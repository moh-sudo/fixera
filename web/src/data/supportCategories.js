// ─────────────────────────────────────────────────────────────
//  Fixera Support — Customer Categories & Department Routing
//  Each category routes to a department with its own SLA.
// ─────────────────────────────────────────────────────────────

export const DEPARTMENTS = {
  finance:         { name: 'Finance & Payments',  color: '#48BB78', sla_hours: 24, sla_label: 'within 24 hrs' },
  operations:      { name: 'Operations',          color: '#63B3ED', sla_hours: 8,  sla_label: 'within 8 hrs'  },
  trust_safety:    { name: 'Trust & Safety',      color: '#FC8181', sla_hours: 1,  sla_label: 'within 1 hr — URGENT' },
  accounts:        { name: 'Accounts',            color: '#C9A020', sla_hours: 48, sla_label: 'within 48 hrs' },
  technical:       { name: 'Technical Support',   color: '#9F7AEA', sla_hours: 24, sla_label: 'within 24 hrs' },
  partner_success: { name: 'Customer Success',    color: '#F6AD55', sla_hours: 48, sla_label: 'within 48 hrs' },
};

// priority: 'urgent' | 'high' | 'normal'
export const CUSTOMER_CATEGORIES = [
  { value: 'worker_noshow',   label: 'Worker No-Show',      desc: 'Your worker never arrived for the scheduled booking',     department: 'operations',   priority: 'urgent' },
  { value: 'safety_incident', label: 'Safety Concern',       desc: 'Worker conduct or on-site safety issue',                  department: 'trust_safety', priority: 'urgent' },
  { value: 'damage_claim',    label: 'Property Damage',      desc: 'Something was damaged during the service',                department: 'trust_safety', priority: 'urgent' },
  { value: 'payment_failed',  label: 'Payment Problem',      desc: 'M-Pesa charged but booking failed, or double charge',     department: 'finance',      priority: 'urgent' },
  { value: 'service_quality', label: 'Poor Service Quality', desc: 'The service delivered was below expected standard',       department: 'trust_safety', priority: 'high'   },
  { value: 'booking_problem', label: 'Booking Issue',         desc: 'Wrong details, cancellation help, rescheduling',          department: 'operations',   priority: 'high'   },
  { value: 'refund_request',  label: 'Refund Request',        desc: 'Request a refund for a completed or cancelled booking',   department: 'finance',      priority: 'high'   },
  { value: 'account_issue',   label: 'Account / Login',       desc: 'Login problems, profile issues, account access',          department: 'accounts',     priority: 'normal' },
  { value: 'app_bug',         label: 'App / Technical',       desc: 'App crash, maps not loading, other technical issues',     department: 'technical',    priority: 'normal' },
  { value: 'other',           label: 'Other',                 desc: 'Anything else not listed above',                          department: 'operations',   priority: 'normal' },
];

export const REFUND_REASONS = [
  { value: 'worker_noshow',    label: 'Worker did not show up'        },
  { value: 'poor_quality',     label: 'Service quality was poor'      },
  { value: 'booked_by_mistake',label: 'Booked by mistake'             },
  { value: 'cancelled_early',  label: 'Cancelled within free window'  },
  { value: 'other',            label: 'Other reason'                  },
];

export function findCategory(value) {
  return CUSTOMER_CATEGORIES.find(c => c.value === value) || null;
}

export function deptMeta(deptId) {
  return DEPARTMENTS[deptId] || DEPARTMENTS.partner_success;
}
