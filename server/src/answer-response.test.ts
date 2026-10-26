import assert from 'node:assert/strict';
import test from 'node:test';
import {answerResponse} from './answer-response.js';

test('instant and quick answers return correctness and explanation',()=>{
 const result={isCorrect:false,correctOption:'C',explanation:'Review the rule.'};
 assert.deepEqual(answerResponse('practice',result),result);
 assert.deepEqual(answerResponse('quick',result),result);
});

test('mock answers save without revealing correctness',()=>{
 assert.deepEqual(answerResponse('mock',{isCorrect:false,correctOption:'C',explanation:'Hidden during exam.'}),{saved:true});
});
