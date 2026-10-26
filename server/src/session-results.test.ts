import assert from 'node:assert/strict';
import test from 'node:test';
import {sessionScore} from './session-results.js';

test('session results include correct, attempted, accuracy, and skips',()=>{
 assert.deepEqual(sessionScore(4,[
  {selectedOption:'A',isCorrect:true},
  {selectedOption:'B',isCorrect:false},
  {selectedOption:'C',isCorrect:true},
  {},
 ]),{correct:2,wrong:1,skipped:1,attempted:3,marks:1.6666666666666667,accuracy:66.66666666666666});
});

test('quitting before answering produces a valid empty result',()=>{
 assert.deepEqual(sessionScore(3,[]),{correct:0,wrong:0,skipped:3,attempted:0,marks:0,accuracy:0});
});
