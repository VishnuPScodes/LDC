'use client';
import {useEffect,useState} from 'react';

type Topic = { topic: string; marks: number };
type TopicProgress = { topic: string; attempted: number; total: number; attempts: number; correct: number; accuracy: number };

type Props = {
  name: string;
  dailyCount: number;
  dailyGoal: number;
  streak: number;
  progress: any;
  syllabus: Topic[];
  onStart: (config?: any) => void;
  onPracticeTopic: (topic: string) => void;
  onContinuePdf: () => void;
  onOpenSyllabus: () => void;
  reviewDue?: number;
  weekDays?: boolean[];
};

export default function TodayDashboard({ name, dailyCount, dailyGoal, streak, progress, syllabus, onStart, onContinuePdf, onOpenSyllabus, reviewDue = 0, weekDays = [] }: Props) {
  const [celebrate,setCelebrate]=useState(false);
  const topicStats: TopicProgress[] = progress?.coverage?.byTopic || [];
  const bestFocus = [...syllabus].map(topic => {
    const stats = topicStats.find(row => row.topic === topic.topic);
    const attempts = stats?.attempts || 0;
    const accuracy = stats?.accuracy || 0;
    return { ...topic, attempts, accuracy, priority: topic.marks * (attempts ? 1 - accuracy / 100 : 1) };
  }).sort((a, b) => b.priority - a.priority)[0];
  const percent = Math.min(100, Math.round(dailyCount / dailyGoal * 100));
  const circumference = 2 * Math.PI * 33;
  useEffect(()=>{if(percent<100)return;const now=new Date(),day=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`,key='ldc-goal-celebrated';if(localStorage.getItem(key)===day)return;localStorage.setItem(key,day);setCelebrate(true);const timer=window.setTimeout(()=>setCelebrate(false),1300);return()=>window.clearTimeout(timer)},[percent]);

  return <div className="today-page">
    <section className="today-heading">
      <div><div className="eyebrow">TODAY</div><h1 className="title">Good {new Date().getHours() < 12 ? 'morning' : 'day'}, {name}.</h1><p className="today-subtitle">A steady session is progress. Let’s take the next step.</p></div>
      <div className="streak-card" aria-label={`${streak} day streak`}><span aria-hidden="true">✦</span><div><strong>{streak} day{streak === 1 ? '' : 's'}</strong><small>daily goal streak</small><div className="week-dots" aria-label="Weekly goal activity">{'MTWTFSS'.split('').map((day, i) => <span key={i} className={`${weekDays[i] ? 'complete' : ''}${i === (new Date().getDay()+6)%7 ? ' today' : ''}`} aria-hidden="true">{day}</span>)}</div></div></div>
    </section>

    <section className={`daily-goal-card${percent >= 100 ? ' goal-done' : ''}`} aria-label="Daily question goal">
      {celebrate&&<span className="goal-confetti" aria-hidden="true">{Array.from({length:7},(_,i)=><i key={i} style={{'--particle':i} as any}/>)}</span>}
      <div className="goal-ring" role="progressbar" aria-label="Daily goal progress" aria-valuemin={0} aria-valuemax={dailyGoal} aria-valuenow={Math.min(dailyCount, dailyGoal)}>
        <svg viewBox="0 0 76 76" aria-hidden="true"><circle className="goal-track" cx="38" cy="38" r="33"/><circle className="goal-progress" cx="38" cy="38" r="33" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)}/></svg>
        <span>{percent >= 100 ? '✓' : `${percent}%`}</span>
      </div>
      <div className="goal-copy"><div className="eyebrow">DAILY GOAL</div><h2>{percent >= 100 ? 'Goal complete' : 'One question at a time'}</h2><p>{dailyCount} of {dailyGoal} questions today</p></div>
      <div className="goal-count"><strong>{Math.min(dailyCount, dailyGoal)}</strong><span>/ {dailyGoal}</span></div>
    </section>

    <section className="today-plan card">
      <div className="plan-copy"><div className="eyebrow">TODAY’S PLAN</div><h2>{bestFocus?.topic || 'A short practice session'}</h2><p>{bestFocus ? `${Math.max(1, Math.min(10, dailyGoal - dailyCount || 10))} focused questions · ${bestFocus.marks} syllabus marks${bestFocus.attempts >= 10 ? ` · ${Math.round(bestFocus.accuracy)}% accuracy` : ''}` : 'A gentle mix from your eligible question bank.'}</p><span className="plan-note">Review due: {reviewDue}</span></div>
      <button className="button plan-start" type="button" onClick={() => onStart(bestFocus ? { topics: [bestFocus.topic] } : {})}>Start <span aria-hidden="true">→</span></button>
    </section>

    <button className="syllabus-link" type="button" onClick={onOpenSyllabus}>Browse syllabus and topics <span aria-hidden="true">→</span></button>
    <button className="pdf-order-link" type="button" onClick={onContinuePdf}>Continue in Question Paper order <span aria-hidden="true">→</span></button>
  </div>;
}
