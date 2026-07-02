import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', light: '#9BAAB8', gold: '#C9A020',
};

const SECTIONS = [
  { id: 'definitions',    title: '1. Definitions & Interpretation' },
  { id: 'eligibility',    title: '2. User Eligibility & Registration' },
  { id: 'commission',     title: '3. Commission & Payment Structure' },
  { id: 'delivery',       title: '4. Service Delivery & Quality' },
  { id: 'operational',   title: '4A. Platform Operational Standards' },
  { id: 'disputes',       title: '5. Dispute Resolution' },
  { id: 'deposits',       title: '6. Deposits & Security' },
  { id: 'liability',      title: '7. Liability & Limitation' },
  { id: 'ip',             title: '8. Intellectual Property' },
  { id: 'privacy',        title: '9. Data Privacy & Security' },
  { id: 'suspension',     title: '10. Suspension & Termination' },
  { id: 'modifications',  title: '11. Modifications to Terms' },
  { id: 'governing',      title: '12. Governing Law' },
  { id: 'severability',   title: '13. Severability' },
  { id: 'contact',        title: '14. Contact Information' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 36, scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 22, borderRadius: 2, background: CL.gold, flexShrink: 0 }} />
        <h2 style={{ margin: 0, color: CL.text, fontSize: 17, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.85 }}>{children}</div>
    </section>
  );
}

function Para({ children }) {
  return <p style={{ margin: '0 0 12px 0' }}>{children}</p>;
}

function Sub({ children }) {
  return <p style={{ margin: '14px 0 6px', color: CL.text, fontSize: 14, fontWeight: 700 }}>{children}</p>;
}

function List({ items }) {
  return (
    <ul style={{ margin: '0 0 12px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
        <div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Terms &amp; Conditions</div>
          <div style={{ color: CL.light, fontSize: 11 }}>Version 1.0 · 12 June 2026</div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 9, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {open ? 'Hide' : 'Contents'}
        </button>
      </div>

      {open && (
        <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: CL.gold, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 60px' }}>

        <div style={{ background: 'rgba(201,160,32,0.06)', border: '1px solid rgba(201,160,32,0.18)', borderRadius: 12, padding: '12px 16px', marginBottom: 28, color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>
          📄 These Business Terms and Conditions govern the use of the Fixera platform and apply to all Users, Customers, and Partners. By registering or using the Fixera platform, you agree to be bound by these Terms in their entirety.
        </div>

        <Section id="definitions" title="1. Definitions and Interpretation">
          <Para>In these Terms, the following expressions shall bear the meanings ascribed to them:</Para>
          <List items={[
            '"Fixera" or "the Company" means the digital marketplace platform operated by Fixera, connecting Customers seeking services with Partners providing such services.',
            '"Customer" means any registered user of the Fixera platform who seeks or procures services through the platform.',
            '"Partner" means any registered service provider on the Fixera platform, including but not limited to Service Workers, Vendors, Riders, Suppliers, Movers, and Water Carriers.',
            '"Service Worker" means a Partner who provides skilled trade services, including plumbing, electrical, painting, and cleaning services, but excluding carpentry unless otherwise agreed in writing.',
            '"Vendor" means a Partner that provides services as a service company or construction company.',
            '"Rider" or "Courier" means a Partner who provides delivery and courier services through the platform.',
            '"Supplier" means a Partner engaged in the supply of bulk goods and materials.',
            '"Mover" means a Partner who provides professional moving services.',
            '"Water Carrier" means a Partner who provides clean water delivery services.',
            '"Service" means any work performed by a Partner for a Customer through the Fixera platform pursuant to a confirmed booking.',
            '"Commission" means the transaction fee payable to Fixera upon completion of a Service, at the rates specified in Clause 3.1.',
            '"Wallet" means the digital payment and earnings management system maintained within the Fixera platform, available exclusively to Service Workers and Riders.',
            '"Deposit" means the mandatory security deposit of Kenya Shillings Five Hundred (KSh 500) required from all Partners upon registration.',
            '"KYC" means Know Your Customer verification and documentation as required under applicable Kenyan law.',
            '"ODPC" means the Office of the Data Protection Commissioner established under the Data Protection Act, No. 24 of 2019.',
            '"Platform" means the Fixera mobile and web application and all associated technology infrastructure.',
          ]} />
        </Section>

        <Section id="eligibility" title="2. User Eligibility and Registration">
          <Sub>2.1 Age Requirements</Sub>
          <Para>All persons registering on the Fixera platform, whether as Customers or Partners, must be at least eighteen (18) years of age. By registering, you represent and warrant that you meet this age requirement.</Para>
          <Sub>2.2 Registration Requirements</Sub>
          <List items={[
            'A valid, active telephone number registered in the user\'s name',
            'A valid email address accessible by the user',
            'Accurate and truthful personal information as may be requested by the Company',
            'Unconditional acceptance of these Terms and Conditions',
            'For Partners: acceptance of the applicable Partner-Specific Agreement',
          ]} />
          <Sub>2.3 Account Verification</Sub>
          <List items={[
            'All users: telephone number verification via SMS one-time password (OTP)',
            'All users: email address verification via confirmation link',
            'Partners: national identification document (National ID or Passport) verification',
            'Partners: background check clearance and criminal declaration prior to activation',
            'Partners: role-specific certifications as applicable — ERB registration number for electricians; valid driving licence, vehicle registration, and insurance for Riders; health certification and water quality certification for Water Carriers',
            'Partners with cumulative transactions exceeding KSh 100,000: full KYC documentation verification',
            'Vendors, Suppliers, Movers, and Water Carriers: certificate of incorporation, KRA PIN, business licence, and prior registration of all crew members in the Fixera Crew Registry before any crew member may be deployed on a booking',
          ]} />
          <Sub>2.4 Prohibited Activities</Sub>
          <List items={[
            'Impersonating any person or entity, or misrepresenting affiliation',
            'Creating multiple accounts or fraudulent accounts',
            'Conducting or facilitating any illegal activities through the Platform',
            'Engaging in harassment, discrimination, or abuse of any person',
            'Sharing, transferring, or disclosing account credentials to any third party',
            'Manipulating, fabricating, or otherwise interfering with ratings or reviews',
            'Soliciting, conducting, or completing service transactions outside the Platform',
            'Infringing the intellectual property rights of the Company or any third party',
            'For Partners: providing or arranging Services other than through the Platform',
          ]} />
        </Section>

        <Section id="commission" title="3. Commission and Payment Structure">
          <Sub>3.1 Commission Rates</Sub>
          <List items={[
            'Service Workers: 15% to the Company; 85% to the Partner',
            'Vendors: 20% to the Company; 80% to the Partner',
            'Riders: 15% to the Company; 85% to the Partner',
            'Suppliers: 20% to the Company; 80% to the Partner',
            'Movers: 20% to the Company; 80% to the Partner',
            'Water Carriers: 20% to the Company; 80% to the Partner',
          ]} />
          <Para>The Company reserves the right to revise Commission rates upon thirty (30) days prior written notice to Partners.</Para>
          <Sub>3.2 Payment Methods</Sub>
          <List items={[
            'Customer payments: M-Pesa STK Push or in-app wallet',
            'Service Workers and Riders: weekly via M-Pesa B2C transfer',
            'Vendors, Suppliers, Movers, and Water Carriers: monthly via bank transfer or M-Pesa B2C',
            'Minimum payout threshold: KSh 500',
            'M-Pesa B2C transaction fees (KSh 30 per transaction) absorbed by the Company',
          ]} />
          <Sub>3.3 Wallet System (Service Workers and Riders Only)</Sub>
          <List items={[
            'Minimum Wallet deposit of KSh 500 is mandatory for activation',
            'Partners may deposit above minimum to access higher-value or premium job categories',
            'Commission on cash-paid jobs shall be deducted from the Partner\'s Wallet balance',
            'Wallet balance below KSh 500 disqualifies the Partner from cash-payment jobs until replenished',
            'The Wallet deposit is refundable after 30 days subject to the Partner remaining in good standing',
          ]} />
          <Sub>3.4 Payment Terms (Other Partner Categories)</Sub>
          <List items={[
            'Vendors: monthly invoice-based settlement, net 7–30 days via bank transfer',
            'Suppliers: monthly order-based settlement, net 30–60 days via bank transfer',
            'Movers: weekly M-Pesa B2C settlement or monthly bank transfer, at the Partner\'s election',
            'Water Carriers: weekly M-Pesa B2C settlement',
          ]} />
          <Sub>3.5 Refund Policy</Sub>
          <List items={[
            'Cancellation less than 2 hours before service: full refund to the Customer',
            'Cancellation between 2 and 24 hours before service: fifty percent (50%) refund to the Customer',
            'Cancellation more than 24 hours before service: no refund shall be payable',
            'Service not completed by the Partner: full refund to the Customer; no payment to the Partner',
            'Disputes must be reported within twenty-four (24) hours of the scheduled service completion time',
          ]} />
        </Section>

        <Section id="delivery" title="4. Service Delivery and Quality Standards">
          <Sub>4.1 Partner Obligations</Sub>
          <List items={[
            'Arrive punctually, or notify the Customer of anticipated delay at least 30 minutes before the scheduled time',
            'Perform the Service strictly as described and confirmed in the booking',
            'Conduct themselves in a professional and courteous manner at all times',
            'Respect and preserve the Customer\'s property and privacy',
            'Complete the Service safely and in accordance with applicable industry standards',
            'Maintain appropriate standards of cleanliness, hygiene, and personal presentation',
            'Use adequate safety equipment appropriate to the Service',
            'Comply with all applicable laws, regulations, and licensing requirements',
            'Respond to Customer communications within thirty (30) minutes of receipt',
            'Conduct all communications through the Fixera messaging system only',
            'Obtain the Customer\'s written or digital confirmation of Service completion upon conclusion',
          ]} />
          <Sub>4.2 Customer Obligations</Sub>
          <List items={[
            'Provide accurate, complete, and sufficient details of the required Service at booking',
            'Provide the Partner with adequate access to the service location',
            'Make agreed payment in full and on time',
            'Maintain respectful, professional communication with Partners',
            'Submit fair and honest ratings and reviews following service completion',
          ]} />
          <Sub>4.3 Quality Standards and Partner Ratings</Sub>
          <List items={[
            'Average rating below 3.5 stars: subject to review and potential suspension',
            'Average rating below 3.0 stars: subject to automatic suspension pending review',
            'Suspension periods range from a minimum of 7 days to permanent deactivation, at the sole discretion of the Company',
          ]} />
        </Section>

        <Section id="operational" title="4A. Platform Operational Standards">
          <div style={{ background: 'rgba(201,160,32,0.06)', border: '1px solid rgba(201,160,32,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>
            ⚙️ This section describes the operational mechanics enforced by the Fixera platform. These requirements are binding on all Partners from the date of activation.
          </div>
          <Sub>4A.1 OTP Verification — Commencement and Completion</Sub>
          <Para>The Fixera platform uses a two-step OTP system to legally define when a Service begins and ends:</Para>
          <List items={[
            'Arrival OTP: upon arriving at the service location the Partner requests an OTP from the Customer. Entry of this OTP constitutes verified commencement of the Service.',
            'Completion OTP: upon finishing the Service the Customer confirms via a second OTP. Entry constitutes verified completion and triggers payment processing.',
            'These OTPs are the definitive record of commencement and completion for the purposes of payment, refunds, and dispute resolution.',
            'If a Customer is unavailable to provide an OTP the Partner must immediately report this via the platform messaging system.',
          ]} />
          <Sub>4A.2 GPS Tracking and Photo Documentation</Sub>
          <List items={[
            'Riders: photograph the item at collection and at delivery before marking the job complete.',
            'Movers: upload loading photographs before departure; maintain GPS throughout the move; submit delivery photographs and obtain Customer\'s signed or digital inventory confirmation at destination before closing the job.',
            'Water Carriers: maintain GPS during delivery; submit a delivery photograph before marking as complete.',
            'Disabling GPS during an active service or failing to submit required photographs without valid reason may result in non-payment and account suspension.',
          ]} />
          <Sub>4A.3 Exclusive Delivery Policy — Vendors and Suppliers</Sub>
          <Para>All collection and return delivery of Customer items is handled exclusively by Fixera Riders. No exceptions.</Para>
          <List items={[
            'Vendors and Suppliers must not use own staff, third-party couriers, or any other means to deliver to or collect from Customers.',
            'Customer contact details must not be shared with any external delivery provider.',
            'Off-platform delivery arrangement constitutes a material breach and results in permanent deactivation and forfeiture of outstanding earnings.',
          ]} />
          <Sub>4A.4 Crew Registry</Sub>
          <List items={[
            'Vendors, Suppliers, Movers, and Water Carriers must register all crew members in the Fixera Crew Registry before deployment on any booking.',
            'Each crew member must provide full name, national ID number, photograph, and role.',
            'Movers: the crew and vehicle confirmed at booking must attend. Substitutions only permitted where the substitute is already registered and the Customer is notified via the platform before departure.',
            'Operating with unregistered personnel is a breach and grounds for suspension.',
          ]} />
          <Sub>4A.5 Category-Specific Requirements</Sub>
          <Para><strong style={{ color: CL.text }}>Vendors</strong></Para>
          <List items={[
            'Accept or decline orders within two (2) operating hours. Non-response may result in automatic cancellation and a rating impact.',
            'Items must be returned clean, undamaged, and on time.',
            'Any damage discovered during processing must be reported immediately. Concealing damage is a breach.',
          ]} />
          <Para><strong style={{ color: CL.text }}>Suppliers</strong></Para>
          <List items={[
            'Only genuine, authentic products may be listed or supplied. Counterfeit, imitation, or misrepresented goods are strictly prohibited and result in permanent deactivation.',
            'Maintain accurate stock levels and pricing at all times.',
            'Bulk orders must be fulfilled on the agreed delivery schedule.',
          ]} />
          <Para><strong style={{ color: CL.text }}>Water Carriers</strong></Para>
          <List items={[
            'Food-grade containers only. Reused chemical containers or any non-food-grade container is strictly prohibited.',
            'Health certifications must be current and renewed monthly. A lapsed certificate results in immediate suspension.',
            'Delivery of contaminated water results in a minimum 30-day suspension, full Customer refund, and possible permanent deactivation.',
          ]} />
          <Para><strong style={{ color: CL.text }}>Movers</strong></Para>
          <List items={[
            'Moving company must be registered and in continuous operation for a minimum of two (2) years prior to onboarding.',
            'Minimum of five (5) verifiable professional references required during onboarding.',
            'All vehicles must be registered in the Fixera Fleet Registry with current photographs, plates, logbook, and insurance.',
            'Minimum public liability insurance of KSh 10,000,000 must be maintained at all times. A lapse results in immediate suspension until reinstated.',
          ]} />
        </Section>

        <Section id="disputes" title="5. Dispute Resolution Procedure">
          <Sub>5.1 Internal Dispute Resolution</Sub>
          <List items={[
            'Disputes must be reported within twenty-four (24) hours of the scheduled service completion',
            'The Company shall review all available evidence including photographs, platform messages, and system timestamps',
            'The Company shall determine a resolution, which may include a refund, payment, or suspension',
            'Any dissatisfied party may lodge an appeal within seven (7) days of notification',
            'The final decision of the Company\'s management following appeal shall be binding on all parties',
          ]} />
          <Sub>5.2 Dispute Categories and Resolutions</Sub>
          <List items={[
            'Service not performed: full refund to the Customer; no payment to the Partner',
            'Service partially completed: partial refund at the Company\'s assessed proportion',
            'Quality deficiencies: partial refund proportionate to severity assessed by the Company',
            'Partner no-show: full refund to the Customer and suspension of the Partner',
            'Customer no-show: no refund; Partner retains the full fee for the scheduled Service',
          ]} />
          <Sub>5.3 Payment Disputes and Chargebacks</Sub>
          <List items={[
            'All chargebacks shall be handled through the M-Pesa dispute resolution process',
            'The Company shall cooperate fully with M-Pesa in the investigation of any chargeback',
            'Fraudulent chargebacks by a Partner shall result in permanent deactivation of the Partner\'s account',
            'Where a chargeback is determined to be legitimate, the Customer shall be refunded and the Partner shall forfeit the relevant payment',
          ]} />
        </Section>

        <Section id="deposits" title="6. Deposits and Security Requirements">
          <Sub>6.1 Mandatory Security Deposit (All Partners)</Sub>
          <Para>All Partners, irrespective of category, are required to pay a mandatory security deposit of Kenya Shillings Five Hundred (KSh 500) upon registration, serving as security for the protection of Customers against Partner misconduct. The deposit shall be refundable after thirty (30) days provided the Partner is in good standing with no unresolved complaints and no violations of these Terms.</Para>
          <Sub>6.2 Wallet Deposit System (Service Workers and Riders Only)</Sub>
          <List items={[
            'Minimum Wallet deposit: KSh 500 (standard access to job listings)',
            'Deposit of KSh 1,000: access to an expanded range of job opportunities',
            'Deposit of KSh 2,000 and above: access to premium job categories',
            'Commission on cash-payment jobs deducted from the Wallet balance',
            'Wallet balance below KSh 500 disqualifies Partner from cash-payment jobs until replenished',
            'M-Pesa-payment jobs shall not result in any deduction from the Wallet balance',
          ]} />
          <Sub>6.3 Deposit Forfeiture</Sub>
          <List items={[
            'Category 1 — Fraud (identity fraud, payment fraud, impersonation): 100% forfeiture',
            'Category 2 — Customer Harm (theft, property damage, physical violence): 50%–100% forfeiture at Company\'s discretion',
            'Category 3 — Platform Abuse (rating manipulation, harassment): 25%–100% forfeiture',
            'Category 4 — Repeated Policy Violations: 25% or more on an escalating basis',
          ]} />
        </Section>

        <Section id="liability" title="7. Liability and Limitation of Liability">
          <Sub>7.1 Company's Limitation of Liability</Sub>
          <Para>To the fullest extent permitted by applicable law, Fixera shall not be liable for:</Para>
          <List items={[
            'Personal injury or property damage suffered by a Customer or any third party during or as a result of Service delivery',
            'Loss of or damage to Customer property, except to the extent covered by applicable insurance',
            'The misconduct, negligence, or poor workmanship of any Partner',
            'The acts or omissions of any third party',
            'Service quality issues or disputes between Partners and Customers',
            'Platform downtime, technical failures, or interruptions in service',
          ]} />
          <Sub>7.2 Aggregate Liability Cap</Sub>
          <Para>The Company's total aggregate liability to any party in connection with any single transaction shall be limited to the lesser of: the amount paid by the Customer for the specific Service giving rise to the claim; or Kenya Shillings Ten Thousand (KSh 10,000).</Para>
          <Sub>7.3 Indemnification by Partners</Sub>
          <Para>Each Partner agrees to indemnify, defend, and hold harmless Fixera and its officers, directors, employees, and agents from and against all claims, demands, liabilities, losses, damages, costs, and expenses arising from the Partner's conduct in service delivery; personal injury or property damage caused by the Partner; the Partner's violation of any applicable law or these Terms; or any third-party claims arising from the Partner's services.</Para>
          <Sub>7.4 Insurance Requirements</Sub>
          <Para>Partners engaged in high-risk services, including moving and construction activities, are required to maintain adequate public liability insurance at all times. Fixera does not provide insurance cover for Partners or their activities. Evidence of insurance shall be provided during onboarding and upon request thereafter.</Para>
        </Section>

        <Section id="ip" title="8. Intellectual Property Rights and Brand Protection">
          <Sub>8.1 Ownership of Intellectual Property</Sub>
          <Para>All intellectual property rights in and relating to the Fixera Platform are and shall remain the exclusive property of the Company, including: the Fixera brand name, logo, trademarks, and service marks; the Platform's technology, software, source code, and algorithms; all user interface designs, features, and functionality; all marketing and promotional materials; database structures and data compilations; proprietary business models, processes, and methodologies; and all digital infrastructure and content.</Para>
          <Sub>8.2 Restrictions on Use</Sub>
          <List items={[
            'Copying, reproducing, distributing, or transmitting any content from the Platform without prior written consent',
            'Using the Fixera name, logo, or trademarks without prior written authorisation',
            'Creating competing platforms, services, or technologies based on or derived from Fixera\'s business model',
            'Reverse engineering, decompiling, or disassembling any aspect of the Platform\'s technology',
            'Claiming ownership of any feature, design, or process of the Platform',
            'Using Fixera\'s intellectual property for unauthorised commercial purposes',
            'Accessing, exporting, or misappropriating Customer data or Partner data',
            'Disclosing proprietary Platform information to competitors or third parties',
          ]} />
          <Sub>8.3 Limited Licence</Sub>
          <Para>Partners are granted a limited, non-exclusive, non-transferable, and revocable licence to access and use the Platform solely for the purposes contemplated by this Agreement. This licence automatically terminates upon deactivation, suspension, or termination of the Partner's account.</Para>
        </Section>

        <Section id="privacy" title="9. Data Privacy and Security">
          <Sub>9.1 Data Collected</Sub>
          <List items={[
            'Personal identification information: full name, telephone number, email address, and national identification number',
            'Transaction data: bookings, payment records, ratings, and reviews',
            'Location data: service delivery locations and GPS data where applicable',
            'Device information: for security monitoring and fraud detection purposes',
            'Communication logs: messages and correspondence conducted through the Platform',
          ]} />
          <Sub>9.2 Purpose of Data Processing</Sub>
          <List items={[
            'Facilitating service delivery and processing transactions',
            'Processing payments and administering Partner settlements',
            'Fraud detection, prevention, and platform security',
            'Service analytics, quality assurance, and platform improvement',
            'Communication with Customers and Partners',
            'Compliance with legal and regulatory obligations under Kenyan law',
          ]} />
          <Sub>9.3 Data Protection Compliance</Sub>
          <Para>The Company is committed to processing personal data in accordance with the Data Protection Act, No. 24 of 2019 (Laws of Kenya) and the regulations of the ODPC. All sensitive data is encrypted both in transit and at rest; the Company shall not sell personal data to any third party; data is retained only for such periods as required by applicable law.</Para>
          <Sub>9.4 Data Subject Rights</Sub>
          <Para>Users have the following rights, exercisable upon written request to the Company: the right to access personal data held; the right to rectify inaccurate or incomplete data; the right to erase personal data, subject to applicable legal retention obligations; and the right to object to processing in certain circumstances. All valid requests shall be processed within thirty (30) days. For full details, see our <span onClick={() => navigate('/privacy')} style={{ color: CL.gold, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.</Para>
        </Section>

        <Section id="suspension" title="10. Suspension and Termination of Accounts">
          <Sub>10.1 Grounds for Suspension or Termination</Sub>
          <Para>The Company reserves the right to suspend or terminate any account, with or without prior notice, in the event of: a violation of these Terms; multiple Customer disputes within any rolling 30-day period; fraudulent activity; non-payment of applicable fees; conduct posing a safety risk; violation of any applicable law; a Partner's average rating falling below 3.0 stars (automatic suspension); or any other material breach of these Terms or the applicable Partner Agreement.</Para>
          <Sub>10.2 Graduated Suspension Procedure</Sub>
          <List items={[
            'First offence: formal written warning',
            'Repeated violations: temporary suspension for 7 to 30 days',
            'Serious or persistent violations: permanent deactivation from the Platform',
          ]} />
          <Sub>10.3 Appeal Procedure</Sub>
          <List items={[
            'Appeal must be lodged within seven (7) days of notification',
            'The appeal shall be reviewed by the Company\'s management team',
            'The outcome shall be communicated to the user within fourteen (14) days of receipt',
            'The Company\'s decision on appeal shall be final and binding',
          ]} />
          <Sub>10.4 Consequences of Termination</Sub>
          <List items={[
            'The Partner shall immediately cease accepting new bookings',
            'All outstanding earnings shall be paid to the Partner within 30 days, subject to deduction of amounts owed',
            'Access to the account shall be revoked with immediate effect',
            'Personal data shall be retained in accordance with applicable legal requirements',
            'No refund of the Deposit shall be made where termination results from a policy violation',
          ]} />
        </Section>

        <Section id="modifications" title="11. Modifications to Terms">
          <Para>The Company reserves the right to amend, update, or replace these Terms at any time. The Company shall provide not less than thirty (30) days' advance written notice of any material amendments via email or in-app notification. Continued use of the Platform following the expiry of the notice period shall constitute acceptance of the amended Terms. A user who does not accept the amended Terms may terminate their account prior to the effective date of the amendment.</Para>
        </Section>

        <Section id="governing" title="12. Governing Law and Dispute Resolution">
          <Para>These Terms are governed by and shall be construed in accordance with the laws of the Republic of Kenya. Any dispute, controversy, or claim arising out of or relating to these Terms shall first be submitted to good faith negotiations. In the absence of agreement, the dispute shall be referred to the courts of the Republic of Kenya. Each party irrevocably submits to the jurisdiction of the Kenyan courts.</Para>
        </Section>

        <Section id="severability" title="13. Severability">
          <Para>If any provision of these Terms is held by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, such provision shall be severed from the remaining Terms, which shall continue in full force and effect as if the severed provision had not been included.</Para>
        </Section>

        <Section id="contact" title="14. Contact Information">
          <Para>All enquiries, legal notices, and correspondence in connection with these Terms should be directed to:</Para>
          <Para><strong style={{ color: CL.text }}>Fixera Company Limited</strong></Para>
          <Para>Email: <a href="mailto:legal@fixera.africa" style={{ color: CL.gold, fontWeight: 600, textDecoration: 'none' }}>legal@fixera.africa</a></Para>
          <Para>Telephone: <a href="tel:+254712008361" style={{ color: CL.gold, fontWeight: 600, textDecoration: 'none' }}>+254 712 008 361</a></Para>
          <Para>Business Hours: Monday to Friday, 09:00 to 17:00 EAT</Para>
        </Section>

        {/* Footer links */}
        <div style={{ borderTop: `1px solid ${CL.border}`, paddingTop: 24, marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Privacy Policy', path: '/privacy', color: '#63B3ED' },
            { label: 'AI Policy',      path: '/ai-policy', color: '#48BB78' },
          ].map(l => (
            <button key={l.path} onClick={() => navigate(l.path)}
              style={{ padding: '9px 18px', borderRadius: 10, border: `1px solid ${l.color}30`, background: l.color + '10', color: l.color, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {l.label}
            </button>
          ))}
        </div>

        <div style={{ color: CL.light, fontSize: 11, textAlign: 'center', marginTop: 24 }}>
          © 2026 Fixera Company Limited · P.O. Box 12997 - 00100, Nairobi, Kenya
        </div>
      </div>
    </div>
  );
}
