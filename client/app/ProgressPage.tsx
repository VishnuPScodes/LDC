'use client';
import {Area,AreaChart,CartesianGrid,ResponsiveContainer,Tooltip,XAxis,YAxis,Bar,BarChart} from 'recharts';
import PointsLevelCard from './PointsLevelCard';
import {featureFlags} from './feature-flags';
export default function ProgressPage({progress,history,habitDays={},loading=false,error='',onRetry,learnerStats,language='en'}:{progress:any;history:any[];habitDays?:Record<string,{count?:number;goalMet?:boolean}>;loading?:boolean;error?:string;onRetry?:()=>void;learnerStats?:any;language?:'en'|'ml'}) {
  const completed=history.filter(x=>x.status==='completed');
  const trend=completed.map((x,i)=>({name:`Test ${i+1}`,accuracy:Math.round(x.score?.accuracy||0),date:new Date(x.completedAt||x.startedAt).toLocaleDateString()}));
  const days=Array.from({length:30},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(29-i));const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return {key,count:habitDays[key]?.count||0,goalMet:!!habitDays[key]?.goalMet,label:d.toLocaleDateString()}});
  const coverage=progress?.coverage?.byTopic||[];
  return <section className="progress-page"><div className="eyebrow">PROGRESS</div><h1 className="section-title">Your practice, over time.</h1>{featureFlags.points&&<PointsLevelCard stats={learnerStats} language={language}/>}
    {loading&&<div className="progress-loading" role="status">Loading your progress…</div>}{!loading&&error&&<div className="page-load-error" role="alert"><p>Couldn’t load your progress.</p><button type="button" className="secondary-button" onClick={onRetry}>Retry</button></div>}
    {!loading&&!error&&<>
    {completed.length>=3&&<div className="progress-panel"><h2>Accuracy trend</h2><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3"/><XAxis dataKey="name" stroke="var(--muted)"/><YAxis domain={[0,100]} stroke="var(--muted)"/><Tooltip/><Area type="monotone" dataKey="accuracy" stroke="#4ade80" fill="#2e7d52" fillOpacity={.2}/></AreaChart></ResponsiveContainer></div></div>}
    <div className="progress-panel"><h2>Questions per day · last 30 days</h2><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={days}><CartesianGrid stroke="var(--line)" strokeDasharray="3 3"/><XAxis dataKey="label" hide/><YAxis allowDecimals={false} stroke="var(--muted)"/><Tooltip/><Bar dataKey="count" fill="#2e7d52" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div><p className="small">Daily questions include your practice and review answers.</p></div>
    <div className="progress-panel"><h2>Coverage</h2><p className="small">{progress?.coverage?.attempted||0} of {progress?.coverage?.total||0} eligible questions attempted</p><div className="coverage-list">{coverage.map((t:any)=><div key={t.topic} className="coverage-row"><div className="row"><strong>{t.topic}</strong><span>{t.attempted} / {t.total}</span></div><div className="topic-meter"><span style={{width:`${t.total?Math.min(100,t.attempted/t.total*100):0}%`}}/></div></div>)}</div></div>
    <div className="progress-panel"><h2>Daily goal history</h2><div className="streak-history" aria-label="Daily goal completion, last 30 days">{days.map(day=><span key={day.key} className={day.goalMet?'met':''} title={`${day.label}: ${day.goalMet?'goal met':'goal not met'}`} aria-label={`${day.label}: ${day.goalMet?'goal met':'goal not met'}`}/>)}</div><p className="small progress-streak">Amber marks a day when you met your daily goal.</p></div>
    </>}
  </section>;
}
