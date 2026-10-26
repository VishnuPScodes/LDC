import questionsJson from '../../server/data/questions.json';
import syllabusJson from '../../server/data/syllabus.json';
import {PAPER_METADATA} from '../../server/src/paper-metadata';
import {isPublicQuestion} from '../../server/src/public-question';

export type PublicQuestion={questionNumber:number;text:string;options:{key:string;text:string}[];correctOption:'A'|'B'|'C'|'D';explanation?:string;topic:string;sourcePage?:number;paperNumber:number;pdfOrder?:number;paperCode:string;examDate:string};
export type PublicPaper={paperNumber:number;paperCode:string;examDate:string;slug:string;year:number;questions:PublicQuestion[]};
export type PublicTopic={topic:string;slug:string;part:string;marks:number;description:string;sourceTopics:string[];questions:PublicQuestion[]};

const rawQuestions=questionsJson as any[];
export const syllabus=syllabusJson as {topic:string;part:string;marks:number;subtopics:string[]}[];
// Stable source revision from the latest committed change to each data file; never use request time here.
export const questionDataLastModified=new Date('2026-10-26T15:09:34+05:30');
export const syllabusDataLastModified=new Date('2026-10-22T14:04:59+05:30');
const language='[\\u0D00-\\u0D7F]';
const descriptions:Record<string,string>={
 History:'Study Indian and Kerala history, national movements, social reformers and key events asked in Kerala PSC LDC previous papers.',
 Geography:'Revise Indian and Kerala geography, rivers, climate, natural resources, maps and census facts through previous questions.',
 Economics:'Practise Indian economy, planning, banking, budgets and basic economic ideas from LDC question papers.',
 'Indian Constitution':'Review the Constitution of India, fundamental rights, duties, institutions and governance questions.',
 'Kerala – Governance and System of Administration':'Learn Kerala governance, public administration, local bodies and state institutions.',
 'Biology and Public Health':'Practise biology, human health, diseases, nutrition and public health questions.',
 Physics:'Revise the basic physics concepts and applications asked in Kerala PSC LDC exams.',
 Chemistry:'Practise chemistry concepts, elements, reactions and everyday applications from past papers.',
 'Arts, Literature, Culture and Sports':'Explore Kerala and Indian arts, literature, culture, awards and sports questions.',
 'Basics of Computer':'Review computer fundamentals, operating systems, internet and digital literacy questions.',
 'Current Affairs':'Test your knowledge of important national and Kerala current affairs found in previous LDC papers.',
 'Simple Arithmetic, Mental Ability and Reasoning':'Practise arithmetic, number problems, logical reasoning, series and mental ability.',
 'General English':'Build grammar, vocabulary and usage skills with English questions from LDC papers.',
 'Regional Language: Malayalam':'Practise Malayalam grammar, vocabulary and language questions from past LDC papers.'
};
export const publicQuestions:PublicQuestion[]=rawQuestions.filter(isPublicQuestion).map(row=>{const metadata=PAPER_METADATA[row.paperNumber];return{questionNumber:row.questionNumber,text:row.text,options:row.options,correctOption:row.correctOption,explanation:row.explanation,topic:row.topic,sourcePage:row.sourcePage,paperNumber:row.paperNumber,pdfOrder:row.pdfOrder,paperCode:metadata?.paperCode||'',examDate:metadata?.examDate||''}}).filter(row=>row.paperCode&&row.examDate);
export function slugify(value:string){const special:Record<string,string>={'Simple Arithmetic, Mental Ability and Reasoning':'simple-arithmetic','Biology and Public Health':'biology-public-health','Arts, Literature, Culture and Sports':'arts-literature-culture-sports'};return special[value]||value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
export const publicPapers:PublicPaper[]=Object.entries(PAPER_METADATA).map(([key,metadata])=>{const paperNumber=Number(key),questions=publicQuestions.filter(question=>question.paperNumber===paperNumber).sort((a,b)=>a.questionNumber-b.questionNumber),year=Number(metadata.paperCode.match(/\d{4}/)?.[0]||0);return{paperNumber,paperCode:metadata.paperCode,examDate:metadata.examDate,slug:metadata.paperCode.toLowerCase().replaceAll('/','-'),year,questions}}).filter(paper=>paper.questions.length).sort((a,b)=>b.examDate.localeCompare(a.examDate)||a.paperCode.localeCompare(b.paperCode));
export const publicYears=[...new Set(publicPapers.map(paper=>paper.year))].sort((a,b)=>b-a);
export const publicTopics:PublicTopic[]=syllabus.map(item=>({topic:item.topic,slug:slugify(item.topic),part:item.part,marks:item.marks,description:descriptions[item.topic]||`Practise verified Kerala PSC LDC previous-year questions in ${item.topic}.`,sourceTopics:[item.topic],questions:publicQuestions.filter(question=>question.topic===item.topic)})).filter(topic=>topic.questions.length);
const scienceTopics=['Biology and Public Health','Physics','Chemistry'];
publicTopics.push({topic:'General Science',slug:'general-science',part:'Part I — General Knowledge',marks:scienceTopics.reduce((sum,name)=>sum+(syllabus.find(item=>item.topic===name)?.marks||0),0),description:'Practise biology, public health, physics and chemistry from Kerala PSC LDC previous-year papers.',sourceTopics:scienceTopics,questions:publicQuestions.filter(question=>scienceTopics.includes(question.topic))});
export function paperBySlug(slug:string){return publicPapers.find(paper=>paper.slug===slug.toLowerCase())}
export function topicBySlug(slug:string){return publicTopics.find(topic=>topic.slug===slug.toLowerCase())}
export function topicSlugForName(topic:string){return slugify(topic)}
export function topicPageCount(topic:PublicTopic){return Math.ceil(topic.questions.length/50)}
export function formatExamDate(value:string){return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T00:00:00Z`))}
export function questionLanguage(text:string){return new RegExp(language,'u').test(text)?'ml':'en-IN'}
