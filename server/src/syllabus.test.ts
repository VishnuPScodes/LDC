import assert from 'node:assert/strict';
import test from 'node:test';
import type {NextFunction,Request,Response} from 'express';
import {syllabusHandler} from './syllabus.js';

test('syllabus handler returns the complete topic list',()=>{
 let result:unknown;
 const res={json(value:unknown){result=value;return this}} as unknown as Response;
 let error:unknown;
 const next=((value?:unknown)=>{error=value}) as NextFunction;
 syllabusHandler({} as Request,res,next);
 assert.equal(error,undefined);
 assert.ok(Array.isArray(result));
 assert.ok((result as {topic:string;marks:number}[]).length>=10);
 assert.ok((result as {topic:string;marks:number}[]).every(row=>row.topic&&row.marks>0));
});
