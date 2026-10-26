import type {Metadata} from 'next';
import PublicFrame from '../PublicFrame';
import {formatExamDate,publicPapers,publicYears} from '../public-content';
import {publicMetadata} from '../public-seo';
export const revalidate=86400;
export const metadata:Metadata=publicMetadata('Kerala PSC LDC Question Papers with Answers | LDC Practice','Browse verified Kerala PSC LDC previous-year question papers from 2013 to 2023. എൽഡിസി ചോദ്യപേപ്പറുകൾ ഉത്തരങ്ങളോടെ.','/papers');
export default function PapersPage(){return <PublicFrame breadcrumbs={[{name:'Question Papers'}]}><section className="public-page-heading"><p className="eyebrow">KERALA PSC · LDC</p><h1>Question papers with answers</h1><p lang="ml">2013 മുതൽ 2023 വരെയുള്ള പി.എസ്.സി മുൻവർഷ ചോദ്യപേപ്പറുകൾ</p><p>Choose a paper to read every verified question and reveal its answer when you are ready.</p></section>{publicYears.map(year=><section className="public-section" key={year}><h2><a href={`/years/${year}`}>{year} LDC question papers</a></h2><div className="public-card-grid">{publicPapers.filter(paper=>paper.year===year).map(paper=><a className="public-card" href={`/papers/${paper.slug}`} key={paper.slug}><strong>Paper {paper.paperCode}</strong><span>{formatExamDate(paper.examDate)}</span><span>{paper.questions.length} verified questions</span></a>)}</div></section>)}</PublicFrame>}
