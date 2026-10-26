'use client';
import QuizScreen from '../QuizScreen';
import bank from '../../../server/data/questions.json';

const question = (bank as any[]).find((item: any) => item.eligibleForPractice && item.correctOption && item.options.length === 4)!;
const selected = question.options.find((option: any) => option.key !== question.correctOption)!.key;

export default function QuizPreview() {
  return <main className="shell quiz-shell">
    <QuizScreen question={{ ...question, _id: `preview-${question.questionNumber}` }} index={0} total={20} elapsed={3} picked={selected}
      feedback={{ isCorrect: false, correctOption: question.correctOption!, ...(question.explanation ? { explanation: question.explanation } : {}) }}
      quick={false} reported={false} streak={0} onChoose={() => {}} onContinue={() => {}} onQuit={() => {}} onReport={() => {}} />
  </main>;
}
