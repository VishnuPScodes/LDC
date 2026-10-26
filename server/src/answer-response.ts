export function answerResponse(mode:string,result:{isCorrect:boolean;correctOption:string;explanation?:string|null}){
 if(mode==='mock')return {saved:true};
 return {isCorrect:result.isCorrect,correctOption:result.correctOption,explanation:result.explanation||null};
}
