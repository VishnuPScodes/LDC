import { rankEstimateConfig } from './config.js';

export type HistoryCycle = {
  district: string; examYear: number; notificationNo: string; applicants?: number | null; attendees?: number | null;
  mainListSize?: number | null; mainListCutoff?: number | null; supplementaryListSize?: number | null;
  supplementaryListCutoff?: number | null; shortListSize?: number | null; shortListCutoff?: number | null; topScore?: number | null;
};
export type CurrentCycle = { applicants?: number | null; expectedAttendanceRatio?: number | null } | null;
type Anchor = { score: number; rank: number };
type CycleCurve = { year: number; weight: number; points: Anchor[]; mainCutoff: number };

export type DistrictCurve = {
  district: string; years: number[]; cycles: CycleCurve[]; percentileMode: boolean; expectedAttendees: number | null;
  scoreUncertainty: number; mainCutoffRange: [number, number]; supplementaryCutoff: number | null;
};

export function buildDistrictCurve(district: string, history: HistoryCycle[], current: CurrentCycle) {
  const rows = history.filter(row => row.district === district && Number.isFinite(row.mainListSize) && (row.mainListSize || 0) > 0 && Number.isFinite(row.mainListCutoff));
  const selected = rows.sort((a, b) => b.examYear - a.examYear).slice(0, rankEstimateConfig.curve.maximumCycles);
  if (!selected.length) return null;

  const ratios = selected.filter(row => (row.applicants || 0) > 0 && (row.attendees || 0) > 0).map(row => (row.attendees as number) / (row.applicants as number));
  const averageAttendanceRatio = ratios.length ? ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length : rankEstimateConfig.curve.attendanceRatioDefault;
  const expectedAttendees = current?.applicants && (current.expectedAttendanceRatio ?? averageAttendanceRatio) !== null
    ? current.applicants * (current.expectedAttendanceRatio ?? averageAttendanceRatio as number)
    : null;
  const percentileMode = expectedAttendees !== null && selected.every(row => (row.attendees || 0) > 0);
  const cycleWeights = selected.map((_, index) => rankEstimateConfig.curve.cycleWeights[index] ?? rankEstimateConfig.curve.cycleWeights.at(-1) ?? 1);
  const totalWeight = cycleWeights.reduce((sum, weight) => sum + weight, 0);
  const cycles = selected.map((row, index) => {
    const points = anchorsForCycle(row).map(anchor => ({
      score: anchor.score,
      rank: percentileMode ? anchor.rank / (row.attendees as number) : anchor.rank,
    }));
    return { year: row.examYear, weight: cycleWeights[index] / totalWeight, points: monotonicAnchors(points), mainCutoff: row.mainListCutoff as number };
  });
  if (!cycles.length) return null;
  const cutoffs = cycles.map(cycle => cycle.mainCutoff);
  const meanCutoff = cutoffs.reduce((sum, cutoff) => sum + cutoff, 0) / cutoffs.length;
  const scoreUncertainty = Math.sqrt(cutoffs.reduce((sum, cutoff) => sum + (cutoff - meanCutoff) ** 2, 0) / cutoffs.length);
  const lowerCutoff = Math.min(...cutoffs), upperCutoff = Math.max(...cutoffs);
  const supplementary = cycles.map((cycle, index) => ({ row: selected[index], weight: cycle.weight })).filter(item => Number.isFinite(item.row.supplementaryListCutoff));
  const supplementaryCutoff = supplementary.length
    ? supplementary.reduce((sum, item) => sum + (item.row.supplementaryListCutoff as number) * item.weight, 0) / supplementary.reduce((sum, item) => sum + item.weight, 0)
    : null;
  return {
    district, years: cycles.map(cycle => cycle.year), cycles, percentileMode,
    expectedAttendees: percentileMode ? expectedAttendees : null,
    scoreUncertainty, mainCutoffRange: [lowerCutoff, upperCutoff] as [number, number], supplementaryCutoff,
  } satisfies DistrictCurve;
}

export function rankAtScore(score: number, curve: DistrictCurve) {
  const ranks = curve.cycles.map(cycle => evaluateCycle(score, cycle.points));
  const rankValue = Math.exp(ranks.reduce((sum, rank, index) => sum + Math.log(Math.max(1e-9, rank)) * curve.cycles[index].weight, 0));
  const rank = curve.percentileMode ? rankValue * (curve.expectedAttendees || 0) : rankValue;
  const minScore = Math.min(...curve.cycles.flatMap(cycle => cycle.points.map(point => point.score)));
  const maxScore = Math.max(...curve.cycles.flatMap(cycle => cycle.points.map(point => point.score)));
  const outsideAnchors = score < minScore || score > maxScore;
  const edgeLabel = score > maxScore ? 'Top range' as const : score < minScore ? 'Below past list ranges' as const : null;
  return { rank: Math.max(1, rank), outsideAnchors, edgeLabel };
}

export function estimateRankRange(lowScore: number, highScore: number, curve: DistrictCurve) {
  const lowResult = rankAtScore(highScore, curve), highResult = rankAtScore(lowScore, curve);
  if (lowResult.edgeLabel === 'Top range' && highResult.edgeLabel === 'Top range') return { lowRank: null, highRank: null, label: 'Top range', widenedLowScore: lowScore, widenedHighScore: highScore };
  if (lowResult.edgeLabel === 'Below past list ranges' && highResult.edgeLabel === 'Below past list ranges') return { lowRank: null, highRank: null, label: 'Below past list ranges', widenedLowScore: lowScore, widenedHighScore: highScore };
  const widening = curve.scoreUncertainty + (lowResult.outsideAnchors || highResult.outsideAnchors ? rankEstimateConfig.curve.outsideAnchorWidening : 0);
  const widenedLowScore = clamp(lowScore - widening, 0, 100), widenedHighScore = clamp(highScore + widening, 0, 100);
  const firstRank = rankAtScore(widenedHighScore, curve).rank, secondRank = rankAtScore(widenedLowScore, curve).rank;
  const lowRank = roundRank(Math.min(firstRank, secondRank));
  const rankStep = lowRank < 1000 ? rankEstimateConfig.curve.rankRoundingBelow1000 : rankEstimateConfig.curve.rankRoundingAtOrAbove1000;
  const highRank = Math.max(lowRank + rankStep, roundRank(Math.max(firstRank, secondRank)));
  return { lowRank, highRank, label: null, widenedLowScore, widenedHighScore };
}

export function fitBand(score: number, curve: DistrictCurve) {
  const [low, high] = curve.mainCutoffRange;
  if (score >= high + rankEstimateConfig.curve.strongPositionMargin) return 'Strong position' as const;
  if (score >= low && score <= high) return 'In range' as const;
  const closeToMain = score >= low - rankEstimateConfig.curve.nearSupplementaryMargin;
  const closeToSupplementary = curve.supplementaryCutoff !== null && score >= curve.supplementaryCutoff - rankEstimateConfig.curve.nearSupplementaryMargin;
  if (score < low && (closeToMain || closeToSupplementary)) return 'Getting close' as const;
  return 'Building up' as const;
}

export function monotonicAnchors(input: Anchor[]) {
  const sorted = input.filter(anchor => Number.isFinite(anchor.score) && Number.isFinite(anchor.rank) && anchor.rank > 0).sort((a, b) => a.score - b.score);
  const merged: Anchor[] = [];
  for (const anchor of sorted) {
    const previous = merged.at(-1);
    if (previous && previous.score === anchor.score) previous.rank = Math.sqrt(previous.rank * anchor.rank);
    else merged.push({ ...anchor });
  }
  for (let index = 1; index < merged.length; index++) merged[index].rank = Math.min(merged[index].rank, merged[index - 1].rank);
  return merged;
}

function anchorsForCycle(row: HistoryCycle): Anchor[] {
  const points: Anchor[] = [];
  if (Number.isFinite(row.mainListCutoff) && (row.mainListSize || 0) > 0) points.push({ score: row.mainListCutoff as number, rank: row.mainListSize as number });
  if (Number.isFinite(row.supplementaryListCutoff) && (row.mainListSize || 0) > 0 && (row.supplementaryListSize || 0) > 0) points.push({ score: row.supplementaryListCutoff as number, rank: (row.mainListSize as number) + (row.supplementaryListSize as number) });
  if (Number.isFinite(row.shortListCutoff) && (row.shortListSize || 0) > 0) points.push({ score: row.shortListCutoff as number, rank: row.shortListSize as number });
  if (Number.isFinite(row.topScore)) points.push({ score: row.topScore as number, rank: 1 });
  if ((row.attendees || 0) > 0) points.push({ score: 0, rank: row.attendees as number });
  return monotonicAnchors(points);
}

function evaluateCycle(score: number, points: Anchor[]) {
  if (points.length === 1) return points[0].rank;
  if (score <= points[0].score) return points[0].rank;
  if (score >= points.at(-1)!.score) return points.at(-1)!.rank;
  const values = points.map(point => ({ x: point.score, y: -Math.log(point.rank) }));
  const slopes = pchipSlopes(values);
  const index = values.findIndex((value, i) => i < values.length - 1 && score <= values[i + 1].x);
  const left = values[index], right = values[index + 1], width = right.x - left.x, t = (score - left.x) / width;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t;
  const h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
  const y = h00 * left.y + h10 * width * slopes[index] + h01 * right.y + h11 * width * slopes[index + 1];
  return Math.exp(-y);
}

function pchipSlopes(points: { x: number; y: number }[]) {
  const widths = points.slice(1).map((point, index) => point.x - points[index].x);
  const secants = points.slice(1).map((point, index) => (point.y - points[index].y) / widths[index]);
  if (points.length === 2) return [secants[0], secants[0]];
  const slopes = new Array<number>(points.length);
  slopes[0] = endpointSlope(widths[0], widths[1], secants[0], secants[1]);
  slopes[slopes.length - 1] = endpointSlope(widths.at(-1)!, widths.at(-2)!, secants.at(-1)!, secants.at(-2)!);
  for (let index = 1; index < points.length - 1; index++) {
    if (secants[index - 1] * secants[index] <= 0) slopes[index] = 0;
    else {
      const w1 = 2 * widths[index] + widths[index - 1], w2 = widths[index] + 2 * widths[index - 1];
      slopes[index] = (w1 + w2) / (w1 / secants[index - 1] + w2 / secants[index]);
    }
  }
  return slopes;
}
function endpointSlope(h1: number, h2: number, d1: number, d2: number) {
  let slope = ((2 * h1 + h2) * d1 - h1 * d2) / (h1 + h2);
  if (slope * d1 <= 0) slope = 0;
  else if (d1 * d2 < 0 && Math.abs(slope) > Math.abs(3 * d1)) slope = 3 * d1;
  return slope;
}
function roundRank(rank: number) {
  const quantum = rank < 1000 ? rankEstimateConfig.curve.rankRoundingBelow1000 : rankEstimateConfig.curve.rankRoundingAtOrAbove1000;
  return Math.max(quantum, Math.round(rank / quantum) * quantum);
}
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
