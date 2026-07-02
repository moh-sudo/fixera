import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FixeraLogo from '../../components/FixeraLogo';
import { useCL } from '../../hooks/useCL';

const SECTIONS = [
  { id: 'definitions',    title: '1. Definitions' },
  { id: 'scope',          title: '2. Scope of Application' },
  { id: 'principles',     title: '3. AI Governance Principles' },
  { id: 'applications',   title: '4. Specific AI Applications' },
  { id: 'rights',         title: '5. Rights of Users' },
  { id: 'third-party',   title: '6. Third-Party AI Providers' },
  { id: 'training',       title: '7. Use of Data for AI Training' },
  { id: 'risk',           title: '8. AI Risk Management' },
  { id: 'amendments',     title: '9. Amendments' },
  { id: 'contact',        title: '10. Contact' },
];

function SectionBlock({ id, title, children }) {
  const CL = useCL();
  return (
    <section id={id} style={{ marginBottom: 48, scrollMarginTop: 90 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: 'linear-gradient(180deg, #48BB78, #38A169)' }} />
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

function Highlight({ color = '#48BB78', children }) {
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
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(72,187,120,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{r.icon}</div>
          <div>
            <div style={{ color: CL.text, fontSize: 13, fontWeight: 800, marginBottom: 3 }}>{r.title}</div>
            <div style={{ color: CL.muted, fontSize: 12, lineHeight: 1.6 }}>{r.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIPolicyPage() {
  const CL = useCL();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('definitions');
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
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  textAlign: 'left', background: isActive ? 'rgba(72,187,120,0.10)' : 'transparent',
                  border: 'none', borderLeft: `3px solid ${isActive ? '#48BB78' : 'transparent'}`,
                  color: isActive ? '#48BB78' : CL.muted, fontSize: 12, fontWeight: isActive ? 700 : 500,
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(72,187,120,0.10)', border: '1px solid rgba(72,187,120,0.2)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <span style={{ color: '#48BB78', fontSize: 12, fontWeight: 700 }}>Legal · AI Policy</span>
            </div>
            <h1 style={{ margin: '0 0 12px', color: CL.text, fontSize: 34, fontWeight: 900, lineHeight: 1.2 }}>Fixera AI Policy</h1>
            <p style={{ margin: '0 0 20px', color: CL.muted, fontSize: 15, lineHeight: 1.7, maxWidth: 580 }}>
              Fixera Company Limited employs artificial intelligence and automated decision-making technologies to power core functions of its home services marketplace platform. This Policy sets out the principles governing our deployment of AI Systems, the rights of Users in relation to automated processing, and our accountability commitments.
            </p>
            <Highlight>
              This Policy is read together with the Company's Privacy Policy and Terms and Conditions of Use, and is issued in compliance with the Data Protection Act, No. 24 of 2019 (Kenya), the Data Protection (General) Regulations, 2021, and emerging best practice on responsible AI governance.
            </Highlight>
          </div>

          {/* 1. Definitions */}
          <SectionBlock id="definitions" title="1. Definitions">
            <List items={[
              '"Artificial Intelligence" or "AI" means computational systems that perform tasks ordinarily requiring human intelligence, including pattern recognition, prediction, natural language processing, and decision optimisation.',
              '"Automated Decision-Making" ("ADM") means any decision produced solely by automated means, without meaningful human involvement, that produces a legal or similarly significant effect on a Data Subject.',
              '"AI System" means any software deployed by the Company that uses AI or machine learning to process data and produce outputs, including recommendations, scores, rankings, or automated actions.',
              '"User" means any Homeowner or Service Provider registered on and using the Platform.',
              '"Training Data" means the datasets used to develop, train, test, or refine an AI System.',
              'All other defined terms have the meanings assigned in the Company\'s Privacy Policy.',
            ]} />
          </SectionBlock>

          {/* 2. Scope */}
          <SectionBlock id="scope" title="2. Scope of Application">
            <Para>This Policy applies to all AI Systems deployed by the Company on the Platform, whether developed internally or procured from third-party AI providers. It governs the use of AI in:</Para>
            <List items={[
              'Service Provider matching and ranking',
              'Dynamic pricing recommendations',
              'Fraud detection and risk scoring',
              'Automated customer communications and chatbot interactions',
              'Review and rating moderation',
              'Identity verification and background screening',
              'Demand forecasting and scheduling optimisation',
            ]} />
          </SectionBlock>

          {/* 3. Principles */}
          <SectionBlock id="principles" title="3. AI Governance Principles">
            <Para>The Company's deployment of AI is governed by the following principles:</Para>

            <SubHeading>3.1 Lawfulness and Transparency</SubHeading>
            <Para>AI Systems shall only process personal data on a lawful basis under Section 30 of the Act. Users shall be informed, in plain language, of the material ways in which AI influences decisions that affect them, including matching, pricing, and account actions.</Para>

            <SubHeading>3.2 Purpose Limitation</SubHeading>
            <Para>AI Systems shall be deployed only for the specific purposes stated in this Policy and the Company's Privacy Policy. Personal data processed by AI Systems shall not be repurposed for unrelated objectives without a fresh legal basis and, where required, renewed User consent.</Para>

            <SubHeading>3.3 Fairness and Non-Discrimination</SubHeading>
            <Para>AI Systems shall not be designed or permitted to produce outputs that unlawfully discriminate against Users on the basis of ethnicity, gender, disability, religion, or any other protected characteristic. The Company shall conduct periodic bias audits of its AI Systems and remediate identified disparities without undue delay.</Para>

            <SubHeading>3.4 Accuracy and Data Quality</SubHeading>
            <Para>The Company shall take reasonable steps to ensure that data used to train and operate AI Systems is accurate, current, and representative. AI outputs shall not be treated as determinative where they derive from incomplete or unreliable data.</Para>

            <SubHeading>3.5 Data Minimisation</SubHeading>
            <Para>AI Systems shall process only the minimum personal data necessary to achieve the stated purpose. The Company shall periodically review AI inputs to confirm that no excessive or unnecessary data is being processed.</Para>

            <SubHeading>3.6 Human Oversight</SubHeading>
            <Para>Decisions with material consequences for Users shall be subject to human review where technically and operationally feasible. The Company shall maintain defined escalation pathways through which AI-generated outputs may be reviewed and, where appropriate, overridden by authorised personnel.</Para>

            <SubHeading>3.7 Security and Resilience</SubHeading>
            <Para>AI Systems shall be subject to appropriate technical and organisational security measures consistent with Section 41 of the Act. The Company shall monitor AI Systems for adversarial manipulation, data poisoning, model drift, and other integrity risks.</Para>

            <SubHeading>3.8 Accountability</SubHeading>
            <Para>Responsibility for AI governance is assigned to the Company's Data Protection Officer and senior management. Internal records shall be maintained documenting the purpose, data inputs, logic, and risk assessment of each material AI System deployed on the Platform.</Para>

            <SubHeading>3.9 Human Oversight Prior to Implementation of AI-Assisted Decisions</SubHeading>
            <Para>AI Systems are intended to assist human decision-making and shall not replace meaningful human oversight where decisions may significantly affect a User's rights, obligations or legitimate interests. Where an AI-assisted decision may significantly affect a User's rights or interests, the Company shall ensure meaningful human review before any final decision is implemented, except where otherwise permitted by law.</Para>
          </SectionBlock>

          {/* 4. Applications */}
          <SectionBlock id="applications" title="4. Specific AI Applications on the Platform">
            <SubHeading>4.1 Service Provider Matching</SubHeading>
            <Para>The Platform uses AI algorithms to match Homeowners with Service Providers based on location, service category, availability, ratings, and historical performance data. Matching outputs are recommendations; Homeowners retain full discretion to select or decline any Service Provider presented.</Para>

            <SubHeading>4.2 Dynamic Pricing</SubHeading>
            <Para>Where applicable, AI-assisted pricing tools may generate service cost estimates or surge pricing recommendations based on demand signals, location data, and market conditions. These represent indicative estimates only. Final pricing is confirmed between parties prior to service commencement.</Para>

            <SubHeading>4.3 Fraud Detection and Risk Scoring</SubHeading>
            <Para>The Company employs AI-based fraud detection tools that analyse transaction patterns, behavioural signals, and device data to identify potentially fraudulent or high-risk activity. Where an account is flagged, a human reviewer shall assess the matter before any account restriction or suspension is applied. Users subject to account action resulting from fraud detection shall be notified and given an opportunity to respond, except where notification would compromise an active investigation or legal obligation.</Para>

            <SubHeading>4.4 Automated Communications and Chatbots</SubHeading>
            <Para>The Platform may use AI-powered chatbots and automated messaging tools to handle User enquiries, booking confirmations, and notifications. Where a User's query cannot be adequately resolved by an automated system, escalation to a human agent shall be available. AI-generated communications shall not be used to solicit sensitive personal data.</Para>

            <SubHeading>4.5 Identity Verification</SubHeading>
            <Para>AI-assisted identity verification tools may be used to authenticate Service Provider credentials and detect fraudulent documentation. Where an automated system rejects or flags a verification submission, the outcome shall be reviewed by a human agent before a final determination is made.</Para>

            <SubHeading>4.6 Review and Content Moderation</SubHeading>
            <Para>AI tools may be used to detect and flag reviews or User-generated content that appears to violate Platform policies, including spam, abusive language, or fraudulent ratings. Flagged content shall be reviewed by a human moderator before removal or other action.</Para>

            <SubHeading>4.7 Generative Artificial Intelligence</SubHeading>
            <Para>The Company may utilise generative artificial intelligence technologies to assist with customer support, content generation, knowledge retrieval and operational efficiency. AI-generated responses may occasionally contain inaccuracies, omissions or outdated information and should not be relied upon as professional legal, financial or medical advice. Users may request review or assistance from an appropriately authorised human representative where reasonably available.</Para>

            <SubHeading>4.8 AI Voice Assistants</SubHeading>
            <Para>The Company may utilise AI-powered voice assistants and conversational AI systems to facilitate customer support, booking enquiries and operational communications. Calls may be recorded, transcribed and analysed for service improvement, quality assurance and fraud prevention.</Para>

            <SubHeading>4.9 AI Recommendations</SubHeading>
            <Para>Recommendations generated by AI Systems, including estimated pricing, estimated arrival times, provider rankings and service recommendations, are intended solely as decision-support tools and do not constitute guarantees, warranties or legally binding commitments.</Para>
          </SectionBlock>

          {/* 5. Rights */}
          <SectionBlock id="rights" title="5. Rights of Users in Relation to AI and Automated Decisions">
            <Para>Pursuant to the Data Protection Act, 2019 and applicable Regulations, Users have the following rights in relation to AI-driven processing:</Para>
            <RightsGrid rights={[
              { icon: 'ℹ️', title: 'Right to Information', desc: 'Users have the right to be informed, in clear and accessible terms, that AI Systems are being used in ways that materially affect them, and to receive an explanation of the logic, significance, and likely consequences of such processing.' },
              { icon: '🛑', title: 'Right Not to Be Subject to Solely Automated Decisions', desc: 'Where a decision is made solely by automated means and produces a legal or similarly significant effect on a User, that User has the right to request human review of the decision, to express their views, and to contest the outcome. This right applies to decisions such as account suspension, deactivation of Service Provider listings, or exclusion from the Platform.' },
              { icon: '✏️', title: 'Right to Rectification', desc: 'Where an AI-generated outcome is based on inaccurate personal data, the User has the right to request correction of the underlying data and a review of any adverse decision based thereon.' },
              { icon: '🚫', title: 'Right to Object', desc: 'Users may object to the processing of their personal data for AI-driven purposes grounded in legitimate interests. The Company shall cease such processing unless it can demonstrate compelling legitimate grounds that override the User\'s interests.' },
              { icon: '💬', title: 'Right to Explanation', desc: 'Upon request, the Company shall provide Users with a meaningful explanation of how a specific AI-generated decision was reached, expressed in plain, non-technical language.' },
              { icon: '🔍', title: 'Enhanced Explainability', desc: 'Where a User is subject to a material AI-assisted decision, the Company shall, upon request and where reasonably practicable, provide an explanation of the principal factors contributing to that decision together with information regarding available review or appeal mechanisms.' },
            ]} />
            <Para>To exercise any of the above rights, Users should submit a written request to <strong style={{ color: '#48BB78' }}>amin.mohamed09@outlook.com</strong>. The Company shall respond within thirty (30) days of receipt of the request.</Para>
          </SectionBlock>

          {/* 6. Third-party */}
          <SectionBlock id="third-party" title="6. Third-Party AI Providers">
            <Para>Where the Company engages third-party providers to supply AI tools or services that process User personal data, the Company shall:</Para>
            <List items={[
              'Conduct due diligence on the provider\'s AI governance and data protection practices prior to engagement',
              'Execute a data processing agreement imposing obligations consistent with the Act and this Policy',
              'Ensure that the provider processes personal data only on the Company\'s documented instructions',
              'Verify that cross-border data transfers, where applicable, comply with Section 48 of the Act',
              'Retain accountability to Users for the conduct of all engaged processors',
            ]} />
            <Para>A register of material third-party AI providers shall be maintained internally.</Para>
          </SectionBlock>

          {/* 7. Training */}
          <SectionBlock id="training" title="7. Use of User Data for AI Training">
            <Para>The Company may use anonymised or aggregated User data derived from Platform interactions to train, validate, and improve its AI Systems. The following conditions apply:</Para>
            <List items={[
              'Personal data shall not be used to train AI models without a lawful basis under Section 30 of the Act. Where consent is the chosen basis, it shall be obtained separately and explicitly for training purposes.',
              'Before use in training, personal data shall be anonymised to a standard that renders re-identification technically infeasible, or pseudonymised and protected by appropriate additional safeguards.',
              'Users who have withdrawn consent to data processing shall have their data excluded from training datasets.',
              'Training data shall not be shared with third-party model developers except under binding contractual protections consistent with this Policy and the Act.',
            ]} />
            <Para>In addition, the Company may utilise anonymised or lawfully processed operational information, customer feedback, ratings, complaint outcomes and support interactions to improve the accuracy, safety and performance of its AI Systems, provided such processing complies with applicable data protection legislation.</Para>
          </SectionBlock>

          {/* 8. Risk */}
          <SectionBlock id="risk" title="8. AI Risk Management">
            <Para>The Company shall implement and maintain the following risk management measures in respect of its AI Systems:</Para>
            <List items={[
              'Data Protection Impact Assessments ("DPIAs") shall be conducted prior to the deployment of any AI System likely to result in high risk to the rights and freedoms of Users, in accordance with Section 31 of the Act and the Data Protection (General) Regulations, 2021',
              'Periodic audits of AI Systems shall be conducted to assess accuracy, fairness, bias, and compliance with this Policy',
              'Model performance shall be monitored on an ongoing basis to detect and address material degradation or drift',
              'AI Systems shall be subject to the Company\'s information security framework, including access controls, logging, and incident response protocols',
              'The Company shall maintain a record of significant AI incidents, including errors with material consequences for Users, and shall take prompt corrective action',
            ]} />
            <Para>The Company shall periodically monitor its AI Systems to assess accuracy, reliability, fairness, bias, performance degradation, security vulnerabilities and regulatory compliance, and shall take corrective action where material deficiencies are identified. The Company shall also conduct periodic validation of AI model accuracy following significant software updates, retraining or material system changes, and shall maintain internal procedures for recording, investigating and responding to material AI-related incidents.</Para>
          </SectionBlock>

          {/* 9. Amendments */}
          <SectionBlock id="amendments" title="9. Amendments">
            <Para>This Policy shall be reviewed at least annually and updated to reflect material changes in AI deployment, applicable law, or regulatory guidance issued by the ODPC or other competent authorities. Material amendments shall be communicated to Users through the Platform and by email prior to taking effect.</Para>
          </SectionBlock>

          {/* 10. Contact */}
          <SectionBlock id="contact" title="10. Contact">
            <Para>Questions, complaints, or requests relating to this AI Policy or to AI-driven decisions affecting you should be directed to:</Para>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: 8, marginBottom: 20 }}>
              {[
                { icon: '👤', label: 'Role', value: 'Data Protection Officer', href: null },
                { icon: '🏢', label: 'Company', value: 'Fixera Company Limited', href: null },
                { icon: '📍', label: 'Address', value: 'P.O. Box 12997 - 00100, Nairobi, Kenya', href: null },
                { icon: '📧', label: 'Email', value: 'amin.mohamed09@outlook.com', href: 'mailto:amin.mohamed09@outlook.com?subject=AI%20Policy%20Enquiry' },
              ].map(c => (
                <div key={c.label} style={{ background: CL.bg, border: `1px solid ${CL.border}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ color: CL.light, fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
                  {c.href
                    ? <a href={c.href} style={{ color: '#48BB78', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{c.value}</a>
                    : <div style={{ color: CL.text, fontSize: 13, fontWeight: 700 }}>{c.value}</div>}
                </div>
              ))}
            </div>
          </SectionBlock>

          {/* Footer strip */}
          <div style={{ marginTop: 24, padding: '20px 24px', borderRadius: 16, background: 'rgba(72,187,120,0.06)', border: '1px solid rgba(72,187,120,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 4 }}>Fixera Company Limited</div>
              <div style={{ color: CL.light, fontSize: 12 }}>© 2026 Fixera. All rights reserved. · P.O. Box 12997 - 00100, Nairobi, Kenya</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/terms')} style={{ background: 'rgba(201,160,32,0.10)', border: '1px solid rgba(201,160,32,0.2)', color: '#C9A020', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Terms of Service</button>
              <button onClick={() => navigate('/privacy')} style={{ background: 'rgba(99,179,237,0.10)', border: '1px solid rgba(99,179,237,0.2)', color: '#63B3ED', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>Privacy Policy</button>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ background: 'rgba(72,187,120,0.10)', border: '1px solid rgba(72,187,120,0.2)', color: '#48BB78', fontSize: 12, fontWeight: 700, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit' }}>↑ Back to top</button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
