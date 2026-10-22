import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'node:fs';
import { Question } from './models.js';
import { PAPER_METADATA } from './paper-metadata.js';

const rows = JSON.parse(fs.readFileSync(new URL('../data/questions.json', import.meta.url), 'utf8'));
if (!Array.isArray(rows)) throw new Error('questions.json must contain an array');
if (rows.length !== 4632) throw new Error(`Expected 4,632 questions; found ${rows.length}`);
const rowsWithPaperMetadata=rows.map((question:any)=>({...question,...PAPER_METADATA[question.paperNumber]}));

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ldc_practice');
try {
  await Question.deleteMany({});
  await Question.insertMany(rowsWithPaperMetadata, { ordered: false });

  const [total, eligible, cancelled, sidebar] = await Promise.all([
    Question.countDocuments(),
    Question.countDocuments({ eligibleForPractice: true, needsReview: false, correctOption: { $in: ['A', 'B', 'C', 'D'] } }),
    Question.countDocuments({ answerKeyStatus: 'cancelled' }),
    Question.countDocuments({ exclusionReason: 'boxed_sidebar_information_not_an_MCQ' }),
  ]);
  const counts = { total, eligible, cancelled, sidebar, excludedFromPractice: cancelled + sidebar };
  if (total !== 4632 || eligible !== 4118 || cancelled !== 116 || sidebar !== 21) {
    throw new Error(`Seeded question counts failed verification: ${JSON.stringify(counts)}`);
  }
  console.log(`Seeded and verified ${JSON.stringify(counts)}.`);
} finally {
  await mongoose.disconnect();
}
