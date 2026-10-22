type Props={paperCode?:string;paperNumber?:number;examDate?:string;sourcePage?:number;questionNumber?:number;compact?:boolean};

export default function QuestionSource({paperCode,paperNumber,examDate,sourcePage,questionNumber,compact=false}:Props){
  const date=examDate?new Date(`${examDate.slice(0,10)}T00:00:00Z`):null;
  const dateLabel=date&&!Number.isNaN(date.getTime())?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(date):null;
  const parts=[dateLabel?`Asked ${dateLabel}`:null,paperCode?`Paper code ${paperCode}`:paperNumber?`Paper ${paperNumber}`:null,!compact&&sourcePage?`Page ${sourcePage}`:null].filter(Boolean);
  if(!parts.length)return questionNumber?<>Question {questionNumber}</>:null;
  return <span className="question-origin">{questionNumber?`Question ${questionNumber} · `:''}{parts.join(' · ')}</span>;
}
