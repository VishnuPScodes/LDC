/** Extract PDF text-layer MCQs into a review sidecar, without touching the bank. */
import fs from 'node:fs';
import { verifyPdfChecksum } from './verify-pdf-checksum.ts';
import pdfParse from 'pdf-parse';
import { fixMalayalamOrder } from './fix-malayalam-order.ts';

type Option = { key: string; text: string };
type Question = {
  questionNumber: number;
  paperNumber?: number;
  sourcePage: number;
  text: string;
  options: Option[];
  correctOption: string | null;
  needsReview: boolean;
};
type LayerRecord = {
  paperNumber?: number;
  questionNumber: number;
  sourcePage: number;
  pdfLayerText: string | null;
  pdfLayerOptions: Option[] | null;
  pdfLayerTextFixed: string | null;
  pdfLayerOptionsFixed: Option[] | null;
  pdfLayerPosition: { x: number; y: number } | null;
};
type Candidate = { page: number; number: number; text: string; options: Option[]; x: number; y: number };

const [pdfFile, questionsFile, outputFile] = process.argv.slice(2);
if (!pdfFile || !questionsFile || !outputFile) {
  console.error('Usage: tsx scripts/extract-pdf-layer.ts <pdf> <questions.json> <review-output.json>');
  process.exit(2);
}
verifyPdfChecksum(pdfFile);

function clean(value: string) {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')
    .replace(/^[\s:;,.–-]+|[\s:;,.–-]+$/g, '').trim();
}

function extractCandidates(page: number, content: string, linePositions: { offset: number; x: number; y: number }[]): Candidate[] {
  const matches = [...content.matchAll(/(?:^|\n)\s*(\d{1,3})\s*\.\s*/g)]
    .filter(match => Number(match[1]) >= 1 && Number(match[1]) <= 100);
  return matches.map((match, index) => {
    const markerOffset = match.index! + match[0].lastIndexOf(match[1]);
    const end = matches[index + 1]?.index ?? content.length;
    let block = content.slice(markerOffset + match[1].length + match[0].slice(match[0].lastIndexOf(match[1]) + match[1].length).length, end);
    block = block.replace(/\n\s*\d{1,3}\s*[-–]\s*[A-DX](?:\s*,[^\n]*)?\s*$/i, '');
    const optionPattern = /(?<![A-Za-z])\(?([A-D])\)?\s*[).:]\s*/g;
    const labels = [...block.matchAll(optionPattern)];
    const options: Option[] = [];
    for (let i = 0; i < labels.length; i++) {
      const key = labels[i][1];
      const start = labels[i].index! + labels[i][0].length;
      const endOffset = labels[i + 1]?.index ?? block.length;
      const optionText = clean(block.slice(start, endOffset)
        .replace(/\n\s*\d{1,3}\s*[-–]\s*[A-DX][\s\S]*$/i, ''));
      if (!options.some(option => option.key === key)) options.push({ key, text: optionText });
    }
    const questionText = clean(block.slice(0, labels[0]?.index ?? block.length));
    const position = [...linePositions].reverse().find(line => line.offset <= markerOffset);
    return { page, number: Number(match[1]), text: questionText, options, x: position?.x ?? 0, y: position?.y ?? 0 };
  }).filter(candidate => candidate.text.length > 1);
}

function normalized(value: string) {
  return value.normalize('NFC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s\u200B-\u200D\uFEFF]+/gu, '');
}

function fullOptions(options: Option[]) {
  return ['A', 'B', 'C', 'D'].every(key => options.some(option => option.key === key && option.text.trim()));
}

const questions: Question[] = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
const pages: string[] = [];
const pageLinePositions: { offset: number; x: number; y: number }[][] = [];
await pdfParse(fs.readFileSync(pdfFile), {
  pagerender: async page => {
    const content = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
    let lastY: number | undefined;
    let text = '';
    const linePositions: { offset: number; x: number; y: number }[] = [];
    for (const item of content.items as any[]) {
      if (!('str' in item)) continue;
      if (lastY === item.transform[5] || lastY === undefined) text += item.str;
      else text += `\n${item.str}`;
      if (lastY === undefined || lastY !== item.transform[5]) linePositions.push({ offset: text.length - item.str.length, x: item.transform[4], y: item.transform[5] });
      lastY = item.transform[5];
    }
    pages.push(text);
    pageLinePositions.push(linePositions);
    return '';
  },
});

const candidateMap = new Map<string, Candidate[]>();
for (let page = 1; page <= pages.length; page++) {
  for (const candidate of extractCandidates(page, pages[page - 1], pageLinePositions[page - 1])) {
    const key = `${page}:${candidate.number}`;
    candidateMap.set(key, [...(candidateMap.get(key) ?? []), candidate]);
  }
}

const records: LayerRecord[] = questions.map(question => {
  const possible = candidateMap.get(`${question.sourcePage}:${question.questionNumber}`) ?? [];
  const candidate = possible.sort((a, b) => Number(fullOptions(b.options)) - Number(fullOptions(a.options)) || b.text.length - a.text.length)[0];
  const rawOptions = candidate?.options ?? null;
  const rawText = candidate?.text ?? null;
  return {
    paperNumber: question.paperNumber,
    questionNumber: question.questionNumber,
    sourcePage: question.sourcePage,
    pdfLayerText: rawText,
    pdfLayerOptions: rawOptions,
    pdfLayerTextFixed: candidate ? fixMalayalamOrder(candidate.text) : null,
    pdfLayerOptionsFixed: rawOptions?.map(option => ({ ...option, text: fixMalayalamOrder(option.text) })) ?? null,
    pdfLayerPosition: candidate ? { x: candidate.x, y: candidate.y } : null,
  };
});

const matched = records.filter(record => record.pdfLayerText !== null && record.pdfLayerOptions !== null);
const comparisons = records.map((record, index) => {
  const question = questions[index];
  const existingOptionsComplete = fullOptions(question.options);
  const rawOptionsComplete = !!record.pdfLayerOptions && fullOptions(record.pdfLayerOptionsFixed ?? []);
  const comparable = record.pdfLayerTextFixed !== null && !!record.pdfLayerOptionsFixed && rawOptionsComplete && existingOptionsComplete;
  const agrees = comparable && normalized(record.pdfLayerTextFixed!) === normalized(question.text) &&
    ['A', 'B', 'C', 'D'].every(key => normalized(record.pdfLayerOptionsFixed!.find(option => option.key === key)!.text) ===
      normalized(question.options.find(option => option.key === key)!.text));
  return { comparable, agrees: !!agrees, canClear: !!agrees && !!question.correctOption && existingOptionsComplete && question.needsReview };
});

const hasReorder = (record: LayerRecord) => [record.pdfLayerText, ...(record.pdfLayerOptions ?? []).map(option => option.text)]
  .some(value => !!value && /[\u0D46-\u0D48](?:[\u0D15-\u0D39]|\u0D4D\u0D30)|\u0D4D\u0D30[\u0D15-\u0D39]/u.test(value));
const sampleEligible = (record: LayerRecord) => hasReorder(record) && !!record.pdfLayerText && fullOptions(record.pdfLayerOptions ?? []);
const papers = [...new Set(questions.map(question => question.paperNumber ?? 0))].sort((a, b) => a - b);
const sample: number[] = [];
for (const paper of papers) {
  const index = records.findIndex((record, i) => questions[i].paperNumber === paper && sampleEligible(record));
  if (index >= 0) sample.push(index);
}
for (let i = 0; sample.length < 50 && i < records.length; i++) {
  if (!sample.includes(i) && sampleEligible(records[i])) sample.push(i);
}
const sampleReport = sample.slice(0, 50).map(index => ({
  ...records[index],
  existingText: questions[index].text,
  existingOptions: questions[index].options,
  correctOption: questions[index].correctOption,
  existingNeedsReview: questions[index].needsReview,
  pdfLayerPosition: records[index].pdfLayerPosition,
}));

const summary = {
  pdfPages: pages.length,
  questions: questions.length,
  matchedPdfLayerRecords: matched.length,
  missingPdfLayerRecords: records.length - matched.length,
  comparableWithExisting: comparisons.filter(value => value.comparable).length,
  notComparableWithExisting: comparisons.filter(value => !value.comparable).length,
  agreesWithExisting: comparisons.filter(value => value.agrees).length,
  disagreesWithExisting: comparisons.filter(value => value.comparable && !value.agrees).length,
  needsReview: questions.filter(question => question.needsReview).length,
  flaggedCouldClearByAgreement: comparisons.filter(value => value.canClear).length,
  sampleCount: sampleReport.length,
  samplePapers: [...new Set(sampleReport.map(row => row.paperNumber))].length,
  sample: sampleReport,
};
const reviewedRecords = records.map((record, index) => ({
  ...record,
  existingText: questions[index].text,
  existingOptions: questions[index].options,
  correctOption: questions[index].correctOption,
  needsReview: questions[index].needsReview,
  comparisonComparable: comparisons[index].comparable,
  agreesWithExisting: comparisons[index].agrees,
  couldClearFlagByAgreement: comparisons[index].canClear,
}));
fs.writeFileSync(outputFile, JSON.stringify({ summary, records: reviewedRecords }, null, 2) + '\n');
console.log(JSON.stringify({ ...summary, sample: sampleReport }, null, 2));
