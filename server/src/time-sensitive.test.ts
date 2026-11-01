import test from 'node:test';
import assert from 'node:assert/strict';
import {isTimeSensitiveQuestion} from './time-sensitive.js';

test('detects current office-holder and volatile result questions',()=>{
 assert.equal(isTimeSensitiveQuestion('Who is the current Chief Minister of Kerala?'),true);
 assert.equal(isTimeSensitiveQuestion('Who was the latest award winner?'),true);
 assert.equal(isTimeSensitiveQuestion('നിലവിലെ മുഖ്യമന്ത്രിയുടെ പേര് എന്താണ്?'),true);
});

test('keeps stable history and science questions outside the time-sensitive set',()=>{
 assert.equal(isTimeSensitiveQuestion('When did the Vaikom Satyagraha begin?'),false);
 assert.equal(isTimeSensitiveQuestion('What is the chemical symbol for oxygen?'),false);
});
