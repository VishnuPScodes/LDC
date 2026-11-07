import assert from 'node:assert/strict';
import test from 'node:test';
import {savedNoteSchema,toSavedItem,SAVED_NOTE_MAX} from './saved-questions.js';

test('saved note is optional and trimmed',()=>{
 assert.deepEqual(savedNoteSchema.parse({}),{});
 assert.deepEqual(savedNoteSchema.parse({note:'  remember the year  '}),{note:'remember the year'});
 assert.deepEqual(savedNoteSchema.parse({note:'   '}),{note:''});
});

test('saved note rejects long notes, wrong types and unknown fields',()=>{
 assert.equal(savedNoteSchema.safeParse({note:'x'.repeat(SAVED_NOTE_MAX)}).success,true);
 assert.equal(savedNoteSchema.safeParse({note:'x'.repeat(SAVED_NOTE_MAX+1)}).success,false);
 assert.equal(savedNoteSchema.safeParse({note:42}).success,false);
 assert.equal(savedNoteSchema.safeParse({note:'ok',userId:'someone-else'}).success,false);
});

test('saved item uses the review question shape plus note and savedAt',()=>{
 const item=toSavedItem({note:null,createdAt:new Date('2026-01-02T03:04:05Z'),questionId:{_id:'abc',questionNumber:7,text:'Q?',options:[{key:'A',text:'One',_id:'x'}],topic:'History',correctOption:'A',paperCode:'P1',secret:'nope'}});
 assert.deepEqual(item.question.options,[{key:'A',text:'One'}]);
 assert.equal(item.question._id,'abc');
 assert.equal(item.question.explanation,null);
 assert.equal((item.question as any).secret,undefined);
 assert.equal(item.note,'');
 assert.equal(item.savedAt,'2026-01-02T03:04:05.000Z');
});
