export function checkAnswer(selectedOption: string, correctOption: string | null) { return correctOption !== null && selectedOption === correctOption; }
export type TopicStat = { topic: string; attempts: number; correct: number; syllabusMarks: number };
export function calculateScore(correct: number, wrong: number) { return { correct, wrong, skipped: 0, marks: correct - wrong / 3, accuracy: correct + wrong ? correct / (correct + wrong) * 100 : 0 }; }
export function weakAreas(rows: TopicStat[]) { return rows.filter(x => x.attempts >= 3 && x.correct / x.attempts < .6).map(x => ({ ...x, accuracy: x.correct / x.attempts * 100, weakness: (1 - x.correct / x.attempts) * x.syllabusMarks })).sort((a,b) => b.weakness - a.weakness); }
