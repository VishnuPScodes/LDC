'use client';
import {featureFlags} from './feature-flags';

export default function MilestonesPage({stats,loading=false,error='',onRetry,language='en'}:{stats:any;loading?:boolean;error?:string;onRetry?:()=>void;language?:'en'|'ml'}){
 const ml=language==='ml',items=stats?.milestones||[];
 if(!featureFlags.milestones)return <section className="milestones-page"><div className="page-empty-state">{ml?'ഈ സവിശേഷത ഇപ്പോൾ ലഭ്യമല്ല.':'Milestones are turned off.'}</div></section>;
 return <section className="milestones-page"><div className="eyebrow">{ml?'നേട്ടങ്ങൾ':'MILESTONES'}</div><h1 className="section-title">{ml?'നിങ്ങളുടെ പഠന നേട്ടങ്ങൾ':'Milestones'}</h1><p className="small">{ml?'ഓരോ നേട്ടവും നിങ്ങളുടെ പരിശീലനത്തിന്റെ അടിസ്ഥാനത്തിലാണ് കണക്കാക്കുന്നത്.':'Milestones are earned from your saved practice history.'}</p>
  {loading&&<div className="milestones-loading" role="status">{ml?'നേട്ടങ്ങൾ ലോഡ് ചെയ്യുന്നു…':'Loading milestones…'}</div>}
  {!loading&&error&&<div className="page-load-error" role="alert"><p>{ml?'നേട്ടങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.':'Couldn’t load milestones.'}</p><button type="button" className="secondary-button" onClick={onRetry}>{ml?'വീണ്ടും ശ്രമിക്കുക':'Retry'}</button></div>}
  {!loading&&!error&&!items.length&&<div className="page-empty-state">{ml?'ഇതുവരെ നേട്ടങ്ങളില്ല. പരിശീലനം ആരംഭിക്കൂ!':'No milestones yet. Start a practice session to earn your first one.'}</div>}
  {!loading&&!error&&items.length>0&&<div className="milestone-grid">{items.map((item:any)=><article key={item.id} className={`milestone-card${item.earned?' earned':''}`}><div className="milestone-card-top"><span className="milestone-mark" aria-hidden="true">{item.earned?'✓':'○'}</span><span className="milestone-state">{item.earned?(ml?'നേടി':'Earned'):(ml?'ലക്ഷ്യം':'In progress')}</span></div><h2>{ml?item.titleMl:item.title}</h2><p>{ml?item.descriptionMl:item.description}</p>{item.earned?<time dateTime={item.earnedAt}>{new Date(item.earnedAt).toLocaleDateString(ml?'ml-IN':'en-IN',{day:'numeric',month:'short',year:'numeric'})}</time>:<><div className="milestone-progress"><span style={{width:`${Math.min(100,item.target?item.current/item.target*100:0)}%`}}/></div><strong className="milestone-progress-label">{item.progress} {ml?progressNoun(item.type):progressNounEn(item.type)}</strong></>}</article>)}</div>}
 </section>;
}
function progressNoun(type:string){return({questions:'ചോദ്യങ്ങൾ',sessions:'സെഷനുകൾ',mocks:'മോക്ക് പരീക്ഷകൾ',topics:'വിഷയങ്ങൾ',streak:'ദിവസങ്ങൾ',paper:'പേപ്പറുകൾ',level:'ലെവൽ'} as Record<string,string>)[type]||'നേട്ടങ്ങൾ'}
function progressNounEn(type:string){return({questions:'questions',sessions:'sessions',mocks:'mock exams',topics:'topics',streak:'days',paper:'papers',level:'level'} as Record<string,string>)[type]||'items'}
