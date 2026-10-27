import { rankEstimateConfig } from './config.js';

export const historyCsvHeaders = [
  'district', 'exam_year', 'notification_no', 'exam_date', 'applicants', 'attendees',
  'main_list_size', 'main_list_cutoff', 'supplementary_list_size', 'supplementary_list_cutoff',
  'short_list_size', 'short_list_cutoff', 'top_score', 'source_url', 'source_note', 'verified_by', 'verified_at',
];
export const currentCycleCsvHeaders = [
  'district', 'applicants', 'expected_attendance_ratio', 'exam_date', 'source_url', 'source_note',
];

const metricColumns = ['applicants', 'attendees', 'main_list_size', 'main_list_cutoff', 'supplementary_list_size', 'supplementary_list_cutoff', 'short_list_size', 'short_list_cutoff', 'top_score'] as const;
const rankColumns = new Set(['main_list_size', 'supplementary_list_size', 'short_list_size']);
const scoreColumns = new Set(['main_list_cutoff', 'supplementary_list_cutoff', 'short_list_cutoff', 'top_score']);

export function parseHistoryRow(row: Record<string, string>) {
  const district = required(row.district, 'district');
  if (!(rankEstimateConfig.districts as readonly string[]).includes(district)) throw new Error(`Unknown district: ${district}`);
  const values: Record<string, unknown> = {
    district,
    examYear: integer(required(row.exam_year, 'exam_year'), 'exam_year', 1),
    notificationNo: required(row.notification_no, 'notification_no'),
    examDate: nullableText(row.exam_date),
    sourceUrl: nullableText(row.source_url),
    sourceNote: nullableText(row.source_note),
    verifiedBy: nullableText(row.verified_by),
    verifiedAt: dateValue(row.verified_at, 'verified_at'),
  };
  for (const column of metricColumns) {
    const value = numericValue(row[column], column);
    if (value !== null) {
      if (rankColumns.has(column) && value <= 0) throw new Error(`${column} must be positive.`);
      if (scoreColumns.has(column) && (value < rankEstimateConfig.score.minimum || value > rankEstimateConfig.score.maximum)) throw new Error(`${column} must be between ${rankEstimateConfig.score.minimum} and ${rankEstimateConfig.score.maximum}.`);
    }
    values[toCamel(column)] = value;
  }
  if (metricColumns.some(column => values[toCamel(column)] !== null)) requireSource(values.sourceUrl, values.sourceNote);
  return values;
}

export function parseCurrentCycleRow(row: Record<string, string>) {
  const district = required(row.district, 'district');
  if (!(rankEstimateConfig.districts as readonly string[]).includes(district)) throw new Error(`Unknown district: ${district}`);
  const applicants = numericValue(row.applicants, 'applicants');
  const expectedAttendanceRatio = numericValue(row.expected_attendance_ratio, 'expected_attendance_ratio');
  if (applicants !== null && applicants <= 0) throw new Error('applicants must be positive.');
  if (expectedAttendanceRatio !== null && (expectedAttendanceRatio < 0 || expectedAttendanceRatio > 1)) throw new Error('expected_attendance_ratio must be between 0 and 1.');
  const sourceUrl = nullableText(row.source_url), sourceNote = nullableText(row.source_note);
  if (applicants !== null || expectedAttendanceRatio !== null) requireSource(sourceUrl, sourceNote);
  return {
    district,
    applicants,
    expectedAttendanceRatio,
    examDate: dateValue(row.exam_date, 'exam_date'),
    sourceUrl,
    sourceNote,
  };
}

export function parseCsv(content: string, expectedHeaders: readonly string[]) {
  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim().length > 0);
  if (!lines.length) throw new Error('CSV is empty.');
  const headers = splitCsvLine(lines[0]).map(header => header.trim());
  if (headers.length !== expectedHeaders.length || expectedHeaders.some((header, index) => headers[index] !== header)) {
    throw new Error(`CSV header must be exactly: ${expectedHeaders.join(',')}`);
  }
  return lines.slice(1).map((line, index) => {
    const fields = splitCsvLine(line);
    if (fields.length !== headers.length) throw new Error(`CSV row ${index + 2} has ${fields.length} columns; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, fieldIndex) => [header, fields[fieldIndex].trim()]));
  });
}

function splitCsvLine(line: string) {
  const fields: string[] = [];
  let field = '', quoted = false;
  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { field += '"'; index++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { fields.push(field); field = ''; }
    else field += char;
  }
  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  fields.push(field);
  return fields;
}

function required(value: string | undefined, field: string) {
  const text = value?.trim();
  if (!text) throw new Error(`${field} is required.`);
  return text;
}
function nullableText(value: string | undefined) { return value?.trim() || null; }
function numericValue(value: string | undefined, field: string) {
  if (!value?.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${field} must be numeric.`);
  return number;
}
function integer(value: string, field: string, min: number) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min) throw new Error(`${field} must be an integer of at least ${min}.`);
  return number;
}
function dateValue(value: string | undefined, field: string) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error(`${field} must be a valid date.`);
  return date;
}
function requireSource(url: unknown, note: unknown) {
  if (typeof url !== 'string' || typeof note !== 'string') throw new Error('source_url and source_note are required whenever a figure is entered.');
  try { new URL(url); } catch { throw new Error('source_url must be an absolute URL.'); }
  if (!note.trim()) throw new Error('source_note is required whenever a figure is entered.');
}
function toCamel(snake: string) { return snake.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()); }
