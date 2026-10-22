/**
 * Apply verified PDF glyph substitutions, then correct Malayalam pre-base
 * signs stored in visual order. This does not perform OCR or guess mappings.
 *
 * Usage:
 *   pnpm exec tsx scripts/fix-malayalam-order.ts <pdf-layer-review.json> <output.json> --glyph-map glyph-map.json
 *   pnpm exec tsx scripts/fix-malayalam-order.ts <pdf-layer-review.json> <output.json> --glyph-map glyph-map.json --sample 50
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { verifyPdfChecksum } from './verify-pdf-checksum.ts';

type LayerRecord = {
  paperNumber?: number;
  questionNumber: number;
  sourcePage: number;
  pdfLayerText: string | null;
  pdfLayerOptions: { key: string; text: string }[] | null;
  pdfLayerTextFixed?: string | null;
  pdfLayerOptionsFixed?: { key: string; text: string }[] | null;
  pdfLayerTextGlyphKeys?: string[];
  pdfLayerOptionGlyphKeys?: Record<string, string[]>;
  [key: string]: unknown;
};
type LayerInput = LayerRecord[] | { records: LayerRecord[]; [key: string]: unknown };
type GlyphMap = {
  acceptedMappings?: Record<string, string | { unicode: string }>;
};

const MALAYALAM_CONSONANT = '[\u0D15-\u0D39]';
const CLUSTER = `${MALAYALAM_CONSONANT}(?:\u0D4D${MALAYALAM_CONSONANT})*`;

/** Move visual-order prefixes after the consonant cluster they belong to. */
export function fixMalayalamOrder(value: string): string {
  // Move pre-base ra first. Keeping it separate prevents a preceding
  // consonant from absorbing it into its cluster (for example, visual-order
  // `േക് രന്ദ` must become `കേന്ദ്ര`, not `ക്രേന്ദ`).
  const raPrefix = new RegExp(`\\u0D4D\\u0D30(${CLUSTER})`, 'gu');
  let result = value.replace(raPrefix, (_match, cluster: string) => `${cluster}\u0D4D\u0D30`);

  // Malayalam's reordered legacy text can leave ya-ra in the wrong order in
  // conjuncts such as സ്വാതന്ത്ര്യം.
  result = result.replace(/\u0D4D\u0D2F\u0D4D\u0D30/gu, '\u0D4D\u0D30\u0D4D\u0D2F');

  // The three pre-base vowel signs belong after their full consonant cluster.
  const vowelPrefixes = new RegExp(`([\\u0D46-\\u0D48]+)(${CLUSTER})`, 'gu');
  result = result.replace(vowelPrefixes, (_match, prefix: string, cluster: string) => `${cluster}${prefix}`);

  // A split vowel is written as the pre-base sign followed by aa/au after
  // reordering. Replace the sequences with their precomposed Malayalam signs.
  result = result
    .replace(new RegExp(`(${CLUSTER})\\u0D46\\u0D3E`, 'gu'), '$1\u0D4A')
    .replace(new RegExp(`(${CLUSTER})\\u0D47\\u0D3E`, 'gu'), '$1\u0D4B')
    .replace(new RegExp(`(${CLUSTER})\\u0D46\\u0D57`, 'gu'), '$1\u0D4C')
    .replace(/\u0D46\u0D3E/g, '\u0D4A')
    .replace(/\u0D47\u0D3E/g, '\u0D4B')
    .replace(/\u0D46\u0D57/g, '\u0D4C');
  // Keep the au length mark in the representation used by the source bank.
  result = result.replace(/\u0D4C/gu, '\u0D57');
  return result.normalize('NFC');
}

/** Font g_d0_f11 encodes the right-hand aa part of ോ as ോ itself. */
export function fixGd0F11Vowel(value: string): string {
  return value.replace(/\u0D4B/gu, '\u0D3E');
}

/** Substitute PDF-layer glyphs before changing their visual character order. */
export function applyGlyphMap(value: string, keys: string[] = [], glyphMap: GlyphMap = {}): string {
  const mappings = glyphMap.acceptedMappings ?? {};
  let keyIndex = 0;
  return [...value].map(character => {
    if (character !== '\0') return character;
    const key = keys[keyIndex++];
    const entry = key ? mappings[key] : undefined;
    return typeof entry === 'string' ? entry : entry?.unicode ?? character;
  }).join('');
}

async function main() {
  const [inputFile, outputFile, ...flags] = process.argv.slice(2);
  if (!inputFile || !outputFile) {
    console.error('Usage: tsx scripts/fix-malayalam-order.ts <pdf-layer-review.json> <output.json> [--glyph-map glyph-map.json] [--sample N]');
    process.exit(2);
  }
  verifyPdfChecksum(path.resolve(process.cwd(), 'LDC.pdf'));
  const sampleIndex = flags.indexOf('--sample');
  const sampleSize = sampleIndex < 0 ? 0 : Number(flags[sampleIndex + 1]);
  if (sampleIndex >= 0 && (!Number.isInteger(sampleSize) || sampleSize < 1)) {
    console.error('--sample requires a positive integer');
    process.exit(2);
  }
  const glyphMapIndex = flags.indexOf('--glyph-map');
  let glyphMap: GlyphMap = {};
  if (glyphMapIndex >= 0) {
    const glyphMapFile = flags[glyphMapIndex + 1];
    if (!glyphMapFile) {
      console.error('--glyph-map requires a JSON file');
      process.exit(2);
    }
    glyphMap = JSON.parse(fs.readFileSync(glyphMapFile, 'utf8')) as GlyphMap;
  }
  const hasVisualOrder = (value: string) => /[\u0D46-\u0D48](?:[\u0D15-\u0D39]|\u0D4D\u0D30)|\u0D4D\u0D30[\u0D15-\u0D39]/u.test(value);
  const hasVisualOrderAfterMap = (record: LayerRecord) => {
    const mapped = mapQuestion(record);
    const mappedOptions = (mapped.pdfLayerOptionsMapped as { text: string }[] | null) ?? [];
    return [mapped.pdfLayerTextMapped as string | null, ...mappedOptions.map(option => option.text)]
      .some(value => !!value && hasVisualOrder(value));
  };
  const mapQuestion = (record: LayerRecord): LayerRecord => {
    // Glyph substitution must happen while each U+0000 still has its font key.
    // Reordering the resulting Malayalam string comes only after substitution.
    const mappedText = record.pdfLayerText === null ? null : applyGlyphMap(
      record.pdfLayerText, record.pdfLayerTextGlyphKeys, glyphMap,
    );
    const mappedOptions = record.pdfLayerOptions?.map(option => ({
      ...option,
      text: applyGlyphMap(option.text, record.pdfLayerOptionGlyphKeys?.[option.key], glyphMap),
    })) ?? null;
    return {
      ...record,
      pdfLayerTextMapped: mappedText,
      pdfLayerOptionsMapped: mappedOptions,
      pdfLayerTextFixed: mappedText === null ? null : fixMalayalamOrder(mappedText),
      pdfLayerOptionsFixed: mappedOptions?.map(option => ({ ...option, text: fixMalayalamOrder(option.text) })) ?? null,
    };
  };

  const parsed: LayerInput = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  const records: LayerRecord[] = Array.isArray(parsed) ? parsed : parsed.records;
  let selected = records;
  if (sampleSize) {
    const papers = [...new Set(records.map(record => record.paperNumber ?? 0))].sort((a, b) => a - b);
    const byPaper = papers.map(paper => records.filter(record => record.paperNumber === paper && record.pdfLayerText !== null &&
      hasVisualOrderAfterMap(record) &&
      ['A', 'B', 'C', 'D'].every(key => record.pdfLayerOptions?.some(option => option.key === key && option.text.trim()))));
    selected = [];
    for (let round = 0; selected.length < sampleSize; round++) {
      let added = false;
      for (const candidates of byPaper) {
        const record = candidates[round];
        if (record && selected.length < sampleSize) {
          selected.push(record);
          added = true;
        }
      }
      if (!added) break;
    }
  }
  const selectedIds = new Set(selected);
  const output = records.map(record => selectedIds.has(record) ? mapQuestion(record) : record);
  const outputByIdentity = new Map(output.map(record => [`${record.paperNumber}:${record.sourcePage}:${record.questionNumber}`, record]));
  const report = selected.map(before => {
    const after = outputByIdentity.get(`${before.paperNumber}:${before.sourcePage}:${before.questionNumber}`)!;
    return {
      paperNumber: before.paperNumber,
      questionNumber: before.questionNumber,
      sourcePage: before.sourcePage,
      before: before.pdfLayerText,
      mapped: after.pdfLayerTextMapped,
      after: after.pdfLayerTextFixed,
      beforeOptions: before.pdfLayerOptions,
      afterOptions: after.pdfLayerOptionsFixed,
    };
  });
  const result: LayerInput = Array.isArray(parsed) ? output : { ...parsed, records: output };
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ inputRecords: records.length, selected: selected.length, distinctPapers: new Set(selected.map(record => record.paperNumber)).size, outputFile, sample: report }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main();
