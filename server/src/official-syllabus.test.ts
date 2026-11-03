import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

const syllabus=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../data/ldc-syllabus-503-2023.json',import.meta.url)),'utf8'));

test('official LDC syllabus reproduces the 503/2023 and 504/2023 100-mark structure',()=>{
 assert.deepEqual(syllabus.categoryNumbers,['503/2023','504/2023']);
 assert.deepEqual(syllabus.parts.map((part:any)=>part.marks),[50,20,10,10,10]);
 assert.equal(syllabus.parts.reduce((sum:number,part:any)=>sum+part.marks,0),syllabus.totalMarks);
 const generalKnowledge=syllabus.parts[0];
 assert.equal(generalKnowledge.sections.reduce((sum:number,section:any)=>sum+section.marks,0),50);
 assert.equal(generalKnowledge.sections.find((section:any)=>section.title==='Kerala: Governance and System of Administration').marks,5);
 assert.equal(generalKnowledge.sections.find((section:any)=>section.title==='Important Acts').marks,5);
 assert.ok(generalKnowledge.sections.every((section:any)=>section.groups.some((group:any)=>group.topics.length>0)));
 assert.match(syllabus.sourceUrl,/keralapsc\.gov\.in/);
});

test('regional language options are alternatives within the single 10-mark part',()=>{
 const regional=syllabus.parts.find((part:any)=>part.number==='V');
 assert.equal(regional.marks,10);
 assert.deepEqual(regional.sections.map((section:any)=>section.title),['Malayalam','Kannada','Tamil']);
 assert.ok(regional.sections.every((section:any)=>section.marks===10));
});
