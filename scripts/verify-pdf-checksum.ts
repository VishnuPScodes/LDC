import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type PdfChecksum = {
  sha256: string;
  sizeBytes: number;
};

/** Refuse to process a PDF that differs from the checked-in source manifest. */
export function verifyPdfChecksum(
  pdfFile: string,
  manifestFile = path.resolve(process.cwd(), 'server/data/LDC.pdf.checksum.json'),
): void {
  const bytes = fs.readFileSync(pdfFile);
  const expected = JSON.parse(fs.readFileSync(manifestFile, 'utf8')) as PdfChecksum;
  const actual = crypto.createHash('sha256').update(bytes).digest('hex');
  if (actual !== expected.sha256 || bytes.length !== expected.sizeBytes) {
    throw new Error(
      `STOP: ${pdfFile} does not match ${manifestFile} ` +
      `(sha256 ${actual}, size ${bytes.length}; expected ${expected.sha256}, ${expected.sizeBytes})`,
    );
  }
  console.log(`PDF checksum verified: ${actual}`);
}
