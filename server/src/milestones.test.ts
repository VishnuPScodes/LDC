import assert from 'node:assert/strict';
import test from 'node:test';
import {computeMilestones} from './milestones.js';

test('milestones award from saved history and dependent dates never precede prerequisites',()=>{
 const questions=Array.from({length:100},(_,index)=>({_id:`q${index}`,topic:'History',paperNumber:11,eligibleForPractice:true,needsReview:false}));
 const session={_id:'s1',settings:{mode:'practice',order:'pdf',dailyGoal:200},status:'completed',startedAt:new Date('2026-01-01T00:00:00Z'),completedAt:new Date('2026-01-01T12:00:00Z'),questionIds:questions.map(row=>row._id)};
 const events=questions.map((question,index)=>({session,question,answer:{questionId:question._id,isCorrect:index<60,selectedOption:'A'},date:new Date(Date.UTC(2026,0,2,0,index))}));
 const awards=computeMilestones(events,[session],questions,200,2,{s1:{points:100,levelBefore:1,levelAfter:2}},new Date('2026-01-05T00:00:00Z'));
 const byId=new Map(awards.map(item=>[item.id,item]));
 assert.equal(byId.get('first-question')?.earned,true);
 assert.equal(byId.get('questions-100')?.earned,true);
 assert.equal(byId.get('topic-1')?.earned,true);
 assert.equal(byId.get('full-paper')?.earned,true);
 assert.equal(byId.get('level-2')?.earned,true);
 assert.ok(new Date(byId.get('first-session')!.earnedAt!).getTime()>=new Date(byId.get('first-question')!.earnedAt!).getTime());
 assert.equal(byId.get('questions-500')?.progress,'100 / 500');
 assert.equal(byId.get('first-session')?.sessionId,'s1');
});
