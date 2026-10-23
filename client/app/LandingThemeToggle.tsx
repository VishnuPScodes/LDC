'use client';

import {useEffect, useState} from 'react';

export default function LandingThemeToggle() {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const storedDark = localStorage.getItem('ldc-theme') !== 'light';
    setDark(storedDark);
    document.querySelector('.landing-shell')?.classList.toggle('dark', storedDark);
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    localStorage.setItem('ldc-theme', nextDark ? 'dark' : 'light');
    document.querySelector('.landing-shell')?.classList.toggle('dark', nextDark);
  };

  return <button className="ghost" type="button" onClick={toggle} aria-label="Toggle theme">{dark ? '☀' : '◐'}</button>;
}
