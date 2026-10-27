'use client';

export default function LandingActions() {
  return <div className="landing-actions"><button className="button" type="button" onClick={() => window.dispatchEvent(new Event('ldc-open-auth'))}>Get started →</button><a className="secondary-button" href="/practice/mock">Take a full mock exam</a></div>;
}
