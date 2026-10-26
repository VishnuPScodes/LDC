import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {isPublicQuestion} from './public-question.js';
import {PAPER_METADATA} from './paper-metadata.js';

const questions=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../data/questions.json',import.meta.url)),'utf8'));
const publicQuestions=questions.filter(isPublicQuestion);

test('public question eligibility requires a verified answer and four complete options',()=>{
 assert.equal(isPublicQuestion(questions.find((row:any)=>row.eligibleForPractice&&!row.needsReview)),true);
 assert.equal(isPublicQuestion({...questions[0],needsReview:true}),false);
 assert.equal(isPublicQuestion({...questions[0],eligibleForPractice:false}),false);
 assert.equal(isPublicQuestion({...questions[0],correctOption:null}),false);
 assert.equal(isPublicQuestion({...questions[0],options:questions[0].options.slice(0,3)}),false);
});

test('public paper metadata resolves unique paper slugs and question groups',()=>{
 const groups=new Map<number,number>();for(const question of publicQuestions)groups.set(question.paperNumber,(groups.get(question.paperNumber)||0)+1);
 const slugs=Object.values(PAPER_METADATA).map((paper:any)=>paper.paperCode.toLowerCase().replaceAll('/','-'));
 assert.equal(new Set(slugs).size,slugs.length);
 assert.equal(groups.size,50);
 assert.ok([...groups.values()].every(count=>count>0));
 assert.ok(publicQuestions.every((question:any)=>Boolean(PAPER_METADATA[question.paperNumber])));
});

test('reviewed 2014 topic corrections remain present in the public eligible bank',()=>{
 const expected=new Map([[64,'Geography'],[66,'History'],[67,'Geography'],[69,'Chemistry']]);
 for(const [questionNumber,topic] of expected){const question=publicQuestions.find((row:any)=>row.paperNumber===16&&row.questionNumber===questionNumber);assert.ok(question);assert.equal(question.topic,topic)}
});
