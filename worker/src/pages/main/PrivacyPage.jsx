import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', light: '#9BAAB8', gold: '#C9A020',
};

const SECTIONS = [
  { id: 'introduction',  title: '1. Definitions & Interpretation' },
  { id: 'controller',   title: '2. Data Controller' },
  { id: 'collect',      title: '3. Personal Data We Collect' },
  { id: 'legal-basis',  title: '4. Legal Basis for Processing' },
  { id: 'purposes',     title: '5. Purposes of Processing' },
  { id: 'sharing',      title: '6. Disclosure to Third Parties' },
  { id: 'transfers',    title: '7. International Data Transfers' },
  { id: 'retention',    title: '8. Data Retention' },
  { id: 'breach',       title: '9. Data Breach Management' },
  { id: 'rights',       title: '10. Your Rights' },
  { id: 'children',     title: '11. Children\'s Privacy' },
  { id: 'marketing',    title: '12. Marketing' },
  { id: 'cookies',      title: '13. Cookies' },
  { id: 'changes',      title: '14. Amendments' },
  { id: 'governing',    title: '15. Governing Law' },
  { id: 'contact',      title: '16. Contact Us' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 36, scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 22, borderRadius: 2, background: '#63B3ED', flexShrink: 0 }} />
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

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
        <div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>Privacy Policy</div>
          <div style={{ color: CL.light, fontSize: 11 }}>Last updated: June 2026</div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 9, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {open ? 'Hide contents' : 'Contents'}
        </button>
      </div>

      {/* Slide-down contents */}
      {open && (
        <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: '#63B3ED', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Intro badge */}
        <div style={{ background: 'rgba(99,179,237,0.08)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 28, color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>
          🛡️ This Privacy Policy governs the manner in which Fixera Company Limited collects, uses, maintains, discloses, and protects information obtained from users of the Fixera Platform. Issued in compliance with the Data Protection Act, No. 24 of 2019 (Kenya).
        </div>

        <Section id="introduction" title="1. Definitions and Interpretation">
          <Para>In this Privacy Policy, the following terms shall bear the meanings assigned to them:</Para>
          <List items={[
            '"Data Controller" means Fixera Company Limited, the entity that determines the purposes and means of processing personal data collected through the Platform.',
            '"Data Processor" means any third party engaged by the Company to process personal data on its behalf and under its instructions.',
            '"Data Subject" means an identifiable natural person who is the subject of personal data, including Homeowners and Service Providers registered on the Platform.',
            '"Homeowner" means a registered user seeking home-related services through the Platform.',
            '"Service Provider" means a registered individual or entity offering professional home services through the Platform.',
            '"Personal Data" means any information relating to an identified or identifiable natural person.',
            '"Sensitive Personal Data" has the meaning assigned to it under Section 2 of the Data Protection Act, 2019.',
            '"Processing" means any operation or set of operations performed on personal data, whether or not by automated means.',
            '"the Act" means the Data Protection Act, No. 24 of 2019 (Laws of Kenya).',
            '"ODPC" means the Office of the Data Protection Commissioner established under Section 5 of the Act.',
            '"Platform" means the Fixera mobile application and web-based platform through which Users access the Company\'s services.',
          ]} />
        </Section>

        <Section id="controller" title="2. Identity and Contact Details of the Data Controller">
          <Para>The Data Controller responsible for your personal data is:</Para>
          <List items={[
            'Company Name: Fixera Company Limited',
            'Registered Address: P.O. Box 12997 - 00100, Nairobi, Kenya',
            'DPO Email: amin.mohamed09@outlook.com',
          ]} />
        </Section>

        <Section id="collect" title="3. Personal Data We Collect">
          <Sub>3.1 Data collected from Homeowners</Sub>
          <List items={['Full name and national identification details','Contact information, including email address, telephone number, and physical or postal address','Location data, including GPS coordinates','Payment information, including mobile money account details (e.g., M-Pesa), bank card details, and transaction history','Profile photograph (optional)','Service booking history, reviews, and ratings','Device information and unique device identifiers','Log data, including IP addresses, browser type, and usage patterns']} />
          <Sub>3.2 Data collected from Service Providers</Sub>
          <List items={['Full name and national identification number (ID/Passport)','Contact information, including email address, telephone number, and physical address','Professional qualifications, certifications, licences, and work experience','Kenya Revenue Authority (KRA) PIN for tax compliance purposes','Bank account or mobile money details for payment disbursements','Profile photograph and identity verification documents','Background verification information as required for vetting','Location data to facilitate service delivery','Service history, ratings, and reviews received through the Platform']} />
          <Sub>3.3 Automatically collected data</Sub>
          <Para>When you use the Platform, we may automatically collect IP addresses, browser type and version, device type, operating system, and unique identifiers.</Para>
          <Sub>3.4 Job Verification Records and Evidence</Sub>
          <Para>The Company may collect OTP verification records, before-service and after-service photographs, customer digital signatures, electronic timestamps, GPS location records, and job completion confirmations for quality assurance, fraud prevention, dispute resolution, and legal purposes.</Para>
          <Sub>3.5 CCTV, Video and Audio Evidence</Sub>
          <Para>Where necessary for investigation of complaints, safety incidents, fraud, or legal proceedings, the Company may receive and retain CCTV footage, photographs, video recordings and audio recordings.</Para>
          <Sub>3.6 Voice Recordings</Sub>
          <Para>Telephone calls and customer support interactions may be monitored, recorded, transcribed and retained for quality assurance, fraud prevention, dispute resolution, and regulatory compliance. Where required by law, Users shall be notified before call recording commences.</Para>
          <Sub>3.7 Continuous GPS Tracking</Sub>
          <Para>During the performance of an active booking, the Company may collect and process real-time and historical GPS location information relating to Service Providers for customer tracking, route optimisation, worker safety, emergency response, fraud prevention, job verification, Platform security, and service quality monitoring.</Para>
          <Sub>3.8 Device Security and Fraud Detection</Sub>
          <Para>The Company may collect device fingerprint identifiers, device security status, operating system information, browser identifiers, application version, emulator detection, and rooted or jailbroken device status for fraud prevention.</Para>
          <Sub>3.9 Biometric Verification</Sub>
          <Para>Where identity verification technologies are implemented, the Company may collect facial verification, liveness detection and similar authentication data solely for identity verification, fraud prevention and Platform security.</Para>
          <Sub>3.10 Audit Logs</Sub>
          <Para>The Company may generate and retain electronic audit logs recording user activity, login history, device access, account changes, booking history, payment events, and security events.</Para>
        </Section>

        <Section id="legal-basis" title="4. Legal Basis for Processing Personal Data">
          <Para>The Company processes personal data only where a lawful basis exists under Section 30 of the Data Protection Act, 2019:</Para>
          <List items={[
            'Consent — Where you have given explicit, informed, and freely given consent to the processing of your personal data.',
            'Performance of a Contract — Where processing is necessary for the performance of a contract, including the provision of Platform services.',
            'Legal Obligation — Where processing is necessary for compliance with a legal obligation under Kenyan statutes.',
            'Legitimate Interests — Where processing is necessary for the legitimate interests of the Company, such as fraud prevention, network security, and platform improvement.',
            'Vital Interests — Where processing is necessary to protect the vital interests of the Data Subject or another natural person.',
          ]} />
        </Section>

        <Section id="purposes" title="5. Purposes of Processing">
          <List items={[
            'Registration, verification, and onboarding of Homeowners and Service Providers onto the Platform',
            'Facilitating the matching, booking, and scheduling of home services',
            'Processing and settling payments and disbursements between parties',
            'Identity verification and fraud prevention, including background checks on Service Providers',
            'Customer support, dispute resolution, and management of complaints',
            'Communication regarding bookings, service updates, and Platform notifications',
            'Generating and sending invoices, receipts, and financial records',
            'Compliance with applicable tax, regulatory, and statutory obligations',
          ]} />
        </Section>

        <Section id="sharing" title="6. Disclosure of Personal Data to Third Parties">
          <Para>The Company does not sell, rent, or trade personal data to third parties. Personal data may be disclosed to the following categories of recipients:</Para>
          <Sub>6.1 Service Providers and Technology Partners</Sub>
          <Para>We may share personal data with cloud hosting providers, payment processors, SMS and email delivery platforms, identity verification services, and analytics providers. Such processors are bound by data processing agreements.</Para>
          <Sub>6.2 Counterparty Users</Sub>
          <Para>Where necessary for the facilitation of a service booking, limited personal data may be disclosed to the counterparty User.</Para>
          <Sub>6.3 Regulatory and Law Enforcement Authorities</Sub>
          <Para>We may disclose personal data to the Kenya Revenue Authority, Financial Reporting Centre, National Police Service, or the ODPC, where required by law or lawful request.</Para>
          <Sub>6.4 Business Transfers</Sub>
          <Para>In the event of a merger, acquisition, or sale of business assets, personal data may be transferred to successor entities, subject to equivalent data protection safeguards.</Para>
        </Section>

        <Section id="transfers" title="7. International Data Transfers">
          <Para>Personal data may be processed or stored outside Kenya where the Company utilises international service providers, including cloud hosting providers, payment processors, AI service providers and technology infrastructure providers. Where cross-border transfers occur, the Company shall implement appropriate contractual, technical and organisational safeguards in accordance with the Data Protection Act, 2019.</Para>
        </Section>

        <Section id="retention" title="8. Data Retention">
          <List items={[
            'Account and profile data: Five (5) years following account closure or last activity, whichever is later',
            'Transaction and payment records: Seven (7) years from the date of the transaction',
            'Communications and support records: Three (3) years from the date of the communication or resolution',
            'Background verification records of Service Providers: Duration of active engagement, plus three (3) years',
            'Log data and technical records: Twelve (12) months from the date of collection',
          ]} />
        </Section>

        <Section id="breach" title="9. Personal Data Breach Management">
          <Para>The Company shall maintain procedures for identifying, investigating, documenting and responding to personal data breaches. Where required by law, affected Users and the ODPC shall be notified within the timeframes prescribed by applicable legislation.</Para>
        </Section>

        <Section id="rights" title="10. Rights of Data Subjects">
          <Para>Pursuant to Part IV of the Data Protection Act, 2019, you have the following rights:</Para>
          <List items={[
            'Right of Access — Obtain confirmation of and access to personal data we hold about you.',
            'Right to Rectification — Request correction of inaccurate or incomplete personal data.',
            'Right to Erasure — Request deletion of your personal data where no longer necessary or lawful.',
            'Right to Restriction of Processing — Request restriction of processing in certain circumstances.',
            'Right to Data Portability — Receive your personal data in a structured, machine-readable format.',
            'Right to Object — Object to processing based on legitimate interests or for direct marketing.',
            'Right to Withdraw Consent — Withdraw consent at any time without affecting prior lawful processing.',
            'Right to Lodge a Complaint — Lodge a complaint with the ODPC: info@odpc.go.ke | www.odpc.go.ke.',
          ]} />
          <Para>To exercise any of the above rights, submit a written request to <strong style={{ color: '#63B3ED' }}>amin.mohamed09@outlook.com</strong>. We will respond within thirty (30) days.</Para>
        </Section>

        <Section id="children" title="11. Children's Privacy">
          <Para>The Platform is intended for persons aged eighteen (18) years or older. The Company does not knowingly collect personal data from children except where expressly permitted by law or where such processing is necessary for the provision of services requested by a parent or legal guardian.</Para>
        </Section>

        <Section id="marketing" title="12. Marketing Communications">
          <Para>Users may choose whether to receive promotional communications including marketing emails, promotional SMS messages and marketing push notifications. Users may withdraw marketing consent at any time without affecting operational communications relating to bookings, payments, safety notifications or legal obligations.</Para>
        </Section>

        <Section id="cookies" title="13. Cookies and Similar Technologies">
          <Para>The Company may utilise essential cookies, functional cookies, analytics cookies, performance cookies, security cookies, and preference cookies for the operation, security and continuous improvement of the Platform.</Para>
        </Section>

        <Section id="changes" title="14. Amendments to this Privacy Policy">
          <Para>The Company reserves the right to amend this Privacy Policy at any time. Where material changes are made, we will notify registered Users through the Platform or by email, and will update the effective date at the top of this Policy. Continued use of the Platform following the posting of amendments shall constitute your acceptance of the revised Policy.</Para>
        </Section>

        <Section id="governing" title="15. Governing Law and Jurisdiction">
          <Para>This Privacy Policy is governed by and shall be construed in accordance with the laws of the Republic of Kenya. Any dispute arising out of or in connection with this Policy shall be subject to the exclusive jurisdiction of the courts of Kenya.</Para>
        </Section>

        <Section id="contact" title="16. How to Contact Us">
          <Para>Data Protection Officer · Fixera Company Limited · P.O. Box 12997 - 00100, Nairobi, Kenya</Para>
          <Para>Email: <a href="mailto:amin.mohamed09@outlook.com" style={{ color: '#63B3ED', fontWeight: 600, textDecoration: 'none' }}>amin.mohamed09@outlook.com</a></Para>
          <Para>We are committed to addressing all data protection enquiries in a timely and transparent manner, consistent with our obligations under the Data Protection Act, 2019.</Para>
        </Section>

        {/* Footer links */}
        <div style={{ borderTop: `1px solid ${CL.border}`, paddingTop: 24, marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Terms of Service', path: '/terms', color: CL.gold },
            { label: 'AI Policy', path: '/ai-policy', color: '#48BB78' },
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
