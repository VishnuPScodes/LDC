import { rankEstimateConfig, type RankSectionKey } from './rank-estimate/config.js';
import { calculateMockSectionScores as calculate, evaluateMockRankEligibility as eligibility, selectMockQuestionSet as select, type MockCandidate } from './mock-exam-core.js';

export type { MockCandidate, SelectedMockQuestion } from './mock-exam-core.js';
export type MockSectionScore = { sectionKey:RankSectionKey;title:string;questionCount:number;possibleMarks:number;correct:number;wrong:number;skipped:number;attempted:number;marksScored:number;marksLost:number;accuracy:number };

export function selectMockQuestionSet<T extends MockCandidate>(candidates:T[],previouslyAnsweredIds:Set<string>,random=Math.random,difficultyByQuestion=new Map<string,number>()){
 return select(candidates,previouslyAnsweredIds,rankEstimateConfig,random,difficultyByQuestion);
}
export function calculateMockSectionScores(questionSections:{questionId:string;sectionKey:RankSectionKey}[],answers:{questionId:string;selectedOption?:string|null;isCorrect?:boolean|null}[]):MockSectionScore[]{
 return calculate(rankEstimateConfig,questionSections,answers) as MockSectionScore[];
}
export function evaluateMockRankEligibility(input:{quitEarly:boolean;durationSeconds:number;elapsedSeconds:number;answeredCount:number;questionCount:number;repeatShare:number}){
 return eligibility(rankEstimateConfig,input);
}
