'use client';

import {useEffect, useState} from 'react';

export default function LandingThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem('ldc-theme');
    const storedDark = theme === 'dark';
    setDark(storedDark);
    if (theme) document.documentElement.dataset.themeChoice = theme;
    else delete document.documentElement.dataset.themeChoice;
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => { meta.content = storedDark ? '#121513' : '#FAF8F3'; });
    document.querySelector('.landing-shell')?.classList.toggle('dark', storedDark);
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    localStorage.setItem('ldc-theme', nextDark ? 'dark' : 'light');
    document.documentElement.dataset.themeChoice = nextDark ? 'dark' : 'light';
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach(meta => { meta.content = nextDark ? '#121513' : '#FAF8F3'; });
    document.querySelector('.landing-shell')?.classList.toggle('dark', nextDark);
  };

  return <button className="ghost" type="button" onClick={toggle} aria-label="Toggle theme">{dark ? '☀' : '◐'}</button>;
}
