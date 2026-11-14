'use client';
import {topicLabel} from './topic-labels';

export type Todo={id:string;kind:string;target:number;current:number;done:boolean;topic?:string;pct?:number;seconds?:number;streak?:number;accuracy?:number};
export type TodoList={count:number;chosen:boolean;available:number;min:number;max:number;items:Todo[];completed:number};
export const TODO_COUNT_CHOICES=[3,5,7,10];

function todoText(todo:Todo,ml:boolean){
 const n=todo.target,topic=todo.topic?topicLabel(todo.topic,ml?'ml':'en'):'';
 switch(todo.kind){
  case'answer':return ml?`${n} ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകുക`:`Answer ${n} questions`;
  case'daily_goal':return todo.streak?(ml?`${todo.streak} ദിവസത്തെ തുടർച്ച നിലനിർത്തുക: ${n} ചോദ്യങ്ങൾ`:`Keep your ${todo.streak}-day streak: answer ${n} questions`):(ml?`ദിവസ ലക്ഷ്യം: ${n} ചോദ്യങ്ങൾ`:`Reach your daily goal of ${n} questions`);
  case'correct':return ml?`${n} ശരിയുത്തരങ്ങൾ നേടുക`:`Get ${n} answers right`;
  case'accuracy':return ml?`${n}+ ചോദ്യങ്ങളിൽ ${todo.pct}%+ കൃത്യത`:`Score ${todo.pct}%+ across ${n}+ questions`;
  case'correct_run':return ml?`തുടർച്ചയായി ${n} ശരിയുത്തരങ്ങൾ`:`Get ${n} right in a row`;
  case'speed':return ml?`${n} ചോദ്യങ്ങൾക്ക് ${todo.seconds} സെക്കൻഡിനുള്ളിൽ ഉത്തരം`:`Answer ${n} questions in under ${todo.seconds} s each`;
  case'read':return ml?`${n} അറിവ് കാർഡുകൾ വായിക്കുക`:`Read ${n} knowledge cards`;
  case'review':return ml?`${n} ആവർത്തന ചോദ്യങ്ങൾ തീർക്കുക`:`Clear ${n} review ${n===1?'question':'questions'}`;
  case'weak_topic':return ml?`ദുർബല വിഷയം: ${topic} — ${n} ചോദ്യങ്ങൾ`:`Strengthen ${topic}: ${n} questions`;
  case'new_topic':return ml?`പുതിയ വിഷയം: ${topic} — ${n} ചോദ്യങ്ങൾ`:`Explore ${topic}: ${n} questions`;
  case'session':return ml?'ഒരു പരിശീലന സെഷൻ പൂർത്തിയാക്കുക':'Finish one practice session';
  case'saved':return ml?`സംരക്ഷിച്ച ${n} ചോദ്യങ്ങൾ വീണ്ടും ചെയ്യുക`:`Revisit ${n} saved ${n===1?'question':'questions'}`;
  case'mock':return ml?'ഒരു മോക്ക് പരീക്ഷ എഴുതുക':'Take a full mock exam';
  case'exam_date':return ml?'പരീക്ഷാ തീയതി ചേർക്കുക':'Set your exam date';
  default:return todo.kind;
 }
}

function progressText(todo:Todo,ml:boolean){
 if(todo.done)return ml?'പൂർത്തിയായി':'Done';
 if(todo.kind==='accuracy'&&todo.current>=todo.target)return ml?`ഇപ്പോൾ ${todo.accuracy}%`:`Now ${todo.accuracy}%`;
 if(todo.target===1)return ml?'ബാക്കി':'To do';
 return `${todo.current}/${todo.target}`;
}

type Props={list:TodoList|null;loading:boolean;error?:boolean;language:'en'|'ml';onChooseCount:(count:number)=>void;onAction:(todo:Todo)=>void;onOpenSettings:()=>void;onRetry:()=>void};

export default function DailyTodos({list,loading,error,language,onChooseCount,onAction,onOpenSettings,onRetry}:Props){
 const ml=language==='ml';
 if(error&&!list)return <section className="todo-card" aria-label={ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'Today’s to-dos'}><div className="eyebrow">{ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'TODAY’S TO-DOS'}</div><p className="small">{ml?'ലിസ്റ്റ് ലോഡ് ചെയ്യാനായില്ല.':'Could not load today’s to-dos.'} <button type="button" className="text-button" onClick={onRetry}>{ml?'വീണ്ടും ശ്രമിക്കുക':'Retry'}</button></p></section>;
 if(!list)return <section className="todo-card is-loading" aria-busy="true" aria-label={ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'Today’s to-dos'}><div className="eyebrow">{ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'TODAY’S TO-DOS'}</div>{[0,1,2].map(i=><div className="todo-skeleton" key={i}/>)}</section>;

 // First visit: let the learner pick how many daily to-dos they want.
 if(!list.chosen)return <section className="todo-card todo-chooser" aria-label={ml?'ദിവസേനയുള്ള ചെയ്യേണ്ടവ':'Daily to-dos'}>
  <div className="eyebrow">{ml?'പുതിയത് · ദിവസേന ചെയ്യേണ്ടവ':'NEW · DAILY TO-DOS'}</div>
  <h2>{ml?'ദിവസവും എത്ര ചെറിയ ലക്ഷ്യങ്ങൾ വേണം?':'How many small goals would you like each day?'}</h2>
  <p>{ml?'നിങ്ങളുടെ പഠനരീതി അനുസരിച്ച് ഓരോ ദിവസവും പുതിയ ലക്ഷ്യങ്ങൾ തയ്യാറാക്കും. പിന്നീട് ക്രമീകരണങ്ങളിൽ മാറ്റാം.':'We pick fresh goals for you every day from how you study: weak topics, reading, accuracy and more. You can change this later in Settings.'}</p>
  <div className="todo-count-choices" role="group" aria-label={ml?'ചെയ്യേണ്ടവയുടെ എണ്ണം':'Number of to-dos'}>
   {TODO_COUNT_CHOICES.map(count=><button type="button" key={count} className={count===3?'button':'secondary-button'} onClick={()=>onChooseCount(count)}>{count}</button>)}
  </div>
  <p className="small todo-hint">{ml?'തുടങ്ങാൻ 3 നല്ലതാണ്.':'3 is a good place to start.'}</p>
 </section>;

 const allDone=list.items.length>0&&list.completed===list.items.length;
 return <section className={`todo-card${allDone?' is-complete':''}`} aria-label={ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'Today’s to-dos'} aria-busy={loading}>
  <div className="todo-head">
   <div><div className="eyebrow">{ml?'ഇന്നത്തെ ചെയ്യേണ്ടവ':'TODAY’S TO-DOS'}</div><h2>{allDone?(ml?'എല്ലാം പൂർത്തിയായി! 🎉':'All done for today! 🎉'):(ml?`${list.items.length}-ൽ ${list.completed} പൂർത്തിയായി`:`${list.completed} of ${list.items.length} done`)}</h2></div>
   <button type="button" className="text-button todo-edit" onClick={onOpenSettings}>{ml?'എണ്ണം മാറ്റുക':'Change number'}</button>
  </div>
  <div className="todo-meter" aria-hidden="true"><span style={{width:`${list.items.length?list.completed/list.items.length*100:0}%`}}/></div>
  <ul className="todo-list">
   {list.items.map(todo=><li key={todo.id}>
    <button type="button" className={`todo-item${todo.done?' is-done':''}`} disabled={todo.done} onClick={()=>onAction(todo)} aria-label={`${todoText(todo,ml)} — ${progressText(todo,ml)}`}>
     <span className="todo-check" aria-hidden="true">{todo.done?<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>:null}</span>
     <span className="todo-text">{todoText(todo,ml)}</span>
     <span className="todo-progress">{progressText(todo,ml)}</span>
     {!todo.done&&<span className="todo-go" aria-hidden="true">→</span>}
    </button>
   </li>)}
  </ul>
  {list.items.length<list.count&&<p className="small todo-note">{ml?'ഇന്നത്തേക്ക് ഇത്രയും ലക്ഷ്യങ്ങളേ ഉള്ളൂ.':'That’s every goal we have for you today.'}</p>}
 </section>;
}
