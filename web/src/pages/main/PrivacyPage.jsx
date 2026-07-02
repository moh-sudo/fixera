import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FixeraLogo from '../../components/FixeraLogo';
import { useCL } from '../../hooks/useCL';

const SECTIONS = [
  { id: 'introduction',  title: '1. Definitions & Interpretation' },
  { id: 'controller',   title: '2. Identity of the Data Controller' },
  { id: 'collect',      title: '3. Personal Data We Collect' },
  { id: 'legal-basis',  title: '4. Legal Basis for Processing' },
  { id: 'purposes',     title: '5. Purposes of Processing' },
  { id: 'sharing',      title: '6. Disclosure to Third Parties' },
  { id: 'transfers',    title: '7. International Data Transfers' },
  { id: 'retention',    title: '8. Data Retention' },
  { id: 'breach',       title: '9. Data Breach Management' },
  { id: 'rights',       title: '10. Your Rights' },
  { id: 'children',     title: '11. Children\'s Privacy' },
  { id: 'marketing',    title: '12. Marketing Communications' },
  { id: 'cookies',      title: '13. Cookies & Technologies' },
  { id: 'changes',      title: '14. Amendments to this Policy' },
  { id: 'governing',    title: '15. Governing Law' },
  { id: 'contact',      title: '16. How to Contact Us' },
];

function SectionBlock({ id, title, children }) {
  const CL = useCL();
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #63B3ED, #4299E1)' }} />
        <h2 style={{ margin: 0, color: CL.text, fontSize: 20, fontWeight: 800 }}>{title}</h2>
      </div>
      <div style={{ color: CL.muted, fontSize: 14, lineHeight: 1.9 }}>{children}</div>
    </section>
  );
}

function Para({ children }) {
  return <p style={{ margin: '0 0 14px 0' }}>{children}</p>;
}

function SubHeading({ children }) {
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

function Highlight({ color = '#63B3ED', children }) {
  const CL = useCL();
  return (
    <div style={{ background: color + '08', border: `1px solid ${color}25`, borderRadius: 12, padding: '14px 18px', marginBottom: 14, color: CL.muted, fontSize: 14, lineHeight: 1.8 }}>
      {children}
    </div>
  );
}

function RightsGrid({ rights }) {
  const CL = useCL();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
      {rights.map(r => (
        <div key={r.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 16px', background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,179,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{r.icon}</div>
          <div>
            <div style={{ color: CL.text, fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{r.title}</div>
            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>{r.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PrivacyPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('introduction');
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'inherit' }}>

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: CL.surface, borderBottom: `1px solid ${CL.border}`,
        padding: '0 32px', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'rgba(122,139,160,0.1)', border: `1px solid ${CL.border}`, color: CL.muted, borderRadius: 10, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>← Back</button>
          <div style={{ width: 1, height: 24, background: CL.border }} />
          <FixeraLogo size={32} showText={true} showTagline={false} />
        </div>
        <div style={{ color: CL.light, fontSize: 12, fontWeight: 600 }}>Last updated: June 2026</div>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '40px 24px', gap: 48 }}>

        {/* Sticky sidebar */}
        <aside style={{ width: 240, flexShrink: 0, position: 'sticky', top: 90, alignSelf: 'flex-start', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
          <div style={{ color: CL.light, fontSize: 10, fontWeight: 800, letterSpacing: 2.5, marginBottom: 14, textTransform: 'uppercase' }}>Contents</div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map(s => {
              const isActive = activeSection === s.id;
              return (
                <button key={s.id} onClick={() => scrollTo(s.id)} style={{
                  textAlign: 'left', background: isActive ? 'rgba(99,179,237,0.10)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${isActive ? '#63B3ED' : 'transparent'}`,
                  color: isActive ? '#63B3ED' : CL.muted, fontSize: 12, fontWeight: isActive ? 700 : 500,
                  padding: '8px 12px', cursor: 'pointer', fontFamily: 'inherit',
                  borderRadius: '0 8px 8px 0', transition: 'all 0.15s', lineHeight: 1.4,
                }}>
                  {s.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, minWidth: 0 }}>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,179,237,0.10)', border: '1px solid rgba(99,179,237,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 14 }}>🛡️</span>
              <span style={{ color: '#63B3ED', fontSize: 12, fontWeight: 700 }}>Legal · Privacy Policy</span>
            </div>
            <h1 style={{ margin: '0 0 12px', color: CL.text, fontSize: 34, fontWeight: 900, lineHeight: 1.2 }}>Privacy Policy</h1>
            <p style={{ margin: '0 0 20px', color: CL.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
              This Privacy Policy governs the manner in which Fixera Company Limited collects, uses, maintains, discloses, and protects information obtained from users of the Fixera Platform. Issued in compliance with the Data Protection Act, No. 24 of 2019 (Kenya).
            </p>
          </div>

          {/* 1. Definitions */}
          <SectionBlock id="introduction" title="1. Definitions and Interpretation">
            <Para>In this Privacy Policy, the following terms shall bear the meanings assigned to them hereunder unless the context otherwise requires:</Para>
            <List items={[
              '"Data Controller" means Fixera Company Limited, the entity that determines the purposes and means of processing personal data collected through the Platform.',
              '"Data Processor" means any third party engaged by the Company to process personal data on its behalf and under its instructions.',
              '"Data Subject" means an identifiable natural person who is the subject of personal data, including Homeowners and Service Providers registered on the Platform.',
              '"Homeowner" means a registered user seeking home-related services through the Platform, including but not limited to plumbing, electrical work, cleaning, or moving and relocation services.',
              '"Service Provider" means a registered individual or entity offering professional home services through the Platform.',
              '"Personal Data" means any information relating to an identified or identifiable natural person.',
              '"Sensitive Personal Data" has the meaning assigned to it under Section 2 of the Data Protection Act, 2019, and includes data revealing racial or ethnic origin, health status, biometric data, and financial information.',
              '"Processing" means any operation or set of operations performed on personal data, whether or not by automated means.',
              '"the Act" means the Data Protection Act, No. 24 of 2019 (Laws of Kenya).',
              '"ODPC" means the Office of the Data Protection Commissioner established under Section 5 of the Act.',
              '"Platform" means the Fixera mobile application and web-based platform through which Users access the Company\'s services.',
            ]} />
          </SectionBlock>

          {/* 2. Controller */}
          <SectionBlock id="controller" title="2. Identity and Contact Details of the Data Controller">
            <Para>The Data Controller responsible for your personal data is:</Para>
            <div style={{ background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.15)', borderRadius: 14, padding: '18px 20px', marginBottom: 14 }}>
              <List items={[
                'Company Name: Fixera Company Limited',
                'Registered Address: P.O. Box 12997 - 00100, Nairobi, Kenya',
                'DPO Email: amin.mohamed09@outlook.com',
              ]} />
            </div>
          </SectionBlock>

          {/* 3. Collect */}
          <SectionBlock id="collect" title="3. Personal Data We Collect">
            <Para>We collect the following categories of personal data from Users of the Platform:</Para>

            <SubHeading>3.1 Data collected from Homeowners</SubHeading>
            <List items={[
              'Full name and national identification details',
              'Contact information, including email address, telephone number, and physical or postal address',
              'Location data, including GPS coordinates for the purpose of matching with nearby Service Providers',
              'Payment information, including mobile money account details (e.g., M-Pesa), bank card details, and transaction history',
              'Profile photograph (optional)',
              'Service booking history, reviews, and ratings submitted on the Platform',
              'Device information and unique device identifiers',
              'Log data, including IP addresses, browser type, and usage patterns',
            ]} />

            <SubHeading>3.2 Data collected from Service Providers</SubHeading>
            <List items={[
              'Full name and national identification number (ID/Passport)',
              'Contact information, including email address, telephone number, and physical address',
              'Professional qualifications, certifications, licences, and work experience',
              'Kenya Revenue Authority (KRA) PIN for tax compliance purposes',
              'Bank account or mobile money details for payment disbursements',
              'Profile photograph and identity verification documents',
              'Background verification information as required for vetting',
              'Location data to facilitate service delivery',
              'Service history, ratings, and reviews received through the Platform',
            ]} />

            <SubHeading>3.3 Automatically collected data</SubHeading>
            <Para>When you use the Platform, we may automatically collect certain technical information through cookies, web beacons, and similar technologies, including Internet Protocol (IP) addresses, browser type and version, and device type, operating system, and unique identifiers.</Para>

            <SubHeading>3.4 Job Verification Records and Evidence</SubHeading>
            <Para>The Company may collect, generate, process, store and use operational records relating to the performance of services, including: Arrival and job completion OTP verification records; before-service and after-service photographs; pickup and delivery photographs; customer digital signatures and acknowledgements; electronic timestamps; GPS location records; job completion confirmations; and supporting documents uploaded through the Platform. Such information may be used for quality assurance, fraud prevention, complaint investigations, dispute resolution, insurance claims, regulatory compliance, legal proceedings and enforcement of the Company's contractual rights.</Para>

            <SubHeading>3.5 CCTV, Video and Audio Evidence</SubHeading>
            <Para>Where necessary for the investigation of complaints, safety incidents, fraud, criminal activity or legal proceedings, the Company may receive, collect, process and retain CCTV footage, photographs, video recordings and audio recordings supplied by Homeowners, Service Providers, law enforcement agencies, insurers or other authorised third parties. Such records shall be processed only for lawful purposes and in accordance with the Data Protection Act, 2019.</Para>

            <SubHeading>3.6 Voice Recordings</SubHeading>
            <Para>Telephone calls, customer support interactions and communications made through the Company's communication systems may be monitored, recorded, transcribed and retained for quality assurance, staff training, fraud prevention, dispute resolution, regulatory compliance and security purposes. Where required by law, Users shall be notified before call recording commences.</Para>

            <SubHeading>3.7 Continuous GPS Tracking</SubHeading>
            <Para>During the performance of an active booking, the Company may collect and process real-time and historical GPS location information relating to Service Providers for the purposes of: customer tracking; route optimisation; worker safety; emergency response; fraud prevention; job verification; complaint investigation; Platform security; and service quality monitoring. Historical location records may be retained in accordance with the Company's data retention policy.</Para>

            <SubHeading>3.8 Device Security and Fraud Detection</SubHeading>
            <Para>To enhance Platform security and detect fraudulent activity, the Company may collect technical device information including device fingerprint identifiers, device security status, operating system information, browser identifiers, application version, emulator detection, rooted or jailbroken device status, and other technical identifiers reasonably required for fraud prevention.</Para>

            <SubHeading>3.9 Biometric Verification</SubHeading>
            <Para>Where identity verification technologies are implemented, the Company may collect and process biometric verification information including facial verification, liveness detection and similar authentication technologies solely for identity verification, fraud prevention and Platform security. Such processing shall only occur where authorised by applicable law and supported by an appropriate lawful basis.</Para>

            <SubHeading>3.10 Audit Logs</SubHeading>
            <Para>The Company may generate, maintain and retain electronic audit logs recording user activity, login history, device access, account changes, booking history, payment events, administrative actions, system events and security events for fraud prevention, dispute resolution, regulatory compliance, cybersecurity, system integrity and legal purposes.</Para>
          </SectionBlock>

          {/* 4. Legal Basis */}
          <SectionBlock id="legal-basis" title="4. Legal Basis for Processing Personal Data">
            <Para>The Company processes personal data only where a lawful basis exists under Section 30 of the Data Protection Act, 2019. The applicable legal bases are as follows:</Para>
            <List items={[
              'Consent — Where you have given explicit, informed, and freely given consent to the processing of your personal data for one or more specific purposes, as contemplated under Section 32 of the Act. You may withdraw consent at any time, subject to the limitations set out in this Policy.',
              'Performance of a Contract — Where processing is necessary for the performance of a contract to which you are a party or to take steps at your request prior to entering a contract, including the provision of Platform services.',
              'Legal Obligation — Where processing is necessary for compliance with a legal obligation to which the Company is subject, including obligations under the Income Tax Act, the Anti-Money Laundering and Combating of Terrorism Financing (Amendment) Act, and other applicable Kenyan statutes.',
              'Legitimate Interests — Where processing is necessary for the purposes of the legitimate interests pursued by the Company or a third party, provided such interests are not overridden by the interests, rights, or freedoms of the Data Subject. Such interests include fraud prevention, network security, and platform improvement.',
              'Vital Interests — Where processing is necessary to protect the vital interests of the Data Subject or another natural person.',
            ]} />
          </SectionBlock>

          {/* 5. Purposes */}
          <SectionBlock id="purposes" title="5. Purposes of Processing">
            <Para>The Company processes personal data for the following specific and lawful purposes:</Para>
            <List items={[
              'Registration, verification, and onboarding of Homeowners and Service Providers onto the Platform',
              'Facilitating the matching, booking, and scheduling of home services between Homeowners and Service Providers',
              'Processing and settling payments and disbursements between parties',
              'Identity verification and fraud prevention, including background checks on Service Providers',
              'Customer support, dispute resolution, and management of complaints',
              'Communication regarding bookings, service updates, and Platform notifications',
              'Generating and sending invoices, receipts, and financial records',
              'Compliance with applicable tax, regulatory, and statutory obligations',
            ]} />
          </SectionBlock>

          {/* 6. Sharing */}
          <SectionBlock id="sharing" title="6. Disclosure of Personal Data to Third Parties">
            <Para>The Company does not sell, rent, or trade personal data to third parties. Personal data may, however, be disclosed to the following categories of recipients:</Para>

            <SubHeading>6.1 Service Providers and Technology Partners</SubHeading>
            <Para>We may share personal data with third-party service providers engaged to support our business operations, including cloud hosting providers, payment processors, SMS and email delivery platforms, identity verification services, and analytics providers. Such processors are bound by data processing agreements requiring them to process data only on our instructions and to implement appropriate security measures.</Para>

            <SubHeading>6.2 Counterparty Users</SubHeading>
            <Para>Where necessary for the facilitation of a service booking, limited personal data (such as name, general location, and contact number) may be disclosed to the counterparty User. Homeowners will receive relevant details about the Service Provider assigned to their booking, and vice versa.</Para>

            <SubHeading>6.3 Regulatory and Law Enforcement Authorities</SubHeading>
            <Para>We may disclose personal data to competent authorities, including the Kenya Revenue Authority, Financial Reporting Centre, National Police Service, or the ODPC, where required by law, court order, or lawful request, or where necessary to prevent fraud, protect safety, or enforce our legal rights.</Para>

            <SubHeading>6.4 Business Transfers</SubHeading>
            <Para>In the event of a merger, acquisition, restructuring, or sale of business assets, personal data may be transferred to successor entities, subject to equivalent data protection safeguards and, where required, notification to affected Data Subjects.</Para>
          </SectionBlock>

          {/* 7. Transfers */}
          <SectionBlock id="transfers" title="7. International Data Transfers">
            <Para>Personal data may be processed or stored outside Kenya where the Company utilises international service providers and infrastructure partners, including cloud hosting providers, payment processors, AI service providers and technology infrastructure providers. Where cross-border transfers occur, the Company shall implement appropriate contractual, technical and organisational safeguards in accordance with the Data Protection Act, 2019.</Para>
          </SectionBlock>

          {/* 8. Retention */}
          <SectionBlock id="retention" title="8. Data Retention">
            <Para>The Company retains personal data only for as long as is necessary for the purposes for which it was collected, or as required by applicable law. The following retention periods apply:</Para>
            <List items={[
              'Account and profile data: For the duration of the User\'s active registration, and for a period of five (5) years following account closure or last activity, whichever is later',
              'Transaction and payment records: Seven (7) years from the date of the transaction, in accordance with the requirements of the Income Tax Act and the Value Added Tax Act',
              'Communications and support records: Three (3) years from the date of the communication or resolution of the relevant matter',
              'Background verification records of Service Providers: Duration of active engagement, plus three (3) years',
              'Log data and technical records: Twelve (12) months from the date of collection',
            ]} />
          </SectionBlock>

          {/* 9. Breach */}
          <SectionBlock id="breach" title="9. Personal Data Breach Management">
            <Para>The Company shall maintain procedures for identifying, investigating, documenting and responding to personal data breaches. Where required by law, affected Users and the Office of the Data Protection Commissioner shall be notified within the timeframes prescribed by applicable legislation.</Para>
          </SectionBlock>

          {/* 10. Rights */}
          <SectionBlock id="rights" title="10. Rights of Data Subjects">
            <Para>Pursuant to Part IV of the Data Protection Act, 2019, Data Subjects have the following rights in respect of their personal data, which the Company is committed to upholding:</Para>
            <RightsGrid rights={[
              { icon: '👁️', title: 'Right of Access', desc: 'You have the right to obtain confirmation as to whether the Company processes your personal data and, if so, to request access to such data and information regarding the purposes, categories, recipients, and retention periods applicable to your data.' },
              { icon: '✏️', title: 'Right to Rectification', desc: 'You have the right to request the correction of inaccurate or incomplete personal data held by the Company without undue delay.' },
              { icon: '🗑️', title: 'Right to Erasure', desc: 'You have the right to request the deletion of your personal data where: (a) the data is no longer necessary for the purposes for which it was collected; (b) you withdraw consent and no other legal basis applies; (c) the data has been unlawfully processed; or (d) erasure is required to comply with a legal obligation.' },
              { icon: '⏸️', title: 'Right to Restriction of Processing', desc: 'You have the right to request that the Company restrict the processing of your personal data in certain circumstances, including where the accuracy of the data is contested or the processing is unlawful but you oppose erasure.' },
              { icon: '📤', title: 'Right to Data Portability', desc: 'You have the right to receive personal data you have provided to the Company in a structured, commonly used, and machine-readable format, and to transmit such data to another data controller, where processing is based on consent or contract.' },
              { icon: '🚫', title: 'Right to Object', desc: 'You have the right to object to the processing of your personal data where processing is based on legitimate interests or for direct marketing purposes.' },
              { icon: '↩️', title: 'Right to Withdraw Consent', desc: 'Where processing is based on consent, you have the right to withdraw such consent at any time without affecting the lawfulness of processing carried out prior to withdrawal.' },
              { icon: '📢', title: 'Right to Lodge a Complaint', desc: 'You have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC) at any time if you believe that the processing of your personal data infringes the Act. The ODPC may be contacted at: Office of the Data Protection Commissioner, Upper Hill, Nairobi | info@odpc.go.ke | www.odpc.go.ke.' },
            ]} />
            <Para>To exercise any of the above rights, please submit a written request to our Data Protection Officer at <strong style={{ color: '#63B3ED' }}>amin.mohamed09@outlook.com</strong>. We will respond to your request within thirty (30) days from the date of receipt, or within such extended period as may be permitted by the Act.</Para>
          </SectionBlock>

          {/* 11. Children */}
          <SectionBlock id="children" title="11. Children's Privacy">
            <Para>The Platform is intended for persons aged eighteen (18) years or older. The Company does not knowingly collect personal data from children except where expressly permitted by law or where such processing is necessary for the provision of services requested by a parent or legal guardian.</Para>
          </SectionBlock>

          {/* 12. Marketing */}
          <SectionBlock id="marketing" title="12. Marketing Communications">
            <Para>Users may choose whether to receive promotional communications including marketing emails, promotional SMS messages and marketing push notifications. Users may withdraw marketing consent at any time without affecting operational communications relating to bookings, payments, safety notifications or legal obligations. Users may update their marketing communication preferences through their account settings where available.</Para>
          </SectionBlock>

          {/* 13. Cookies */}
          <SectionBlock id="cookies" title="13. Cookies and Similar Technologies">
            <Para>The Company may utilise essential cookies, functional cookies, analytics cookies, performance cookies, security cookies, and preference cookies for the operation, security and continuous improvement of the Platform.</Para>
          </SectionBlock>

          {/* 14. Changes */}
          <SectionBlock id="changes" title="14. Amendments to this Privacy Policy">
            <Para>The Company reserves the right to amend, update, or revise this Privacy Policy at any time to reflect changes in our practices, applicable law, or regulatory requirements. Where material changes are made, we will notify registered Users through the Platform, by email, or by such other means as may be appropriate, and will update the effective date at the top of this Policy. Continued use of the Platform following the posting of amendments shall constitute your acceptance of the revised Policy. We encourage you to review this Policy periodically.</Para>
          </SectionBlock>

          {/* 15. Governing Law */}
          <SectionBlock id="governing" title="15. Governing Law and Jurisdiction">
            <Para>This Privacy Policy is governed by and shall be construed in accordance with the laws of the Republic of Kenya. Any dispute arising out of or in connection with this Policy shall be subject to the exclusive jurisdiction of the courts of Kenya. Nothing in this Policy shall be construed to limit your rights under the Data Protection Act, 2019 or any other applicable law.</Para>
          </SectionBlock>

          {/* 16. Contact */}
          <SectionBlock id="contact" title="16. How to Contact Us">
            <Para>If you have any questions, concerns, or requests in relation to this Privacy Policy or the processing of your personal data, please contact us as follows:</Para>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8, marginBottom: 20 }}>
              {[
                { icon: '🏢', label: 'Data Controller', value: 'Fixera Company Limited', href: null },
                { icon: '📍', label: 'Registered Address', value: 'P.O. Box 12997 - 00100, Nairobi, Kenya', href: null },
                { icon: '📧', label: 'DPO Email', value: 'amin.mohamed09@outlook.com', href: 'mailto:amin.mohamed09@outlook.com?subject=Privacy%20Request' },
                { icon: '🕐', label: 'Response Time', value: 'Within 30 days', href: null },
              ].map(c => (
                <div key={c.label} style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ color: CL.light, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
                  {c.href
                    ? <a href={c.href} style={{ color: '#63B3ED', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{c.value}</a>
                    : <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{c.value}</div>}
                </div>
              ))}
            </div>
            <Highlight color="#63B3ED">
              We are committed to addressing all data protection enquiries and complaints in a timely and transparent manner, consistent with our obligations under the Data Protection Act, 2019.
            </Highlight>
          </SectionBlock>

          {/* Footer strip */}
          <div style={{ marginTop: 24, padding: '20px 24px', borderRadius: 16, background: 'rgba(99,179,237,0.06)', border: '1px solid rgba(99,179,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Fixera Company Limited</div>
              <div style={{ color: CL.light, fontSize: 12 }}>© 2026 Fixera. All rights reserved. · P.O. Box 12997 - 00100, Nairobi, Kenya</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/terms')} style={{ background: 'rgba(201,160,32,0.10)', border: '1px solid rgba(201,160,32,0.2)', color: CL.gold, fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Terms of Service</button>
              <button onClick={() => navigate('/ai-policy')} style={{ background: 'rgba(72,187,120,0.10)', border: '1px solid rgba(72,187,120,0.2)', color: '#48BB78', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>AI Policy</button>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'rgba(99,179,237,0.10)', border: '1px solid rgba(99,179,237,0.2)', color: '#63B3ED', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>↑ Back to top</button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
