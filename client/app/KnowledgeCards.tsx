'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {knowledgeGroups} from './knowledge-data';

// Reading is unlimited: the learner keeps a cursor through every card (wrapping at the end) and a per-day count
// that feeds the daily reading goal on the Today page.
type Saved={cursor:number;day:string;read:number;known:number};
const STORAGE='ldc-knowledge-v3',GUEST_GOAL='ldc-knowledge-goal',SWIPE_INTRO='ldc-knowledge-swipe-intro-seen:v1';
const dayKey=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const allCards=knowledgeGroups.flat();
const todaysStart=()=>{const d=new Date(),group=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2024,0,1))/86400000)%knowledgeGroups.length;return knowledgeGroups.slice(0,group).reduce((sum,cards)=>sum+cards.length,0)};
const readSaved=():Saved=>{const today=dayKey();try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null') as Saved|null;if(saved&&Number.isInteger(saved.cursor))return saved.day===today?saved:{cursor:saved.cursor,day:today,read:0,known:0}}catch{}return {cursor:todaysStart(),day:today,read:0,known:0}};

export default function KnowledgeCards({onExit}:{onExit:()=>void;onPractice?:()=>void}){
 const reduce=useReducedMotion();
 const [state,setState]=useState<Saved|null>(null),[direction,setDirection]=useState(1),[showSwipeIntro,setShowSwipeIntro]=useState(false);
 const [goal,setGoal]=useState(10),[goalMet,setGoalMet]=useState(false),[signedIn,setSignedIn]=useState(false),[toast,setToast]=useState<string|null>(null);
 const reportTimer=useRef<number|undefined>(undefined);

 useEffect(()=>{
  const saved=readSaved();setState(saved);
  try{setShowSwipeIntro(localStorage.getItem(SWIPE_INTRO)!=='1');const guestGoal=Number(localStorage.getItem(GUEST_GOAL));if(guestGoal>=5)setGoal(guestGoal)}catch{}
  // Signed-in learners: today's goal and count come from the server, so progress follows them across devices.
  let alive=true;
  void fetch('/api/knowledge/today',{credentials:'include'}).then(r=>r.ok?r.json():null).then(data=>{if(!alive||!data)return;setSignedIn(true);setGoal(data.goal||10);setGoalMet(!!data.goalMet);setState(current=>current&&data.read>current.read?{...current,read:data.read}:current)}).catch(()=>{});
  return()=>{alive=false};
 },[]);
 useEffect(()=>{if(state)try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch{}},[state]);
 useEffect(()=>{if(!toast)return;const id=window.setTimeout(()=>setToast(null),3800);return()=>window.clearTimeout(id)},[toast]);

 // Report today's count (debounced). The server awards XP once, when the count first reaches the goal.
 useEffect(()=>{
  if(!state||!state.read)return;
  if(!signedIn){if(!goalMet&&state.read>=goal){setGoalMet(true);setToast('ഇന്നത്തെ ലക്ഷ്യം പൂർത്തിയായി! സൈൻ ഇൻ ചെയ്താൽ XP ലഭിക്കും.')}return}
  window.clearTimeout(reportTimer.current);
  reportTimer.current=window.setTimeout(()=>{void fetch('/api/knowledge/read',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({read:state.read})}).then(r=>r.ok?r.json():null).then(data=>{if(!data)return;setGoalMet(!!data.goalMet);if(data.justMet)setToast(`ഇന്നത്തെ ലക്ഷ്യം പൂർത്തിയായി! +${data.xp} XP`)}).catch(()=>{})},600);
  return()=>window.clearTimeout(reportTimer.current);
 },[state?.read,signedIn,goal,goalMet]);

 const advance=useCallback((mark:'known'|'review')=>{
  setShowSwipeIntro(show=>{if(show)try{localStorage.setItem(SWIPE_INTRO,'1')}catch{}return false});
  setDirection(mark==='known'?1:-1);
  setState(current=>current&&{...current,cursor:(current.cursor+1)%allCards.length,read:current.read+1,known:current.known+(mark==='known'?1:0)});
 },[]);
 useEffect(()=>{const keydown=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')advance('known');if(e.key==='ArrowLeft')advance('review')};window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown)},[advance]);

 const card=useMemo(()=>state?allCards[state.cursor%allCards.length]:null,[state?.cursor]);
 if(!state||!card)return <section className="knowledge-page palm-leaf-theme" aria-busy="true"/>;
 const progress=Math.min(100,state.read/goal*100);
 return <section className="knowledge-page palm-leaf-theme">
  <div className="knowledge-top"><button type="button" className="knowledge-back" onClick={onExit}><span aria-hidden="true">←</span><span>തിരികെ</span></button><div className="knowledge-title"><div className="eyebrow">{goalMet?'ലക്ഷ്യം പൂർത്തിയായി ✓':`ഇന്നത്തെ ലക്ഷ്യം: ${goal} അറിവുകൾ`}</div><h1 className="section-title">അറിവ്</h1></div><div className="knowledge-date">{new Intl.DateTimeFormat('ml-IN',{day:'numeric',month:'short'}).format(new Date())}</div></div>
  <div className={`knowledge-progress${goalMet?' is-met':''}`} aria-label={`ഇന്ന് ${state.read} അറിവുകൾ വായിച്ചു · ലക്ഷ്യം ${goal}`}><div className="knowledge-progress-track"><span style={{width:`${progress}%`}}/></div><strong>{goalMet&&<span aria-hidden="true">✓ </span>}{state.read} <span>/ {goal}</span></strong></div>
  <div className="knowledge-stage" aria-live="polite">
   <div className="knowledge-card knowledge-card-under" aria-hidden="true"><span className="leaf-thread"/><span className="leaf-hole is-start"/><span className="leaf-hole is-end"/></div>
   <AnimatePresence mode="popLayout" initial={false}>
    <motion.article key={state.cursor} className="knowledge-card" drag="x" dragConstraints={{left:0,right:0}} dragElastic={.85} onDrag={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.toggle('swipe-known',info.offset.x>45);target?.classList.toggle('swipe-review',info.offset.x< -45)}} onDragEnd={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.remove('swipe-known','swipe-review');if(info.offset.x>70||info.velocity.x>450)advance('known');else if(info.offset.x< -70||info.velocity.x< -450)advance('review')}} initial={reduce?{opacity:0}:{x:-direction*42,opacity:0,rotate:-direction*3}} animate={{x:0,opacity:1,rotate:0}} exit={reduce?{opacity:0}:{x:direction*420,opacity:0,rotate:direction*13}} transition={{type:'spring',stiffness:280,damping:25}} whileDrag={{scale:1.025,rotate:0,cursor:'grabbing'}}>
     <span className="leaf-thread" aria-hidden="true"/><span className="leaf-hole is-start" aria-hidden="true"/><span className="leaf-hole is-end" aria-hidden="true"/><div className="knowledge-card-head"><span className="knowledge-topic"><i/> {card.topic}</span><span className="knowledge-card-number">{state.cursor+1} / {allCards.length}</span></div>
     <div className="knowledge-card-content"><h2>{card.title}</h2><p>{card.body}</p></div>
     <div className="knowledge-card-footer"><a href={card.url} target="_blank" rel="noreferrer">ഉറവിടം <span aria-hidden="true">↗</span></a>{showSwipeIntro&&<span className="knowledge-swipe-hint"><span aria-hidden="true">←</span> ഇടത്തേക്ക് വീണ്ടും പഠിക്കാം · വലത്തേക്ക് അറിയാം <span aria-hidden="true">→</span></span>}</div>
     <span className="knowledge-stamp stamp-known" aria-hidden="true">അറിയാം</span><span className="knowledge-stamp stamp-review" aria-hidden="true">വീണ്ടും പഠിക്കാം</span>
    </motion.article>
   </AnimatePresence>
  </div>
  <div className="knowledge-nav" aria-label="അടുത്ത അറിവ്"><button type="button" onClick={()=>advance('review')}><span aria-hidden="true">←</span> വീണ്ടും പഠിക്കാം</button><button type="button" onClick={()=>advance('known')}>അറിയാം <span aria-hidden="true">→</span></button></div>
  <AnimatePresence>{toast&&<motion.div className="knowledge-toast" role="status" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:16}}>{toast}</motion.div>}</AnimatePresence>
 </section>
}
