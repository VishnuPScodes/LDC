'use client';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';

// Cards live in small files under /knowledge (built by scripts/build-knowledge.mjs): an index of the reading
// rotation — blocks of about ten same-topic cards — and one file per block, fetched only when needed.
// Reading is unlimited: the learner moves through the rotation (wrapping at the end) with a per-day count that
// feeds the daily reading goal on the Today page. Each new day starts at the next block, so it brings a new topic.
type Card={id:string;topic:string;title:string;body:string;memo?:string;source:string;url:string};
type Block={id:string;topic:string;file:string;cards:string[]};
type Rotation={total:number;blocks:Block[];order:string[];blockAt:number[];starts:number[]};
type Saved={card:string;day:string;read:number;known:number};
type Place={pos:number;day:string;read:number;known:number};
const STORAGE='ldc-knowledge-v4',LEGACY_STORAGE='ldc-knowledge-v3',GUEST_GOAL='ldc-knowledge-goal',SWIPE_INTRO='ldc-knowledge-swipe-intro-seen:v1';
const dayKey=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
const toRotation=(index:{total:number;blocks:Block[]}):Rotation=>{const order:string[]=[],blockAt:number[]=[],starts:number[]=[];index.blocks.forEach((block,b)=>{starts.push(order.length);for(const id of block.cards){order.push(id);blockAt.push(b)}});return {total:order.length,blocks:index.blocks,order,blockAt,starts}};
const readSaved=():Saved|null=>{
 try{
  const saved=JSON.parse(localStorage.getItem(STORAGE)||'null') as Saved|null;if(saved&&typeof saved.card==='string')return saved;
  // Version 3 saved a position in the old 602-card list, whose order matches the card ids k0001…k0602.
  const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE)||'null') as {cursor:number;day:string;read:number;known:number}|null;
  if(legacy&&Number.isInteger(legacy.cursor))return {card:`k${String(legacy.cursor%602+1).padStart(4,'0')}`,day:legacy.day,read:legacy.read||0,known:legacy.known||0};
 }catch{}
 return null;
};
// Where to start: today's saved card; on a new day, the start of the next block (or this block if the learner
// stopped exactly at its start); for a first visit, a block chosen by the date.
const startPlace=(rotation:Rotation,saved:Saved|null):Place=>{
 const today=dayKey(),pos=saved?rotation.order.indexOf(saved.card):-1;
 if(saved&&pos>=0&&saved.day===today)return {pos,day:today,read:saved.read,known:saved.known};
 if(pos>=0){const b=rotation.blockAt[pos];return {pos:rotation.starts[b]===pos?pos:rotation.starts[(b+1)%rotation.blocks.length],day:today,read:0,known:0}}
 const d=new Date(),days=Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2024,0,1))/86400000);
 return {pos:rotation.starts[days%rotation.blocks.length],day:today,read:0,known:0};
};

export default function KnowledgeCards({onExit}:{onExit:()=>void;onPractice?:()=>void}){
 const reduce=useReducedMotion();
 const [state,setState]=useState<Place|null>(null),[rotation,setRotation]=useState<Rotation|null>(null),[blockCards,setBlockCards]=useState<Record<string,Card[]>>({}),[loadError,setLoadError]=useState(false),[attempt,setAttempt]=useState(0),[direction,setDirection]=useState(1),[showSwipeIntro,setShowSwipeIntro]=useState(false);
 const [goal,setGoal]=useState(10),[goalMet,setGoalMet]=useState(false),[signedIn,setSignedIn]=useState(false),[toast,setToast]=useState<string|null>(null);
 const reportTimer=useRef<number|undefined>(undefined),serverRead=useRef(0),requested=useRef(new Set<string>());

 useEffect(()=>{
  try{setShowSwipeIntro(localStorage.getItem(SWIPE_INTRO)!=='1');const guestGoal=Number(localStorage.getItem(GUEST_GOAL));if(guestGoal>=5)setGoal(guestGoal)}catch{}
  // Signed-in learners: today's goal and count come from the server, so progress follows them across devices.
  let alive=true;
  void fetch('/api/knowledge/today',{credentials:'include'}).then(r=>r.ok?r.json():null).then(data=>{if(!alive||!data)return;setSignedIn(true);setGoal(data.goal||10);setGoalMet(!!data.goalMet);serverRead.current=data.read||0;setState(current=>current&&data.read>current.read?{...current,read:data.read}:current)}).catch(()=>{});
  return()=>{alive=false};
 },[]);
 useEffect(()=>{
  let alive=true;setLoadError(false);
  void fetch('/knowledge/index.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then(index=>{if(!alive)return;const next=toRotation(index);setRotation(next);setState(current=>{if(current)return {...current,pos:Math.min(current.pos,next.total-1)};const place=startPlace(next,readSaved());return {...place,read:Math.max(place.read,serverRead.current)}})}).catch(()=>{if(alive)setLoadError(true)});
  return()=>{alive=false};
 },[attempt]);
 // Load the current block and the next one, so the next swipe never waits.
 useEffect(()=>{
  if(!rotation||!state)return;
  const b=rotation.blockAt[state.pos];
  for(const block of [rotation.blocks[b],rotation.blocks[(b+1)%rotation.blocks.length]]){
   if(blockCards[block.file]||requested.current.has(block.file))continue;
   requested.current.add(block.file);
   void fetch(`/knowledge/${block.file}`).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()}).then((cards:Card[])=>setBlockCards(loaded=>({...loaded,[block.file]:cards}))).catch(()=>{requested.current.delete(block.file);setLoadError(true)});
  }
 },[rotation,state?.pos,blockCards,attempt]);
 useEffect(()=>{if(state&&rotation)try{localStorage.setItem(STORAGE,JSON.stringify({card:rotation.order[state.pos],day:state.day,read:state.read,known:state.known}));localStorage.removeItem(LEGACY_STORAGE)}catch{}},[state,rotation]);
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
  setState(current=>!current||!rotation?current:{...current,pos:(current.pos+1)%rotation.total,read:current.read+1,known:current.known+(mark==='known'?1:0)});
 },[rotation]);
 useEffect(()=>{const keydown=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')advance('known');if(e.key==='ArrowLeft')advance('review')};window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown)},[advance]);

 const card=useMemo(()=>{if(!state||!rotation)return null;const b=rotation.blockAt[state.pos];return blockCards[rotation.blocks[b].file]?.[state.pos-rotation.starts[b]]||null},[state?.pos,rotation,blockCards]);
 if(loadError&&!card)return <section className="knowledge-page palm-leaf-theme"><div className="knowledge-top"><button type="button" className="knowledge-back" onClick={onExit}><span aria-hidden="true">←</span><span>തിരികെ</span></button></div><div className="knowledge-load-error" role="alert"><p>അറിവുകൾ ലോഡ് ചെയ്യാനായില്ല. ഇന്റർനെറ്റ് കണക്ഷൻ പരിശോധിക്കുക.</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>വീണ്ടും ശ്രമിക്കുക</button></div></section>;
 if(!state||!rotation||!card)return <section className="knowledge-page palm-leaf-theme" aria-busy="true"/>;
 const progress=Math.min(100,state.read/goal*100);
 return <section className="knowledge-page palm-leaf-theme">
  <div className="knowledge-top"><button type="button" className="knowledge-back" onClick={onExit}><span aria-hidden="true">←</span><span>തിരികെ</span></button><div className="knowledge-title"><div className="eyebrow">{goalMet?'ലക്ഷ്യം പൂർത്തിയായി ✓':`ഇന്നത്തെ ലക്ഷ്യം: ${goal} അറിവുകൾ`}</div><h1 className="section-title">അറിവ്</h1></div><div className="knowledge-date">{new Intl.DateTimeFormat('ml-IN',{day:'numeric',month:'short'}).format(new Date())}</div></div>
  <div className={`knowledge-progress${goalMet?' is-met':''}`} aria-label={`ഇന്ന് ${state.read} അറിവുകൾ വായിച്ചു · ലക്ഷ്യം ${goal}`}><div className="knowledge-progress-track"><span style={{width:`${progress}%`}}/></div><strong>{goalMet&&<span aria-hidden="true">✓ </span>}{state.read} <span>/ {goal}</span></strong></div>
  <div className="knowledge-stage" aria-live="polite">
   <div className="knowledge-card knowledge-card-under" aria-hidden="true"><span className="leaf-thread"/><span className="leaf-hole is-start"/><span className="leaf-hole is-end"/></div>
   <AnimatePresence mode="popLayout" initial={false}>
    <motion.article key={state.pos} className="knowledge-card" drag="x" dragConstraints={{left:0,right:0}} dragElastic={.85} onDrag={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.toggle('swipe-known',info.offset.x>45);target?.classList.toggle('swipe-review',info.offset.x< -45)}} onDragEnd={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.remove('swipe-known','swipe-review');if(info.offset.x>70||info.velocity.x>450)advance('known');else if(info.offset.x< -70||info.velocity.x< -450)advance('review')}} initial={reduce?{opacity:0}:{x:-direction*42,opacity:0,rotate:-direction*3}} animate={{x:0,opacity:1,rotate:0}} exit={reduce?{opacity:0}:{x:direction*420,opacity:0,rotate:direction*13}} transition={{type:'spring',stiffness:280,damping:25}} whileDrag={{scale:1.025,rotate:0,cursor:'grabbing'}}>
     <span className="leaf-thread" aria-hidden="true"/><span className="leaf-hole is-start" aria-hidden="true"/><span className="leaf-hole is-end" aria-hidden="true"/><div className="knowledge-card-head"><span className="knowledge-topic"><i/> {card.topic}</span><span className="knowledge-card-number">{state.pos+1} / {rotation.total}</span></div>
     <div className="knowledge-card-content"><h2>{card.title}</h2><div className="knowledge-story">{card.body.split(/\n\s*\n/).map((para,i)=><p key={i}>{para}</p>)}</div>{card.memo&&<div className="knowledge-memo"><span>ഓർമ്മിക്കാൻ ഒരു സൂത്രവാക്യം</span><p>{card.memo}</p></div>}</div>
     <div className="knowledge-card-footer"><a href={card.url} target="_blank" rel="noreferrer">ഉറവിടം <span aria-hidden="true">↗</span></a>{showSwipeIntro&&<span className="knowledge-swipe-hint"><span aria-hidden="true">←</span> ഇടത്തേക്ക് വീണ്ടും പഠിക്കാം · വലത്തേക്ക് അറിയാം <span aria-hidden="true">→</span></span>}</div>
     <span className="knowledge-stamp stamp-known" aria-hidden="true">അറിയാം</span><span className="knowledge-stamp stamp-review" aria-hidden="true">വീണ്ടും പഠിക്കാം</span>
    </motion.article>
   </AnimatePresence>
  </div>
  <div className="knowledge-nav" aria-label="അടുത്ത അറിവ്"><button type="button" onClick={()=>advance('review')}><span aria-hidden="true">←</span> വീണ്ടും പഠിക്കാം</button><button type="button" onClick={()=>advance('known')}>അറിയാം <span aria-hidden="true">→</span></button></div>
  <AnimatePresence>{toast&&<motion.div className="knowledge-toast" role="status" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:16}}>{toast}</motion.div>}</AnimatePresence>
 </section>
}
