'use client';
import {useCallback,useEffect,useState} from 'react';
import PageSkeleton from './PageSkeleton';
import PublicHeader from './PublicHeader';
import PaperSettings from './PaperSettings';
import {useAutoAdvance} from './useAutoAdvance';

type Question={_id:string;paperCode?:string;examDate?:string;questionNumber:number;text:string;options:{key:string;text:string}[];correctOption:string;explanation?:string;topic:string};
type Daily={date:string;number:number;questions:Question[]};
type DayRecord={answers:boolean[];score:number;total?:number;number?:number};
type Store=Record<string,DayRecord>;

const STORAGE='ldc-daily-v1',LAUNCH='2026-01-01',DAY=86400000;
const ml=(text?:string)=>text&&/[ഀ-ൿ]/u.test(text)?'ml':'en-IN';
// Mirrors server/src/daily-challenge.ts (kept separate so the client bundle never pulls in Mongoose).
const istDateKey=(now:Date)=>new Date(now.getTime()+330*60000).toISOString().slice(0,10);
const dailyNumber=(key:string)=>Math.round((Date.parse(`${key}T00:00:00Z`)-Date.parse(`${LAUNCH}T00:00:00Z`))/DAY)+1;
const shiftKey=(key:string,days:number)=>new Date(Date.parse(`${key}T00:00:00Z`)+days*DAY).toISOString().slice(0,10);
const isComplete=(record?:DayRecord)=>!!record&&record.answers.length>=(record.total||10);

function readStore():Store{try{const value=JSON.parse(localStorage.getItem(STORAGE)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{}}catch{return{}}}
function writeRecord(key:string,record:DayRecord){try{const store=readStore();store[key]=record;localStorage.setItem(STORAGE,JSON.stringify(store))}catch{}}
function dailyStreak(store:Store,today:string){let key=isComplete(store[today])?today:shiftKey(today,-1),streak=0;while(isComplete(store[key])){streak++;key=shiftKey(key,-1)}return streak}

export default function DailyChallenge(){
 const [today,setToday]=useState(''),[daily,setDaily]=useState<Daily|null>(null),[record,setRecord]=useState<DayRecord|null>(null),[phase,setPhase]=useState<'loading'|'error'|'intro'|'quiz'|'results'>('loading'),[error,setError]=useState(''),[index,setIndex]=useState(0),[selected,setSelected]=useState(''),[streak,setStreak]=useState(0),[copied,setCopied]=useState('');

 const load=useCallback(async()=>{
  setPhase('loading');setError('');
  const localKey=istDateKey(new Date()),existing=readStore()[localKey];
  if(isComplete(existing)){setToday(localKey);setRecord(existing);setStreak(dailyStreak(readStore(),localKey));setPhase('results');return}
  try{
   const response=await fetch('/api/public/daily',{cache:'no-store'}),data=await response.json().catch(()=>({}));
   if(!response.ok||!Array.isArray(data.questions)||!data.questions.length)throw new Error(data.error||'Could not load today’s challenge.');
   const saved=readStore()[data.date];
   setToday(data.date);setDaily(data);
   if(isComplete(saved)){setRecord(saved);setStreak(dailyStreak(readStore(),data.date));setPhase('results');return}
   setRecord(saved?.answers?.length?saved:null);setIndex(saved?.answers?.length||0);setPhase('intro');
  }catch(reason:any){setError(reason?.message||'Could not load today’s challenge.');setPhase('error')}
 },[]);
 useEffect(()=>{void load()},[load]);

 const questions=daily?.questions||[],current=questions[index],answers=record?.answers||[],total=record?.total||questions.length||10,number=daily?.number||record?.number||(today?dailyNumber(today):0);

 const choose=(key:string)=>{
  if(!current||selected)return;
  const next=[...answers.slice(0,index),key===current.correctOption],updated:DayRecord={answers:next,score:next.filter(Boolean).length,total:questions.length,number:daily?.number};
  setSelected(key);setRecord(updated);writeRecord(today,updated);
 };
 const advance=()=>{
  if(index+1>=questions.length){setStreak(dailyStreak(readStore(),today));setPhase('results');return}
  setIndex(index+1);setSelected('');window.scrollTo({top:0});
 };
 const secondsLeft=useAutoAdvance(phase==='quiz'&&!!selected,advance);

 const grid=answers.map(correct=>correct?'🟩':'🟥').join('');
 const shareText=()=>`LDC Daily #${number} · ${record?.score||0}/${total} ✅\n${grid} · 🔥 ${streak}-day streak\n${window.location.origin}/daily`;
 const copy=async()=>{
  const text=shareText();
  try{await navigator.clipboard.writeText(text);setCopied('Copied!');}
  catch{try{const area=document.createElement('textarea');area.value=text;area.setAttribute('readonly','');area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();const ok=document.execCommand('copy');area.remove();setCopied(ok?'Copied!':'Copy failed — select the text manually.')}catch{setCopied('Copy failed — select the text manually.')}}
  window.setTimeout(()=>setCopied(''),2500);
 };
 const share=()=>{window.open(`https://wa.me/?text=${encodeURIComponent(shareText())}`,'_blank','noopener,noreferrer')};

 if(phase==='quiz'&&current){
  const isAnswered=!!selected,wasCorrect=selected===current.correctOption;
  return <main className="landing-shell public-site"><div className="shell public-guest-shell"><section className="guest-question-view paper-screen daily-quiz">
   <header className="quiz-topbar guest-practice-header"><a className="icon-button quit-button" href="/" aria-label="Leave the daily challenge">×</a><div className="quiz-progress-wrap"><div className="quiz-count"><strong>{index+1}</strong><span>/ {questions.length}</span></div><div className="quiz-progress" role="progressbar" aria-label="Challenge progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index+1}><span style={{width:`${(index+1)/questions.length*100}%`}}/></div></div><PaperSettings/></header>
   <article className="public-question guest-question">
    <div className="booklet-heading"><strong>LDC Daily #{number}</strong></div>
    <p className="quiz-topic">{current.topic}{current.paperCode?` · ${current.paperCode}`:''}</p>
    <h1 lang={ml(current.text)}>{current.text}</h1>
    <div className="quiz-options guest-options" role="group" aria-label="Answer choices">{current.options.map((option,position)=>{const correct=isAnswered&&option.key===current.correctOption,wrong=isAnswered&&option.key===selected&&!wasCorrect,dim=isAnswered&&!correct&&!wrong;return <button type="button" key={option.key} disabled={isAnswered} aria-pressed={selected===option.key} aria-label={`(${option.key}) ${option.text}${correct?', correct answer':wrong?', your answer, wrong':''}`} className={`quiz-option${correct?' is-correct answer-correct-option':''}${wrong?' is-wrong answer-wrong-option':''}${dim?' is-dimmed':''}`} onClick={()=>choose(option.key)}><span className="option-badge">({option.key})</span><span className="option-copy" lang={ml(option.text)}>{option.text}</span><span className="option-mark" aria-hidden="true">{correct?'✓':wrong?'✗':!isAnswered?<span className="option-shortcut">{position+1}</span>:null}</span></button>})}</div>
    {isAnswered&&<div className={`feedback-verdict ${wasCorrect?'verdict-correct':'verdict-wrong'}`} role="status" aria-live="polite"><strong>{wasCorrect?'✓ Correct':`✗ Wrong — answer is ${current.correctOption}`}</strong>{current.explanation&&<div className="paper-explanation"><span>Explanation</span><p lang={ml(current.explanation)}>{current.explanation}</p></div>}</div>}
    <div className="guest-question-actions">{isAnswered&&<button className="button" onClick={advance}>{index+1===questions.length?'See results':'Next →'}{secondsLeft!==null&&<span className="auto-advance-count" aria-hidden="true">{secondsLeft}</span>}</button>}</div>
   </article>
  </section></div></main>;
 }

 return <main className="landing-shell public-site"><div className="shell public-guest-shell"><PublicHeader/>
  {phase==='loading'&&<PageSkeleton variant="panel" rows={6} label="Loading today’s challenge…"/>}
  {phase==='error'&&<section className="public-page-heading daily-intro"><p className="eyebrow">LDC DAILY CHALLENGE</p><h1>Couldn’t load today’s challenge</h1><p className="error" role="alert">{error}</p><div className="public-page-actions"><button className="button" onClick={()=>void load()}>Retry</button><a className="secondary-button" href="/practice">Practise instead</a></div></section>}
  {phase==='intro'&&<section className="public-page-heading daily-intro"><p className="eyebrow">LDC DAILY CHALLENGE</p><h1>LDC Daily #{number}</h1><p className="daily-date">{new Date(`${today}T00:00:00Z`).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})}</p><p>{questions.length} previous-year Kerala PSC LDC questions — the same set for everyone today. Answer each one, see the right answer instantly, then share your score.</p><p lang="ml">ഇന്നത്തെ {questions.length} ചോദ്യങ്ങൾ എല്ലാവർക്കും ഒരേത്. ഒരിക്കൽ മാത്രം ശ്രമിക്കാം.</p>{index>0&&<p className="small">You’ve answered {index} of {questions.length}. Pick up where you left off.</p>}<div className="public-page-actions"><button className="button" onClick={()=>{setSelected('');setPhase('quiz')}}>{index>0?'Continue →':'Start →'}</button></div></section>}
  {phase==='results'&&record&&<section className="daily-results" aria-labelledby="daily-result-title">
   <div className="daily-card">
    <p className="eyebrow">LDC DAILY #{number}</p>
    <h1 id="daily-result-title" className="daily-score"><strong>{record.score}</strong><span>/ {total}</span></h1>
    <p className="daily-grid" role="img" aria-label={`${record.score} correct, ${answers.length-record.score} wrong`}>{answers.map((correct,position)=><span key={position} className={correct?'is-correct':'is-wrong'}>{correct?'🟩':'🟥'}</span>)}</p>
    <p className="daily-streak">🔥 <strong>{streak}</strong>-day streak</p>
    <div className="daily-share">
     <button className="button daily-whatsapp" onClick={share}>Share on WhatsApp</button>
     <button className="secondary-button" onClick={()=>void copy()}>Copy result</button>
    </div>
    <p className="small daily-copied" role="status" aria-live="polite">{copied}</p>
   </div>
   <p className="daily-next">Come back tomorrow for Daily #{number+1}.</p>
   <div className="public-page-actions daily-actions"><a className="button" href="/practice">Practise more →</a></div>
  </section>}
 </div></main>;
}
