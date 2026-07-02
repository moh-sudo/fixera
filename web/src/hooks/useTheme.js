import { useEffect, useState } from 'react';

function checkDay() {
  const h = new Date().getHours();
  return h >= 6 && h < 18;
}

// Store manual override in memory (shared across components)
let manualOverride = null; // null = auto, true = forced light, false = forced dark
let listeners = [];

function notify(val) {
  listeners.forEach(fn => fn(val));
}

export function setThemeOverride(isLight) {
  manualOverride = isLight;
  document.documentElement.classList.toggle('light-mode', isLight);
  notify(isLight);
}

export function useTheme() {
  const getEffective = () => manualOverride !== null ? manualOverride : checkDay();
  const [day, setDay] = useState(getEffective());

  useEffect(() => {
    // Apply on mount
    document.documentElement.classList.toggle('light-mode', getEffective());

    // Listen for manual changes from other components
    const handler = (val) => setDay(val);
    listeners.push(handler);

    // Auto-check every 60s (only applies if no manual override)
    const interval = setInterval(() => {
      if (manualOverride === null) {
        const nowDay = checkDay();
        setDay(nowDay);
        document.documentElement.classList.toggle('light-mode', nowDay);
      }
    }, 60_000);

    return () => {
      listeners = listeners.filter(fn => fn !== handler);
      clearInterval(interval);
    };
  }, []);

  const toggle = () => setThemeOverride(!day);

  return { isDay: day, toggle };
}
