'use client';

type Props={minutes:number;setMinutes:(value:number)=>void;busy:boolean;onStart:()=>void};

export default function MockExamSetup({minutes,setMinutes,busy,onStart}:Props){
 const count=Math.ceil(minutes*60/45);
 return <section className="mock-setup-page">
  <div className="eyebrow">EXAM MODE</div>
  <h1 className="section-title">Mock exam</h1>
  <p className="small">Choose your exam duration. The question count adjusts at 45 seconds per question.</p>
  <label className="field mock-duration-field">Exam duration <span className="mock-duration-value">{minutes} minutes</span>
   <input aria-label="Exam duration in minutes" type="range" min="15" max="180" step="5" value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/>
  </label>
  <div className="mock-setup-summary"><span>Questions</span><strong>{count}</strong><small>About {Math.ceil(count/10)} pages of 10</small></div>
  <button type="button" className="button setup-start" onClick={onStart} disabled={busy}>{busy?'Preparing exam…':'Start mock exam →'}</button>
 </section>;
}
