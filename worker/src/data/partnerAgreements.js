// ─────────────────────────────────────────────────────────────
//  Fixera Partner Agreements — per partner type
//  Source: FIXERA-LEGAL-DOCUMENTATION-CORRECTED.txt v1.1
//  STATUS: interim draft — final wording pending advocate
//  verification. When the verified legal pack is uploaded,
//  replace the content below and bump AGREEMENT_VERSION so all
//  partners re-accept.
// ─────────────────────────────────────────────────────────────

export const AGREEMENT_VERSION = 'v1.0';

export const PENDING_VERIFICATION_NOTICE =
  'This agreement is an operating draft of the Fixera Partner Terms. ' +
  'A formally verified version prepared by Fixera’s legal counsel will ' +
  'replace it, and you will be asked to review and accept the updated terms.';

// Shared clauses — apply to every partner type
export const SHARED_CLAUSES = [
  {
    title: 'Independent Contractor',
    body: 'You operate as an independent business, not an employee of Fixera. You are responsible for your own taxes, equipment, and statutory compliance.',
  },
  {
    title: 'Conduct & Customer Care',
    body: 'Professional appearance and conduct at all times. No harassment, discrimination, or abusive behaviour. Treat customer property with care. Respond to customer concerns promptly.',
  },
  {
    title: 'Data Protection',
    body: 'Customer personal data (names, phone numbers, addresses, photos) may only be used to deliver the booked service. Sharing, selling, or contacting customers outside the platform is prohibited (Kenya Data Protection Act 2019).',
  },
  {
    title: 'Off-Platform Dealing',
    body: 'Taking Fixera customers off-platform to avoid commission is a material breach and leads to permanent removal.',
  },
  {
    title: 'Fixera Brand',
    body: 'Fixera’s name, logo, and platform content are Fixera’s intellectual property. You may not use them outside the platform without written permission.',
  },
  {
    title: 'Disputes & Claims',
    body: 'Customer claims are reviewed by Fixera Trust & Safety. You agree to cooperate with evidence requests (photos, GPS records, signatures). Verified claims may be offset against your earnings as described in your partner-specific terms.',
  },
];

export const AGREEMENTS_BY_ROLE = {

  worker: {
    icon: '🔧', label: 'Service Worker Agreement', color: '#C9A020',
    terms: [
      { k: 'Commission',  v: '15% to Fixera — you earn 85% of every job' },
      { k: 'Settlement',  v: 'Weekly via M-Pesa B2C, every Friday' },
      { k: 'Deposit',     v: 'KSh 500 minimum wallet deposit (refundable after 30 days; commission for cash jobs deducted from wallet)' },
      { k: 'Minimum payout', v: 'KSh 500 — smaller balances roll to next week' },
    ],
    requirements: [
      'Valid National ID + clear passport photo',
      'Phone (SMS OTP) and email verification',
      'Service-specific certification (e.g. ERB number for electricians)',
      'Background check clearance / criminal declaration',
      'Own tools and equipment for your trade',
    ],
    standards: [
      'Arrive on time; notify the customer if delayed',
      'Verify job with arrival OTP; close with completion OTP',
      'Clean the work area before leaving',
      'No demanding extra payment beyond the agreed price',
    ],
    suspension: [
      'No-show: 7-day suspension',
      'Customer complaint (verified): 7–30 day suspension',
      'Rating below 3.0: 30-day suspension',
      'Fraud / theft / safety violation: permanent ban',
    ],
  },

  vendor: {
    icon: '🏪', label: 'Vendor Agreement', color: '#63B3ED',
    deliveryProvider: {
      title: '🚚 Fixera is your delivery provider',
      body: 'All pickup of items from customers and return delivery after service is handled exclusively by Fixera riders. You agree NOT to use your own delivery, third-party couriers, or arrange delivery directly with the customer. This keeps every order tracked, insured, and inside Fixera’s protection for both you and the customer. Arranging delivery off-platform is a material breach.',
    },
    terms: [
      { k: 'Commission',  v: '20% to Fixera — you earn 80% of every order' },
      { k: 'Settlement',  v: 'Monthly via bank transfer (Net 7–30 days)' },
      { k: 'Deposit',     v: 'KSh 500 (refundable after 30 days)' },
      { k: 'Wallet',      v: 'Not used — invoiced settlement instead' },
    ],
    requirements: [
      'Business registration + valid KRA PIN',
      'Business premises (laundry / washing station etc.)',
      'Owner National ID + phone & email verification',
      'All staff registered in the Fixera Crew Registry (name, ID, photo, position)',
    ],
    standards: [
      'Accept or decline orders within 2 operating hours',
      'Items returned clean, undamaged, and on time',
      'Damage to customer items must be reported immediately — hiding damage is a breach',
      'Accurate pricing and service listings at all times',
    ],
    suspension: [
      'Item damage/loss (verified): compensation + possible 30-day suspension',
      'Late or failed orders repeatedly: 7–30 day suspension',
      'Rating below 3.0: 30-day suspension',
      'Fraud: permanent ban',
    ],
  },

  rider: {
    icon: '🚗', label: 'Rider Agreement', color: '#68D391',
    terms: [
      { k: 'Commission',  v: '15% to Fixera — you earn 85% per delivery' },
      { k: 'Settlement',  v: 'Daily via M-Pesa (if > KSh 500) or weekly Friday (if below)' },
      { k: 'Deposit',     v: 'KSh 500 minimum wallet deposit (refundable after 30 days)' },
    ],
    requirements: [
      'Valid National ID + driving licence for your vehicle class',
      'Vehicle registration + insurance (motorcycle / tuk-tuk / car)',
      'Phone & email verification, clear passport photo',
      'Background check clearance',
    ],
    standards: [
      'Handle customer items with care — you are responsible in transit',
      'Follow the pickup → delivery state flow in the app, with photos where required',
      'Keep GPS on during active deliveries',
      'No opening, tampering with, or delaying customer packages',
    ],
    suspension: [
      'Lost / damaged package: compensation + 7–30 day suspension',
      'No-show after accepting: 7-day suspension',
      'Insurance or licence lapse: immediate suspension until renewed',
      'Theft: permanent ban + report to authorities',
    ],
  },

  supplier: {
    icon: '📦', label: 'Supplier Agreement', color: '#F6AD55',
    deliveryProvider: {
      title: '🚚 Fixera is your delivery provider',
      body: 'All delivery of products to customers is handled exclusively by Fixera riders and logistics. You agree NOT to use your own delivery, third-party couriers, or arrange delivery directly with the customer. This keeps every order tracked, insured, and inside Fixera’s protection. Arranging delivery off-platform, or sharing customer contacts to deliver directly, is a material breach.',
    },
    terms: [
      { k: 'Commission',  v: '20% to Fixera — you earn 80% of every order' },
      { k: 'Settlement',  v: 'Monthly via bank transfer (Net 30–60 days)' },
      { k: 'Deposit',     v: 'KSh 500 (refundable after 30 days)' },
      { k: 'Wallet',      v: 'Not used — invoiced settlement instead' },
    ],
    requirements: [
      'Business registration + valid KRA PIN',
      'Product catalog with accurate stock and pricing',
      'Owner National ID + phone & email verification',
      'Warehouse / delivery staff registered in the Fixera Crew Registry',
    ],
    standards: [
      'Only genuine products — counterfeits are a permanent-ban offence',
      'Honour listed prices; update stock availability promptly',
      'Deliver bulk orders on the agreed schedule',
      'Quality disputes resolved with evidence through Fixera Trust & Safety',
    ],
    suspension: [
      'Late or short deliveries repeatedly: 7–30 day suspension',
      'Quality complaints (verified): compensation + suspension',
      'Counterfeit goods: permanent ban',
    ],
  },

  mover: {
    icon: '🚚', label: 'Mover Agreement', color: '#9F7AEA',
    terms: [
      { k: 'Commission',  v: '20% to Fixera — you earn 80% of every move' },
      { k: 'Settlement',  v: 'Weekly via M-Pesa B2C or monthly bank transfer' },
      { k: 'Deposit',     v: 'KSh 500 (refundable after 30 days)' },
      { k: 'Insurance',   v: 'Liability insurance ≥ KSh 10,000,000 — mandatory, lapse = immediate suspension' },
    ],
    requirements: [
      'Registered moving company, operating ≥ 2 years',
      'Certificate of Incorporation + KRA PIN + business license',
      'Liability insurance certificate (min KSh 10M)',
      'All vehicles registered in Fleet (plates, photos, logbook, insurance)',
      'All crew registered in the Fixera Crew Registry (name, ID, photo, position)',
      '5+ professional references',
    ],
    standards: [
      'Loading photos required before every departure (evidence chain)',
      'GPS on during every move — customer watches live',
      'Delivery photos + customer inventory sign-off close every job',
      'Arrive on time with the assigned crew and vehicle — substitutions must be registered crew',
      'Protect property; provide moving receipt; respond to concerns within 1 hour',
    ],
    suspension: [
      'Item damage/loss (verified): compensation + 30-day suspension',
      'No-show: 30-day suspension',
      'Insurance lapse: immediate suspension until renewed',
      'Rating below 3.0: 30-day suspension',
      'Fraud / theft: permanent ban',
    ],
  },

  water_carrier: {
    icon: '🚰', label: 'Water Carrier Agreement', color: '#00B5D8',
    terms: [
      { k: 'Commission',  v: '20% to Fixera — you earn 80% of every delivery' },
      { k: 'Settlement',  v: 'Weekly via M-Pesa B2C, every Friday' },
      { k: 'Deposit',     v: 'KSh 500 (refundable after 30 days)' },
      { k: 'M-Pesa fee',  v: 'KSh 30 B2C fee absorbed by Fixera' },
    ],
    requirements: [
      'Valid National ID + passport photo + phone/email verification',
      'Health certification (renewed monthly)',
      'Water quality certification for your source',
      'Vehicle registration + insurance, food-grade containers ONLY',
      'Background check clearance',
      'Drivers registered in the Fixera Crew Registry',
    ],
    standards: [
      'Clean, uncontaminated water only — food-grade containers, no reused chemical containers',
      'GPS on during deliveries — customer watches live',
      'Delivery photos before marking delivered',
      'Maintain vehicle and container hygiene at all times',
    ],
    suspension: [
      'Contaminated water (verified): 30-day suspension + full refund',
      'Health certification lapse: immediate suspension',
      'No-show / late delivery: 7-day suspension',
      'Fraud / health violation: permanent ban',
    ],
  },
};

export function agreementForRole(role) {
  return AGREEMENTS_BY_ROLE[role] || AGREEMENTS_BY_ROLE.worker;
}
