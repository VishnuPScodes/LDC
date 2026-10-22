import test from 'node:test';import assert from 'node:assert/strict';import {calculateScore,weakAreas,checkAnswer} from './scoring.js';
test('answer checking accepts only the verified option',()=>{assert.equal(checkAnswer('B','B'),true);assert.equal(checkAnswer('A','B'),false);assert.equal(checkAnswer('B',null),false)});
test('negative marking deducts one third for each wrong answer',()=>assert.equal(calculateScore(7,3).marks,6));
test('weak areas require three attempts and rank by weakness weighted by syllabus marks',()=>{const rows=[{topic:'A',attempts:4,correct:1,syllabusMarks:10},{topic:'B',attempts:2,correct:0,syllabusMarks:20}];assert.deepEqual(weakAreas(rows).map(x=>x.topic),['A'])});
test('weak areas rank by accuracy deficit weighted by syllabus marks',()=>{const rows=[{topic:'High-mark',attempts:3,correct:1,syllabusMarks:10},{topic:'Low-mark',attempts:3,correct:0,syllabusMarks:3}];assert.deepEqual(weakAreas(rows).map(x=>x.topic),['High-mark','Low-mark'])});
