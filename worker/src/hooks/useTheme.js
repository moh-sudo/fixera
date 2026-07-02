import { useEffect, useState } from 'react';

function isDayTime() {
  const h = new Date().getHours();
  return h >= 6 && h < 18;
}

function applyTheme(day) {
  document.documentElement.classList.toggle('light-mode', day);
}

let _isDay = isDayTime();
applyTheme(_isDay);

export function useTheme() {
  const [isDay, setIsDay] = useState(_isDay);

  useEffect(() => {
    applyTheme(isDay);
    const id = setInterval(() => {
      const now = isDayTime();
      if (now !== _isDay) { _isDay = now; setIsDay(now); applyTheme(now); }
    }, 60000);
    return () => clearInterval(id);
  }, [isDay]);

  const toggle = () => { const next = !isDay; _isDay = next; setIsDay(next); applyTheme(next); };
  return { isDay, toggle };
}
