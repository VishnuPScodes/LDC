'use client';

export default function LandingActions() {
  return <button className="button" type="button" onClick={() => window.dispatchEvent(new Event('ldc-open-auth'))}>Get started →</button>;
}
