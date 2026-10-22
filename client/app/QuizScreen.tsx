'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type Option = { key: string; text: string };
type Question = { _id: string; questionNumber: number; text: string; options: Option[]; topic: string; paperNumber?: number; sourcePage?: number };
type Feedback = { isCorrect: boolean; correctOption: string; explanation?: string | null };

type Props = {
  question: Question;
  index: number;
  total: number;
  elapsed: number;
  picked: string | null;
  feedback: Feedback | null;
  quick: boolean;
  reported: boolean;
  streak: number;
  onChoose: (key: string) => void;
  onContinue: () => void;
  onQuit: () => void;
  onReport: () => void;
};

export default function QuizScreen({ question, index, total, elapsed, picked, feedback, quick, reported, streak, onChoose, onContinue, onQuit, onReport }: Props) {
  const [showQuit, setShowQuit] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const openQuit = () => setShowQuit(true);
    window.addEventListener('quiz-escape', openQuit);
    return () => window.removeEventListener('quiz-escape', openQuit);
  }, []);

  // Auto-advance after answering — no popup needed
  useEffect(() => {
    if (!feedback) return;
    const delay = quick ? 900 : 1200;
    const timer = window.setTimeout(() => onContinue(), delay);
    return () => window.clearTimeout(timer);
  }, [feedback, quick, onContinue]);

  return <section className="quiz-page" aria-label="Exam practice question">
    <header className="quiz-topbar">
      <button className="icon-button quit-button" type="button" aria-label="Quit test" onClick={() => setShowQuit(true)}><span aria-hidden="true">×</span></button>
      <div className="quiz-progress-wrap">
        <div className="quiz-count"><strong>{index + 1}</strong><span>/ {total}</span><span className="quiz-time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span></div>
        <div className="quiz-progress" role="progressbar" aria-label="Test progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}><span style={{ width: `${(index + 1) / total * 100}%` }} /></div>
      </div>
    </header>

    <div className="quiz-content">
      <div className="quiz-topic">{question.topic}</div>
      <h1 className="question-prompt">{question.text}</h1>
      <div className="quiz-options" role="group" aria-label="Answer choices">
        {question.options.map((option, position) => {
          const selected = picked === option.key;
          const isCorrectAnswer = feedback?.correctOption === option.key;
          const isWrongSelection = !!feedback && selected && !feedback.isCorrect;
          const isRightSelection = !!feedback && selected && feedback.isCorrect;
          const dim = !!feedback && !selected && !isCorrectAnswer;
          return <motion.button key={option.key} type="button"
            className={`quiz-option${isWrongSelection ? ' is-wrong' : ''}${isRightSelection || (feedback && isCorrectAnswer) || (!feedback && selected) ? ' is-correct' : ''}${dim ? ' is-dimmed' : ''}`}
            whileTap={!picked && !reduceMotion ? { y: 2 } : undefined}
            animate={reduceMotion ? undefined : isWrongSelection ? { x: [0, -4, 4, -3, 0] } : isRightSelection ? { scale: [1, 1.012, 1] } : undefined}
            transition={{ duration: .24 }} disabled={!!picked} aria-pressed={selected} data-answer-option="true" onClick={() => onChoose(option.key)}>
            <span className="option-badge">{option.key}</span>
            <span className="option-copy">{option.text}</span>
            <span className="option-mark" aria-hidden="true">
              {isWrongSelection ? '✗' : isRightSelection ? '✓' : isCorrectAnswer ? '✓' : !picked ? <span className="option-shortcut">{position + 1}</span> : null}
            </span>
          </motion.button>;
        })}
      </div>
      <div className="quiz-footer">
        <span className="question-source">Question {question.questionNumber}{question.paperNumber ? ` · Paper ${question.paperNumber}` : ''}{question.sourcePage ? ` · Page ${question.sourcePage}` : ''}</span>
        <button type="button" className={`report-link${reported ? ' reported' : ''}`} onClick={onReport} disabled={reported}>
          {reported ? '✓ Sent for review' : 'Report a problem'}
        </button>
      </div>
    </div>

    <AnimatePresence>
      {streak >= 5 && <motion.div className="streak-toast" role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>5 in a row <span aria-hidden="true">✦</span></motion.div>}
    </AnimatePresence>

    <AnimatePresence>
      {showQuit && <motion.div className="dialog-scrim" role="presentation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={event => { if (event.target === event.currentTarget) setShowQuit(false); }}>
        <motion.div className="quit-dialog" role="alertdialog" aria-modal="true" aria-labelledby="quit-title" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
          <h2 id="quit-title">Quit test?</h2><p>Your progress so far will be saved.</p>
          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={() => setShowQuit(false)}>Keep going</button>
            <button type="button" className="quit-confirm" onClick={onQuit}>Quit test</button>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </section>;
}
