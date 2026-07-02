import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CL = {
  bg: '#F7F8FA', surface: '#FFFFFF', border: '#E8ECF0',
  text: '#0A1628', muted: '#6B7A8F', light: '#9BAAB8',
  green: '#48BB78',
};

const SECTIONS = [
  { id: 'definitions',  title: '1. Definitions' },
  { id: 'scope',        title: '2. Scope of Application' },
  { id: 'principles',   title: '3. AI Governance Principles' },
  { id: 'applications', title: '4. Specific AI Applications' },
  { id: 'rights',       title: '5. Rights of Users' },
  { id: 'third-party', title: '6. Third-Party AI Providers' },
  { id: 'training',     title: '7. Use of Data for AI Training' },
  { id: 'risk',         title: '8. AI Risk Management' },
  { id: 'amendments',   title: '9. Amendments' },
  { id: 'contact',      title: '10. Contact' },
];

function Section({ id, title, children }) {
  return (
    <section id={id} style={{ marginBottom: 36, scrollMarginTop: 80 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 3, height: 22, borderRadius: 2, background: CL.green, flexShrink: 0 }} />
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

export default function AIPolicyPage() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: CL.bg, fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>←</button>
        <div>
          <div style={{ color: CL.text, fontSize: 15, fontWeight: 800 }}>AI Policy</div>
          <div style={{ color: CL.light, fontSize: 11 }}>Last updated: June 2026</div>
        </div>
        <button onClick={() => setOpen(o => !o)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 9, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {open ? 'Hide contents' : 'Contents'}
        </button>
      </div>

      {open && (
        <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => { document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); setOpen(false); }}
              style={{ textAlign: 'left', background: 'none', border: 'none', color: CL.green, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit' }}>
              {s.title}
            </button>
          ))}
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 20px 60px' }}>

        <div style={{ background: 'rgba(72,187,120,0.08)', border: '1px solid rgba(72,187,120,0.2)', borderRadius: 12, padding: '12px 16px', marginBottom: 28, color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>
          🤖 Fixera Company Limited employs artificial intelligence and automated decision-making technologies to power core functions of its home services marketplace platform. This Policy sets out the principles governing our AI deployment, the rights of Users, and our accountability commitments. It is issued in compliance with the Data Protection Act, No. 24 of 2019 (Kenya).
        </div>

        <Section id="definitions" title="1. Definitions">
          <List items={[
            '"Artificial Intelligence" or "AI" means computational systems that perform tasks ordinarily requiring human intelligence, including pattern recognition, prediction, natural language processing, and decision optimisation.',
            '"Automated Decision-Making" ("ADM") means any decision produced solely by automated means, without meaningful human involvement, that produces a legal or similarly significant effect on a Data Subject.',
            '"AI System" means any software deployed by the Company that uses AI or machine learning to process data and produce outputs, including recommendations, scores, rankings, or automated actions.',
            '"User" means any Homeowner or Service Provider registered on and using the Platform.',
            '"Training Data" means the datasets used to develop, train, test, or refine an AI System.',
            'All other defined terms have the meanings assigned in the Company\'s Privacy Policy.',
          ]} />
        </Section>

        <Section id="scope" title="2. Scope of Application">
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
        </Section>

        <Section id="principles" title="3. AI Governance Principles">
          <Sub>3.1 Lawfulness and Transparency</Sub>
          <Para>AI Systems shall only process personal data on a lawful basis under Section 30 of the Act. Users shall be informed, in plain language, of the material ways in which AI influences decisions that affect them.</Para>
          <Sub>3.2 Purpose Limitation</Sub>
          <Para>AI Systems shall be deployed only for the specific purposes stated in this Policy and the Company's Privacy Policy. Personal data shall not be repurposed without a fresh legal basis and, where required, renewed User consent.</Para>
          <Sub>3.3 Fairness and Non-Discrimination</Sub>
          <Para>AI Systems shall not produce outputs that unlawfully discriminate against Users on the basis of ethnicity, gender, disability, religion, or any other protected characteristic. The Company shall conduct periodic bias audits and remediate identified disparities without undue delay.</Para>
          <Sub>3.4 Accuracy and Data Quality</Sub>
          <Para>The Company shall take reasonable steps to ensure that data used to train and operate AI Systems is accurate, current, and representative.</Para>
          <Sub>3.5 Data Minimisation</Sub>
          <Para>AI Systems shall process only the minimum personal data necessary to achieve the stated purpose.</Para>
          <Sub>3.6 Human Oversight</Sub>
          <Para>Decisions with material consequences for Users shall be subject to human review where technically and operationally feasible. The Company shall maintain defined escalation pathways through which AI-generated outputs may be reviewed and overridden by authorised personnel.</Para>
          <Sub>3.7 Security and Resilience</Sub>
          <Para>AI Systems shall be subject to appropriate technical and organisational security measures consistent with Section 41 of the Act. The Company shall monitor AI Systems for adversarial manipulation, data poisoning, model drift, and other integrity risks.</Para>
          <Sub>3.8 Accountability</Sub>
          <Para>Responsibility for AI governance is assigned to the Company's Data Protection Officer and senior management. Internal records shall be maintained documenting the purpose, data inputs, logic, and risk assessment of each material AI System deployed on the Platform.</Para>
          <Sub>3.9 Human Oversight Prior to Implementation of AI-Assisted Decisions</Sub>
          <Para>AI Systems are intended to assist human decision-making and shall not replace meaningful human oversight where decisions may significantly affect a User's rights, obligations or legitimate interests.</Para>
        </Section>

        <Section id="applications" title="4. Specific AI Applications on the Platform">
          <Sub>4.1 Service Provider Matching</Sub>
          <Para>The Platform uses AI algorithms to match Homeowners with Service Providers based on location, service category, availability, ratings, and historical performance data. Matching outputs are recommendations; Homeowners retain full discretion to select or decline any Service Provider.</Para>
          <Sub>4.2 Dynamic Pricing</Sub>
          <Para>Where applicable, AI-assisted pricing tools may generate service cost estimates or surge pricing recommendations. These represent indicative estimates only. Final pricing is confirmed between parties prior to service commencement.</Para>
          <Sub>4.3 Fraud Detection and Risk Scoring</Sub>
          <Para>The Company employs AI-based fraud detection tools that analyse transaction patterns, behavioural signals, and device data. Where an account is flagged, a human reviewer shall assess the matter before any account restriction or suspension is applied.</Para>
          <Sub>4.4 Automated Communications and Chatbots</Sub>
          <Para>The Platform may use AI-powered chatbots and automated messaging tools. Where a User's query cannot be adequately resolved by an automated system, escalation to a human agent shall be available.</Para>
          <Sub>4.5 Identity Verification</Sub>
          <Para>AI-assisted identity verification tools may be used to authenticate Service Provider credentials. Where an automated system rejects or flags a submission, the outcome shall be reviewed by a human agent before a final determination is made.</Para>
          <Sub>4.6 Review and Content Moderation</Sub>
          <Para>AI tools may be used to detect and flag reviews or User-generated content that violates Platform policies. Flagged content shall be reviewed by a human moderator before removal or other action.</Para>
          <Sub>4.7 Generative Artificial Intelligence</Sub>
          <Para>The Company may utilise generative AI technologies to assist with customer support, content generation, knowledge retrieval and operational efficiency. AI-generated responses may occasionally contain inaccuracies and should not be relied upon as professional legal, financial or medical advice.</Para>
          <Sub>4.8 AI Voice Assistants</Sub>
          <Para>The Company may utilise AI-powered voice assistants to facilitate customer support and operational communications. Calls may be recorded, transcribed and analysed for service improvement, quality assurance and fraud prevention.</Para>
          <Sub>4.9 AI Recommendations</Sub>
          <Para>Recommendations generated by AI Systems, including estimated pricing, estimated arrival times, provider rankings and service recommendations, are intended solely as decision-support tools and do not constitute guarantees, warranties or legally binding commitments.</Para>
        </Section>

        <Section id="rights" title="5. Rights of Users in Relation to AI and Automated Decisions">
          <Para>Pursuant to the Data Protection Act, 2019, Users have the following rights in relation to AI-driven processing:</Para>
          <List items={[
            'Right to Information — Be informed, in clear and accessible terms, that AI Systems are being used in ways that materially affect you, and to receive an explanation of the logic, significance, and likely consequences of such processing.',
            'Right Not to Be Subject to Solely Automated Decisions — Where a decision is made solely by automated means and produces a legal or similarly significant effect, you have the right to request human review, to express your views, and to contest the outcome.',
            'Right to Rectification — Where an AI-generated outcome is based on inaccurate personal data, request correction of the underlying data and a review of any adverse decision based thereon.',
            'Right to Object — Object to the processing of your personal data for AI-driven purposes grounded in legitimate interests.',
            'Right to Explanation — Receive a meaningful explanation of how a specific AI-generated decision was reached, expressed in plain, non-technical language.',
            'Enhanced Explainability — Where subject to a material AI-assisted decision, receive an explanation of the principal factors contributing to that decision together with information regarding available review or appeal mechanisms.',
          ]} />
          <Para>To exercise any of the above rights, submit a written request to <strong style={{ color: CL.green }}>amin.mohamed09@outlook.com</strong>. The Company shall respond within thirty (30) days.</Para>
        </Section>

        <Section id="third-party" title="6. Third-Party AI Providers">
          <Para>Where the Company engages third-party providers to supply AI tools or services that process User personal data, the Company shall:</Para>
          <List items={[
            'Conduct due diligence on the provider\'s AI governance and data protection practices prior to engagement',
            'Execute a data processing agreement imposing obligations consistent with the Act and this Policy',
            'Ensure that the provider processes personal data only on the Company\'s documented instructions',
            'Verify that cross-border data transfers, where applicable, comply with Section 48 of the Act',
            'Retain accountability to Users for the conduct of all engaged processors',
          ]} />
        </Section>

        <Section id="training" title="7. Use of User Data for AI Training">
          <Para>The Company may use anonymised or aggregated User data derived from Platform interactions to train, validate, and improve its AI Systems. The following conditions apply:</Para>
          <List items={[
            'Personal data shall not be used to train AI models without a lawful basis under Section 30 of the Act.',
            'Before use in training, personal data shall be anonymised to a standard that renders re-identification technically infeasible.',
            'Users who have withdrawn consent to data processing shall have their data excluded from training datasets.',
            'Training data shall not be shared with third-party model developers except under binding contractual protections consistent with this Policy and the Act.',
          ]} />
        </Section>

        <Section id="risk" title="8. AI Risk Management">
          <Para>The Company shall implement and maintain the following risk management measures:</Para>
          <List items={[
            'Data Protection Impact Assessments ("DPIAs") shall be conducted prior to the deployment of any AI System likely to result in high risk to the rights and freedoms of Users',
            'Periodic audits of AI Systems shall be conducted to assess accuracy, fairness, bias, and compliance with this Policy',
            'Model performance shall be monitored on an ongoing basis to detect and address material degradation or drift',
            'AI Systems shall be subject to the Company\'s information security framework, including access controls, logging, and incident response protocols',
            'The Company shall maintain a record of significant AI incidents and shall take prompt corrective action',
          ]} />
        </Section>

        <Section id="amendments" title="9. Amendments">
          <Para>This Policy shall be reviewed at least annually and updated to reflect material changes in AI deployment, applicable law, or regulatory guidance issued by the ODPC or other competent authorities. Material amendments shall be communicated to Users through the Platform and by email prior to taking effect.</Para>
        </Section>

        <Section id="contact" title="10. Contact">
          <Para>Questions, complaints, or requests relating to this AI Policy or to AI-driven decisions affecting you should be directed to:</Para>
          <Para>Data Protection Officer · Fixera Company Limited · P.O. Box 12997 - 00100, Nairobi, Kenya</Para>
          <Para>Email: <a href="mailto:amin.mohamed09@outlook.com?subject=AI Policy Enquiry" style={{ color: CL.green, fontWeight: 600, textDecoration: 'none' }}>amin.mohamed09@outlook.com</a></Para>
        </Section>

        {/* Footer links */}
        <div style={{ borderTop: `1px solid ${CL.border}`, paddingTop: 24, marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {[
            { label: 'Terms of Service', path: '/terms', color: '#C9A020' },
            { label: 'Privacy Policy', path: '/privacy', color: '#63B3ED' },
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
