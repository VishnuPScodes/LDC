'use client';
import TodayDashboard from '../TodayDashboard';
import syllabus from '../../../server/data/syllabus.json';

const progress = { coverage: { byTopic: [
  { topic: 'Kerala – Governance and System of Administration', attempts: 18, correct: 10, accuracy: 56, attempted: 16, total: 91 },
  { topic: 'Geography', attempts: 14, correct: 11, accuracy: 79, attempted: 12, total: 80 },
  { topic: 'Indian Constitution', attempts: 4, correct: 3, accuracy: 75, attempted: 4, total: 95 },
  { topic: 'History', attempts: 22, correct: 18, accuracy: 82, attempted: 20, total: 136 },
] } };

export default function TodayPreview() {
  return <main className="shell">
    <header className="header"><div className="brand">LDC<span>.</span> practice</div><span className="small">A calm study companion</span></header>
    <TodayDashboard name="Anu" dailyCount={12} dailyGoal={20} streak={4} progress={progress} syllabus={syllabus}
      onStart={() => {}} onPracticeTopic={() => {}} onContinuePdf={() => {}} onOpenSyllabus={() => {}} />
  </main>;
}
