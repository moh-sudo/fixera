import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FixeraLogo from '../../components/FixeraLogo';
import { useCL } from '../../hooks/useCL';

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

function SectionBlock({ id, title, children }) {
  const CL = useCL();
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: `linear-gradient(180deg, ${CL.gold}, ${'#D4B033'})` }} />
        <h2 style={{ margin: 0, color: CL.text, fontSize: 20, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

function Para({ children }) {
  return <p style={{ margin: '0 0 14px 0' }}>{children}</p>;
}

function Sub({ children }) {
  const CL = useCL();
  return <p style={{ margin: '16px 0 8px', color: CL.text, fontSize: 14, fontWeight: 700 }}>{children}</p>;
}

function List({ items }) {
  const CL = useCL();
  return (
    <ul style={{ margin: '0 0 14px 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: CL.muted, fontSize: 14, lineHeight: 1.7 }}>{item}</li>
      ))}
    </ul>
  );
}

function Highlight({ children }) {
  const CL = useCL();
  return (
    <div style={{ background: 'rgba(201,160,32,0.08)', border: `1px solid rgba(201,160,32,0.2)`, borderRadius: 12, padding: '14px 18px', marginBottom: 14, color: CL.muted, fontSize: 14, lineHeight: 1.8 }}>
      {children}
    </div>
  );
}

export default function TermsPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('definitions');
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); }); },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) observerRef.current.observe(el); });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'inherit' }}>

      {/* ── Top bar ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(122,139,160,0.1)', border: `1px solid ${CL.border}`, color: CL.muted, borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back
          </button>
          <div style={{ width: 1, height: 24, background: CL.border }} />
          <FixeraLogo size={32} showText={true} showTagline={false} />
        </div>
        <div style={{ color: CL.light, fontSize: 12, fontWeight: 600 }}>Version 1.0 · 12 June 2026</div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 48 }}>

        {/* ── Sticky sidebar TOC ── */}
        <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 90, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div style={{ color: CL.light, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, marginBottom: 14, textTransform: 'uppercase' }}>Contents</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => scrollTo(s.id)} style={{ textAlign: 'left', background: isActive ? 'rgba(201,160,32,0.10)' : 'transparent', border: 'none', borderLeft: `3px solid ${isActive ? CL.gold : 'transparent'}`, color: isActive ? CL.gold : CL.muted, fontSize: 12, fontWeight: isActive ? 700 : 500, padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit', borderRadius: '0 8px 8px 0', transition: 'all 0.15s', lineHeight: 1.4 }}>
                  {s.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,160,32,0.10)', border: `1px solid rgba(201,160,32,0.2)`, borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ color: CL.gold, fontSize: 12, fontWeight: 700 }}>Legal · Business Terms and Conditions</span>
            </div>
            <h1 style={{ margin: '0 0 12px', color: CL.text, fontSize: 34, fontWeight: 900, lineHeight: 1.2 }}>Terms &amp; Conditions</h1>
            <p style={{ margin: 0, color: CL.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
              These Business Terms and Conditions govern the use of the Fixera platform and apply to all Users, Customers, and Partners. By registering or using the Fixera platform, you agree to be bound by these Terms in their entirety.
            </p>
          </div>

          {/* 1 */}
          <SectionBlock id="definitions" title="1. Definitions and Interpretation">
            <Para>In these Terms, unless the context otherwise requires, the following expressions shall bear the meanings ascribed to them:</Para>
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
              '"KYC" means Know Your Customer verification and documentation as required under applicable Kenyan law and regulations.',
              '"ODPC" means the Office of the Data Protection Commissioner established under the Data Protection Act, No. 24 of 2019.',
              '"Platform" means the Fixera mobile and web application and all associated technology infrastructure.',
            ]} />
            <Para>In these Terms, references to a person include natural persons, companies, partnerships, and other legal entities; the singular includes the plural and vice versa; headings are for ease of reference only and shall not affect interpretation.</Para>
          </SectionBlock>

          {/* 2 */}
          <SectionBlock id="eligibility" title="2. User Eligibility and Registration">
            <Sub>2.1 Age Requirements</Sub>
            <Para>All persons registering on the Fixera platform, whether as Customers or Partners, must be at least eighteen (18) years of age. By registering, you represent and warrant that you meet this age requirement.</Para>
            <Sub>2.2 Registration Requirements</Sub>
            <Para>All users must provide the following information upon registration:</Para>
            <List items={[
              'A valid, active telephone number registered in the user\'s name',
              'A valid email address accessible by the user',
              'Accurate and truthful personal information as may be requested by the Company',
              'Unconditional acceptance of these Terms and Conditions',
              'For Partners: acceptance of the applicable Partner-Specific Agreement',
            ]} />
            <Sub>2.3 Account Verification</Sub>
            <Para>The Company shall verify accounts as follows:</Para>
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
            <Para>Users of the Platform are expressly prohibited from:</Para>
            <List items={[
              'Impersonating any person or entity, or misrepresenting affiliation with any person or entity',
              'Creating multiple accounts or fraudulent accounts',
              'Conducting or facilitating any illegal activities through the Platform',
              'Engaging in harassment, discrimination, or abuse of any person',
              'Sharing, transferring, or disclosing account credentials to any third party',
              'Manipulating, fabricating, or otherwise interfering with ratings or reviews',
              'Soliciting, conducting, or completing service transactions outside the Platform',
              'Infringing the intellectual property rights of the Company or any third party',
              'For Partners: providing or arranging Services other than through the Platform',
            ]} />
          </SectionBlock>

          {/* 3 */}
          <SectionBlock id="commission" title="3. Commission and Payment Structure">
            <Sub>3.1 Commission Rates</Sub>
            <Para>The Company shall deduct Commission from each completed transaction at the following rates:</Para>
            <List items={[
              'Service Workers: fifteen percent (15%) to the Company; eighty-five percent (85%) to the Partner',
              'Vendors: twenty percent (20%) to the Company; eighty percent (80%) to the Partner',
              'Riders: fifteen percent (15%) to the Company; eighty-five percent (85%) to the Partner',
              'Suppliers: twenty percent (20%) to the Company; eighty percent (80%) to the Partner',
              'Movers: twenty percent (20%) to the Company; eighty percent (80%) to the Partner',
              'Water Carriers: twenty percent (20%) to the Company; eighty percent (80%) to the Partner',
            ]} />
            <Para>The Company reserves the right to revise Commission rates upon thirty (30) days prior written notice to Partners.</Para>
            <Sub>3.2 Payment Methods</Sub>
            <List items={[
              'Customer payments: M-Pesa STK Push or in-app wallet',
              'Partner settlements (Service Workers and Riders): weekly via M-Pesa Business to Customer (B2C) transfer',
              'Partner settlements (Vendors, Suppliers, Movers, and Water Carriers): monthly via bank transfer or M-Pesa B2C, as applicable',
              'Minimum payout threshold: Kenya Shillings Five Hundred (KSh 500)',
              'M-Pesa B2C transaction fees (KSh 30 per transaction) shall be absorbed by the Company',
            ]} />
            <Sub>3.3 Wallet System (Service Workers and Riders Only)</Sub>
            <List items={[
              'A minimum Wallet deposit of Kenya Shillings Five Hundred (KSh 500) is mandatory for activation',
              'Partners may deposit amounts in excess of the minimum to access higher-value or premium job categories',
              'Commission on cash-paid jobs shall be deducted from the Partner\'s Wallet balance',
              'A Partner whose Wallet balance falls below KSh 500 shall not be eligible to accept cash-payment jobs until the balance is replenished',
              'The Wallet deposit is refundable after thirty (30) days subject to the Partner remaining in good standing',
            ]} />
            <Sub>3.4 Payment Terms for Other Partner Categories</Sub>
            <List items={[
              'Vendors: monthly invoice-based settlement on net seven (7) to thirty (30) days terms via bank transfer',
              'Suppliers: monthly order-based settlement on net thirty (30) to sixty (60) days terms via bank transfer',
              'Movers: weekly M-Pesa B2C settlement or monthly bank transfer, at the Partner\'s election',
              'Water Carriers: weekly M-Pesa B2C settlement',
            ]} />
            <Sub>3.5 Refund Policy</Sub>
            <List items={[
              'Cancellation made less than two (2) hours before the scheduled service commencement: full refund to the Customer',
              'Cancellation made between two (2) and twenty-four (24) hours before the scheduled service: fifty percent (50%) refund to the Customer',
              'Cancellation made more than twenty-four (24) hours before the scheduled service: no refund shall be payable',
              'Service not completed by the Partner: full refund to the Customer; no payment to the Partner',
              'Disputes must be reported within twenty-four (24) hours of the scheduled service completion time',
            ]} />
          </SectionBlock>

          {/* 4 */}
          <SectionBlock id="delivery" title="4. Service Delivery and Quality Standards">
            <Sub>4.1 Partner Obligations</Sub>
            <Para>Each Partner undertakes to:</Para>
            <List items={[
              'Arrive at the service location punctually, or to notify the Customer of any anticipated delay no less than thirty (30) minutes prior to the scheduled time',
              'Verify service commencement via the platform arrival OTP and confirm completion via the platform completion OTP as prompted by the system',
              'Perform the Service strictly as described and confirmed in the booking',
              'Conduct themselves in a professional and courteous manner at all times',
              'Respect and preserve the Customer\'s property and privacy',
              'Complete the Service safely and in accordance with applicable industry standards',
              'Maintain appropriate standards of cleanliness, hygiene, and personal presentation',
              'Use adequate safety equipment appropriate to the Service being performed',
              'Comply with all applicable local and national laws, regulations, and licensing requirements',
              'Respond to Customer communications within thirty (30) minutes of receipt',
              'Conduct all communications through the Fixera messaging system and not through private channels',
              'Riders, Movers, and Water Carriers: maintain active GPS tracking throughout the duration of service delivery and submit photographic evidence of pick-up and delivery as prompted by the platform',
              'Movers: capture and upload loading photographs before departure, obtain a signed or digitally confirmed inventory from the Customer at delivery, and arrive with the crew and vehicle registered to the booking — unregistered substitutions are not permitted',
              'Vendors and Suppliers: all delivery of items to and from Customers shall be conducted exclusively by Fixera Riders; arranging delivery through any other means — including own staff, third-party couriers, or direct arrangement with the Customer — constitutes a material breach of this Agreement and may result in permanent deactivation',
              'Vendors, Suppliers, Movers, and Water Carriers: ensure all crew members engaged in service delivery are registered in the Fixera Crew Registry prior to deployment',
              'Obtain the Customer\'s written or digital confirmation of Service completion upon conclusion',
            ]} />
            <Sub>4.2 Customer Obligations</Sub>
            <Para>Each Customer undertakes to:</Para>
            <List items={[
              'Provide accurate, complete, and sufficient details of the required Service at the time of booking',
              'Provide the Partner with adequate access to the service location',
              'Make agreed payment in full and on time',
              'Maintain respectful, professional communication with Partners',
              'Submit fair and honest ratings and reviews following service completion',
            ]} />
            <Sub>4.3 Quality Standards and Partner Ratings</Sub>
            <Para>The Company operates a quality assurance rating system on a scale of one (1) to five (5) stars. The following consequences apply:</Para>
            <List items={[
              'Partners whose average rating falls below three-and-a-half (3.5) stars: subject to review and potential suspension',
              'Partners whose average rating falls below three (3.0) stars: subject to automatic suspension pending review',
              'Suspension periods range from a minimum of seven (7) days to permanent deactivation, at the sole discretion of the Company',
            ]} />
          </SectionBlock>

          {/* 4A */}
          <SectionBlock id="operational" title="4A. Platform Operational Standards">
            <Highlight>
              ⚙️ This section describes the operational mechanics enforced by the Fixera platform. These requirements apply in addition to the obligations set out in Section 4 and are binding on all Partners from the date of activation.
            </Highlight>
            <Sub>4A.1 OTP Verification — Commencement and Completion</Sub>
            <Para>The Fixera platform uses a two-step one-time password (OTP) system to legally define when a Service begins and ends:</Para>
            <List items={[
              'Arrival OTP: upon arriving at the service location, the Partner requests and receives an OTP from the Customer via the platform. Entry of this OTP by the Partner constitutes verified commencement of the Service.',
              'Completion OTP: upon finishing the Service, the Customer is prompted to confirm completion via a second OTP. Entry of this OTP constitutes verified completion of the Service and triggers payment processing.',
              'These OTPs are the definitive record of commencement and completion for the purposes of payment, refunds, and dispute resolution.',
              'Where a Customer is unavailable to provide an OTP, the Partner must immediately report this through the platform messaging system. Failure to do so may affect payment eligibility.',
            ]} />
            <Sub>4A.2 GPS Tracking and Photo Documentation</Sub>
            <Para>The following Partners are required to maintain active GPS tracking throughout the duration of every active service and to submit photographic evidence as prompted by the platform:</Para>
            <List items={[
              'Riders: photograph the item at collection and again at the point of delivery before marking the job as complete',
              'Movers: upload loading photographs of all items before departure from the origin location; maintain GPS throughout the move; submit delivery photographs and obtain the Customer\'s signed or digital inventory confirmation at the destination before closing the job',
              'Water Carriers: maintain GPS during delivery; submit a delivery photograph before marking the delivery as complete',
              'Disabling GPS during an active service or failing to submit required photographs without a valid reason constitutes a breach of these Terms and may result in non-payment for the affected job and suspension of the account',
            ]} />
            <Sub>4A.3 Exclusive Delivery Policy — Vendors and Suppliers</Sub>
            <Para>All collection of items from Customers and return delivery of completed items is handled exclusively by Fixera Riders through the platform's logistics system. This applies to all Vendor and Supplier Partners without exception.</Para>
            <List items={[
              'Vendors and Suppliers must not use their own staff, third-party couriers, or any other means to deliver items to or collect items from Customers',
              'Vendors and Suppliers must not share Customer contact details or addresses with any external delivery provider',
              'Arranging or completing delivery outside the Fixera platform, or sharing Customer details for the purpose of off-platform delivery, constitutes a material breach of this Agreement',
              'A confirmed breach of this clause shall result in permanent deactivation of the Partner\'s account and forfeiture of any outstanding earnings',
            ]} />
            <Sub>4A.4 Crew Registry</Sub>
            <Para>Vendors, Suppliers, Movers, and Water Carriers that engage multiple crew members in service delivery are required to register all such persons in the Fixera Crew Registry prior to their deployment on any booking. Each registered crew member must provide their full name, national identification number, photograph, and role within the operation.</Para>
            <List items={[
              'Deployment of any unregistered crew member on a Customer booking is a breach of these Terms',
              'For Movers: the crew and vehicle assigned to a booking at the point of confirmation must be the crew and vehicle that attends; substitutions are only permitted where the substitute crew member or vehicle is already registered in the Crew Registry and the Customer is notified via the platform before departure',
              'The Company reserves the right to audit crew registrations and to suspend any Partner found to be operating with unregistered personnel',
            ]} />
            <Sub>4A.5 Category-Specific Operational Requirements</Sub>
            <Para><strong style={{ color: CL.text }}>Vendors</strong></Para>
            <List items={[
              'Vendors must accept or decline each incoming order within two (2) operating hours of receipt. Failure to respond within this window may result in automatic cancellation and a negative impact on the Partner\'s performance rating.',
              'Items must be returned to the Customer clean, undamaged, and on time.',
              'Any damage to a Customer\'s item discovered during processing must be reported to the Company immediately via the platform. Concealing damage is a breach of these Terms and grounds for suspension.',
            ]} />
            <Para><strong style={{ color: CL.text }}>Suppliers</strong></Para>
            <List items={[
              'Suppliers must only list and supply genuine, authentic products. The listing, sale, or supply of counterfeit, imitation, or misrepresented goods is strictly prohibited and shall result in permanent deactivation of the Supplier\'s account.',
              'Suppliers must maintain accurate stock levels and pricing on the platform at all times.',
              'Bulk orders must be fulfilled on the agreed delivery schedule.',
            ]} />
            <Para><strong style={{ color: CL.text }}>Water Carriers</strong></Para>
            <List items={[
              'Water Carriers must use food-grade containers exclusively. The use of reused chemical containers, drums previously used for non-food substances, or any container not certified as food-grade is strictly prohibited.',
              'Health certifications must be current and renewed on a monthly basis. A lapsed health certification results in immediate suspension until a valid certificate is provided.',
              'Water quality certification for the water source must be maintained and available for inspection upon request.',
              'Water Carriers must ensure all delivered water is clean and uncontaminated. Delivery of contaminated water constitutes a serious breach and shall result in a minimum thirty (30) day suspension, a full refund to the Customer, and possible permanent deactivation.',
            ]} />
            <Para><strong style={{ color: CL.text }}>Movers</strong></Para>
            <List items={[
              'Moving companies must have been registered and in continuous operation for a minimum of two (2) years prior to onboarding.',
              'A minimum of five (5) verifiable professional references must be provided during the onboarding process.',
              'All vehicles used for bookings must be registered in the Fixera Fleet Registry with current photographs, registration plates, logbook, and insurance details.',
              'Public liability insurance of a minimum of Kenya Shillings Ten Million (KSh 10,000,000) must be maintained at all times. A lapse in this insurance results in immediate suspension until valid cover is reinstated and evidenced.',
            ]} />
          </SectionBlock>

          {/* 5 */}
          <SectionBlock id="disputes" title="5. Dispute Resolution Procedure">
            <Sub>5.1 Internal Dispute Resolution</Sub>
            <List items={[
              'A Customer or Partner must report any dispute within twenty-four (24) hours of the scheduled service completion',
              'The Company shall review all available evidence, including photographs, platform messages, and system timestamps',
              'The Company shall determine a resolution, which may include a refund, payment, or suspension of the relevant party',
              'Any party dissatisfied with the Company\'s determination may lodge an appeal within seven (7) days of notification',
              'The final decision of the Company\'s management following appeal shall be binding on all parties',
            ]} />
            <Sub>5.2 Dispute Categories and Applicable Resolutions</Sub>
            <List items={[
              'Service not performed: full refund to the Customer; no payment to the Partner',
              'Service partially completed: partial refund at the Company\'s assessed proportion',
              'Quality deficiencies: partial refund proportionate to the severity assessed by the Company',
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
          </SectionBlock>

          {/* 6 */}
          <SectionBlock id="deposits" title="6. Deposits and Security Requirements">
            <Sub>6.1 Mandatory Security Deposit (All Partners)</Sub>
            <Para>All Partners, irrespective of category, are required to pay a mandatory security deposit of Kenya Shillings Five Hundred (KSh 500) upon registration. This deposit serves as security for the protection of Customers against Partner misconduct and as an assurance of the Partner's commitment to compliance with these Terms.</Para>
            <Para>The deposit shall be refundable after thirty (30) days provided the Partner is in good standing, has no unresolved complaints, and has committed no violations of these Terms.</Para>
            <Sub>6.2 Wallet Deposit System (Service Workers and Riders Only)</Sub>
            <List items={[
              'Minimum Wallet deposit: KSh 500 (standard access to job listings)',
              'Deposit of KSh 1,000: access to an expanded range of job opportunities',
              'Deposit of KSh 2,000 and above: access to premium job categories',
              'Commission on cash-payment jobs shall be deducted from the Wallet balance',
              'A Wallet balance falling below KSh 500 disqualifies the Partner from accepting cash-payment jobs until replenished',
              'M-Pesa-payment jobs shall not result in any deduction from the Wallet balance',
            ]} />
            <Sub>6.3 Deposit Forfeiture</Sub>
            <Para>Deposits may be forfeited in whole or in part on the following grounds:</Para>
            <List items={[
              'Category 1 — Fraud (including identity fraud, payment fraud, and impersonation): one hundred percent (100%) forfeiture',
              'Category 2 — Customer Harm (including theft, property damage, and physical violence): fifty percent (50%) to one hundred percent (100%) forfeiture, at the Company\'s discretion',
              'Category 3 — Platform Abuse (including rating manipulation and harassment): twenty-five percent (25%) to one hundred percent (100%) forfeiture',
              'Category 4 — Repeated Policy Violations: twenty-five percent (25%) or more on an escalating basis',
            ]} />
          </SectionBlock>

          {/* 7 */}
          <SectionBlock id="liability" title="7. Liability and Limitation of Liability">
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
            <Para>The Company's total aggregate liability to any party in connection with any single transaction shall be limited to the lesser of the amount paid by the Customer for the specific Service giving rise to the claim; or Kenya Shillings Ten Thousand (KSh 10,000). This limitation shall apply notwithstanding the nature or basis of the claim.</Para>
            <Sub>7.3 Indemnification by Partners</Sub>
            <Para>Each Partner agrees to indemnify, defend, and hold harmless Fixera and its officers, directors, employees, and agents from and against any and all claims, demands, liabilities, losses, damages, costs, and expenses (including reasonable legal fees) arising from or related to the Partner's conduct, acts, or omissions in the course of service delivery; personal injury or property damage caused by the Partner; the Partner's violation of any applicable law, regulation, or licensing requirement; any breach by the Partner of these Terms or the applicable Partner Agreement; or any third-party claims arising from the Partner's services.</Para>
            <Sub>7.4 Insurance Requirements</Sub>
            <Para>Partners engaged in high-risk services are required to maintain public liability insurance at all times. Movers must maintain a minimum cover of Kenya Shillings Ten Million (KSh 10,000,000); other high-risk categories including construction and water delivery must maintain cover appropriate to the scale of their operations. Evidence of current insurance shall be provided during onboarding and upon request at any time. A lapse in required insurance constitutes grounds for immediate suspension until cover is reinstated. Fixera does not provide insurance cover for Partners or their activities.</Para>
          </SectionBlock>

          {/* 8 */}
          <SectionBlock id="ip" title="8. Intellectual Property Rights and Brand Protection">
            <Sub>8.1 Ownership of Intellectual Property</Sub>
            <Para>All intellectual property rights in and relating to the Fixera Platform are and shall remain the exclusive property of the Company, including without limitation: the Fixera brand name, logo, trademarks, and service marks; the Platform's technology, software, source code, and algorithms; all user interface designs, features, and functionality; all marketing and promotional materials; database structures and data compilations; proprietary business models, processes, and methodologies; and all digital infrastructure and content.</Para>
            <Sub>8.2 Restrictions on Use</Sub>
            <Para>Users and Partners are expressly prohibited from:</Para>
            <List items={[
              'Copying, reproducing, distributing, or transmitting any content from the Platform without prior written consent',
              'Using the Fixera name, logo, or trademarks without prior written authorisation',
              'Creating or developing competing platforms, services, or technologies based on or derived from Fixera\'s business model or proprietary methods',
              'Reverse engineering, decompiling, or disassembling any aspect of the Platform\'s technology',
              'Claiming ownership of, or attempting to register as intellectual property, any feature, design, or process of the Platform',
              'Using Fixera\'s intellectual property for unauthorised commercial purposes',
              'Accessing, exporting, or misappropriating Customer data or Partner data',
              'Disclosing proprietary Platform information to competitors or third parties',
            ]} />
            <Sub>8.3 Limited Licence</Sub>
            <Para>Subject to compliance with these Terms, Partners are granted a limited, non-exclusive, non-transferable, and revocable licence to access and use the Platform solely for the purposes contemplated by this Agreement; display Fixera branding only to the extent pre-approved in writing by the Company; and make reference to their Fixera partnership in a professional capacity with prior written permission. This licence shall automatically terminate upon deactivation, suspension, or termination of the Partner's account.</Para>
          </SectionBlock>

          {/* 9 */}
          <SectionBlock id="privacy" title="9. Data Privacy and Security">
            <Sub>9.1 Data Collected</Sub>
            <Para>In the course of operating the Platform, Fixera collects the following categories of personal data:</Para>
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
            <Para>The Company is committed to processing personal data in accordance with the Data Protection Act, No. 24 of 2019 (Laws of Kenya) and the regulations of the ODPC. All sensitive data is encrypted both in transit and at rest; the Company shall not sell personal data to any third party; data is retained only for such periods as required by applicable law; and regular security audits are conducted to maintain data integrity.</Para>
            <Sub>9.4 Data Subject Rights</Sub>
            <Para>Users have the following rights in respect of their personal data, exercisable upon written request to the Company: the right to access their personal data held by the Company; the right to rectify inaccurate or incomplete data; the right to erase personal data, subject to applicable legal retention obligations; and the right to object to processing in certain circumstances. All valid data subject requests shall be processed within thirty (30) days of receipt.</Para>
            <Highlight>
              🛡️ For full details of how your personal data is collected, used, and protected, please read our{' '}
              <span onClick={() => navigate('/privacy')} style={{ color: '#C9A020', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span> and{' '}
              <span onClick={() => navigate('/ai-policy')} style={{ color: '#C9A020', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}>AI Policy</span>.
            </Highlight>
          </SectionBlock>

          {/* 10 */}
          <SectionBlock id="suspension" title="10. Suspension and Termination of Accounts">
            <Sub>10.1 Grounds for Suspension or Termination</Sub>
            <Para>The Company reserves the right to suspend or terminate any account, with or without prior notice, in the event of: a violation of these Terms; multiple Customer disputes, complaints, or reports within any rolling thirty (30) day period; fraudulent activity, misrepresentation, or deception; non-payment of applicable fees or repeated payment chargebacks; conduct posing a safety risk; violation of any applicable law or commission of any criminal offence; a Partner's average rating falling below three (3.0) stars (automatic suspension); or any other material breach of these Terms or the applicable Partner Agreement.</Para>
            <Sub>10.2 Graduated Suspension Procedure</Sub>
            <List items={[
              'First offence: formal written warning',
              'Repeated violations: temporary suspension for a period of seven (7) to thirty (30) days',
              'Serious or persistent violations: permanent deactivation from the Platform',
            ]} />
            <Sub>10.3 Appeal Procedure</Sub>
            <List items={[
              'The appeal must be lodged within seven (7) days of notification of suspension or termination',
              'The appeal shall be reviewed by the Company\'s management team',
              'The outcome of the appeal shall be communicated to the user within fourteen (14) days of receipt',
              'The Company\'s decision on appeal shall be final and binding',
            ]} />
            <Sub>10.4 Consequences of Termination</Sub>
            <List items={[
              'The Partner shall immediately cease accepting new bookings',
              'All outstanding earnings shall be paid to the Partner within thirty (30) days, subject to deduction of any amounts owed',
              'Access to the account shall be revoked with immediate effect',
              'Personal data shall be retained in accordance with applicable legal requirements',
              'No refund of the Deposit shall be made where termination results from a policy violation',
            ]} />
          </SectionBlock>

          {/* 11 */}
          <SectionBlock id="modifications" title="11. Modifications to Terms">
            <Para>The Company reserves the right to amend, update, or replace these Terms at any time. The Company shall provide not less than thirty (30) days' advance written notice of any material amendments via email or in-app notification. Continued use of the Platform following the expiry of the notice period shall constitute acceptance of the amended Terms. A user who does not accept the amended Terms may terminate their account prior to the effective date of the amendment.</Para>
          </SectionBlock>

          {/* 12 */}
          <SectionBlock id="governing" title="12. Governing Law and Dispute Resolution">
            <Sub>12.1 Governing Law</Sub>
            <Para>These Terms are governed by and shall be construed in accordance with the laws of the Republic of Kenya.</Para>
            <Sub>12.2 Dispute Resolution</Sub>
            <Para>Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall first be submitted to good faith negotiations among the parties. In the absence of agreement, the dispute shall be referred to the courts of the Republic of Kenya. Each party irrevocably submits to the jurisdiction of the Kenyan courts.</Para>
          </SectionBlock>

          {/* 13 */}
          <SectionBlock id="severability" title="13. Severability">
            <Para>If any provision of these Terms is held by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, such provision shall be severed from the remaining Terms, which shall continue in full force and effect as if the severed provision had not been included.</Para>
          </SectionBlock>

          {/* 14 */}
          <SectionBlock id="contact" title="14. Contact Information">
            <Para>All enquiries, legal notices, and correspondence in connection with these Terms should be directed to:</Para>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8 }}>
              {[
                { icon: '⚖️', label: 'Legal Email', value: 'legal@fixera.africa', href: 'mailto:legal@fixera.africa' },
                { icon: '📞', label: 'Telephone', value: '+254 712 008 361', href: 'tel:+254712008361' },
                { icon: '📍', label: 'Location', value: 'Nairobi, Kenya', href: null },
                { icon: '🕐', label: 'Business Hours', value: 'Mon–Fri, 09:00–17:00 EAT', href: null },
              ].map(c => (
                <div key={c.label} style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ color: CL.light, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
                  {c.href ? (
                    <a href={c.href} style={{ color: CL.gold, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{c.value}</a>
                  ) : (
                    <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{c.value}</div>
                  )}
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Footer strip */}
          <div style={{ marginTop: 24, padding: '20px 24px', borderRadius: 16, background: 'rgba(201,160,32,0.06)', border: `1px solid rgba(201,160,32,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Fixera Company Limited</div>
              <div style={{ color: CL.light, fontSize: 12 }}>© 2026 Fixera. All rights reserved. · P.O. Box 12997 - 00100, Nairobi, Kenya</div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { label: 'Privacy Policy', path: '/privacy', color: '#63B3ED' },
                { label: 'AI Policy',      path: '/ai-policy', color: '#48BB78' },
              ].map(l => (
                <button key={l.path} onClick={() => navigate(l.path)} style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${l.color}30`, background: l.color + '10', color: l.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {l.label}
                </button>
              ))}
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'rgba(201,160,32,0.12)', border: `1px solid rgba(201,160,32,0.25)`, color: CL.gold, fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>
                ↑ Back to top
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
