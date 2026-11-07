import test from 'node:test';
import assert from 'node:assert/strict';
import {dailyNumber,istDateKey,pickDailyIds} from './daily-challenge.js';

test('istDateKey uses the Asia/Kolkata calendar date',()=>{
 assert.equal(istDateKey(new Date('2026-03-10T18:29:59Z')),'2026-03-10');
 assert.equal(istDateKey(new Date('2026-03-10T18:30:00Z')),'2026-03-11');
 assert.equal(istDateKey(new Date('2026-12-31T20:00:00Z')),'2027-01-01');
});

test('dailyNumber counts days from the launch date starting at #1',()=>{
 assert.equal(dailyNumber('2026-01-01'),1);
 assert.equal(dailyNumber('2026-01-02'),2);
 assert.equal(dailyNumber('2026-03-01'),60);
 assert.equal(dailyNumber('2027-01-01'),366);
});

test('pickDailyIds is deterministic, order-independent and sized',()=>{
 const ids=Array.from({length:500},(_,index)=>`id${index}`),reversed=ids.slice().reverse();
 const first=pickDailyIds(ids,'2026-05-05'),again=pickDailyIds(reversed,'2026-05-05');
 assert.equal(first.length,10);assert.equal(new Set(first).size,10);assert.deepEqual(first,again);
 assert.ok(first.every(id=>ids.includes(id)));
 assert.notDeepEqual(pickDailyIds(ids,'2026-05-06'),first);
 assert.equal(pickDailyIds(ids,'2026-05-05',25).length,25);
 assert.deepEqual(pickDailyIds(['b','a'],'2026-05-05').sort(),['a','b']);
 assert.deepEqual(pickDailyIds([],'2026-05-05'),[]);
});
