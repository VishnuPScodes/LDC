'use client';

type Props={questionCount:number|null;durationSeconds:number|null;busy:boolean;onStart:()=>void};

export default function MockExamSetup({questionCount,durationSeconds,busy,onStart}:Props){
 return <section className="mock-setup-page">
  <div className="eyebrow">EXAM MODE</div>
  <h1 className="section-title">Mock exam</h1>
  <p className="small">A full-length mock based on the Kerala PSC LDC exam format.</p>
  <div className="mock-setup-summary"><span>Questions</span><strong>{questionCount??'—'}</strong><small>{durationSeconds===null?'Loading exam format…':`${Math.floor(durationSeconds/60)} minutes · ${Math.ceil((questionCount||0)/10)} pages of 10`}</small></div>
  <button type="button" className="button setup-start" onClick={onStart} disabled={busy||questionCount===null||durationSeconds===null}>{busy?'Preparing exam…':'Start mock exam →'}</button>
 </section>;
}
