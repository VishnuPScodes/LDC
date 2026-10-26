import test from 'node:test';
import assert from 'node:assert/strict';
import {pickGuestQuestions} from './guest-session.js';

test('guest sessions return a unique requested-size sample from the selected public pool',()=>{
 const pool=Array.from({length:80},(_,index)=>({id:`q${index}`})),sample=pickGuestQuestions(pool,20,()=>.5);
 assert.equal(sample.length,20);assert.equal(new Set(sample.map(item=>item.id)).size,20);assert.ok(sample.every(item=>pool.includes(item)));
});

test('guest session selection caps at the available verified questions and rejects invalid counts',()=>{
 const pool=[{id:'q1'},{id:'q2'}];assert.deepEqual(pickGuestQuestions(pool,20,()=>.5),pool);assert.deepEqual(pickGuestQuestions(pool,0),[]);assert.deepEqual(pickGuestQuestions(pool,201),[]);
});
