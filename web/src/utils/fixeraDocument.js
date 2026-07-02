import { jsPDF } from 'jspdf';
import { getLogoDataUrl } from './logoForPdf';

// ─────────────────────────────────────────────────────────────
//  Unified Fixera document generator — Receipt | Invoice | Quotation
//  doc = {
//    type: 'receipt' | 'invoice' | 'quotation',
//    number, date, dueDate?, status,
//    partner: { name, role }, customer: { name, phone, address },
//    items: [{ name, qty, price }],   // qty optional
//    subtotal, commission?, total,
//    note?, refId,
//  }
// ─────────────────────────────────────────────────────────────

const TYPE_META = {
  receipt:   { title: 'RECEIPT',   accent: [72, 187, 120],  stamp: 'PAID',   stampColor: [72, 187, 120] },
  invoice:   { title: 'INVOICE',   accent: [99, 179, 237],  stamp: 'DUE',    stampColor: [246, 173, 85] },
  quotation: { title: 'QUOTATION', accent: [201, 160, 32],  stamp: 'QUOTE',  stampColor: [201, 160, 32] },
};

export async function buildDocumentPDF(doc) {
  const meta = TYPE_META[doc.type] || TYPE_META.receipt;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;

  // Header
  pdf.setFillColor(253, 248, 236); pdf.rect(0, 0, W, 42, 'F');
  pdf.setFillColor(...meta.accent); pdf.rect(0, 42, W, 2, 'F');
  const logo = await getLogoDataUrl();
  if (logo) pdf.addImage(logo, 'PNG', 20, 7, 13, 13);
  pdf.setTextColor(201, 160, 32); pdf.setFontSize(22); pdf.setFont('helvetica', 'bold');
  pdf.text('FIXERA', 37, 18);
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(7.5); pdf.setFont('helvetica', 'normal');
  pdf.text('Professional Services Marketplace  |  Nairobi, Kenya', 37, 26);
  pdf.text('support@fixera.africa  |  www.fixera.africa', 37, 32);

  // Document title + number
  pdf.setTextColor(10, 22, 40); pdf.setFontSize(20); pdf.setFont('helvetica', 'bold');
  pdf.text(meta.title, W - 20, 24, { align: 'right' });
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
  pdf.text(`No: ${doc.number}`, W - 20, 32, { align: 'right' });

  // Meta row
  let y = 56;
  pdf.setTextColor(100, 100, 100); pdf.setFontSize(9);
  pdf.text(`Date: ${fmtDate(doc.date)}`, 20, y);
  if (doc.type === 'invoice' && doc.dueDate) pdf.text(`Due: ${fmtDate(doc.dueDate)}`, 20, y + 6);
  if (doc.type === 'quotation' && doc.dueDate) pdf.text(`Valid until: ${fmtDate(doc.dueDate)}`, 20, y + 6);

  // Status stamp
  pdf.setFillColor(...meta.stampColor);
  pdf.roundedRect(W - 55, y - 6, 35, 9, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(9); pdf.setFont('helvetica', 'bold');
  pdf.text(meta.stamp, W - 37.5, y, { align: 'center' });

  // Parties
  y += 16;
  pdf.setDrawColor(230, 230, 230); pdf.line(20, y - 6, W - 20, y - 6);
  pdf.setTextColor(150, 150, 150); pdf.setFontSize(7); pdf.setFont('helvetica', 'bold');
  pdf.text('FROM (SERVICE PROVIDER)', 20, y);
  pdf.text('BILLED TO', W / 2 + 6, y);
  y += 6;
  pdf.setTextColor(26, 26, 46); pdf.setFontSize(10); pdf.setFont('helvetica', 'bold');
  pdf.text(doc.partner?.name || 'Fixera Partner', 20, y);
  pdf.text(doc.customer?.name || 'Customer', W / 2 + 6, y);
  y += 5;
  pdf.setTextColor(110, 110, 110); pdf.setFontSize(8.5); pdf.setFont('helvetica', 'normal');
  pdf.text(roleLabel(doc.partner?.role), 20, y);
  if (doc.customer?.phone) pdf.text(doc.customer.phone, W / 2 + 6, y);
  y += 5;
  if (doc.customer?.address) {
    const addr = pdf.splitTextToSize(doc.customer.address, 80);
    pdf.text(addr, W / 2 + 6, y);
  }

  // Items table
  y += 12;
  pdf.setFillColor(245, 245, 245); pdf.rect(20, y - 5, W - 40, 9, 'F');
  pdf.setTextColor(120, 120, 120); pdf.setFontSize(8); pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION', 23, y + 1);
  pdf.text('QTY', W - 80, y + 1, { align: 'right' });
  pdf.text('AMOUNT', W - 23, y + 1, { align: 'right' });
  y += 12;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
  (doc.items || []).forEach(it => {
    pdf.setTextColor(40, 40, 40);
    const name = pdf.splitTextToSize(it.name || '—', 100);
    pdf.text(name, 23, y);
    pdf.text(String(it.qty || 1), W - 80, y, { align: 'right' });
    pdf.text(`KSh ${Number((it.price || 0) * (it.qty || 1)).toLocaleString()}`, W - 23, y, { align: 'right' });
    pdf.setDrawColor(240, 240, 240); pdf.line(23, y + 3, W - 23, y + 3);
    y += 9 + (name.length > 1 ? (name.length - 1) * 4 : 0);
  });

  // Totals
  y += 6;
  const rightX = W - 23, labelX = W - 80;
  pdf.setTextColor(110, 110, 110); pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal', labelX, y, { align: 'right' });
  pdf.setTextColor(40, 40, 40);
  pdf.text(`KSh ${Number(doc.subtotal ?? doc.total ?? 0).toLocaleString()}`, rightX, y, { align: 'right' });
  y += 7;

  if (doc.commission != null && (doc.type !== 'quotation')) {
    pdf.setTextColor(110, 110, 110);
    pdf.text('Fixera commission', labelX, y, { align: 'right' });
    pdf.setTextColor(246, 130, 80);
    pdf.text(`- KSh ${Number(doc.commission).toLocaleString()}`, rightX, y, { align: 'right' });
    y += 7;
    pdf.setTextColor(110, 110, 110);
    pdf.text('Partner earnings', labelX, y, { align: 'right' });
    pdf.setTextColor(72, 187, 120);
    pdf.text(`KSh ${Number((doc.total || 0) - (doc.commission || 0)).toLocaleString()}`, rightX, y, { align: 'right' });
    y += 9;
  }

  // Total box
  pdf.setFillColor(...meta.accent.map(c => c)); pdf.setDrawColor(...meta.accent);
  pdf.roundedRect(W / 2, y, W / 2 - 20, 14, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255); pdf.setFontSize(10); pdf.setFont('helvetica', 'normal');
  pdf.text(doc.type === 'quotation' ? 'Estimated Total' : doc.type === 'invoice' ? 'Amount Due' : 'Total Paid', W / 2 + 6, y + 9);
  pdf.setFontSize(13); pdf.setFont('helvetica', 'bold');
  pdf.text(`KSh ${Number(doc.total || 0).toLocaleString()}`, rightX, y + 9, { align: 'right' });
  y += 24;

  if (doc.note) {
    pdf.setTextColor(130, 130, 130); pdf.setFontSize(8); pdf.setFont('helvetica', 'italic');
    pdf.text(pdf.splitTextToSize(doc.note, W - 46), 23, y);
  }

  // Footer
  pdf.setFillColor(247, 248, 250); pdf.rect(0, 272, W, 25, 'F');
  pdf.setDrawColor(232, 236, 240); pdf.line(0, 272, W, 272);
  pdf.setTextColor(107, 122, 143); pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
  const footMsg = doc.type === 'quotation'
    ? 'This quotation is an estimate. Final amount may vary with actual work.'
    : doc.type === 'invoice'
    ? 'Please settle by the due date. Pay via M-Pesa or cash through the Fixera app.'
    : 'Thank you for choosing Fixera!';
  pdf.text(footMsg, W / 2, 282, { align: 'center' });
  pdf.text(`Ref: ${doc.refId || '—'}  |  www.fixera.africa`, W / 2, 288, { align: 'center' });

  return pdf;
}

export async function downloadDocument(doc) {
  const pdf = await buildDocumentPDF(doc);
  pdf.save(`Fixera-${doc.type}-${doc.number}.pdf`);
}

export async function documentPdfBlob(doc) {
  const pdf = await buildDocumentPDF(doc);
  return pdf.output('blob');
}

function fmtDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' });
}
function roleLabel(role) {
  return ({ worker: 'Service Worker', mover: 'Mover', water_carrier: 'Water Carrier',
    vendor: 'Vendor', supplier: 'Supplier', rider: 'Rider' }[role]) || 'Fixera Partner';
}
