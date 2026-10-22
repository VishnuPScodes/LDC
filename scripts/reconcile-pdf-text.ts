/**
 * Reconciles the existing question bank with a Google Docs text export and
 * per-page Tesseract OCR text. Matching uses the printed PDF page and the
 * question number; answers and syllabus tags are never inferred here.
 *
 * Usage:
 *   pnpm exec tsx scripts/reconcile-pdf-text.ts LDC.txt /path/to/ocr-text \
 *     server/data/questions.json server/data/questions.reconciled.json
 */
import fs from 'node:fs';
import path from 'node:path';

type Option = { key: string; text: string };
type Candidate = { page: number; number: number; source: 'text' | 'ocr'; text: string; options: Option[] };
type Question = { questionNumber: number; text: string; options: Option[]; correctOption: string | null; topic: string; sourcePage: number; needsReview: boolean; notes?: string; [key: string]: unknown };

const [textFile, ocrDir, inputFile, outputFile] = process.argv.slice(2);
if (!textFile || !ocrDir || !inputFile || !outputFile) {
  console.error('Usage: tsx scripts/reconcile-pdf-text.ts <text-export.txt> <ocr-text-dir> <questions.json> <output.json>');
  process.exit(2);
}

function candidatesFromStream(content: string, pageMarkers: { page: number; index: number }[], source: Candidate['source']): Candidate[] {
  const starts: { number: number; index: number; end: number }[] = [];
  const pattern = /(?<!\S)(\d{1,3})\.(?=\s|[^\d])/g;
  for (const match of content.matchAll(pattern)) {
    const number = Number(match[1]);
    if (number < 1 || number > 100) continue;
    starts.push({ number, index: match.index!, end: 0 });
  }
  starts.forEach((item, i) => item.end = starts[i + 1]?.index ?? content.length);
  return starts.map(({ number, index, end }) => {
    if (!pageMarkers.length || index < pageMarkers[0].index) return null;
    let markerIndex = 0;
    while (markerIndex + 1 < pageMarkers.length && pageMarkers[markerIndex + 1].index <= index) markerIndex++;
    const page = pageMarkers[markerIndex]?.page;
    if (!page) return null;
    let block = content.slice(index, end)
      .replace(/Kerala PSC\s+\d+/g, ' ')
      .replace(/\d+\s+LDC Question Paper/gi, ' ')
      .replace(/\[\[PDF_PAGE_\d+\]\]/g, ' ')
      .replace(/Nidheesh\s+C\s*V|Easy\s+PSC/gi, ' ')
      .replace(/(?:Post Name|Department|Question Paper Code|Date Of Test):[^\n]*/gi, ' ');
    // Answer-key entries are separate from the question content in the source.
    block = block.split(/\r?\n/).filter(line => ([...line.matchAll(/\b\d{1,3}\s*[-–]\s*[A-Z0-9]\b/gi)].length < 2)).join(' ');
    block = block.replace(/\b\d{1,3}\s*[-–]\s*[A-DX]\b/gi, ' ')
      .replace(/\bLDC\s*[-–][^\n]*/gi, ' ');
    const optionPattern = /(?<!\S)([A-D])\s*[).:]\s*/g;
    const labels = [...block.matchAll(optionPattern)];
    const options: Option[] = [];
    for (let i = 0; i < labels.length; i++) {
      const key = labels[i][1];
      const from = labels[i].index! + labels[i][0].length;
      const to = labels[i + 1]?.index ?? block.length;
      const text = clean(block.slice(from, to).replace(/\b\d{1,3}\s*[-–]\s*[A-DX]\b/gi, ' '));
      if (!options.some(option => option.key === key)) options.push({ key, text });
    }
    const firstOption = labels[0]?.index ?? block.length;
    const questionText = clean(block.slice(0, firstOption).replace(/^\s*\d{1,3}\.\s*/, ''));
    return { page, number, source, text: questionText, options };
  }).filter((item): item is Candidate => !!item && item.text.length >= 4);
}

function clean(value: string) {
  return value.replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s:;,.–-]+|[\s:;,.–-]+$/g, '')
    .trim();
}

function textPages(text: string): Candidate[] {
  const marker = /Kerala PSC\s+(\d+)|(\d+)\s+LDC Question Paper/gi;
  const pages = [...text.matchAll(marker)];
  return candidatesFromStream(text, pages.map(page => ({ page: Number(page[1] || page[2]), index: page.index! })), 'text');
}

function ocrPages(directory: string): Candidate[] {
  const files = fs.readdirSync(directory).filter(name => /^page-\d+\.txt$/.test(name))
    .map(name => ({ name, page: Number(name.match(/\d+/)![0]) }))
    .sort((a, b) => a.page - b.page);
  const early = files.filter(file => file.page <= 80).flatMap(file => {
    const content = fs.readFileSync(path.join(directory, file.name), 'utf8');
    return candidatesFromStream(content, [{ page: file.page, index: 0 }], 'ocr');
  });
  const laterFiles = files.filter(file => file.page > 80);
  let content = '';
  const pageMarkers: { page: number; index: number }[] = [];
  for (const file of laterFiles) {
    content += `\n[[PDF_PAGE_${file.page}]]\n`;
    pageMarkers.push({ page: file.page, index: content.length });
    content += fs.readFileSync(path.join(directory, file.name), 'utf8') + '\n';
  }
  return [...early, ...candidatesFromStream(content, pageMarkers, 'ocr')];
}

function quality(value: string) {
  const mal = (value.match(/[\u0D00-\u0D7F]/g) || []).length;
  const latin = (value.match(/[A-Za-z]/g) || []).length;
  const words = value.split(/\s+/).filter(Boolean);
  const danglingVowels = (value.match(/(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/g) || []).length;
  const invalidVowelPairs = (value.match(/[\u0D05-\u0D14][\u0D46-\u0D4C]/g) || []).length;
  const longLatin = (value.match(/[A-Za-z]{5,}/g) || []).length;
  const controls = (value.match(/[\u0000\uFFFD]/g) || []).length;
  let score = Math.min(value.length, 180) / 9 + Math.min(words.length, 35) / 3;
  score -= danglingVowels * 12 + invalidVowelPairs * 12 + controls * 100;
  if (mal > 0 && longLatin) score -= longLatin * 18;
  if (value.length < 8) score -= 8;
  return score;
}

function completeOptions(candidate: Candidate) {
  return candidate.options.length === 4 && ['A', 'B', 'C', 'D'].every(key => candidate.options.some(option => option.key === key && option.text.length));
}

// Ignore only formatting differences. Keep letters, digits and all scripts intact.
function normalizeForAgreement(value: string) {
  return value.normalize('NFC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s\u200B-\u200D\uFEFF]+/gu, '');
}

function sourcesAgree(rows: Candidate[]) {
  const text = rows.find(candidate => candidate.source === 'text' && completeOptions(candidate));
  const ocr = rows.find(candidate => candidate.source === 'ocr' && completeOptions(candidate));
  if (!text || !ocr) return { comparable: false, agree: false };
  const agree = normalizeForAgreement(text.text) === normalizeForAgreement(ocr.text) &&
    ['A', 'B', 'C', 'D'].every(key => normalizeForAgreement(text.options.find(option => option.key === key)!.text) ===
      normalizeForAgreement(ocr.options.find(option => option.key === key)!.text));
  return { comparable: true, agree };
}

function preferredText(rows: Candidate[]) {
  const text = rows.filter(candidate => candidate.source === 'text').sort((a, b) => quality(b.text) - quality(a.text))[0];
  const ocr = rows.filter(candidate => candidate.source === 'ocr').sort((a, b) => quality(b.text) - quality(a.text))[0];
  if (!text) return ocr;
  if (!ocr) return text;
  const textLooksBroken = /[\u0000\uFFFD]/.test(text.text) || /(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(text.text) || /[\u0D05-\u0D14][\u0D46-\u0D4C]/.test(text.text);
  return textLooksBroken && !/(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(ocr.text) && quality(ocr.text) >= quality(text.text) - 2 ? ocr : text;
}

function preferredOptions(rows: Candidate[]) {
  const complete = rows.filter(completeOptions);
  const score = (candidate: Candidate) => quality(candidate.options.map(option => option.text).join(' '));
  const text = complete.filter(candidate => candidate.source === 'text').sort((a, b) => score(b) - score(a))[0];
  const ocr = complete.filter(candidate => candidate.source === 'ocr').sort((a, b) => score(b) - score(a))[0];
  if (!text) return ocr;
  if (!ocr) return text;
  const textValue = text.options.map(option => option.text).join(' ');
  const ocrValue = ocr.options.map(option => option.text).join(' ');
  const textLooksBroken = /[\u0000\uFFFD]/.test(textValue) || /(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(textValue) || /[\u0D05-\u0D14][\u0D46-\u0D4C]/.test(textValue);
  const ocrLooksLikeMixedScriptNoise = /[\u0D00-\u0D7F]/.test(ocrValue) && /[A-Za-z]{5,}/.test(ocrValue);
  if (ocrLooksLikeMixedScriptNoise) return text;
  return textLooksBroken && !/(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(ocrValue) && score(ocr) >= score(text) - 2 ? ocr : text;
}

const text = fs.readFileSync(textFile, 'utf8');
const candidates = [...textPages(text), ...ocrPages(ocrDir)];
const questionRows: Question[] = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
const byKey = new Map<string, Candidate[]>();
for (const candidate of candidates) {
  const key = `${candidate.page}:${candidate.number}`;
  byKey.set(key, [...(byKey.get(key) || []), candidate]);
}

let promptsUpdated = 0;
let optionsUpdated = 0;
let matched = 0;
let flagged = 0;
let clearedByAgreement = 0;
const reviewReasons: Record<string, number> = {};
const reviewByPaper: Record<string, { needsReview: number; reasons: Record<string, number> }> = {};
let dualSourceComparable = 0;
let dualSourceAgreements = 0;
let agreementsNeedingReview = 0;
let agreementsWithAnswerAndOptions = 0;
const agreedButStillReview: { paper: number | string; questionNumber: number; reasons: string[] }[] = [];
for (const question of questionRows) {
  const wasNeedsReview = question.needsReview;
  const options = byKey.get(`${question.sourcePage}:${question.questionNumber}`) || [];
  const candidate = preferredText(options);
  if (candidate) {
    matched++;
    if (quality(candidate.text) > quality(question.text) || /[\u0000\uFFFD]/.test(question.text)) {
      question.text = candidate.text;
      promptsUpdated++;
    }
    const optionsCandidate = preferredOptions(options);
    if (optionsCandidate) {
      const proposed = ['A', 'B', 'C', 'D'].map(key => optionsCandidate.options.find(option => option.key === key)!);
      const existingQuality = quality(question.options.map(option => option.text).join(' '));
      const proposedQuality = quality(proposed.map(option => option.text).join(' '));
      if (optionsCandidate.source === 'text' || proposedQuality >= existingQuality || question.options.length !== 4 || question.options.some(option => /[\u0000\uFFFD]/.test(option.text))) {
        question.options = proposed;
        optionsUpdated++;
      }
    }
  }
  const textMalformed = /[\u0000\uFFFD]/.test(question.text) || /(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(question.text) || /[\u0D05-\u0D14][\u0D46-\u0D4C]/.test(question.text);
  const malOptionCount = question.options.filter(option => /[\u0D00-\u0D7F]/.test(option.text)).length;
  const optionsMalformed = question.options.some(option => /[\u0000\uFFFD]/.test(option.text) || /(?:^|\s)[\u0D46-\u0D48\u0D4A-\u0D4C]/.test(option.text) || /[\u0D05-\u0D14][\u0D46-\u0D4C]/.test(option.text)) ||
    (malOptionCount >= 2 && question.options.some(option => /[A-Za-z]{5,}/.test(option.text)));
  const malformed = textMalformed || optionsMalformed;
  const full = ['A', 'B', 'C', 'D'].every(key => question.options.some(option => option.key === key && option.text.trim()));
  const agreement = sourcesAgree(options);
  if (agreement.comparable) dualSourceComparable++;
  if (agreement.comparable && agreement.agree) dualSourceAgreements++;
  const reasons: string[] = [];
  if (!full) reasons.push('missing_or_incomplete_options');
  if (!question.correctOption) reasons.push('missing_answer_key');
  if (malformed && !(agreement.comparable && agreement.agree)) reasons.push('garbled_or_suspicious_text');
  if (agreement.comparable && !agreement.agree) reasons.push('text_ocr_disagreement');
  if (!agreement.comparable) reasons.push('no_comparable_dual_source');
  // Matching text and OCR is sufficient to clear only source-quality flags. Missing
  // answers and incomplete option sets remain review items even when text agrees.
  const mayClear = agreement.comparable && agreement.agree && full && !!question.correctOption;
  if (agreement.comparable && agreement.agree && question.needsReview) agreementsNeedingReview++;
  if (agreement.comparable && agreement.agree && full && !!question.correctOption) agreementsWithAnswerAndOptions++;
  if (question.needsReview && mayClear) clearedByAgreement++;
  question.needsReview = wasNeedsReview && !mayClear;
  if (wasNeedsReview && agreement.comparable && agreement.agree && !mayClear) {
    agreedButStillReview.push({
      paper: question.paperNumber ?? 'unknown',
      questionNumber: question.questionNumber,
      reasons: [!full ? 'missing_or_incomplete_options' : '', !question.correctOption ? 'missing_answer_key' : ''].filter(Boolean),
    });
  }
  if (question.needsReview) {
    const paper = String(question.paperNumber ?? 'unknown');
    const paperEntry = reviewByPaper[paper] ||= { needsReview: 0, reasons: {} };
    paperEntry.needsReview++;
    for (const reason of reasons) {
      reviewReasons[reason] = (reviewReasons[reason] || 0) + 1;
      paperEntry.reasons[reason] = (paperEntry.reasons[reason] || 0) + 1;
    }
  }
  if (question.needsReview) {
    question.reviewReasons = reasons;
    question.notes = candidate
      ? `Text reconciled from ${candidate.source === 'text' ? path.basename(textFile) : 'Malayalam Tesseract OCR'}; verify against source PDF page ${question.sourcePage}.`
      : `No matching text/OCR record; verify against source PDF page ${question.sourcePage}.`;
    flagged++;
  } else {
    delete question.notes;
    delete question.reviewReasons;
  }
}

fs.writeFileSync(outputFile, JSON.stringify(questionRows, null, 2) + '\n');
const summary = {
  questions: questionRows.length,
  matchedToPageAndNumber: matched,
  promptsUpdated,
  optionSetsUpdated: optionsUpdated,
  withAnswers: questionRows.filter(question => question.correctOption).length,
  needsReview: questionRows.filter(question => question.needsReview).length,
  matchedStillNeedsReview: flagged,
  clearedByTextOcrAgreement: clearedByAgreement,
  dualSourceComparable,
  dualSourceAgreements,
  agreementsNeedingReview,
  agreementsWithAnswerAndOptions,
  agreedButStillReview,
  reviewReasons,
  reviewByPaper,
  unmatched: questionRows.length - matched,
  textPages: [...new Set(candidates.filter(candidate => candidate.source === 'text').map(candidate => candidate.page))].length,
  ocrPages: [...new Set(candidates.filter(candidate => candidate.source === 'ocr').map(candidate => candidate.page))].length,
};
console.log(JSON.stringify(summary, null, 2));
