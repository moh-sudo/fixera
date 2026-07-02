import { supabase } from '../supabase';

// Turn a payment row (+ optional partner/customer lookups) into the
// normalized document shape used by fixeraDocument.js.
// Works for EVERY flow because every flow creates a payment.
export async function docFromPayment(payment, { type } = {}) {
  if (!payment) return null;

  // partner name
  let partnerName = 'Fixera Partner';
  if (payment.payee_id) {
    const { data: w } = await supabase.from('workers')
      .select('business_name, full_name').eq('id', payment.payee_id).maybeSingle();
    partnerName = w?.business_name || w?.full_name || partnerName;
  }
  // customer name
  let customer = { name: 'Customer' };
  const { data: c } = await supabase.from('profiles')
    .select('full_name, phone').eq('id', payment.customer_id).maybeSingle();
  if (c) customer = { name: c.full_name || 'Customer', phone: c.phone };

  const docType = type || (payment.status === 'paid' ? 'receipt' : 'invoice');
  const num = `${docType.slice(0,3).toUpperCase()}-${String(payment.id).slice(0,8).toUpperCase()}`;

  return {
    type: docType,
    number: num,
    date: payment.paid_at || payment.created_at,
    dueDate: docType === 'invoice' ? addDays(payment.created_at, 7) : null,
    status: payment.status,
    partner: { name: partnerName, role: payment.payee_role },
    customer,
    items: [{ name: payment.description || labelFor(payment.purpose), qty: 1, price: Number(payment.amount || 0) }],
    subtotal: Number(payment.amount || 0),
    commission: payment.commission_amount != null ? Number(payment.commission_amount) : null,
    total: Number(payment.amount || 0),
    refId: `${payment.ref_type || ''}:${payment.ref_id || ''}`,
  };
}

// Quotation from a mover's accepted quote
export function docFromMoverQuote(quote, request) {
  return {
    type: 'quotation',
    number: `QUO-${String(quote.id).slice(0,8).toUpperCase()}`,
    date: quote.created_at,
    dueDate: addDays(quote.created_at, 7),
    status: 'quote',
    partner: { name: quote.mover_name || 'Mover', role: 'mover' },
    customer: { name: request?.customer_name || 'Customer', address: request?.destination },
    items: [
      { name: `Move: ${request?.pickup_location || ''} → ${request?.destination || ''}`, qty: 1, price: Number(quote.price || 0) },
      ...(quote.vehicle_type ? [{ name: `Vehicle: ${quote.vehicle_type}${quote.num_workers ? ` · ${quote.num_workers} crew` : ''}`, qty: 1, price: 0 }] : []),
    ],
    subtotal: Number(quote.price || 0),
    total: Number(quote.price || 0),
    note: quote.message || 'Estimate for your move. Final price confirmed on completion.',
    refId: `moving_request:${request?.id || ''}`,
  };
}

// Quotation from a painting materials estimate (supplier_order in 'estimate')
export function docFromEstimate(order) {
  const items = Array.isArray(order.items) ? order.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })) : [];
  return {
    type: 'quotation',
    number: `QUO-${String(order.id).slice(0,8).toUpperCase()}`,
    date: order.created_at,
    dueDate: addDays(order.created_at, 7),
    status: 'quote',
    partner: { name: order.supplier?.business_name || 'Supplier', role: 'supplier' },
    customer: { name: order.customer_name || 'Customer', address: order.delivery_address },
    items,
    subtotal: Number(order.total || 0),
    total: Number(order.total || 0),
    note: 'Materials estimate from your service provider. Confirm to order.',
    refId: `supplier_order:${order.id}`,
  };
}

// Fetch the payment for a given job/order to build a receipt/invoice
export async function getPaymentDoc(refType, refId, type) {
  const { data } = await supabase.from('payments')
    .select('*').eq('ref_type', refType).eq('ref_id', refId)
    .order('created_at', { ascending: false }).limit(1);
  if (!data?.[0]) return null;
  return docFromPayment(data[0], { type });
}

// ── Customer Documents hub — aggregate ALL of a customer's docs ──
// Returns lightweight list items; the full doc is rebuilt on download/email.
export async function listCustomerDocuments(userId) {
  if (!userId) return [];
  const out = [];

  // Receipts + invoices from payments (universal across every flow)
  const { data: payments } = await supabase
    .from('payments').select('*').eq('customer_id', userId)
    .order('created_at', { ascending: false });
  (payments || []).forEach(p => {
    const isPaid = p.status === 'paid';
    out.push({
      key: `pay-${p.id}`,
      kind: isPaid ? 'receipt' : 'invoice',
      source: 'payment',
      raw: p,
      title: p.description || labelFor(p.purpose),
      total: Number(p.amount || 0),
      date: p.paid_at || p.created_at,
      status: isPaid ? 'Paid' : 'Unpaid',
    });
  });

  // Quotations — mover accepted quotes on my requests
  const { data: reqs } = await supabase
    .from('moving_requests').select('*').eq('user_id', userId);
  const reqById = Object.fromEntries((reqs || []).map(r => [r.id, r]));
  if (reqs && reqs.length) {
    const { data: quotes } = await supabase
      .from('moving_quotes').select('*')
      .in('request_id', reqs.map(r => r.id))
      .eq('status', 'accepted');
    (quotes || []).forEach(q => out.push({
      key: `mq-${q.id}`,
      kind: 'quotation',
      source: 'mover_quote',
      raw: q,
      request: reqById[q.request_id],
      title: `Move quote — ${q.mover_name || 'Mover'}`,
      total: Number(q.price || 0),
      date: q.created_at,
      status: 'Quote',
    }));
  }

  // Quotations — painting/material estimates
  const { data: estimates } = await supabase
    .from('supplier_orders')
    .select('*, supplier:supplier_id(business_name, full_name)')
    .eq('customer_id', userId)
    .eq('status', 'estimate');
  (estimates || []).forEach(o => out.push({
    key: `est-${o.id}`,
    kind: 'quotation',
    source: 'estimate',
    raw: o,
    title: `Materials quote — ${o.supplier?.business_name || 'Supplier'}`,
    total: Number(o.total || 0),
    date: o.created_at,
    status: 'Quote',
  }));

  return out.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Rebuild the full document object for a list item (for download/email)
export async function buildFromListItem(item) {
  if (item.source === 'payment')     return docFromPayment(item.raw, { type: item.kind });
  if (item.source === 'mover_quote') return docFromMoverQuote(item.raw, item.request);
  if (item.source === 'estimate')    return docFromEstimate(item.raw);
  return null;
}

function addDays(d, n) { const x = new Date(d || Date.now()); x.setDate(x.getDate() + n); return x.toISOString(); }
function labelFor(p) {
  return ({ service: 'Service', materials: 'Materials', delivery: 'Delivery', move: 'Moving service', water: 'Water delivery' }[p]) || 'Service';
}
