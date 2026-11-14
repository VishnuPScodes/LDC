'use client';

import { useEffect, useRef, useState } from 'react';

export const AUTO_ADVANCE_MS = 3000;

/**
 * Moves to the next question a few seconds after an answer is shown, so the
 * learner doesn't have to press Next every time. Returns the whole seconds
 * left (for a countdown label), or null while no countdown is running.
 */
export function useAutoAdvance(active: boolean, onAdvance: () => void, ms: number = AUTO_ADVANCE_MS): number | null {
  const advanceRef = useRef(onAdvance);
  useEffect(() => { advanceRef.current = onAdvance; }, [onAdvance]);
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!active) { setLeft(null); return; }
    const endsAt = Date.now() + ms;
    setLeft(Math.ceil(ms / 1000));
    const tick = window.setInterval(() => setLeft(Math.max(1, Math.ceil((endsAt - Date.now()) / 1000))), 250);
    const done = window.setTimeout(() => { setLeft(null); advanceRef.current(); }, ms);
    return () => { window.clearInterval(tick); window.clearTimeout(done); };
  }, [active, ms]);

  return left;
}
