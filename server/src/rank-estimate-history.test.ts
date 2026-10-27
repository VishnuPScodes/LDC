import test from 'node:test';
import assert from 'node:assert/strict';
import { currentCycleCsvHeaders, historyCsvHeaders, parseCsv, parseCurrentCycleRow, parseHistoryRow } from './rank-estimate/history-data.js';

test('history and current-cycle templates have headers only and parse to no records', () => {
  assert.deepEqual(parseCsv(`${historyCsvHeaders.join(',')}\n`, historyCsvHeaders), []);
  assert.deepEqual(parseCsv(`${currentCycleCsvHeaders.join(',')}\n`, currentCycleCsvHeaders), []);
});

test('history figures require a source URL and note, and cutoffs stay within the score scale', () => {
  const row = Object.fromEntries(historyCsvHeaders.map(header => [header, '']));
  Object.assign(row, { district: 'Thrissur', exam_year: '2023', notification_no: 'TEST ONLY', main_list_size: '250' });
  assert.throws(() => parseHistoryRow(row), /source_url and source_note/);
  Object.assign(row, { source_url: 'https://psc.example.test/list', source_note: 'TEST ONLY fixture' });
  assert.equal(parseHistoryRow(row).mainListSize, 250);
  row.main_list_cutoff = '101';
  assert.throws(() => parseHistoryRow(row), /between 0 and 100/);
});

test('empty historical fields remain null and malformed districts, sizes, and numbers are rejected', () => {
  const row = Object.fromEntries(historyCsvHeaders.map(header => [header, '']));
  Object.assign(row, { district: 'Thrissur', exam_year: '2021', notification_no: 'TEST ONLY' });
  const parsed = parseHistoryRow(row);
  assert.equal(parsed.attendees, null);
  assert.equal(parsed.mainListCutoff, null);
  row.main_list_size = '0'; row.source_url = 'https://psc.example.test'; row.source_note = 'TEST ONLY';
  assert.throws(() => parseHistoryRow(row), /must be positive/);
  row.district = 'Kerala'; row.main_list_size = '';
  assert.throws(() => parseHistoryRow(row), /Unknown district/);
});

test('current attendance ratio is nullable, range-checked, and sourced when supplied', () => {
  const row = Object.fromEntries(currentCycleCsvHeaders.map(header => [header, '']));
  Object.assign(row, { district: 'Kozhikode', expected_attendance_ratio: '0.75' });
  assert.throws(() => parseCurrentCycleRow(row), /source_url and source_note/);
  row.expected_attendance_ratio = '1.2'; row.source_url = 'https://psc.example.test'; row.source_note = 'TEST ONLY fixture';
  assert.throws(() => parseCurrentCycleRow(row), /between 0 and 1/);
  row.expected_attendance_ratio = '';
  assert.equal(parseCurrentCycleRow(row).expectedAttendanceRatio, null);
});

test('CSV parser preserves quoted commas and rejects unbalanced rows', () => {
  const headers = ['district', 'source_note'];
  assert.equal(parseCsv('district,source_note\nThrissur,"Official list, page 4"', headers)[0].source_note, 'Official list, page 4');
  assert.throws(() => parseCsv('district,source_note\nThrissur', headers), /expected 2/);
});
