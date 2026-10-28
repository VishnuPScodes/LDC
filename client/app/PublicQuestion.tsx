'use client';

import {useState} from 'react';
import type {PublicQuestion} from './public-content';

const formatExamDate=(value:string)=>new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`));
const questionLanguage=(text:string)=>/[\u0D00-\u0D7F]/u.test(text)?'ml':'en-IN';
const questionReportHref=(question:PublicQuestion)=>`/login?next=${encodeURIComponent(`/feedback?paper=${question.paperNumber}&question=${question.questionNumber}`)}`;

export default function PublicQuestion({question,index}:{question:PublicQuestion;index?:number}){
 const [revealed,setRevealed]=useState(false);
 const answer=question.options.find(option=>option.key===question.correctOption);
 return <article className="public-question paper-question" id={`q-${question.questionNumber}`}>
  <div className="public-question-label"><strong>Question / ചോദ്യം {index??question.questionNumber}</strong><span>{question.topic}</span></div>
  <h2 lang={questionLanguage(question.text)}><span className="paper-question-number">{index??question.questionNumber}.</span>{question.text}</h2>
  <ol className={`public-options${question.options.every(option=>option.text.length<=18)?' short-options':''}`} type="A">{question.options.map(option=><li key={option.key} className={revealed&&option.key===question.correctOption?'public-correct-option':''}><span className="option-key">({option.key})</span><span lang={questionLanguage(option.text)}>{option.text}</span>{revealed&&option.key===question.correctOption&&<strong className="answer-check">✓ Correct / ശരിയുത്തരം</strong>}</li>)}</ol>
  <button className="text-button answer-reveal" type="button" aria-expanded={revealed} onClick={()=>setRevealed(value=>!value)}>{revealed?'Hide answer / ഉത്തരം മറയ്ക്കുക':'Show answer / ഉത്തരം കാണുക'}</button>
  <div className={`public-answer${revealed?' is-revealed':''}`} aria-hidden={!revealed}><strong>Answer / ഉത്തരം: {question.correctOption}{answer?` — ${answer.text}`:''}</strong>{question.explanation&&<div className="paper-explanation"><span>Explanation</span><p lang={questionLanguage(question.explanation)}>{question.explanation}</p></div>}</div>
  <p className="public-question-source">Kerala PSC · Paper {question.paperCode} · {formatExamDate(question.examDate)}</p>
  <a className="report-problem-link" href={questionReportHref(question)}>Report a problem / പ്രശ്നം അറിയിക്കുക</a>
 </article>
}

export function AnswerRevealAll({questionCount}:{questionCount:number}){
 const [showAll,setShowAll]=useState(false);
 return <button className="secondary-button" type="button" aria-pressed={showAll} onClick={()=>{setShowAll(value=>!value);document.querySelectorAll<HTMLButtonElement>('.answer-reveal').forEach(button=>{const revealed=button.getAttribute('aria-expanded')==='true';if(revealed!==!showAll)button.click()})}}>{showAll?`Hide all answers / എല്ലാം മറയ്ക്കുക (${questionCount})`:`Show all answers / എല്ലാം കാണുക (${questionCount})`}</button>
}
