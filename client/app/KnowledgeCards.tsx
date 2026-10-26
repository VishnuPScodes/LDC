'use client';
import {useEffect,useMemo,useState} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'framer-motion';
import {knowledgeGroups} from './knowledge-data';

type Saved={index:number;known:number[]};
const dayKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const groupForToday=()=>{const d=new Date();return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(2024,0,1))/86400000)%knowledgeGroups.length};

export default function KnowledgeCards({onExit}:{onExit:()=>void}){
 const reduce=useReducedMotion(),[index,setIndex]=useState(0),[known,setKnown]=useState<number[]>([]),[ready,setReady]=useState(false),[direction,setDirection]=useState(1);
 const group=useMemo(()=>knowledgeGroups[groupForToday()],[]),key=`ldc-knowledge-v2:${dayKey()}`;
 useEffect(()=>{try{const saved:Saved=JSON.parse(localStorage.getItem(key)||'{"index":0,"known":[]}');setIndex(Math.min(saved.index,group.length));setKnown(saved.known||[])}catch{}setReady(true)},[key,group.length]);
 useEffect(()=>{if(ready)localStorage.setItem(key,JSON.stringify({index,known} satisfies Saved))},[index,known,key,ready]);
 const advance=(mark:'known'|'review')=>{if(index>=group.length)return;setDirection(mark==='known'?1:-1);if(mark==='known')setKnown(xs=>[...xs,index]);setIndex(i=>i+1)};
 useEffect(()=>{const keydown=(e:KeyboardEvent)=>{if(e.key==='ArrowRight')advance('known');if(e.key==='ArrowLeft')advance('review')};window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown)},[index,group.length]);
 const card=group[index],next=group[index+1];
 if(!ready)return <section className="knowledge-page" aria-busy="true"/>;
 return <section className="knowledge-page">
  <div className="knowledge-top"><button type="button" className="knowledge-back" onClick={onExit}><span aria-hidden="true">←</span><span>തിരികെ</span></button><div className="knowledge-title"><div className="eyebrow">ദിവസവും പത്ത് അറിവുകൾ</div><h1 className="section-title">അറിവ്</h1></div><div className="knowledge-date">{new Intl.DateTimeFormat('ml-IN',{day:'numeric',month:'short'}).format(new Date())}</div></div>
  <div className="knowledge-stage" aria-live="polite">
   {next&&<div className="knowledge-card knowledge-card-under" aria-hidden="true"><span className="knowledge-card-orbit"/></div>}
   <AnimatePresence mode="popLayout" initial={false}>
    {card&&<motion.article key={index} className="knowledge-card" drag="x" dragConstraints={{left:0,right:0}} dragElastic={.85} onDrag={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.toggle('swipe-known',info.offset.x>45);target?.classList.toggle('swipe-review',info.offset.x< -45)}} onDragEnd={(e,info)=>{const target=(e.target as HTMLElement).closest('.knowledge-card');target?.classList.remove('swipe-known','swipe-review');if(info.offset.x>70||info.velocity.x>450)advance('known');else if(info.offset.x< -70||info.velocity.x< -450)advance('review')}} initial={reduce?{opacity:0}:{x:-direction*42,opacity:0,rotate:-direction*3}} animate={{x:0,opacity:1,rotate:0}} exit={reduce?{opacity:0}:{x:direction*420,opacity:0,rotate:direction*13}} transition={{type:'spring',stiffness:280,damping:25}} whileDrag={{scale:1.025,rotate:0,cursor:'grabbing'}}>
      <div className="knowledge-card-glow"/><div className="knowledge-card-head"><span className="knowledge-topic"><i/> {card.topic}</span><span className="knowledge-card-number">{String(index+1).padStart(2,'0')}</span></div>
      <div className="knowledge-card-content"><div className="knowledge-spark" aria-hidden="true">✳</div><h2>{card.title}</h2><p>{card.body}</p></div>
      <div className="knowledge-card-footer"><a href={card.url} target="_blank" rel="noreferrer">ഉറവിടം <span aria-hidden="true">↗</span></a><span>തുടരാൻ ഇടത്തോട്ടോ വലത്തോട്ടോ സ്വൈപ്പ് ചെയ്യൂ</span></div>
      <span className="knowledge-stamp stamp-known" aria-hidden="true">അറിയാം</span><span className="knowledge-stamp stamp-review" aria-hidden="true">വീണ്ടും പഠിക്കാം</span>
     </motion.article>}
   </AnimatePresence>
   {!card&&<motion.div className="knowledge-complete" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}><span className="knowledge-complete-mark">✓</span><div className="eyebrow">ഇന്നത്തെ പഠനം പൂർത്തിയായി</div><h2>നന്നായി ചെയ്തു!</h2><p>ഇന്നത്തെ പത്ത് അറിവുകളും കണ്ടുകഴിഞ്ഞു. നാളെ പുതിയ പത്ത് അറിവുകൾ ലഭിക്കും.</p><div className="knowledge-complete-count">{known.length} <span>/ {group.length} അറിഞ്ഞവ</span></div></motion.div>}
  </div>
 </section>
}
