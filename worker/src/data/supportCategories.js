// ─────────────────────────────────────────────────────────────
//  Fixera Support — Departments & Role-aware Categories
//  Each partner type gets its own support categories; each
//  category routes to a Fixera department with its own SLA.
//  Icons are Lucide components (rendered by SupportPage).
// ─────────────────────────────────────────────────────────────
import {
  Banknote, Wrench, ShieldAlert, ShieldCheck, Smartphone, Handshake,
  Wallet, ClipboardList, User, Siren, MessageCircle, Package, Bike,
  AlertTriangle, Users, Store, Tag, Truck, Navigation, Droplets, ScrollText,
} from 'lucide-react';

export const DEPARTMENTS = {
  finance: {
    id: 'finance', name: 'Finance & Payments', Icon: Banknote, color: '#48BB78',
    sla: 'Responds within 24 hours',
  },
  operations: {
    id: 'operations', name: 'Operations', Icon: Wrench, color: '#63B3ED',
    sla: 'Responds within 2 hours',
  },
  trust_safety: {
    id: 'trust_safety', name: 'Trust & Safety', Icon: ShieldAlert, color: '#FC8181',
    sla: 'URGENT — responds within 1 hour',
  },
  accounts: {
    id: 'accounts', name: 'Accounts & Verification', Icon: ShieldCheck, color: '#C9A020',
    sla: 'Responds within 24–48 hours',
  },
  technical: {
    id: 'technical', name: 'Technical Support', Icon: Smartphone, color: '#9F7AEA',
    sla: 'Responds within 24 hours',
  },
  partner_success: {
    id: 'partner_success', name: 'Partner Success', Icon: Handshake, color: '#F6AD55',
    sla: 'Responds within 48 hours',
  },
};

// priority: 'urgent' | 'high' | 'normal'
export const CATEGORIES_BY_ROLE = {

  // ── SERVICE WORKERS ─────────────────────────────────────
  worker: [
    { value: 'earnings',          label: 'Earnings & Payout',      Icon: Banknote,      desc: 'Missing earnings, wrong amount, payout delay',          department: 'finance',        priority: 'high'   },
    { value: 'wallet',            label: 'Wallet & Deposit',       Icon: Wallet,        desc: 'KSh 500 deposit, top-up, wallet balance issues',        department: 'finance',        priority: 'high'   },
    { value: 'job_dispute',       label: 'Job Dispute',            Icon: ClipboardList, desc: 'Wrong job details, cancellation, completion code',      department: 'operations',     priority: 'high'   },
    { value: 'customer_conduct',  label: 'Customer Conduct',       Icon: User,          desc: 'Rude customer, no-show, refused payment',               department: 'trust_safety',   priority: 'urgent' },
    { value: 'safety_incident',   label: 'Safety Incident',        Icon: Siren,         desc: 'Injury on site, unsafe work environment',               department: 'trust_safety',   priority: 'urgent' },
    { value: 'account',           label: 'Account & Verification', Icon: ShieldCheck,   desc: 'Documents, suspension, login problems',                 department: 'accounts',       priority: 'normal' },
    { value: 'app',               label: 'App / Technical',        Icon: Smartphone,    desc: 'App crash, GPS issue, map not loading',                 department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],

  // ── VENDORS ─────────────────────────────────────────────
  vendor: [
    { value: 'order_issue',       label: 'Order Problem',          Icon: Package,       desc: 'Wrong order, cancellation, missing items',              department: 'operations',     priority: 'high'   },
    { value: 'settlement',        label: 'Settlement & Invoices',  Icon: Banknote,      desc: 'Invoice payment, Net 7-30 delays, commission',          department: 'finance',        priority: 'high'   },
    { value: 'rider_pickup',      label: 'Rider Pickup Issue',     Icon: Bike,          desc: 'Rider late or no-show for pickup / delivery',           department: 'operations',     priority: 'high'   },
    { value: 'damage_dispute',    label: 'Damage Claim Dispute',   Icon: AlertTriangle, desc: 'Customer claims item damage — respond with evidence',   department: 'trust_safety',   priority: 'urgent' },
    { value: 'crew',              label: 'Crew & Verification',    Icon: Users,         desc: 'Crew registration, verification status',                department: 'accounts',       priority: 'normal' },
    { value: 'listing',           label: 'Business Listing',       Icon: Store,         desc: 'Pricing display, services shown, business profile',     department: 'operations',     priority: 'normal' },
    { value: 'app',               label: 'App / Technical',        Icon: Smartphone,    desc: 'App crash, orders not loading',                         department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],

  // ── RIDERS ──────────────────────────────────────────────
  rider: [
    { value: 'delivery_issue',    label: 'Delivery Problem',       Icon: Package,       desc: 'Wrong address, customer unreachable, failed delivery',  department: 'operations',     priority: 'high'   },
    { value: 'earnings',          label: 'Earnings & Settlement',  Icon: Banknote,      desc: 'Per-delivery pay, daily settlement, missing payment',   department: 'finance',        priority: 'high'   },
    { value: 'wallet',            label: 'Wallet & Deposit',       Icon: Wallet,        desc: 'KSh 500 deposit, top-up, wallet balance',               department: 'finance',        priority: 'high'   },
    { value: 'accident',          label: 'Accident / Breakdown',   Icon: Siren,         desc: 'Accident or vehicle breakdown during delivery',         department: 'trust_safety',   priority: 'urgent' },
    { value: 'customer_conduct',  label: 'Customer Conduct',       Icon: User,          desc: 'Rude customer, unsafe drop-off location',               department: 'trust_safety',   priority: 'urgent' },
    { value: 'account',           label: 'Account & Verification', Icon: ShieldCheck,   desc: 'License, vehicle docs, suspension',                     department: 'accounts',       priority: 'normal' },
    { value: 'app',               label: 'App / GPS Issue',        Icon: Navigation,    desc: 'GPS not tracking, navigation problems',                 department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],

  // ── SUPPLIERS ───────────────────────────────────────────
  supplier: [
    { value: 'bulk_order',        label: 'Bulk Order Issue',       Icon: Package,       desc: 'Order quantities, delivery schedule, returns',          department: 'operations',     priority: 'high'   },
    { value: 'invoice',           label: 'Invoice & Payment',      Icon: Banknote,      desc: 'Net 30/60 invoices, payment delays, commission',        department: 'finance',        priority: 'high'   },
    { value: 'product_listing',   label: 'Product Catalog',        Icon: Tag,           desc: 'Product listings, pricing, stock display',              department: 'operations',     priority: 'normal' },
    { value: 'logistics',         label: 'Logistics Problem',      Icon: Truck,         desc: 'Transport, delivery to site, warehouse issues',         department: 'operations',     priority: 'high'   },
    { value: 'quality_dispute',   label: 'Quality Dispute',        Icon: AlertTriangle, desc: 'Customer disputes product quality — respond',           department: 'trust_safety',   priority: 'urgent' },
    { value: 'crew',              label: 'Crew & Verification',    Icon: Users,         desc: 'Crew registration, verification status',                department: 'accounts',       priority: 'normal' },
    { value: 'app',               label: 'App / Technical',        Icon: Smartphone,    desc: 'App crash, catalog not loading',                        department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],

  // ── MOVERS ──────────────────────────────────────────────
  mover: [
    { value: 'quote_job',         label: 'Quote / Job Issue',      Icon: ClipboardList, desc: 'Request problems, customer cancelled, job details',     department: 'operations',     priority: 'high'   },
    { value: 'damage_claim',      label: 'Damage / Missing Claim', Icon: AlertTriangle, desc: 'Customer filed claim — respond with evidence',          department: 'trust_safety',   priority: 'urgent' },
    { value: 'settlement',        label: 'Settlement & Payout',    Icon: Banknote,      desc: 'Weekly payout, commission, missing payment',            department: 'finance',        priority: 'high'   },
    { value: 'fleet_insurance',   label: 'Fleet & Insurance',      Icon: Truck,         desc: 'Vehicle verification, insurance renewal, suspension',   department: 'accounts',       priority: 'high'   },
    { value: 'crew',              label: 'Crew & Verification',    Icon: Users,         desc: 'Crew registration, verification status',                department: 'accounts',       priority: 'normal' },
    { value: 'customer_conduct',  label: 'Customer Conduct',       Icon: User,          desc: 'Abusive customer, unsafe site, refused payment',        department: 'trust_safety',   priority: 'urgent' },
    { value: 'app',               label: 'App / GPS Issue',        Icon: Navigation,    desc: 'App crash, GPS tracking problems',                      department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],

  // ── WATER CARRIERS ──────────────────────────────────────
  water_carrier: [
    { value: 'delivery_issue',    label: 'Delivery Problem',       Icon: Droplets,      desc: 'Order issues, customer unreachable, wrong address',     department: 'operations',     priority: 'high'   },
    { value: 'quality_dispute',   label: 'Water Quality Dispute',  Icon: AlertTriangle, desc: 'Customer disputes water quality — respond',             department: 'trust_safety',   priority: 'urgent' },
    { value: 'settlement',        label: 'Settlement & Payout',    Icon: Banknote,      desc: 'Weekly Friday payout, commission, missing payment',     department: 'finance',        priority: 'high'   },
    { value: 'certs',             label: 'Certificates & Vehicle', Icon: ScrollText,    desc: 'Water quality cert, health cert, vehicle renewal',      department: 'accounts',       priority: 'high'   },
    { value: 'crew',              label: 'Crew & Verification',    Icon: Users,         desc: 'Driver registration, verification status',              department: 'accounts',       priority: 'normal' },
    { value: 'customer_conduct',  label: 'Customer Conduct',       Icon: User,          desc: 'Rude customer, unsafe delivery location',               department: 'trust_safety',   priority: 'urgent' },
    { value: 'app',               label: 'App / GPS Issue',        Icon: Navigation,    desc: 'GPS streaming, app crash, orders not loading',          department: 'technical',      priority: 'normal' },
    { value: 'other',             label: 'Other',                  Icon: MessageCircle, desc: 'Anything else not listed above',                        department: 'partner_success', priority: 'normal' },
  ],
};

export function categoriesForRole(role) {
  return CATEGORIES_BY_ROLE[role] || CATEGORIES_BY_ROLE.worker;
}

export function findCategory(role, value) {
  return categoriesForRole(role).find(c => c.value === value) || null;
}

export function departmentMeta(deptId) {
  return DEPARTMENTS[deptId] || DEPARTMENTS.partner_success;
}
