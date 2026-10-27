import 'dotenv/config';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { LdcCurrentCycle, LdcHistory } from './models.js';
import { currentCycleCsvHeaders, historyCsvHeaders, parseCsv, parseCurrentCycleRow, parseHistoryRow } from './rank-estimate/history-data.js';

async function main() {
  if (process.env.LDC_RANK_HISTORY_ADMIN !== 'true') throw new Error('Set LDC_RANK_HISTORY_ADMIN=true in the trusted admin shell to run this importer.');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  const [historyPath, currentPath] = process.argv.slice(2);
  if (!historyPath) throw new Error('Usage: pnpm --filter @ldc/server rank-history:import <history.csv> [current-cycle.csv]');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const historyRows = parseCsv(await fs.readFile(historyPath, 'utf8'), historyCsvHeaders).map(parseHistoryRow);
    for (const row of historyRows) await LdcHistory.updateOne(
      { district: row.district, examYear: row.examYear, notificationNo: row.notificationNo },
      { $set: row }, { upsert: true, runValidators: true },
    );
    let currentCount = 0;
    if (currentPath) {
      const currentRows = parseCsv(await fs.readFile(currentPath, 'utf8'), currentCycleCsvHeaders).map(parseCurrentCycleRow);
      for (const row of currentRows) {
        await LdcCurrentCycle.updateOne({ district: row.district }, { $set: row }, { upsert: true, runValidators: true });
        currentCount++;
      }
    }
    process.stdout.write(`Imported ${historyRows.length} history rows and ${currentCount} current-cycle rows.\n`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1; });
