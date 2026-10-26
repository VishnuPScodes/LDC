export type GuestImportSession={id:string;startedAt:string;completedAt:string;mode:'practice'|'mock';durationSeconds:number;answers:{paperNumber:number;questionNumber:number;selectedOption:string;answeredAt:string;timeTakenMs:number}[]};

export function validGuestImportSessions(sessions:GuestImportSession[],now=new Date()){
 const since=now.getTime()-7*86400000,until=now.getTime();
 return sessions.filter(session=>{const start=Date.parse(session.startedAt),complete=Date.parse(session.completedAt);return Number.isFinite(start)&&Number.isFinite(complete)&&start>=since&&start<=complete&&complete<=until&&session.answers.every(answer=>{const at=Date.parse(answer.answeredAt);return Number.isFinite(at)&&at>=start&&at<=complete})});
}

export function guestQuestionKeys(sessions:GuestImportSession[]){return [...new Set(sessions.flatMap(session=>session.answers.map(answer=>`${answer.paperNumber}:${answer.questionNumber}`)))].map(key=>{const [paperNumber,questionNumber]=key.split(':').map(Number);return{paperNumber,questionNumber}})}
