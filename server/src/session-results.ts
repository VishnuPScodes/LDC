import {calculateScore} from './scoring.js';

export function sessionScore(total:number,answers:{selectedOption?:string;isCorrect?:boolean|null}[]){
 const attempted=answers.filter(answer=>!!answer.selectedOption);
 const correct=attempted.filter(answer=>answer.isCorrect).length;
 const wrong=attempted.length-correct;
 const skipped=Math.max(0,total-attempted.length);
 return {...calculateScore(correct,wrong),skipped,attempted:attempted.length};
}
