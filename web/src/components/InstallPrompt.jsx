import { useState, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────
//  PWA Install Prompt — shows "Install Fixera" banner
//  Works on Chrome/Edge Android. iOS users see manual instructions.
// ─────────────────────────────────────────────────────────────

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow]                     = useState(false);
  const [iosBanner, setIosBanner]           = useState(false);

  useEffect(() => {
    // Already installed? Hide it forever
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
    if (window.navigator.standalone) return; // iOS detection
    if (localStorage.getItem('fixera_install_dismissed')) return;

    // Detect iOS Safari
    const isIos    = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIos && isSafari) {
      // Show iOS instructions after 8 seconds
      const t = setTimeout(() => setIosBanner(true), 8000);
      return () => clearTimeout(t);
    }

    // Listen for the beforeinstallprompt event (Chrome/Edge Android + desktop)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after a small delay so it's not jarring
      setTimeout(() => setShow(true), 6000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setShow(false);
    setIosBanner(false);
    localStorage.setItem('fixera_install_dismissed', Date.now().toString());
  };

  // iOS Safari banner — manual instructions since there's no install API
  if (iosBanner) {
    return (
      <div style={{
        position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 9999,
        background: 'linear-gradient(135deg, #0d2144, #1a3a6e)',
        border: '1px solid rgba(201,160,32,0.4)',
        borderRadius: 16,
        padding: '14px 16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
        display: 'flex', gap: 12, alignItems: 'center',
        animation: 'slideUp 0.4s ease',
      }}>
        <style>{`@keyframes slideUp{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: 'linear-gradient(135deg,#C9A020,#D4B033)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>🔧</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#C9A020', fontSize: 13, fontWeight: 800 }}>Install Fixera</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>
            Tap <strong>Share</strong> → <strong>Add to Home Screen</strong>
          </div>
        </div>
        <button onClick={dismiss} style={{
          background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, color: 'rgba(255,255,255,0.7)',
          width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0,
        }}>✕</button>
      </div>
    );
  }

  // Android / Desktop install prompt
  if (!show || !deferredPrompt) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 16, right: 16, zIndex: 9999,
      background: 'linear-gradient(135deg, #0d2144, #1a3a6e)',
      border: '1px solid rgba(201,160,32,0.4)',
      borderRadius: 16,
      padding: '14px 16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
      display: 'flex', gap: 12, alignItems: 'center',
      maxWidth: 460, margin: '0 auto',
      animation: 'slideUp 0.4s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: 'linear-gradient(135deg,#C9A020,#D4B033)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
        boxShadow: '0 4px 12px rgba(201,160,32,0.3)',
      }}>🔧</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#C9A020', fontSize: 14, fontWeight: 800 }}>Install Fixera App</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 }}>
          Get faster access & push notifications
        </div>
      </div>

      <button onClick={install} style={{
        padding: '8px 14px', borderRadius: 10,
        background: 'linear-gradient(135deg,#C9A020,#D4B033)',
        border: 'none', color: '#0A0E1A',
        fontSize: 12, fontWeight: 800, cursor: 'pointer',
        flexShrink: 0,
      }}>Install</button>

      <button onClick={dismiss} style={{
        background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 8, color: 'rgba(255,255,255,0.7)',
        width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}
