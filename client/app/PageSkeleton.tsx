'use client';
import {useEffect,useState} from 'react';

type Variant='analytics'|'list'|'cards'|'panel';

// Placeholder shaped like the page being loaded, so the layout doesn't jump when data arrives.
export default function PageSkeleton({variant,label,language='en',rows=4}:{variant:Variant;label:string;language?:'en'|'ml';rows?:number}){
 const ml=language==='ml';
 const [slow,setSlow]=useState(false);
 useEffect(()=>{const id=window.setTimeout(()=>setSlow(true),6000);return()=>window.clearTimeout(id)},[]);
 return <div className={`page-skeleton is-${variant}`} role="status" aria-live="polite" aria-busy="true">
  <p className="page-skeleton-status"><span className="page-skeleton-dot" aria-hidden="true"/>{slow?(ml?'ഇനിയും ലോഡ് ചെയ്യുന്നു — വേഗത കുറഞ്ഞ കണക്ഷനിൽ കുറച്ച് സമയമെടുക്കാം.':'Still working — this can take a few seconds on a slow connection.'):label}</p>
  <div aria-hidden="true">
   {variant==='analytics'&&<>
    <div className="page-skeleton-stats">{Array.from({length:4},(_,i)=><div className="sk-card" key={i}><i className="sk sk-line is-short"/><i className="sk sk-line is-big"/></div>)}</div>
    <div className="sk-card is-tall"><i className="sk sk-line is-mid"/><div className="sk-bars">{[62,84,45,70,92,55,76].map((h,i)=><i className="sk" key={i} style={{height:`${h}%`}}/>)}</div></div>
    <div className="page-skeleton-split">{Array.from({length:2},(_,i)=><div className="sk-card" key={i}><i className="sk sk-line is-mid"/>{Array.from({length:4},(_,j)=><i className="sk sk-line" key={j}/>)}</div>)}</div>
   </>}
   {variant==='list'&&Array.from({length:rows},(_,i)=><div className="sk-row" key={i}><div><i className="sk sk-line is-mid"/><i className="sk sk-line is-long"/><i className="sk sk-pill"/></div><i className="sk sk-button"/></div>)}
   {variant==='cards'&&<div className="page-skeleton-grid">{Array.from({length:rows},(_,i)=><div className="sk-card" key={i}><i className="sk sk-circle"/><i className="sk sk-line is-mid"/><i className="sk sk-line"/></div>)}</div>}
   {variant==='panel'&&<div className="sk-card">{Array.from({length:rows},(_,i)=><i className={`sk sk-line${i===0?' is-mid':''}`} key={i}/>)}</div>}
  </div>
 </div>;
}
