'use client';
import {useEffect,useRef,useState} from 'react';
import {featureFlags} from './feature-flags';

type Props={language?:'en'|'ml';dailyGoal:number;targetExamDate?:string;onSetGoal:(n:number)=>void;onSetExamDate:(date:string)=>void;onWarmUp:()=>void;onClose:()=>void};

// Three short steps for a brand-new learner: exam date, daily goal, a 5-question warm-up.
export default function Onboarding({language='en',dailyGoal,targetExamDate='',onSetGoal,onSetExamDate,onWarmUp,onClose}:Props){
 const ml=language==='ml';
 const steps=featureFlags.examCountdown?['date','goal','warmup'] as const:['goal','warmup'] as const;
 const [step,setStep]=useState(0),[date,setDate]=useState(targetExamDate),[goal,setGoal]=useState(dailyGoal||20);
 const dialog=useRef<HTMLDivElement>(null);
 const current=steps[step];
 useEffect(()=>{dialog.current?.querySelector<HTMLElement>('input,button.onboarding-primary')?.focus()},[step]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
 const next=()=>{if(current==='date'&&date)onSetExamDate(date);if(current==='goal'&&goal!==dailyGoal)onSetGoal(goal);setStep(value=>value+1)};
 const today=new Date().toISOString().slice(0,10);
 return <div className="onboarding-backdrop">
  <div className="onboarding" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" ref={dialog}>
   <div className="onboarding-progress" aria-hidden="true">{steps.map((_,i)=><span key={i} className={i<=step?'is-done':''}/>)}</div>
   <p className="onboarding-step">{ml?`ഘട്ടം ${step+1} / ${steps.length}`:`Step ${step+1} of ${steps.length}`}</p>
   {current==='date'&&<>
    <h2 id="onboarding-title">{ml?'നിങ്ങളുടെ പരീക്ഷ എപ്പോഴാണ്?':'When is your exam?'}</h2>
    <p>{ml?'പരീക്ഷയ്ക്ക് എത്ര ദിവസം ബാക്കിയുണ്ടെന്ന് ഞങ്ങൾ കാണിക്കും.':'We’ll count down the days and suggest mock exams as it gets close.'}</p>
    <label className="field">{ml?'പരീക്ഷാ തീയതി':'Exam date'}<input type="date" min={today} value={date} onChange={e=>setDate(e.target.value)}/></label>
    <div className="onboarding-actions"><button type="button" className="ghost" onClick={()=>{setDate('');setStep(1)}}>{ml?'ഇപ്പോൾ അറിയില്ല':'I don’t know yet'}</button><button type="button" className="button onboarding-primary" onClick={next} disabled={!date}>{ml?'തുടരുക':'Continue'} →</button></div>
   </>}
   {current==='goal'&&<>
    <h2 id="onboarding-title">{ml?'ദിവസവും എത്ര ചോദ്യങ്ങൾ?':'How many questions a day?'}</h2>
    <p>{ml?'ചെറിയ ലക്ഷ്യം ദിവസവും തുടരാൻ എളുപ്പമാണ്. പിന്നീട് മാറ്റാം.':'A small daily goal is easier to keep. You can change it later.'}</p>
    <div className="onboarding-goals" role="radiogroup" aria-label={ml?'ദിവസ ലക്ഷ്യം':'Daily goal'}>{[[10,ml?'ലഘു':'Light'],[20,ml?'സ്ഥിരം':'Steady'],[30,ml?'ഗൗരവം':'Serious'],[50,ml?'തീവ്രം':'Intense']].map(([n,label])=><button type="button" role="radio" aria-checked={goal===n} key={n} className={goal===n?'is-selected':''} onClick={()=>setGoal(Number(n))}><strong>{n}</strong><small>{label}</small></button>)}</div>
    <div className="onboarding-actions"><span/><button type="button" className="button onboarding-primary" onClick={next}>{ml?'തുടരുക':'Continue'} →</button></div>
   </>}
   {current==='warmup'&&<>
    <h2 id="onboarding-title">{ml?'5 ചോദ്യങ്ങളിൽ തുടങ്ങാം':'Start with a 5-question warm-up'}</h2>
    <p>{ml?'മുൻവർഷ ചോദ്യങ്ങൾ, ഓരോന്നിനും ഉടൻ ഉത്തരം. രണ്ട് മിനിറ്റ് മതി.':'Real previous-year questions with instant answers. Takes about two minutes.'}</p>
    <div className="onboarding-actions"><button type="button" className="ghost" onClick={onClose}>{ml?'പിന്നീട്':'Maybe later'}</button><button type="button" className="button onboarding-primary" onClick={()=>{onClose();onWarmUp()}}>{ml?'വാം-അപ്പ് തുടങ്ങുക':'Start warm-up'} →</button></div>
   </>}
  </div>
 </div>;
}
