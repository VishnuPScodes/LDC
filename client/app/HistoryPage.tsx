'use client';

type Session={_id:string;settings?:{mode?:string;count?:number;topics?:string[]};status:string;startedAt:string;completedAt?:string;score?:{correct?:number;accuracy?:number}};
export default function HistoryPage({history,loading,error='',onRetry,onOpen,onStart}:{history:Session[];loading:boolean;error?:string;onRetry?:()=>void;onOpen:(session:Session)=>void;onStart:()=>void}){
 return <section className="history-page"><div className="eyebrow">YOUR SESSIONS</div><h1 className="section-title">Practice history</h1>
  {loading?<div className="history-loading" role="status">Loading your sessions…</div>:error?<div className="page-load-error" role="alert"><p>Couldn’t load your sessions.</p><button type="button" className="secondary-button" onClick={onRetry}>Retry</button></div>:history.length===0?<div className="history-empty"><h2>No sessions yet</h2><p>Start your first practice session to see it here.</p><button className="button" type="button" onClick={onStart}>Start practice →</button></div>:history.map(session=>{
   const elapsed=Math.max(0,new Date(session.completedAt||Date.now()).getTime()-new Date(session.startedAt).getTime());
   const mode=session.settings?.mode==='mock'?'Mock exam':session.settings?.mode==='quick'?'Quick practice':'Instant practice';
   const topics=session.settings?.topics?.length?session.settings.topics.join(', '):'All topics';
   return <article className="history-row" key={session._id}><div><strong>{new Date(session.startedAt).toLocaleDateString()}</strong><span>{mode} · {session.settings?.count||0} questions · {topics}</span></div><span>{session.status==='completed'?`${session.score?.correct||0} correct · ${Math.round(session.score?.accuracy||0)}% · ${Math.floor(elapsed/60000)} min`:`In progress · ${Math.floor(elapsed/60000)} min elapsed`}</span><button className="secondary-button" type="button" onClick={()=>onOpen(session)}>{session.status==='completed'?'View results':'Resume'}</button></article>;
  })}
 </section>;
}
