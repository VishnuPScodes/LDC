import test from 'node:test';
import assert from 'node:assert/strict';
import {guestQuestionKeys,validGuestImportSessions,type GuestImportSession} from './guest-merge.js';

const now=new Date('2026-10-26T12:00:00.000Z');
const session=(overrides:Partial<GuestImportSession>={}):GuestImportSession=>({id:'e63f24a0-535c-42ef-bcf8-d8dfe7d95e97',startedAt:'2026-10-26T10:00:00.000Z',completedAt:'2026-10-26T10:30:00.000Z',mode:'practice',durationSeconds:1800,answers:[{paperNumber:16,questionNumber:64,selectedOption:'A',answeredAt:'2026-10-26T10:10:00.000Z',timeTakenMs:10000}],...overrides});

test('guest imports accept only recent, complete sessions and answers within their session',()=>{
 const accepted=session(),expired=session({startedAt:'2026-10-18T10:00:00.000Z',completedAt:'2026-10-18T10:30:00.000Z'}),future=session({startedAt:'2026-10-26T13:00:00.000Z',completedAt:'2026-10-26T13:30:00.000Z'}),outOfBounds=session({answers:[{...accepted.answers[0],answeredAt:'2026-10-26T10:40:00.000Z'}]});
 assert.deepEqual(validGuestImportSessions([accepted,expired,future,outOfBounds],now),[accepted]);
});

test('guest question lookup keys are unique paper and question pairs',()=>{
 const first=session(),second=session({id:'ed5121db-0ae6-4daa-91df-e70c68ce0a61',answers:[...first.answers,{...first.answers[0],questionNumber:65}]});
 assert.deepEqual(guestQuestionKeys([first,second]),[{paperNumber:16,questionNumber:64},{paperNumber:16,questionNumber:65}]);
});
