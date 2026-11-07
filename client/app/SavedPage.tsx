'use client';
import {useEffect,useMemo,useState} from 'react';
import PageSkeleton from './PageSkeleton';
import QuestionSource from './QuestionSource';
import {topicLabel} from './topic-labels';

type Option={key:string;text:string};
export type SavedItem={question:{_id:string;questionNumber:number;text:string;options:Option[];topic:string;correctOption?:string|null;explanation?:string|null;paperCode?:string;paperNumber?:number;examDate?:string;sourcePage?:number};note:string;savedAt:string|null};
type Props={
  savedIds:Set<string>;
  load:()=>Promise<SavedItem[]>;
  onToggleSave:(questionId:string)=>void;
  onSaveNote:(questionId:string,note:string)=>Promise<boolean>;
  onPractise:(topics:string[],count:number)=>void;
  busy?:boolean;
  language?:'en'|'ml';
};

const NOTE_MAX=500;
const langOf=(text?:string|null)=>/[ഀ-ൿ]/u.test(text||'')?'ml':'en';

export default function SavedPage({savedIds,load,onToggleSave,onSaveNote,onPractise,busy=false,language='en'}:Props){
  const ml=language==='ml';
  const [items,setItems]=useState<SavedItem[]|null>(null),[loadError,setLoadError]=useState(''),[topic,setTopic]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
  useEffect(()=>{let active=true;setLoadError('');load().then(data=>{if(active)setItems(data)}).catch(e=>{console.error('Could not load saved questions',e);if(active){setItems(current=>current||[]);setLoadError(ml?'സംരക്ഷിച്ച ചോദ്യങ്ങൾ ലോഡ് ചെയ്യാനായില്ല.':'Couldn’t load your saved questions.')}});return()=>{active=false}},[attempt]);
  // The shared id set is the source of truth, so un-starring (and any rollback) reflects here immediately.
  const visible=useMemo(()=>(items||[]).filter(item=>savedIds.has(item.question._id)),[items,savedIds]);
  const topics=useMemo(()=>Array.from(new Set(visible.map(item=>item.question.topic))).sort(),[visible]);
  useEffect(()=>{if(topic&&!topics.includes(topic))setTopic(null)},[topic,topics]);
  const shown=topic?visible.filter(item=>item.question.topic===topic):visible;
  const updateNote=(id:string,note:string)=>setItems(current=>(current||[]).map(item=>item.question._id===id?{...item,note}:item));

  if(items===null)return <section className="saved-page"><SavedHeading ml={ml}/><PageSkeleton variant="list" label={ml?'സംരക്ഷിച്ച ചോദ്യങ്ങൾ ലോഡ് ചെയ്യുന്നു…':'Loading saved questions…'} language={language}/></section>;

  return <section className="saved-page is-ready">
    <SavedHeading ml={ml}/>
    {loadError&&<div className="inline-error" role="alert"><span>{loadError}</span> <button type="button" className="text-button" onClick={()=>setAttempt(n=>n+1)}>{ml?'വീണ്ടും ശ്രമിക്കുക':'Retry'}</button></div>}
    {!visible.length&&!loadError?<div className="saved-empty card">
      <span className="saved-empty-star" aria-hidden="true">☆</span>
      <h2>{ml?'ഇതുവരെ ഒന്നും സംരക്ഷിച്ചിട്ടില്ല':'Nothing saved yet'}</h2>
      <p>{ml?'പരിശീലിക്കുമ്പോഴോ ഫലം പരിശോധിക്കുമ്പോഴോ ഏതെങ്കിലും ചോദ്യത്തിലെ ☆ സേവ് അമർത്തുക. അവ ഇവിടെ കുറിപ്പുകളോടൊപ്പം കാണാം, പിന്നീട് അവ മാത്രം വീണ്ടും പരിശീലിക്കാം.':'While practising or reviewing your results, tap ☆ Save on any question you want to come back to. It will appear here, where you can add a short note and practise just those questions later.'}</p>
    </div>:visible.length>0&&<>
      <div className="saved-toolbar">
        <div className="saved-filter" role="group" aria-label={ml?'വിഷയം അനുസരിച്ച് ഫിൽട്ടർ ചെയ്യുക':'Filter by topic'}>
          <button type="button" className={`saved-chip${topic===null?' selected':''}`} aria-pressed={topic===null} onClick={()=>setTopic(null)}>{ml?'എല്ലാം':'All'} <small>{visible.length}</small></button>
          {topics.map(t=>{const label=topicLabel(t,language),count=visible.filter(item=>item.question.topic===t).length;return <button type="button" key={t} className={`saved-chip${topic===t?' selected':''}`} aria-pressed={topic===t} onClick={()=>setTopic(t)}><span lang={langOf(label)}>{label}</span> <small>{count}</small></button>})}
        </div>
        <button type="button" className="button saved-practise" disabled={busy||!shown.length} onClick={()=>onPractise(topic?[topic]:[],shown.length)}>{busy?(ml?'തയ്യാറാക്കുന്നു…':'Preparing…'):(ml?`സംരക്ഷിച്ചവ പരിശീലിക്കുക (${shown.length})`:`Practise saved questions (${shown.length})`)}</button>
      </div>
      <div className="saved-list">{shown.map(item=><SavedCard key={item.question._id} item={item} language={language} onRemove={()=>onToggleSave(item.question._id)} onSaveNote={async note=>{const ok=await onSaveNote(item.question._id,note);if(ok)updateNote(item.question._id,note);return ok}}/>)}</div>
    </>}
  </section>;
}

function SavedHeading({ml}:{ml:boolean}){
  return <><div className="eyebrow">{ml?<span lang="ml">സംരക്ഷിച്ചവ</span>:'SAVED'}</div><h1 className="section-title">{ml?<span lang="ml">സംരക്ഷിച്ച ചോദ്യങ്ങൾ</span>:'Saved questions'}</h1><p className="small saved-intro">{ml?<span lang="ml">നിങ്ങൾ നക്ഷത്രമിട്ട ചോദ്യങ്ങളും സ്വന്തം കുറിപ്പുകളും.</span>:'Questions you starred, with your own notes.'}</p></>;
}

function SavedCard({item,language,onRemove,onSaveNote}:{item:SavedItem;language:'en'|'ml';onRemove:()=>void;onSaveNote:(note:string)=>Promise<boolean>}){
  const q=item.question,ml=language==='ml';
  const [note,setNote]=useState(item.note),[status,setStatus]=useState<'idle'|'saving'|'saved'|'error'>('idle');
  useEffect(()=>{setNote(item.note)},[item.note]);
  useEffect(()=>{if(status!=='saved')return;const id=window.setTimeout(()=>setStatus('idle'),2200);return()=>window.clearTimeout(id)},[status]);
  const dirty=note.trim()!==item.note.trim();
  const save=async()=>{if(!dirty||status==='saving')return;setStatus('saving');setStatus(await onSaveNote(note.trim())?'saved':'error')};
  const correct=q.options.find(option=>option.key===q.correctOption);
  const topic=topicLabel(q.topic,language);
  return <article className="saved-card">
    <div className="saved-card-head"><span className="saved-topic" lang={langOf(topic)}>{topic}</span><button type="button" className="saved-remove" onClick={onRemove} aria-label={`${ml?'നീക്കം ചെയ്യുക':'Remove'}: ${q.questionNumber}`}>{ml?'നീക്കം ചെയ്യുക':'Remove'}</button></div>
    <h2 className="saved-question" lang={langOf(q.text)}>{q.questionNumber}. {q.text}</h2>
    <QuestionSource paperCode={q.paperCode} paperNumber={q.paperNumber} examDate={q.examDate} sourcePage={q.sourcePage} compact text={q.text}/>
    <ul className="saved-options">{q.options.map(option=><li key={option.key} className={option.key===q.correctOption?'is-correct':''}><span className="saved-option-key">{option.key}</span><span lang={langOf(option.text)}>{option.text}</span>{option.key===q.correctOption&&<span className="saved-correct-tag">{ml?'ശരിയുത്തരം':'Correct'}</span>}</li>)}</ul>
    {!correct&&<p className="small">{ml?'ശരിയുത്തരം ലഭ്യമല്ല.':'Correct answer not available.'}</p>}
    {q.explanation&&<p className="saved-explanation" lang={langOf(q.explanation)}>{q.explanation}</p>}
    <label className="saved-note">
      <span>{ml?'എന്റെ കുറിപ്പ്':'My note'}</span>
      <textarea rows={2} maxLength={NOTE_MAX} value={note} lang={langOf(note)} placeholder={ml?'ഓർമ്മിക്കാൻ ഒരു ചെറിയ കുറിപ്പ്…':'A short reminder for yourself…'} onChange={e=>{setNote(e.target.value);if(status!=='saving')setStatus('idle')}} onBlur={()=>void save()}/>
    </label>
    <div className="saved-note-actions">
      <span className="small" aria-live="polite">{status==='saving'?(ml?'സേവ് ചെയ്യുന്നു…':'Saving…'):status==='saved'?(ml?'✓ സേവ് ചെയ്തു':'✓ Saved'):status==='error'?(ml?'സേവ് ചെയ്യാനായില്ല':'Not saved — try again'):`${note.length}/${NOTE_MAX}`}</span>
      <button type="button" className="secondary-button saved-note-save" disabled={!dirty||status==='saving'} onClick={()=>void save()}>{ml?'കുറിപ്പ് സേവ് ചെയ്യുക':'Save note'}</button>
    </div>
  </article>;
}
