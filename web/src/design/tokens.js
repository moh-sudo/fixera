// ─────────────────────────────────────────────────────────────
//  FIXERA DESIGN SYSTEM — Tokens (Option A: Light & Clean)
//  Single source of truth for the new premium UI.
//  Import: import { T } from '../design/tokens';
// ─────────────────────────────────────────────────────────────

export const T = {
  color: {
    // Surfaces
    bg:         '#F5F6F8',   // app page background
    surface:    '#FFFFFF',   // cards, sheets, inputs
    surfaceAlt: '#FAFBFC',   // subtle alternate surface
    header:     '#0A1628',   // top bar / nav
    border:     '#E8EAED',   // dividers, card borders
    borderStrong:'#D4D7DC',

    // Brand
    navy:       '#0A1628',
    navyMid:    '#112240',
    gold:       '#C9A020',
    goldLight:  '#D4B033',
    goldDark:   '#A07A10',
    goldSoft:   '#FBF4DD',   // gold tint background

    // Text
    text:       '#0A1628',
    textMuted:  '#5F5E5A',
    textLight:  '#9AA0A6',
    textOnDark: '#FFFFFF',

    // Service accents
    plumbing:   '#4A90D9',
    electrical: '#F6C90E',
    cleaning:   '#4FD1C5',
    painting:   '#FC8A4D',

    // Semantic
    success:    '#1E9E5A',
    successBg:  '#E7F6EE',
    error:      '#E24B4A',
    errorBg:    '#FCEBEB',
    warning:    '#D98A1F',
    warningBg:  '#FBF0DD',
    info:       '#2F7FD1',
    infoBg:     '#E8F1FB',
  },

  // Typography
  font: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: { size: '30px', weight: 700, lh: '1.15', ls: '-0.02em' },
    h1:      { size: '24px', weight: 700, lh: '1.2',  ls: '-0.01em' },
    h2:      { size: '18px', weight: 600, lh: '1.3' },
    h3:      { size: '16px', weight: 600, lh: '1.4' },
    body:    { size: '15px', weight: 400, lh: '1.6' },
    small:   { size: '13px', weight: 400, lh: '1.5' },
    label:   { size: '12px', weight: 600, lh: '1.4', ls: '0.08em', tt: 'uppercase' },
  },

  // Spacing scale (px)
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },

  // Shape
  radius: { sm: '8px', md: '12px', lg: '16px', button: '10px', pill: '999px' },

  // Shadows
  shadow: {
    sm: '0 2px 8px rgba(10,22,40,0.05)',
    md: '0 6px 16px rgba(10,22,40,0.06)',
    lg: '0 12px 32px rgba(10,22,40,0.10)',
    focus: '0 0 0 3px rgba(201,160,32,0.25)',
  },
};

export default T;
