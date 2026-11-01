'use client';
import {featureFlags} from './feature-flags';
import {daysUntilExam} from '../../server/src/exam-countdown';

type Topic={topic:string;marks:number};
type Props={name:string;dailyCount:number;dailyGoal:number;streak:number;progress:any;syllabus:Topic[];onStart:(config?:any)=>void;onPracticeTopic:(topic:string)=>void;onContinuePdf:()=>void;onOpenSyllabus:()=>void;reviewDue?:number;reviewTomorrow?:number;weekDays?:boolean[];unfinishedSession?:any;onResume?:(session:any)=>void;language?:'en'|'ml';targetExamDate?:string;onOpenSettings?:()=>void;learnerStats?:any;onOpenReview?:()=>void;onStartMock?:()=>void;loading?:boolean};
export default function TodayDashboard({name,dailyCount,dailyGoal,streak,unfinishedSession,onResume,language='en',targetExamDate,onOpenSettings,learnerStats,reviewDue=0,reviewTomorrow=0,onOpenReview,onOpenSyllabus,onContinuePdf,loading=false,onStart}:Props){
 const ml=language==='ml';
 return <section className="today-page">
  <header className="today-heading"><div><h1 className="title">{ml?`നമസ്കാരം, ${name}`:`Good ${new Date().getHours()<12?'morning':'day'}, ${name}.`}</h1><p className="today-subtitle">{ml?'ഇന്ന് ചെറിയൊരു പരിശീലനം മതി.':'A short, steady session is enough for today.'}</p>{featureFlags.examCountdown&&<p className="exam-countdown">{targetExamDate?countdownText(daysUntilExam(targetExamDate),ml):<button type="button" className="text-button" onClick={onOpenSettings}>{ml?'പരീക്ഷാ തീയതി ചേർക്കുക':'Set your exam date'}</button>}</p>}</div></header>
  <section className="today-summary-card today-summary-stable" aria-label={ml?'ഇന്നത്തെ സംഗ്രഹം':'Today summary'} aria-busy={loading}>
   <div className="eyebrow">{ml?'ഇന്നത്തെ സംഗ്രഹം':'TODAY'}</div>
   <div className="today-summary-stats"><span><strong>{loading?'—':Number(dailyCount)||0}</strong>{ml?' ചോദ്യങ്ങൾ':` ${plural(dailyCount,'question','questions')}`}</span><span><strong>{loading?'—':`${Number(dailyCount)||0} / ${Number(dailyGoal)||20}`}</strong>{ml?' ലക്ഷ്യചോദ്യങ്ങൾ':' daily goal'}</span><span><strong>{loading?'—':`${Math.round(Number(learnerStats?.todayAccuracy)||0)}%`}</strong>{ml?' കൃത്യത':' accuracy'}</span><span><strong>{loading?'—':Number(streak)||0}</strong>{ml?' ദിവസത്തെ തുടർച്ച':` ${plural(streak,'day','days')} streak`}</span></div>
  </section>
  <section className="today-plan today-primary-action"><div className="plan-copy"><div className="eyebrow">{ml?'അടുത്ത ചുവട്':'NEXT STEP'}</div><h2>{unfinishedSession?(ml?'സെഷൻ തുടരുക':'Continue your session'):(ml?'പരിശീലനം ആരംഭിക്കുക':'Start a practice session')}</h2><p>{unfinishedSession?(ml?'നിങ്ങളുടെ ഉത്തരം നൽകിയ ചോദ്യങ്ങൾ സംരക്ഷിച്ചിട്ടുണ്ട്.':'Your answered questions are saved.'):ml?'ഒരു ചെറിയ സെഷൻ തിരഞ്ഞെടുത്ത് തുടങ്ങാം.':'Choose a short session and begin.'}</p></div><button className="button plan-start" type="button" disabled={loading} onClick={()=>unfinishedSession?onResume?.(unfinishedSession):onStart()}>{unfinishedSession?(ml?'തുടരുക':'Continue'):(ml?'പരിശീലനം തുടങ്ങുക':'Start practice')} <span aria-hidden="true">→</span></button></section>
  <nav className="today-quick-links" aria-label={ml?'മറ്റ് പഠന പേജുകൾ':'Other study pages'}>
   <a className="text-button" href="/syllabus">{ml?'പാഠ്യപദ്ധതി':'Syllabus'} →</a>
   <a className="text-button" href="/papers">{ml?'ചോദ്യപേപ്പറുകൾ':'Question papers'} →</a>
   {reviewDue>0&&<a className="text-button" href="/review">{ml?`${reviewDue} ആവർത്തന ചോദ്യങ്ങൾ`:`Review ${reviewDue} due ${plural(reviewDue,'question','questions')}`} →</a>}
   {reviewTomorrow>0&&<span>{ml?`${reviewTomorrow} നാളെ ആവർത്തിക്കാം`:`${reviewTomorrow} due tomorrow`}</span>}
  </nav>
 </section>
}
function countdownText(days:number,ml:boolean){if(days<0)return ml?'പരീക്ഷാ തീയതി കഴിഞ്ഞു · ക്രമീകരണങ്ങളിൽ മാറ്റാം':'Your exam date has passed · edit in settings';if(days===0)return ml?'ഇന്നാണ് പരീക്ഷ! ആശംസകൾ.':'Your exam is today. Good luck!';if(ml)return `${days} ദിവസത്തിനകം പരീക്ഷ${days<30?' · മോക്ക് പരീക്ഷകൾ പരിശീലിക്കൂ':''}`;return `${days} ${days===1?'day':'days'} to your exam${days<30?' · practise a mock exam':''}`}

function plural(value:number,singular:string,pluralForm:string){return new Intl.PluralRules('en').select(value)==='one'?singular:pluralForm}
