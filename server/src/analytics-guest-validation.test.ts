import test from 'node:test';
import assert from 'node:assert/strict';
import {guestAnalyticsValidationMiddleware,validateGuestAnalyticsPayload} from './analytics/guest-validation.js';

test('guest analytics accepts valid empty and populated history and normalizes range',()=>{
 assert.deepEqual(validateGuestAnalyticsPayload({sessions:[],range:'7'}),{sessions:[],range:'7'});
 assert.equal(validateGuestAnalyticsPayload({sessions:[{answers:[{paperNumber:1,questionNumber:2,selectedOption:'A'}]}],range:'all'})?.range,'all');
 assert.equal(validateGuestAnalyticsPayload({sessions:[],range:'invalid'})?.range,'30');
});

test('guest analytics rejects malformed histories and oversized session or answer lists',()=>{
 for(const value of [null,[],{}, {sessions:'no'}, {sessions:Array(31).fill({answers:[]})}, {sessions:[null]}, {sessions:[{answers:'no'}]}, {sessions:[{answers:Array(201).fill({})}]}, {sessions:[{answers:[null]}]}, {sessions:[{answers:[],questionIds:[4]}]}, {sessions:[{answers:[],mockMetadata:{questionSections:[null]}}]}])assert.equal(validateGuestAnalyticsPayload(value),null);
});

test('guest validation middleware returns 400 for invalid input and normalizes valid ranges',()=>{
 let nextCalled=false,status=0,body:any=null;const response={status(code:number){status=code;return this},json(value:any){body=value;return value}};
 guestAnalyticsValidationMiddleware({body:{sessions:[{answers:[null]}]}},response,()=>{nextCalled=true});
 assert.equal(status,400);assert.equal(body.error,'Guest practice history is invalid.');assert.equal(nextCalled,false);
 const request:any={body:{sessions:[],range:'bad'}};guestAnalyticsValidationMiddleware(request,response,()=>{nextCalled=true});
 assert.equal(nextCalled,true);assert.equal(request.body.range,'30');assert.deepEqual(request.body.sessions,[]);
});
