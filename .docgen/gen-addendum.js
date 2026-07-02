const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, LevelFormat,
} = require('docx');

const GOLD = 'C9A020';
const DARK = '0A0E1A';

// ── helpers ──
const H1 = (text) => new Paragraph({
  spacing: { before: 280, after: 120 },
  children: [new TextRun({ text, bold: true, size: 26, font: 'Arial', color: DARK })],
});
const sub = (text) => new Paragraph({
  spacing: { before: 60, after: 60 },
  children: [new TextRun({ text, size: 22, font: 'Arial' })],
});
const clause = (num, text) => new Paragraph({
  spacing: { before: 40, after: 40 },
  indent: { left: 360, hanging: 360 },
  children: [
    new TextRun({ text: `${num}  `, bold: true, size: 22, font: 'Arial' }),
    new TextRun({ text, size: 22, font: 'Arial' }),
  ],
});
const note = (text) => new Paragraph({
  spacing: { before: 80, after: 80 },
  border: { left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 12 } },
  children: [new TextRun({ text, italics: true, size: 20, font: 'Arial', color: '555555' })],
});

const children = [];

// Title block
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: 'FIXERA COMPANY LIMITED', bold: true, size: 30, font: 'Arial', color: GOLD })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: 'MASTER PARTNER AGREEMENT — ADDENDUM No. 1', bold: true, size: 26, font: 'Arial', color: DARK })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: 'Platform Functionality & Operations (Version 1.1)', size: 22, font: 'Arial' })],
}));
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 240 },
  children: [new TextRun({ text: 'Prepared for legal review — 15 June 2026', size: 20, font: 'Arial', color: '777777' })],
}));

children.push(note('DRAFTING NOTE FOR COUNSEL: This Addendum sets out, in plain operational terms, the platform features now live in the Fixera customer and partner applications that are not yet reflected in the Master Partner Agreement V1.0 dated 12 June 2026. The clauses below are drafted to supplement (not replace) the existing Agreement and are provided for your review, refinement, and incorporation. Clause numbering (A1–A14) is provisional.'));

children.push(new Paragraph({
  spacing: { before: 160, after: 120 },
  children: [new TextRun({ text: 'This Addendum No. 1 is supplemental to and forms part of the Master Partner Agreement between Fixera Company Limited (the “Company”) and the Partner (the “Agreement”). In the event of conflict between this Addendum and the Agreement, this Addendum shall prevail to the extent of the new functionality it describes. Capitalised terms have the meanings given in the Agreement.', size: 22, font: 'Arial' })],
}));

// ── Clauses ──
const A = [
  ['A1. VERIFICATION & ELIGIBILITY GATE', [
    ['A1.1', 'The Partner acknowledges that registration alone does not entitle the Partner to accept jobs. The Partner may only receive and accept bookings after the Company has verified the Partner’s identity, documents, and (where applicable) crew, fleet, insurance, and certifications, and has approved the Partner’s account.'],
    ['A1.2', 'The Partner must complete the in-app onboarding and qualification checklist applicable to their category before activation.'],
    ['A1.3', 'The Company may re-verify the Partner at any time and may suspend the account where any required document, certification, or insurance lapses or cannot be verified.'],
  ]],
  ['A2. LOCATION DATA & LIVE GPS TRACKING', [
    ['A2.1', 'The Partner consents to the capture and transmission of the Partner’s (and the assigned crew/vehicle’s) real-time geolocation while online and while performing an active job or delivery.'],
    ['A2.2', 'Live location may be shared with the relevant Customer for the purpose of tracking the service or delivery, and is retained by the Company as a record of service performance and for safety, dispute resolution, and audit.'],
    ['A2.3', 'Location data is processed in accordance with the Data Protection Act, 2019 (Kenya) and Clause A14 of this Addendum. The Partner is responsible for the device and data connectivity required to transmit location.'],
  ]],
  ['A3. JOB VERIFICATION & EVIDENCE CAPTURE', [
    ['A3.1', 'The Platform uses arrival and completion verification codes (OTP) and, for certain categories, mandatory photographic evidence captured at loading/pick-up and at delivery/completion.'],
    ['A3.2', 'Movers and similar Partners shall photograph loaded goods and the vehicle before departure, and the delivered goods on arrival. The Customer may be required to confirm receipt and to sign off digitally on an inventory or completion record.'],
    ['A3.3', 'The Partner consents to the storage of such codes, photographs, signatures, and timestamps, and agrees that they may be used as evidence in any complaint, claim, or dispute under Clause 7 of the Agreement.'],
  ]],
  ['A4. CREW & PERSONNEL REGISTRY', [
    ['A4.1', 'A Partner that engages workers, crew, drivers, or other personnel to deliver Services (including Movers, Vendors, Suppliers, and Water Carriers) shall register each such person on the Platform with their full name, national identification number, photograph, and assigned role, before deploying them.'],
    ['A4.2', 'The Partner warrants that it has obtained each person’s consent to share such information with the Company, and that the information is accurate.'],
    ['A4.3', 'Only personnel registered and (where required) verified on the Platform may be deployed to perform Services. The Partner remains fully responsible and liable for the acts, omissions, and conduct of all its registered personnel.'],
    ['A4.4', 'The Company retains crew records for safety, accountability, and regulatory purposes, including after a person ceases to work with the Partner, subject to applicable law.'],
  ]],
  ['A5. FLEET & VEHICLE REGISTRATION', [
    ['A5.1', 'Movers and Water Carriers shall register each vehicle used for Services on the Platform, together with the vehicle’s registration, photographs, and valid insurance (including any minimum liability cover required for the category).'],
    ['A5.2', 'Only registered and verified vehicles may be used to perform Services. Expiry or lapse of a vehicle’s registration or insurance shall result in suspension of the vehicle and, where applicable, the Partner’s account until reinstated.'],
  ]],
  ['A6. EXCLUSIVE LOGISTICS (VENDORS & SUPPLIERS)', [
    ['A6.1', 'For Services and orders fulfilled through the Platform, the Company (acting through its registered Riders and logistics) is the exclusive provider of pick-up from, and delivery to, the Customer.'],
    ['A6.2', 'The Partner shall not use its own delivery, third-party couriers, or arrange delivery directly with the Customer for platform orders, nor solicit the Customer to arrange delivery off the Platform.'],
    ['A6.3', 'Any breach of this Clause A6 constitutes a material breach of the Agreement and may result in immediate suspension or termination.'],
  ]],
  ['A7. MATERIALS ESTIMATION & MULTI-PARTNER JOBS', [
    ['A7.1', 'A service Partner may, in the course of a job, estimate materials required and source them from a registered Supplier through the Platform. The Customer confirms the materials and quantity before any order is placed.'],
    ['A7.2', 'The Partner warrants that any materials estimate is made in good faith and to the best of the Partner’s professional judgement. The Platform coordinates the resulting supply and delivery between the service Partner, the Supplier, and the Rider.'],
  ]],
  ['A8. PRODUCT LISTINGS & APPROVAL (SUPPLIERS)', [
    ['A8.1', 'A Supplier’s products, descriptions, units, and prices, and any subsequent change to a price, require the Company’s approval before they become available to Customers.'],
    ['A8.2', 'The Supplier warrants that all listed goods are genuine, lawful, safe, and accurately described, and shall keep stock availability current. Marking an item out of stock takes effect immediately and does not require approval.'],
  ]],
  ['A9. PAYMENTS, CASH HANDLING & WALLET AUTHORISATION', [
    ['A9.1', 'Customers may pay through the Platform by mobile money (M-Pesa) or by cash, as recorded on the Platform.'],
    ['A9.2', 'Where a Customer pays in cash, the Partner collects the gross amount and holds the Company’s commission on trust for the Company. Such commission is a debt immediately due and payable to the Company.'],
    ['A9.3', 'The Partner irrevocably authorises the Company to deduct commission and any other amounts due under the Agreement from the Partner’s Wallet balance and/or from settlement amounts, and to set off such amounts.'],
    ['A9.4', 'The Partner’s Wallet balance, outstanding balances, and settlement status are shown in the Partner application and form part of the records of account between the Parties.'],
  ]],
  ['A10. QUOTATIONS AS BINDING OFFERS', [
    ['A10.1', 'Where the Platform allows a Partner (such as a Mover) to submit a quotation in response to a Customer request, that quotation is a binding offer by the Partner.'],
    ['A10.2', 'Upon the Customer’s acceptance of the quotation through the Platform, the Partner is obliged to perform the Services on the quoted terms, save for variations agreed through the Platform.'],
  ]],
  ['A11. TRANSACTION DOCUMENTS', [
    ['A11.1', 'The Company may generate and issue, on the Partner’s behalf, receipts, invoices, and quotations to Customers, and earnings/payout statements to the Partner, through the Platform.'],
    ['A11.2', 'Such documents are records of the relevant transaction. The Partner is responsible for retaining its own statements for tax and accounting purposes.'],
  ]],
  ['A12. ELECTRONIC COMMUNICATIONS & NOTIFICATIONS', [
    ['A12.1', 'The Partner consents to receive operational communications by SMS, email, and in-app or push notification, including job alerts, status updates, and account notices.'],
    ['A12.2', 'The Parties agree that electronic records and electronic or digital acceptances (including in-app confirmations and OTP verifications) are valid, binding, and admissible.'],
  ]],
  ['A13. AMENDMENT & RE-ACCEPTANCE OF TERMS', [
    ['A13.1', 'The Company may amend this Agreement and its addenda. The Partner will be notified in the Partner application of any material update.'],
    ['A13.2', 'The Partner must review and accept the updated terms to continue using the Platform. Continued use of the Platform after notification constitutes acceptance. Each acceptance is recorded with the version accepted and the date and time of acceptance.'],
  ]],
  ['A14. DATA PROTECTION (DATA PROTECTION ACT, 2019)', [
    ['A14.1', 'Each Party shall comply with the Data Protection Act, 2019 (Kenya) and any applicable data protection law in connection with personal data processed under the Agreement.'],
    ['A14.2', 'Categories of personal data processed through the Platform include identity and contact details, national identification numbers, photographs, geolocation/GPS data, crew personal data, and transaction data.'],
    ['A14.3', 'The Partner shall process any Customer or third-party personal data it receives solely to deliver the booked Service, shall keep it confidential and secure, and shall not use it for marketing or any other purpose, nor retain it longer than necessary.'],
    ['A14.4', 'The Partner shall indemnify the Company against any loss, fine, or claim arising from the Partner’s breach of data protection obligations, including any breach by the Partner’s registered crew.'],
  ]],
];

A.forEach(([title, items]) => {
  children.push(H1(title));
  items.forEach(([n, t]) => children.push(clause(n, t)));
});

// Acceptance block
children.push(H1('ACCEPTANCE'));
children.push(sub('The Partner confirms having read and understood this Addendum No. 1 and agrees to be bound by it together with the Master Partner Agreement.'));
children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Partner: ___________________________    Signature: ___________________    Date: ____________', size: 22, font: 'Arial' })] }));
children.push(new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: 'For Fixera Company Limited: ___________________________    Date: ____________', size: 22, font: 'Arial' })] }));

const doc = new Document({
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
    children,
  }],
});

const out = process.argv[2] || 'Fixera-Partner-Agreement-Addendum-V1.1.docx';
Packer.toBuffer(doc).then(buf => { fs.writeFileSync(out, buf); console.log('WROTE', out); });
