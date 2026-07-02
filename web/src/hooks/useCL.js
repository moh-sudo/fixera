import { useEffect, useState } from 'react';

const LIGHT = {
  bg: '#F7F8FA',
  surface: '#FFFFFF',
  border: '#E8ECF0',
  text: '#0A1628',
  muted: '#6B7A8F',
  gold: '#C9A020',
  goldSoft: '#FDF8EC',
  goldBorder: '#E8D48A',
  navy: '#0A1628',
  black: '#111418',
  success: '#1A7F3C',
  successBg: '#F0FAF4',
  successBorder: '#A3D9B3',
  error: '#C0392B',
  errorBg: '#FDF2F2',
  errorBorder: '#F5C6C6',
  warning: '#D4780A',
  warningBg: '#FFF8F0',
  warningBorder: '#F6AD55',
  info: '#2B6CB0',
  infoBg: '#EBF8FF',
  infoBorder: '#BEE3F8',
};

const DARK = {
  bg: '#0F1117',
  surface: '#1A1D27',
  border: '#2A2D3A',
  text: '#F0F2F5',
  muted: '#8B929E',
  gold: '#C9A020',
  goldSoft: '#1F1A08',
  goldBorder: '#4A3A08',
  navy: '#0A1628',
  black: '#000000',
  success: '#2ECC71',
  successBg: '#0D1F14',
  successBorder: '#1A5C34',
  error: '#E74C3C',
  errorBg: '#1F0D0A',
  errorBorder: '#5C1A18',
  warning: '#F39C12',
  warningBg: '#1F1608',
  warningBorder: '#6A4A08',
  info: '#3498DB',
  infoBg: '#08141F',
  infoBorder: '#1A3A5C',
};

function isNight() {
  const h = new Date().getHours();
  return h < 6 || h >= 19; // night: 7pm – 6am
}

export function useCL() {
  const [dark, setDark] = useState(isNight());

  useEffect(() => {
    const interval = setInterval(() => setDark(isNight()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return dark ? DARK : LIGHT;
}

export const CL_LIGHT = LIGHT;
export const CL_DARK = DARK;
