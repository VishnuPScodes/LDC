'use client';
import {featureFlags} from './feature-flags';
import {daysUntilExam} from '../../server/src/exam-countdown';
import MotivationQuoteCard from './MotivationQuoteCard';

type Topic={topic:string;marks:number};
type Props={name:string;dailyCount:number;dailyGoal:number;streak:number;progress:any;syllabus:Topic[];onStart:(config?:any)=>void;onPracticeTopic:(topic:string)=>void;onContinuePdf:()=>void;onOpenSyllabus:()=>void;reviewDue?:number;reviewTomorrow?:number;weekDays?:boolean[];unfinishedSession?:any;todayCompleted?:boolean;onResume?:(session:any)=>void;language?:'en'|'ml';targetExamDate?:string;onOpenSettings?:()=>void;learnerStats?:any;onOpenReview?:()=>void;onStartMock?:()=>void;loading?:boolean};
export default function TodayDashboard({name,dailyCount,dailyGoal,streak,unfinishedSession,todayCompleted=false,onResume,language='en',targetExamDate,onOpenSettings,learnerStats,reviewDue=0,reviewTomorrow=0,onOpenReview,onOpenSyllabus,onContinuePdf,loading=false,onStart}:Props){
 const ml=language==='ml';
 return <section className="today-page">
  <header className="today-heading"><div><h1 className="title">{ml?`നമസ്കാരം, ${name}`:`Good ${new Date().getHours()<12?'morning':'day'}, ${name}.`}</h1><p className="today-subtitle">{ml?'ഇന്ന് ചെറിയൊരു പരിശീലനം മതി.':'A short, steady session is enough for today.'}</p>{featureFlags.examCountdown&&<p className="exam-countdown">{targetExamDate?countdownText(daysUntilExam(targetExamDate),ml):<button type="button" className="text-button" onClick={onOpenSettings}>{ml?'പരീക്ഷാ തീയതി ചേർക്കുക':'Set your exam date'}</button>}</p>}</div></header>
  <MotivationQuoteCard language={language}/>
  <section className="today-summary-card today-summary-stable" aria-label={ml?'ഇന്നത്തെ സംഗ്രഹം':'Today summary'} aria-busy={loading}>
   <div className="eyebrow">{ml?'ഇന്നത്തെ സംഗ്രഹം':'TODAY'}</div>
   <div className="today-summary-body">
    <GoalRing done={loading?0:Number(dailyCount)||0} goal={Number(dailyGoal)||20} loading={loading} ml={ml}/>
    <div className="today-summary-stats"><span><strong>{loading?'—':Number(dailyCount)||0}</strong>{ml?' ചോദ്യങ്ങൾ':` ${plural(dailyCount,'question','questions')}`}</span><span><strong>{loading?'—':`${Math.round(Number(learnerStats?.todayAccuracy)||0)}%`}</strong>{ml?' കൃത്യത':' accuracy'}</span><span><strong>{loading?'—':Number(streak)||0}</strong>{ml?' ദിവസത്തെ തുടർച്ച':` ${plural(streak,'day','days')} streak`}</span></div>
   </div>
  </section>
  <section className={`today-plan today-primary-action${todayCompleted&&!unfinishedSession?' is-complete':''}`}><div className="plan-copy"><div className="eyebrow">{todayCompleted&&!unfinishedSession?(ml?'ഇന്നത്തെ സെഷൻ':'TODAY’S SESSION'):ml?'അടുത്ത ചുവട്':'NEXT STEP'}</div><h2>{unfinishedSession?(ml?'സെഷൻ തുടരുക':'Continue your session'):todayCompleted?(ml?'ഇന്നത്തെ സെഷൻ പൂർത്തിയായി':'Today’s session is done'):(ml?'പരിശീലനം ആരംഭിക്കുക':'Start a practice session')}</h2><p>{unfinishedSession?(ml?'നിങ്ങളുടെ ഉത്തരം നൽകിയ ചോദ്യങ്ങൾ സംരക്ഷിച്ചിട്ടുണ്ട്.':'Your answered questions are saved.'):todayCompleted?(ml?'നന്നായി! നിങ്ങളുടെ സെഷൻ പൂർത്തിയായി.':'Nice work. You completed a practice session today.'):(ml?'ഒരു ചെറിയ സെഷൻ തിരഞ്ഞെടുത്ത് തുടങ്ങാം.':'Choose a short session and begin.')}</p></div>{todayCompleted&&!unfinishedSession?<span className="today-done-mark" role="status">✓ {ml?'പൂർത്തിയായി':'Done'}</span>:<button className="button plan-start" type="button" disabled={loading} onClick={()=>unfinishedSession?onResume?.(unfinishedSession):onStart()}>{unfinishedSession?(ml?'തുടരുക':'Continue'):(ml?'പരിശീലനം തുടങ്ങുക':'Start practice')} <span aria-hidden="true">→</span></button>}</section>
  <nav className="today-shortcuts" aria-label={ml?'മറ്റ് പഠന പേജുകൾ':'Other study pages'}>
   {reviewDue>0&&<button type="button" className="today-shortcut is-review" onClick={onOpenReview}><span className="today-shortcut-count">{reviewDue}</span><span><strong>{ml?'ആവർത്തനം':'Review'}</strong><small>{ml?'ഇന്ന് ആവർത്തിക്കാനുള്ളവ':`${plural(reviewDue,'question','questions')} due`}{reviewTomorrow>0?(ml?` · നാളെ ${reviewTomorrow}`:` · ${reviewTomorrow} tomorrow`):''}</small></span></button>}
   <button type="button" className="today-shortcut" onClick={onOpenSyllabus}><span><strong>{ml?'പാഠ്യപദ്ധതി':'Syllabus'}</strong><small>{ml?'വിഷയങ്ങളും പുരോഗതിയും':'Topics and progress'}</small></span></button>
   <a className="today-shortcut" href="/daily"><span><strong>{ml?'ഡെയ്‌ലി ചലഞ്ച്':'Daily challenge'}</strong><small>{ml?'10 ചോദ്യങ്ങൾ · എല്ലാവർക്കും ഒരേത്':'10 questions · same for everyone'}</small></span></a>
   <a className="today-shortcut" href="/papers"><span><strong>{ml?'ചോദ്യപേപ്പറുകൾ':'Question papers'}</strong><small>{ml?'2013–2023':'Previous years, 2013–2023'}</small></span></a>
  </nav>
 </section>
}
function countdownText(days:number,ml:boolean){if(days<0)return ml?'പരീക്ഷാ തീയതി കഴിഞ്ഞു · ക്രമീകരണങ്ങളിൽ മാറ്റാം':'Your exam date has passed · edit in settings';if(days===0)return ml?'ഇന്നാണ് പരീക്ഷ! ആശംസകൾ.':'Your exam is today. Good luck!';if(ml)return `${days} ദിവസത്തിനകം പരീക്ഷ${days<30?' · മോക്ക് പരീക്ഷകൾ പരിശീലിക്കൂ':''}`;return `${days} ${days===1?'day':'days'} to your exam${days<30?' · practise a mock exam':''}`}

function GoalRing({done,goal,loading,ml}:{done:number;goal:number;loading:boolean;ml:boolean}){
 const ratio=Math.min(1,goal?done/goal:0),r=26,c=2*Math.PI*r,met=done>=goal&&goal>0;
 return <div className={`goal-ring${met?' is-met':''}`} role="img" aria-label={ml?`ദിവസ ലക്ഷ്യം: ${done} / ${goal}`:`Daily goal: ${done} of ${goal} questions`}>
  <svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true"><circle cx="32" cy="32" r={r} className="goal-ring-track"/><circle cx="32" cy="32" r={r} className="goal-ring-fill" strokeDasharray={c} strokeDashoffset={c*(1-ratio)} transform="rotate(-90 32 32)"/></svg>
  <span className="goal-ring-label"><strong>{loading?'—':met?'✓':`${done}/${goal}`}</strong><small>{ml?'ലക്ഷ്യം':'goal'}</small></span>
 </div>;
}
function plural(value:number,singular:string,pluralForm:string){return new Intl.PluralRules('en').select(value)==='one'?singular:pluralForm}
