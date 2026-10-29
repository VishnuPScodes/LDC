type Props={paperCode?:string;paperNumber?:number;examDate?:string;sourcePage?:number;questionNumber?:number;compact?:boolean;text?:string};

export default function QuestionSource({paperCode,paperNumber,examDate,sourcePage,questionNumber,compact=false,text=''}:Props){
  const date=examDate?new Date(`${examDate.slice(0,10)}T00:00:00Z`):null;
  const dateLabel=date&&!Number.isNaN(date.getTime())?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date):null;
  const parts=[dateLabel?`Asked ${dateLabel}`:null,paperCode?`Paper code ${paperCode}`:paperNumber?`Paper ${paperNumber}`:null,!compact&&sourcePage?`Page ${sourcePage}`:null].filter(Boolean);
  const oldYear=date&&!Number.isNaN(date.getTime())&&date.getUTCFullYear()<=new Date().getUTCFullYear()-1;
  const asksCurrent=/(\bcurrent\b|\bnow\b|\bpresent\b|നിലവിലെ|ഇപ്പോഴത്തെ|ഇപ്പോൾ)/iu.test(text);
  return <>{parts.length?<span className="question-origin">{questionNumber?`Question ${questionNumber} · `:''}{parts.join(' · ')}</span>:questionNumber?<span className="question-origin">Question {questionNumber}</span>:null}{oldYear&&asksCurrent&&<span className="historical-current-note" role="note">{/[ഀ-ൿ]/u.test(text)?`ചോദിച്ചത് ${date!.getUTCFullYear()}ൽ — അന്നത്തെ ഉത്തരമാണ്`:`Asked in ${date!.getUTCFullYear()} — answer reflects that time`}</span>}</>;
}
