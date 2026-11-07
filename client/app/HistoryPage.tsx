'use client';

type Session={_id:string;settings?:{mode?:string;count?:number;topics?:string[]};status:string;startedAt:string;completedAt?:string;score?:{correct?:number;accuracy?:number;percent?:number};questionIds?:unknown[]};
export default function HistoryPage({history,loading,error='',onRetry,onOpen,onStart}:{history:Session[];loading:boolean;error?:string;onRetry?:()=>void;onOpen:(session:Session)=>void;onStart:()=>void}){
 return <section className="history-page"><div className="eyebrow">YOUR SESSIONS</div><h1 className="section-title">Practice history</h1>
  {loading?<div className="history-loading" role="status">Loading your sessions…</div>:error?<div className="page-load-error" role="alert"><p>Couldn’t load your sessions.</p><button type="button" className="secondary-button" onClick={onRetry}>Retry</button></div>:history.length===0?<div className="history-empty"><h2>No sessions yet</h2><p>Start your first practice session to see it here.</p><button className="button" type="button" onClick={onStart}>Start practice →</button></div>:history.map(session=>{
   const elapsed=Math.max(0,new Date(session.completedAt||Date.now()).getTime()-new Date(session.startedAt).getTime());
   const mode=session.settings?.mode==='mock'?'Mock exam':session.settings?.mode==='quick'?'Quick practice':'Instant practice';
   const topics=session.settings?.topics?.length?session.settings.topics.join(', '):'All topics';
   const total=session.questionIds?.length||session.settings?.count||0,done=session.status==='completed';
   const percent=Math.round(session.score?.percent??(total?((session.score?.correct||0)/total*100):0));
   const tone=percent>=70?'good':percent>=50?'fair':'low';
   return <article className="history-row" key={session._id}><div><strong>{friendlyDate(session.completedAt||session.startedAt)}</strong><span>{mode}{total?` · ${total} ${total===1?'question':'questions'}`:''} · {topics}</span></div><span className="history-result">{done?<><span className={`score-badge is-${tone}`}>{session.score?.correct||0}/{total} · {percent}%</span><span className="history-time">{Math.max(1,Math.round(elapsed/60000))} min</span></>:<><span className="score-badge is-progress">In progress</span><span className="history-time">{Math.floor(elapsed/60000)} min so far</span></>}</span><button className={done?'secondary-button':'button'} type="button" onClick={()=>onOpen(session)}>{done?'View results':'Resume'}</button></article>;
  })}
 </section>;
}

function friendlyDate(value:string){
 const date=new Date(value),now=new Date(),day=86400000;
 const start=(d:Date)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
 const diff=Math.round((start(now)-start(date))/day),time=date.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
 if(diff===0)return `Today, ${time}`;
 if(diff===1)return `Yesterday, ${time}`;
 return date.toLocaleDateString('en-IN',{day:'numeric',month:'short',...(date.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})});
}
