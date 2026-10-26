import assert from 'node:assert/strict';
import test from 'node:test';
import { daysUntilExam } from './exam-countdown.js';

test('exam countdown compares local calendar days and updates at midnight',()=>{
 assert.equal(daysUntilExam('2026-01-03',new Date(2026,0,1,23,59)),2);
 assert.equal(daysUntilExam('2026-01-02',new Date(2026,0,2,0,1)),0);
 assert.equal(daysUntilExam('2025-12-31',new Date(2026,0,1)), -1);
});
