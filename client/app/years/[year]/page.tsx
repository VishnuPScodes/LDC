import type {Metadata} from 'next';
import PublicFrame from '../../PublicFrame';
import {formatExamDate,publicPapers,publicYears} from '../../public-content';
import {publicMetadata} from '../../public-seo';
export const revalidate=86400;
export const dynamicParams=false;
export function generateStaticParams(){return publicYears.map(year=>({year:String(year)}))}
export async function generateMetadata({params}:{params:{year:string}}):Promise<Metadata>{const year=Number(params.year);return publicMetadata(`Kerala PSC LDC ${year} Papers with Answers | LDC Practice`,`Browse ${year} Kerala PSC LDC question papers, exam dates and verified answer keys. പി.എസ്.സി മുൻവർഷ ചോദ്യങ്ങൾ.`,`/years/${year}`)}
export default function YearPage({params}:{params:{year:string}}){const year=Number(params.year),papers=publicPapers.filter(paper=>paper.year===year);return <PublicFrame breadcrumbs={[{name:'Question Papers',url:'/papers'},{name:String(year)}]}><section className="public-page-heading"><h1>Kerala PSC LDC {year} question papers with answer keys</h1><p lang="ml">{year} ലെ എൽഡിസി ചോദ്യപേപ്പറുകളും ഉത്തരങ്ങളും</p><p>{papers.length} previous-year papers · {papers.reduce((sum,paper)=>sum+paper.questions.length,0)} verified questions</p></section><div className="public-card-grid">{papers.map(paper=><a className="public-card" href={`/papers/${paper.slug}`} key={paper.slug}><strong>Paper {paper.paperCode}</strong><span>{formatExamDate(paper.examDate)}</span><span>{paper.questions.length} verified questions</span></a>)}</div></PublicFrame>}
