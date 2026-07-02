// ─────────────────────────────────────────────────────────────
//  Fixera Partner Qualification Checklists — per partner type
//  Source: FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt §2 (Mandatory
//  Qualifications) for each role. Each item auto-derives its status
//  from the partner's actual data (profile, crew, fleet, verification).
//
//  ctx passed to met(): { profile, crewCount, fleetCount }
// ─────────────────────────────────────────────────────────────

const has = (v) => v !== null && v !== undefined && String(v).trim() !== '';

// Shared items — onboarding covers ID/photo/contact verification
const ONBOARDING_DONE = {
  label: 'Identity & profile verified',
  hint: 'National ID, passport photo, phone & email — completed in onboarding',
  met: ({ profile }) => profile?.onboarding_complete === true,
  action: { label: 'Complete onboarding', path: '/onboarding' },
};

const FIXERA_APPROVED = {
  label: 'Fixera account approved',
  hint: 'Our team reviews your documents and approves your account before you go live',
  met: ({ profile }) => profile?.verification_status === 'approved',
  action: null, // admin-controlled
};

const AGREEMENT_SIGNED = {
  label: 'Partner Agreement accepted',
  hint: 'Read and accept the Fixera Partner Terms',
  met: ({ profile }) => has(profile?.agreement_accepted_at),
  action: { label: 'View agreement', path: '/agreement' },
};

export const QUALIFICATIONS_BY_ROLE = {

  worker: {
    icon: '🔧', color: '#C9A020',
    items: [
      ONBOARDING_DONE,
      { label: 'Service certification on file', hint: 'Trade certificate (e.g. ERB for electricians) uploaded in onboarding', met: ({ profile }) => profile?.onboarding_complete === true },
      { label: 'Wallet deposit (KSh 500)', hint: 'Minimum wallet deposit to start receiving jobs', met: () => false, action: { label: 'Top up wallet', path: '/earnings' }, pendingNote: 'Available once M-Pesa is live' },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },

  vendor: {
    icon: '🏪', color: '#63B3ED',
    items: [
      ONBOARDING_DONE,
      { label: 'Business name registered', hint: 'Your registered business name', met: ({ profile }) => has(profile?.business_name) },
      { label: 'Crew registered', hint: 'Register your staff in the Crew Registry (name, ID, photo, position)', met: ({ crewCount }) => crewCount > 0, action: { label: 'Add crew', path: '/crew' } },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },

  rider: {
    icon: '🚗', color: '#68D391',
    items: [
      ONBOARDING_DONE,
      { label: 'Driving licence & vehicle docs', hint: 'Licence, vehicle registration & insurance — uploaded in onboarding', met: ({ profile }) => profile?.onboarding_complete === true },
      { label: 'Wallet deposit (KSh 500)', hint: 'Minimum wallet deposit to start receiving deliveries', met: () => false, action: { label: 'Top up wallet', path: '/earnings' }, pendingNote: 'Available once M-Pesa is live' },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },

  supplier: {
    icon: '📦', color: '#F6AD55',
    items: [
      ONBOARDING_DONE,
      { label: 'Business name registered', hint: 'Your registered business name', met: ({ profile }) => has(profile?.business_name) },
      { label: 'Product catalog set up', hint: 'Add at least one product with price & stock', met: ({ profile }) => has(profile?.product_category) },
      { label: 'Crew registered', hint: 'Register warehouse / delivery staff in the Crew Registry', met: ({ crewCount }) => crewCount > 0, action: { label: 'Add crew', path: '/crew' } },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },

  mover: {
    icon: '🚚', color: '#9F7AEA',
    items: [
      ONBOARDING_DONE,
      { label: 'Company name', hint: 'Registered moving company name', met: ({ profile }) => has(profile?.business_name) },
      { label: 'Certificate of Incorporation #', hint: 'Company registration number', met: ({ profile }) => has(profile?.registration_number) },
      { label: 'KRA Tax PIN', hint: 'Valid KRA PIN', met: ({ profile }) => has(profile?.tax_pin) },
      { label: 'Owner National ID', hint: "Owner's National ID number", met: ({ profile }) => has(profile?.owner_national_id) },
      { label: 'Operating ≥ 2 years', hint: 'Legal minimum 2 years in operation', met: ({ profile }) => Number(profile?.years_in_operation) >= 2 },
      { label: 'Fleet registered', hint: 'Register at least one vehicle (plate, photos, logbook, insurance)', met: ({ fleetCount }) => fleetCount > 0, action: { label: 'Register fleet', path: '/fleet' } },
      { label: 'Crew registered', hint: 'Register your moving crew in the Crew Registry', met: ({ crewCount }) => crewCount > 0, action: { label: 'Add crew', path: '/crew' } },
      { label: 'Liability insurance (≥ KSh 10M)', hint: 'Uploaded per vehicle in Fleet — verified by Fixera', met: ({ fleetCount }) => fleetCount > 0 },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },

  water_carrier: {
    icon: '🚰', color: '#00B5D8',
    items: [
      ONBOARDING_DONE,
      { label: 'Company / business name', hint: 'Your water delivery business name', met: ({ profile }) => has(profile?.business_name) },
      { label: 'Owner National ID', hint: "Owner's National ID number", met: ({ profile }) => has(profile?.owner_national_id) },
      { label: 'Service areas defined', hint: 'Areas you cover for delivery', met: ({ profile }) => has(profile?.service_area) },
      { label: 'Water source declared', hint: 'Borehole / county / private / mixed', met: ({ profile }) => has(profile?.water_source) },
      { label: 'Health & water-quality certs', hint: 'Health certification + water quality cert — uploaded in onboarding', met: ({ profile }) => profile?.onboarding_complete === true },
      { label: 'Drivers registered', hint: 'Register your drivers in the Crew Registry', met: ({ crewCount }) => crewCount > 0, action: { label: 'Add drivers', path: '/crew' } },
      AGREEMENT_SIGNED,
      FIXERA_APPROVED,
    ],
  },
};

export function qualificationsForRole(role) {
  return QUALIFICATIONS_BY_ROLE[role] || QUALIFICATIONS_BY_ROLE.worker;
}

// Returns { items: [{...item, done}], completed, total, allDone }
export function evaluateQualifications(role, ctx) {
  const config = qualificationsForRole(role);
  const items = config.items.map(it => ({ ...it, done: !!it.met(ctx) }));
  const completed = items.filter(i => i.done).length;
  return {
    icon: config.icon,
    color: config.color,
    items,
    completed,
    total: items.length,
    allDone: completed === items.length,
  };
}
