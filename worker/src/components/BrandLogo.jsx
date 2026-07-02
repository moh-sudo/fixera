// Real Fixera logo (transparent PNG). Adapts to light/dark surfaces.
// On dark surfaces the metallic gold/silver shines directly.
// On light surfaces it sits in a subtle navy badge so the silver doesn't wash out.

import { motion } from 'framer-motion';

export default function BrandLogo({ height = 44, onLight = false, style = {} }) {
  if (onLight) {
    return (
      <motion.div
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{
          display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: Math.round(height * 0.22), background: '#0A1628', borderRadius: 16,
          boxShadow: '0 0 22px rgba(201,160,32,0.55), 0 0 8px rgba(201,160,32,0.35), 0 4px 16px rgba(10,22,40,0.4)',
          cursor: 'pointer',
        }}>
        <img src="/logo-mark.png" alt="Fixera Home Services"
          style={{ height, width: 'auto', display: 'block', ...style }} />
      </motion.div>
    );
  }

  return (
    <img src="/logo-mark.png" alt="Fixera Home Services"
      style={{ height, width: 'auto', display: 'block', ...style }} />
  );
}
