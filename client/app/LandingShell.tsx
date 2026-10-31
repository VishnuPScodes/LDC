import LandingActions from './LandingActions';
import LandingThemeToggle from './LandingThemeToggle';
import {siteUrl} from './site-url';
import LeafBackground from './LeafBackground';

export default function LandingShell() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LDC Practice',
    description: 'Practice Kerala PSC LDC previous-year questions with topic-wise drills, mock exams, answer review, and progress tracking.',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    ...(siteUrl ? { url: siteUrl } : {}),
  };

  return <main className="landing-shell">
    <LeafBackground />
    <div className="shell">
      <header className="header"><a className="brand" href="/">LDC<span>.</span> practice</a><LandingThemeToggle /></header>
      <section className="card hero">
        <div className="eyebrow">KERALA PSC · LOWER DIVISION CLERK</div>
        <div className="landing-collection">Previous-year question paper collection <span>2013–2023</span></div>
        <h1 className="title">Kerala PSC LDC Exam Practice — Previous Year Questions 2013–2023</h1>
        <p className="lead">Prepare for the Kerala PSC Lower Division Clerk exam with previous-year questions from 2013 to 2023. Practice by syllabus topic, take timed mock exams, review your answers, and track your progress.</p>
        <LandingActions />
        <div className="landing-points"><span>Question by question</span><span>Syllabus wise</span><span>Progress saved</span></div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    </div>
  </main>;
}
