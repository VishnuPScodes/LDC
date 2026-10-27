export type MockCandidate = { _id: unknown; topic: string; [key: string]: unknown };
export type SelectedMockQuestion<T extends MockCandidate = MockCandidate> = { question: T; sectionKey: string; seenBefore: boolean; difficulty: number };
type MockConfig = any;

export function selectMockQuestionSet<T extends MockCandidate>(candidates:T[],previouslyAnsweredIds:Set<string>,config:MockConfig,random=Math.random,difficultyByQuestion=new Map<string,number>()){
 const selected:SelectedMockQuestion<T>[]=[],used=new Set<string>(),imbalanceReasons:string[]=[];
 for(const section of config.syllabus.sections){
  const direct=candidates.filter(question=>(section.topics as readonly string[]).includes(question.topic)),fallback=candidates.filter(question=>(section.fallbackTopics as readonly string[]).includes(question.topic));
  const allowed=[...new Map([...direct,...fallback].map(question=>[String(question._id),question])).values()].filter(question=>!used.has(String(question._id)));
  const directIds=new Set(direct.map(question=>String(question._id)));
  const unseenDirect=shuffle(allowed.filter(question=>directIds.has(String(question._id))&&!previouslyAnsweredIds.has(String(question._id))),random);
  const unseenFallback=shuffle(allowed.filter(question=>!directIds.has(String(question._id))&&!previouslyAnsweredIds.has(String(question._id))),random);
  const seenDirect=shuffle(allowed.filter(question=>directIds.has(String(question._id))&&previouslyAnsweredIds.has(String(question._id))),random);
  const seenFallback=shuffle(allowed.filter(question=>!directIds.has(String(question._id))&&previouslyAnsweredIds.has(String(question._id))),random);
  const chosen=[...unseenDirect,...unseenFallback,...seenDirect,...seenFallback].slice(0,section.marks);
  if(chosen.length<section.marks)imbalanceReasons.push(`${section.title}: only ${chosen.length} of ${section.marks} questions available.`);
  if(chosen.some(question=>!directIds.has(String(question._id))))imbalanceReasons.push(`${section.title}: filled using a related syllabus section.`);
  for(const question of chosen){const id=String(question._id);used.add(id);selected.push({question,sectionKey:section.key,seenBefore:previouslyAnsweredIds.has(id),difficulty:difficultyByQuestion.get(id)??config.difficulty.neutralDefault})}
 }
 const questions=shuffle(selected,random),repeatCount=questions.filter(item=>item.seenBefore).length,questionCount=questions.length;
 return{questions,mockSetId:createMockSetId(random),repeatCount,repeatShare:questionCount?repeatCount/questionCount:0,difficulty:questionCount?questions.reduce((sum,item)=>sum+item.difficulty,0)/questionCount:config.difficulty.neutralDefault,balanced:questionCount===config.mock.questionCount&&imbalanceReasons.length===0,imbalanceReasons:[...new Set(imbalanceReasons)]};
}

export function calculateMockSectionScores(config:MockConfig,questionSections:{questionId:string;sectionKey:string}[],answers:{questionId:string;selectedOption?:string|null;isCorrect?:boolean|null}[]){
 const byId=new Map(answers.map(answer=>[answer.questionId,answer]));
 return config.syllabus.sections.map((section:any)=>{const rows=questionSections.filter(question=>question.sectionKey===section.key),saved=rows.map(row=>byId.get(row.questionId)).filter((answer):answer is NonNullable<typeof answer>=>!!answer),correct=saved.filter(answer=>!!answer.selectedOption&&answer.isCorrect===true).length,wrong=saved.filter(answer=>!!answer.selectedOption&&answer.isCorrect===false).length,skipped=Math.max(0,rows.length-correct-wrong),attempted=correct+wrong;return{sectionKey:section.key,title:section.title,questionCount:rows.length,possibleMarks:rows.length,correct,wrong,skipped,attempted,marksScored:correct+wrong*config.marking.wrong,marksLost:wrong*-config.marking.wrong,accuracy:attempted?correct/attempted*100:0}});
}

export function evaluateMockRankEligibility(config:MockConfig,input:{quitEarly:boolean;durationSeconds:number;elapsedSeconds:number;answeredCount:number;questionCount:number;repeatShare:number}){
 const answeredShare=input.questionCount?input.answeredCount/input.questionCount:0,fullTimeUsed=input.elapsedSeconds>=input.durationSeconds*config.mock.fullTimeShare;let reason:string|null=null;
 if(input.quitEarly)reason='This mock was quit before submission.';
 else if(input.repeatShare>config.mock.maximumRepeatShare)reason='The repeat-question share is above the allowed limit.';
 else if(answeredShare<config.mock.minimumAnsweredShare&&!fullTimeUsed)reason=`Answer at least ${Math.round(config.mock.minimumAnsweredShare*100)}% of the questions or use the full time.`;
 return{counted:reason===null,reason,answeredShare,fullTimeUsed};
}

function shuffle<T>(items:T[],random:()=>number){const result=items.slice();for(let index=result.length-1;index>0;index--){const swap=Math.floor(random()*(index+1));[result[index],result[swap]]=[result[swap],result[index]]}return result}
function createMockSetId(random:()=>number){const timestamp=Date.now().toString(36),suffix=Array.from({length:12},()=>Math.floor(random()*36).toString(36)).join('');return`${timestamp}-${suffix}`}
