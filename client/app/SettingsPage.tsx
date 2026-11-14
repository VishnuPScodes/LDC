'use client';
import {useEffect,useState} from 'react';
import {featureFlags} from './feature-flags';

type Props={language:'en'|'ml';todoCount:number;todoMin:number;todoMax:number;onSetTodoCount:(count:number)=>void;dailyGoal:number;onSetDailyGoal:(goal:number)=>void;knowledgeGoal:number;onSetKnowledgeGoal:(goal:number)=>void;targetExamDate:string;onSetExamDate:(value:string)=>void;dark:boolean;onSetDark:(dark:boolean)=>void;onSetLanguage:(language:'en'|'ml')=>void;onDone:()=>void};

function Stepper({value,min,max,step=1,label,onChange}:{value:number;min:number;max:number;step?:number;label:string;onChange:(value:number)=>void}){
 return <div className="settings-stepper" role="group" aria-label={label}>
  <button type="button" aria-label={`Decrease ${label}`} disabled={value<=min} onClick={()=>onChange(Math.max(min,value-step))}>−</button>
  <output aria-live="polite">{value}</output>
  <button type="button" aria-label={`Increase ${label}`} disabled={value>=max} onClick={()=>onChange(Math.min(max,value+step))}>+</button>
 </div>;
}

export default function SettingsPage(p:Props){
 const ml=p.language==='ml';
 // Local copies so the steppers feel instant; each change is saved straight away by the parent.
 const [todoCount,setTodoCount]=useState(p.todoCount),[dailyGoal,setDailyGoal]=useState(p.dailyGoal),[knowledgeGoal,setKnowledgeGoal]=useState(p.knowledgeGoal);
 useEffect(()=>setTodoCount(p.todoCount),[p.todoCount]);
 useEffect(()=>setDailyGoal(p.dailyGoal),[p.dailyGoal]);
 useEffect(()=>setKnowledgeGoal(p.knowledgeGoal),[p.knowledgeGoal]);
 return <section className="settings-page">
  <div className="eyebrow">{ml?'ക്രമീകരണങ്ങൾ':'SETTINGS'}</div>
  <h1 className="section-title">{ml?'പഠന ക്രമീകരണങ്ങൾ':'Study settings'}</h1>

  <div className="card settings-section">
   <h2>{ml?'ദിവസേന':'Daily plan'}</h2>
   <div className="settings-row">
    <div><strong>{ml?'ദിവസേന ചെയ്യേണ്ടവ':'Daily to-dos'}</strong><small>{ml?'Today പേജിൽ കാണിക്കുന്ന ചെറിയ ലക്ഷ്യങ്ങളുടെ എണ്ണം. ഇന്നത്തെ ലിസ്റ്റിലേക്ക് ഉടൻ ചേർക്കും.':'How many small goals appear on Today. Changes apply to today’s list straight away.'}</small></div>
    <Stepper value={todoCount} min={p.todoMin} max={p.todoMax} label={ml?'ചെയ്യേണ്ടവ':'daily to-dos'} onChange={value=>{setTodoCount(value);p.onSetTodoCount(value)}}/>
   </div>
   <div className="settings-row">
    <div><strong>{ml?'ദിവസേന ചോദ്യ ലക്ഷ്യം':'Daily question goal'}</strong><small>{ml?'ഓരോ ദിവസവും ഉത്തരം നൽകേണ്ട ചോദ്യങ്ങൾ':'Questions to answer each day; meeting it keeps your streak.'}</small></div>
    <Stepper value={dailyGoal} min={5} max={100} step={5} label={ml?'ചോദ്യ ലക്ഷ്യം':'daily question goal'} onChange={value=>{setDailyGoal(value);p.onSetDailyGoal(value)}}/>
   </div>
   <div className="settings-row">
    <div><strong>{ml?'അറിവ് വായനാ ലക്ഷ്യം':'Reading goal'}</strong><small>{ml?'ദിവസവും വായിക്കേണ്ട അറിവ് കാർഡുകൾ':'Knowledge cards to read each day (+10 XP).'}</small></div>
    <Stepper value={knowledgeGoal} min={5} max={100} step={5} label={ml?'വായനാ ലക്ഷ്യം':'reading goal'} onChange={value=>{setKnowledgeGoal(value);p.onSetKnowledgeGoal(value)}}/>
   </div>
  </div>

  {featureFlags.examCountdown&&<div className="card settings-section">
   <h2>{ml?'പരീക്ഷ':'Exam'}</h2>
   <div className="settings-row">
    <label htmlFor="settings-exam-date"><strong>{ml?'ലക്ഷ്യമിടുന്ന പരീക്ഷാ തീയതി':'Target exam date'}</strong><small>{ml?'Today പേജിൽ കൗണ്ട്ഡൗൺ കാണിക്കും':'Shows a countdown on Today.'}</small></label>
    <div className="settings-date"><input id="settings-exam-date" type="date" value={p.targetExamDate||''} onChange={e=>p.onSetExamDate(e.target.value)}/>{p.targetExamDate&&<button type="button" className="text-button" onClick={()=>p.onSetExamDate('')}>{ml?'നീക്കുക':'Remove'}</button>}</div>
   </div>
  </div>}

  <div className="card settings-section">
   <h2>{ml?'രൂപം':'Appearance'}</h2>
   <div className="settings-row">
    <div><strong>{ml?'ഭാഷ':'Language'}</strong></div>
    <div className="settings-segment" role="group" aria-label={ml?'ഭാഷ':'Language'}><button type="button" aria-pressed={!ml} onClick={()=>p.onSetLanguage('en')}>English</button><button type="button" aria-pressed={ml} onClick={()=>p.onSetLanguage('ml')}>മലയാളം</button></div>
   </div>
   <div className="settings-row">
    <div><strong>{ml?'ഡാർക്ക് തീം':'Dark theme'}</strong></div>
    <label className="settings-switch"><input type="checkbox" checked={p.dark} onChange={e=>p.onSetDark(e.target.checked)}/><span aria-hidden="true"/><span className="sr-only">{ml?'ഡാർക്ക് തീം':'Dark theme'}</span></label>
   </div>
  </div>

  <button type="button" className="button settings-done" onClick={p.onDone}>{ml?'Today-ലേക്ക് മടങ്ങുക':'Back to Today'} →</button>
 </section>;
}
