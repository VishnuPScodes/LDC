'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import QuestionSource from './QuestionSource';
import PaperSettings from './PaperSettings';

type Option = { key: string; text: string };
type Question = { _id: string; questionNumber: number; text: string; options: Option[]; topic: string; paperNumber?: number; paperCode?:string;examDate?:string;sourcePage?: number };
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
  onQuit: () => void | Promise<void>;
  onReport: () => void;
};

export default function QuizScreen({ question, index, total, elapsed, picked, feedback, quick, reported, streak, onChoose, onContinue, onQuit, onReport }: Props) {
  const [showQuit, setShowQuit] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const openQuit = () => setShowQuit(true);
    window.addEventListener('quiz-escape', openQuit);
    return () => window.removeEventListener('quiz-escape', openQuit);
  }, []);

  const continueRef=useRef(onContinue);
  useEffect(()=>{continueRef.current=onContinue},[onContinue]);
  useEffect(() => {
    if (!feedback||!quick) return;
    const timer = window.setTimeout(() => continueRef.current(), 1200);
    return () => window.clearTimeout(timer);
  }, [feedback, quick]);

  return <section className="quiz-page paper-screen" aria-label="Exam practice question">
    <header className="quiz-topbar">
      <button className="icon-button quit-button" type="button" aria-label="Quit test" onClick={() => setShowQuit(true)}><span aria-hidden="true">×</span></button>
      <div className="quiz-progress-wrap">
        <div className="quiz-count"><strong>{index + 1}</strong><span>/ {total}</span><span className="quiz-time">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span></div>
        <div className="quiz-progress" role="progressbar" aria-label="Test progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1}><span style={{ width: `${(index + 1) / total * 100}%` }} /></div>
      </div>
      <PaperSettings />
    </header>

    <div className="quiz-content">
      <div className="booklet-heading"><strong>Kerala PSC · {question.paperCode||question.topic}</strong><span>Question {index+1} of {total}</span></div>
      <div className="quiz-topic">{question.topic}</div>
      <h1 className="question-prompt" lang={/[ഀ-ൿ]/u.test(question.text)?'ml':'en'}><span className="paper-question-number">{question.questionNumber}.</span>{question.text}</h1>
      <div className={`quiz-options${question.options.every(option => option.text.length <= 18) ? ' short-options' : ''}`} role="group" aria-label="Answer choices">
        {question.options.map((option, position) => {
          const selected = picked === option.key;
          const isCorrectAnswer = feedback?.correctOption === option.key;
          const isWrongSelection = !!feedback && selected && !feedback.isCorrect;
          const isRightSelection = !!feedback && selected && feedback.isCorrect;
          const dim = !!feedback && !selected && !isCorrectAnswer;
          return <motion.button key={option.key} type="button"
            className={`quiz-option${isWrongSelection ? ' is-wrong' : ''}${feedback && isCorrectAnswer ? ' is-correct' : ''}${selected&&!feedback ? ' is-selected' : ''}${dim ? ' is-dimmed' : ''}`}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ duration: .15 }} disabled={!!picked} aria-pressed={selected} aria-label={`${option.key}. ${option.text}${isRightSelection || isCorrectAnswer ? ', Correct answer' : isWrongSelection ? ', Your answer, wrong' : ''}`} data-answer-option="true" onClick={() => onChoose(option.key)}>
            <span className="option-badge">({option.key})</span>
            <span className="option-copy" lang={/[ഀ-ൿ]/u.test(option.text)?'ml':'en'}>{option.text}</span>
            <span className="option-mark" aria-hidden="true">
              {isWrongSelection ? '✗' : isRightSelection || isCorrectAnswer ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> : !picked ? <span className="option-shortcut">{position + 1}</span> : null}
            </span>
          </motion.button>;
        })}
      </div>
      {feedback&&<div className={`feedback-verdict ${feedback.isCorrect?'verdict-correct':'verdict-wrong'}`} role="status" aria-live="polite">
        <strong>{feedback.isCorrect?'✓ Correct':`✗ Wrong — answer is ${feedback.correctOption}`}</strong>
        {!feedback.isCorrect&&<span>Your answer: {picked}</span>}
        {feedback.explanation&&<div className="paper-explanation"><span>Explanation</span><p lang={/[ഀ-ൿ]/u.test(feedback.explanation)?'ml':'en'}>{feedback.explanation}</p></div>}
        {!quick&&<button type="button" className="button" onClick={onContinue}>Next →</button>}
      </div>}
      <div className="quiz-footer">
        <QuestionSource questionNumber={question.questionNumber} paperCode={question.paperCode} paperNumber={question.paperNumber} examDate={question.examDate} sourcePage={question.sourcePage}/>
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
            <button type="button" className="quit-confirm" disabled={quitting} onClick={async()=>{setQuitting(true);try{await onQuit()}finally{setQuitting(false)}}}>{quitting?'Ending session…':'Quit test'}</button>
          </div>
        </motion.div>
      </motion.div>}
    </AnimatePresence>
  </section>;
}
