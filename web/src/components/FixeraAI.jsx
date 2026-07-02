import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C } from '../theme';
import { askFixeraAI } from '../services/aiService';

// Pages where AI button should be hidden automatically
const HIDDEN_ON = ['/profile', '/receipt', '/review', '/payment'];

const QUICK_PROMPTS = [
  { label: '💧 Pipe leaking', msg: 'My pipe is leaking, what should I do?' },
  { label: '⚡ Power issue',  msg: 'My electricity keeps tripping, can Fixera help?' },
  { label: '💰 Price estimate', msg: 'How much does cleaning a 2-bedroom house cost?' },
  { label: '🚨 Emergency',   msg: 'I have an emergency at home, how fast can you help?' },
];

export default function FixeraAI() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen]         = useState(false);
  const [hidden, setHidden]     = useState(false);

  // Auto-hide on certain pages, restore when leaving
  useEffect(() => {
    const shouldHide = HIDDEN_ON.some(p => pathname.startsWith(p));
    setHidden(shouldHide);
    if (shouldHide) setOpen(false);
  }, [pathname]);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm **Fixy** 👋 — your Fixera AI assistant.\n\nDescribe your home problem and I'll recommend the right service, estimate costs, or guide you through booking!" }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnread(0);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Only send actual user/assistant turns — skip system messages
      // askFixeraAI internally strips any leading assistant messages
      const reply = await askFixeraAI(newMessages.filter(m => m.role !== 'system'));
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      console.error('Fixy error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having a connection issue right now 🔌 Please check your internet and try again, or contact our support team.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Voice input
  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-KE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend   = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  // Render markdown-lite (bold, newlines)
  const renderText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : p.split('\n').map((line, j) => <span key={j}>{line}{j < p.split('\n').length - 1 && <br />}</span>)
    );
  };

  // Show a tiny restore button when manually hidden
  if (hidden && !HIDDEN_ON.some(p => pathname.startsWith(p))) {
    return (
      <button
        onClick={() => setHidden(false)}
        style={{
          position: 'fixed', bottom: 88, right: 20, zIndex: 9999,
          background: 'rgba(13,33,68,0.85)', border: '1px solid rgba(201,160,32,0.4)',
          borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
          color: '#C9A020', fontSize: 11, fontWeight: 700,
        }}
      >🤖 Fixy</button>
    );
  }

  if (hidden) return null;

  return (
    <>
      {/* ── Floating Button ── */}
      <div style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>

        {/* Small hide button — only shows when chat is closed */}
        {!open && (
          <button
            onClick={() => setHidden(true)}
            title="Hide Fixy"
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
          >✕</button>
        )}

      <div
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative',
          width: 58, height: 58, borderRadius: '50%',
          background: open
            ? 'linear-gradient(135deg, #0a1628, #1a2f52)'
            : 'linear-gradient(135deg, #0d2144, #1a3a6e)',
          boxShadow: open
            ? '0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 24px rgba(13,33,68,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 26,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: open ? 'rotate(0deg) scale(1)' : 'rotate(0deg) scale(1)',
          border: open ? '2px solid rgba(201,160,32,0.5)' : '2px solid rgba(201,160,32,0.4)',
        }}
      >
        {open ? '✕' : '🤖'}
        {!open && unread > 0 && (
          <div style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#FC8181', color: '#fff',
            fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>{unread}</div>
        )}
      </div>
      </div>{/* end floating button wrapper */}

      {/* ── Chat Panel ── */}
      <div style={{
        position: 'fixed', bottom: 160, right: 20, zIndex: 9998,
        width: 380, maxHeight: '70vh',
        background: 'var(--bg-light)',
        border: '1px solid rgba(201,160,32,0.25)',
        borderRadius: 24,
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        opacity: open ? 1 : 0,
        transform: open ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
        pointerEvents: open ? 'all' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #0d2144 0%, #1a3a6e 60%, #C9A020 150%)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#C9A020', fontSize: 15, fontWeight: 800 }}>Fixy — Fixera AI</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A020', opacity: 0.8, animation: 'pulse 2s infinite' }} />
              <span style={{ color: 'rgba(201,160,32,0.8)', fontSize: 11, fontWeight: 600 }}>
                {loading ? 'Typing...' : 'Online · Always here to help'}
              </span>
            </div>
          </div>
          <button onClick={() => setMessages([messages[0]])} style={{
            background: 'rgba(201,160,32,0.2)', border: '1px solid rgba(201,160,32,0.4)', borderRadius: 8,
            color: '#C9A020', fontSize: 11, fontWeight: 700, padding: '4px 10px',
            cursor: 'pointer',
          }}>Clear</button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end', gap: 8,
            }}>
              {m.role === 'assistant' && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,160,32,0.15)', border: '1px solid rgba(201,160,32,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: m.role === 'user'
                  ? 'linear-gradient(135deg, #0d2144, #1a3a6e)'
                  : 'var(--bg-mid)',
                color: m.role === 'user' ? '#C9A020' : 'var(--text-primary)',
                fontSize: 13, lineHeight: 1.6,
                border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}>
                {renderText(m.content)}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,160,32,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '18px 18px 18px 4px', background: 'var(--bg-mid)', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#C9A020', opacity: 0.7, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q.msg)} style={{
                padding: '6px 12px', borderRadius: 20,
                background: 'var(--bg-mid)', border: '1px solid var(--border)',
                color: 'var(--text-sec)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A02060'; e.currentTarget.style.color = '#C9A020'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)'; }}
              >{q.label}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          {/* Voice button */}
          <button onClick={toggleVoice} style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: listening ? 'rgba(252,129,129,0.15)' : 'var(--bg-mid)',
            border: `1px solid ${listening ? '#FC8181' : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, cursor: 'pointer',
            animation: listening ? 'pulse 1s infinite' : 'none',
          }}>
            {listening ? '🔴' : '🎤'}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={listening ? 'Listening... speak now 🎤' : 'Ask Fixy anything...'}
            rows={1}
            style={{
              flex: 1, padding: '10px 14px',
              borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--bg-mid)', color: 'var(--text-primary)',
              fontSize: 13, fontFamily: 'inherit', outline: 'none',
              resize: 'none', lineHeight: 1.5, maxHeight: 100, overflowY: 'auto',
            }}
            onFocus={e => e.target.style.borderColor = '#C9A02060'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />

          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #C9A020, #D4B033)'
                : 'var(--bg-mid)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
          >
            {loading ? '⏳' : '➤'}
          </button>
        </div>

        <style>{`
          @keyframes bounce {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-6px); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </>
  );
}
