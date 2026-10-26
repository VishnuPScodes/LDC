'use client';
import {useState} from 'react';
import SyllabusJourney from './SyllabusJourney';
import {featureFlags} from './feature-flags';

type Topic={topic:string;marks:number};
export default function SyllabusPage({syllabus,progress,learnerStats,loading=false,error='',onRetry,onPracticeTopic,language='en'}:{syllabus:Topic[];progress:any;learnerStats:any;loading?:boolean;error?:string;onRetry?:()=>void;onPracticeTopic:(topic:string)=>void;language?:'en'|'ml'}){
 const [tab,setTab]=useState<'journey'|'topics'>(featureFlags.journey?'journey':'topics'),ml=language==='ml';
 const topicStats=learnerStats?.topicStats||[];
 return <section className="syllabus-page">
  <div className="syllabus-tabs" role="tablist" aria-label={ml?'പാഠ്യപദ്ധതി കാഴ്ച':'Syllabus views'}>{featureFlags.journey&&<button type="button" role="tab" aria-selected={tab==='journey'} className={tab==='journey'?'selected':''} onClick={()=>setTab('journey')}>{ml?'യാത്ര':'Journey'}</button>}<button type="button" role="tab" aria-selected={tab==='topics'} className={tab==='topics'?'selected':''} onClick={()=>setTab('topics')}>{ml?'വിഷയങ്ങൾ':'Topics'}</button></div>
  {featureFlags.journey&&tab==='journey'&&<SyllabusJourney syllabus={syllabus} stats={learnerStats} loading={loading} error={error} onRetry={onRetry} onPracticeTopic={onPracticeTopic} language={language}/>}
  {tab==='topics'&&<><div className="eyebrow">{ml?'നിങ്ങളുടെ പാഠ്യപദ്ധതി':'YOUR SYLLABUS'}</div><h1 className="section-title syllabus-title">{ml?'വിഷയങ്ങൾ':'Topic list'}</h1><p className="small syllabus-intro">{ml?'കഴിഞ്ഞ 20 ഉത്തരങ്ങളിൽ കുറഞ്ഞത് 60% ശരിയാകുമ്പോൾ വിഷയം പ്രാവീണ്യമായി കണക്കാക്കും.':'A topic is mastered after 20 recent attempts with at least 60% accuracy.'}</p>
   {loading&&<div className="topic-map-skeleton" role="status" aria-label={ml?'പാഠ്യപദ്ധതി ലോഡ് ചെയ്യുന്നു':'Loading syllabus'}>{Array.from({length:8},(_,i)=><span key={i}/>)}</div>}
   {!loading&&error&&<div className="page-load-error" role="alert"><p>{ml?'വിഷയങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.':'Couldn’t load topics.'}</p><button type="button" className="secondary-button" onClick={onRetry}>{ml?'വീണ്ടും ശ്രമിക്കുക':'Retry'}</button></div>}
   {!loading&&!error&&!syllabus.length&&<div className="page-empty-state">{ml?'പാഠ്യവിഷയങ്ങൾ ലഭ്യമല്ല.':'No syllabus topics are available right now.'}</div>}
   {!loading&&!error&&syllabus.length>0&&<div className="topic-map" aria-label={ml?'പാഠ്യവിഷയങ്ങൾ':'Syllabus topics'}>{syllabus.map(topic=>{const stats=topicStats.find((row:any)=>row.topic===topic.topic),attempts=stats?.attempts||0,recentAccuracy=Math.round(stats?.recentAccuracy||0),mastered=!!stats?.mastered,status=mastered?(ml?'പ്രാവീണ്യം നേടി':'Mastered'):attempts<20?(ml?'കൂടുതൽ പരിശീലനം വേണം':'More practice needed'):(ml?'പരിശീലിച്ചുകൊണ്ടിരിക്കുന്നു':'In progress');return <button className="topic-card" key={topic.topic} type="button" onClick={()=>onPracticeTopic(topic.topic)}><span className="topic-card-top"><strong>{topic.topic}</strong><span>{topic.marks} {ml?'മാർക്ക്':'marks'}</span></span><span className="topic-meter" aria-label={mastered?`${recentAccuracy}% mastery`:'Mastery not yet reached'}><span className={mastered?'mastered':''} style={{width:`${mastered?recentAccuracy:Math.min(59,recentAccuracy)}%`}}/></span><span className="topic-card-bottom"><span>{status}</span><span>{attempts} {ml?'ശ്രമങ്ങൾ':'attempts'} · {recentAccuracy}%</span></span></button>})}</div>}
  </>}
 </section>;
}
