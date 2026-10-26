import assert from 'node:assert/strict';
import test from 'node:test';
import {computeLearnerStats,levelForPoints,pointsForLevel} from './learner-stats.js';

const questions=Array.from({length:155},(_,index)=>({_id:`q${index}`,topic:index===0?'History':'Geography',eligibleForPractice:true,needsReview:false}));
const answered=(questionId:string,isCorrect:boolean,answeredAt='2026-10-01T04:00:00.000Z')=>({questionId,selectedOption:'A',isCorrect,answeredAt});

test('points reward correct answers once per question per day and cap practice points',()=>{
 const answers=questions.slice(0,152).map(q=>answered(q._id,true));
 answers.push(answered('q0',true));answers.push(answered('q154',false));
 const stats=computeLearnerStats([{settings:{mode:'practice'},answers}],questions,200,new Date('2026-10-01T12:00:00.000Z'));
 assert.equal(stats.pointsBreakdown.practice,300);
 assert.equal(stats.questionsAnswered,154);
});

test('a wrong first attempt blocks farming a second same-day answer for points',()=>{
 const sessions=[{settings:{mode:'practice'},answers:[answered('q0',false)]},{settings:{mode:'quick'},answers:[answered('q0',true)]}];
 const stats=computeLearnerStats(sessions,questions,20,new Date('2026-10-01T12:00:00.000Z'));
 assert.equal(stats.points,0);
});

test('review clears, daily goal, and completed mocks receive their configured bonuses',()=>{
 const day='2026-10-01T04:00:00.000Z';
 const practice=questions.slice(0,2).map(q=>answered(q._id,true,day));
 const review=[answered('q2',true,day)];
 const mock=[answered('q3',true,day),answered('q4',false,day)];
 const sessions=[{settings:{mode:'practice'},answers:practice},{settings:{mode:'practice',reviewOnly:true},answers:review},{settings:{mode:'mock'},answers:mock,status:'completed',completedAt:day}];
 const stats=computeLearnerStats(sessions,questions,2,new Date('2026-10-01T12:00:00.000Z'));
 assert.equal(stats.pointsBreakdown.practice,6);
 assert.equal(stats.pointsBreakdown.review,3);
 assert.equal(stats.pointsBreakdown.goal,10);
 assert.equal(stats.pointsBreakdown.mock,25);
 assert.equal(stats.points,44);
});

test('quitting a mock removes its completion bonus and immediate quits earn no points',()=>{
 const stats=computeLearnerStats([{settings:{mode:'mock'},answers:[],status:'completed',quitEarly:true},{settings:{mode:'mock'},answers:[answered('q1',true)],status:'completed',quitEarly:true}],questions,20,new Date('2026-10-01T12:00:00.000Z'));
 assert.equal(stats.pointsBreakdown.mock,0);
 assert.equal(stats.points,2);
});

test('level thresholds use the shared increasing curve',()=>{
 assert.equal(pointsForLevel(1),0);
 assert.equal(pointsForLevel(2),100);
 assert.equal(pointsForLevel(3),283);
 assert.equal(levelForPoints(282),2);
 assert.equal(levelForPoints(283),3);
});

test('screen projections share the same level, points, and counts',()=>{
 const stats=computeLearnerStats([{settings:{mode:'practice'},answers:[answered('q0',true)]}],questions,20,new Date('2026-10-01T12:00:00.000Z'));
 const today=stats,progress=stats,journey=stats,milestones=stats;
 const core=(value:any)=>({level:value.level,points:value.points,questionsAnswered:value.questionsAnswered,sessionCount:value.sessionCount});
 assert.deepEqual(core(today),core(progress));assert.deepEqual(core(today),core(journey));assert.deepEqual(core(today),core(milestones));
});
