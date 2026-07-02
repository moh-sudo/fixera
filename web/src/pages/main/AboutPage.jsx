import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Zap, Star, Handshake } from 'lucide-react';

import { useCL } from '../../hooks/useCL';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.38, delay: i * 0.07, ease: 'easeOut' } }),
};

const STATS = [
  { value: '5,000+', label: 'Happy Customers' },
  { value: '300+',   label: 'Professionals'   },
  { value: '20+',    label: 'Services'         },
  { value: '4.8★',   label: 'Avg. Rating'     },
];

const VALUES = [
  { Icon: Shield,    title: 'Trust & Safety',       color: '#2F7FD1', bg: '#E8F1FB', desc: 'Every professional is background-checked, skills-tested, and continuously rated. Your safety is our top priority.' },
  { Icon: Zap,       title: 'Speed & Reliability',  color: '#C9A020',  bg: '#FDF8EC', desc: 'Same-day and on-demand bookings. We show up on time, every time — or we make it right.' },
  { Icon: Star,      title: 'Quality Guaranteed',   color: '#1A7F3C',  bg: '#F0FAF4', desc: "Not satisfied? We'll send someone back or give you a full refund. Quality is never negotiable." },
  { Icon: Handshake, title: 'Fair for Everyone',    color: '#E07B2A', bg: '#FEF0E6', desc: 'We pay our professionals well and treat them with respect. Happy workers deliver better service.' },
];

const STEPS = [
  { num: '01', title: 'Book in Seconds',  desc: 'Choose your service, pick a time, confirm in under a minute.' },
  { num: '02', title: 'We Match You',     desc: 'Our system instantly matches you with the best-rated professional nearby.' },
  { num: '03', title: 'They Come to You', desc: 'Track your professional in real time as they head to your location.' },
  { num: '04', title: 'Job Done Right',   desc: 'Pay securely via M-Pesa or card. Leave a review when done.' },
];

const SERVICES = [
  { icon: '🧹', label: 'Home Cleaning'   },
  { icon: '🔧', label: 'Plumbing'        },
  { icon: '⚡', label: 'Electrical'      },
  { icon: '🪚', label: 'Carpentry'       },
  { icon: '🎨', label: 'Painting'        },
  { icon: '📦', label: 'Moving & Lifting'},
  { icon: '🛺', label: 'Delivery'        },
  { icon: '👔', label: 'Laundry'         },
  { icon: '🧺', label: 'Carpet Washing'  },
  { icon: '🔍', label: 'Home Inspection' },
  { icon: '🏗️', label: 'Renovation'      },
  { icon: '🌿', label: 'Gardening'       },
];

const AREAS = ['Westlands', 'Karen', 'Kilimani', 'Lavington', 'Langata', 'Kasarani', 'Embakasi', 'South C', 'Parklands', 'Ruaka', 'Kileleshwa', 'Gigiri'];

export default function AboutPage() {
  const CL = useCL();
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: CL.bg }}>
      {/* Header */}
      <div style={{ background: CL.surface, borderBottom: `1px solid ${CL.border}`, padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${CL.border}`, background: CL.bg, color: CL.navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ color: CL.text, fontSize: 16, fontWeight: 800 }}>About Fixera</div>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: CL.goldSoft, border: `1px solid ${CL.gold}30`, borderRadius: 20, padding: '5px 12px', color: CL.gold, fontSize: 12, fontWeight: 700 }}>
          🇰🇪 Proudly Kenyan
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 18px 80px' }}>

        {/* Hero */}
        <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" style={{ textAlign: 'center', padding: '32px 16px 36px' }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: CL.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>🔧</div>
          <h1 style={{ margin: '0 0 12px', color: CL.text, fontSize: 32, fontWeight: 900, lineHeight: 1.2 }}>
            One Call.<br />
            <span style={{ color: CL.gold }}>We Fix It All.</span>
          </h1>
          <p style={{ margin: '0 auto 24px', color: CL.muted, fontSize: 15, lineHeight: 1.8, maxWidth: 500 }}>
            Nairobi's leading home services platform — connecting households with trusted, verified professionals for any job, big or small.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/home')} style={{ padding: '12px 24px', borderRadius: 12, background: CL.navy, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Book a Service</button>
            <a href="tel:+254712008361" style={{ padding: '12px 24px', borderRadius: 12, background: CL.surface, border: `1px solid ${CL.border}`, color: CL.text, fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>📞 Call Us</a>
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, display: 'flex', overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ flex: 1, padding: '18px 8px', textAlign: 'center', borderRight: i < 3 ? `1px solid ${CL.border}` : 'none' }}>
              <div style={{ color: CL.gold, fontSize: 20, fontWeight: 900, marginBottom: 3 }}>{s.value}</div>
              <div style={{ color: CL.light, fontSize: 10, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Our Story */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: CL.gold }} />
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>Our Story</div>
          </div>
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '22px 22px', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
            <p style={{ margin: '0 0 14px', color: CL.muted, fontSize: 14, lineHeight: 1.85 }}>
              Fixera was born out of a simple frustration — finding a <strong style={{ color: CL.text }}>reliable, affordable home service professional in Nairobi</strong> was nearly impossible. You'd call someone unreliable, overpay, or wait days with no guarantee of quality.
            </p>
            <p style={{ margin: '0 0 14px', color: CL.muted, fontSize: 14, lineHeight: 1.85 }}>
              We built Fixera to change that. By combining technology with a rigorous vetting process, we've created a platform where <strong style={{ color: CL.text }}>customers get world-class service</strong> and <strong style={{ color: CL.text }}>professionals get steady, fairly-paid work</strong>.
            </p>
            <p style={{ margin: 0, color: CL.muted, fontSize: 14, lineHeight: 1.85 }}>
              Today, Fixera serves thousands of households across Nairobi — from quick plumbing fixes to full-home cleaning, laundry, and inspections. We're just getting started.
            </p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: '#2F7FD1' }} />
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>How Fixera Works</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '20px 20px', position: 'relative', overflow: 'hidden', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ position: 'absolute', top: 12, right: 16, color: CL.navy + '08', fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{s.num}</div>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: CL.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 900, marginBottom: 12 }}>{s.num.replace('0', '')}</div>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{s.title}</div>
                <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Values */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: CL.success }} />
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>What We Stand For</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {VALUES.map(v => (
              <div key={v.title} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 16, padding: '20px', borderTop: `3px solid ${v.color}`, boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <v.Icon size={22} color={v.color} strokeWidth={2} />
                </div>
                <div style={{ color: CL.text, fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{v.title}</div>
                <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.7 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Services */}
        <motion.div custom={5} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: CL.gold }} />
            <div style={{ color: CL.text, fontSize: 18, fontWeight: 800 }}>Our Services</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {SERVICES.map(s => (
              <div key={s.label} onClick={() => navigate('/home')} style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 14, padding: '16px 10px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = CL.gold + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = CL.border; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ fontSize: 24, marginBottom: 7 }}>{s.icon}</div>
                <div style={{ color: CL.muted, fontSize: 11, fontWeight: 600, lineHeight: 1.3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coverage */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: 24 }}>
          <div style={{ background: CL.surface, border: `1px solid ${CL.border}`, borderRadius: 18, padding: '22px', textAlign: 'center', boxShadow: '0 2px 8px rgba(10,22,40,0.04)' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🗺️</div>
            <div style={{ color: CL.text, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Currently Serving Nairobi</div>
            <div style={{ color: CL.muted, fontSize: 13, lineHeight: 1.75, maxWidth: 420, margin: '0 auto 18px' }}>
              We cover Nairobi and its environs. Expanding to Mombasa and Kisumu soon.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
              {AREAS.map(area => (
                <span key={area} style={{ background: CL.goldSoft, border: `1px solid ${CL.gold}30`, color: CL.gold, fontSize: 11, fontWeight: 600, borderRadius: 20, padding: '4px 11px' }}>{area}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="show"
          style={{ background: CL.navy, borderRadius: 20, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 900, marginBottom: 10 }}>Ready to experience Fixera?</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
            Join thousands of Nairobi households who trust Fixera for their home needs.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/home')} style={{ padding: '13px 28px', borderRadius: 12, background: CL.gold, border: 'none', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              Book Now
            </button>
            <a href="https://wa.me/254712008361?text=Hi%20Fixera%2C%20I%20want%20to%20learn%20more." target="_blank" rel="noopener noreferrer"
              style={{ padding: '13px 28px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
              💬 WhatsApp
            </a>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
