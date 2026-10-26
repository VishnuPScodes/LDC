import type {Metadata} from 'next';
import PublicFrame from '../PublicFrame';
import {publicTopics,syllabus} from '../public-content';
import {publicMetadata} from '../public-seo';
export const revalidate=86400;
export const metadata:Metadata=publicMetadata('Kerala PSC LDC Questions by Topic | LDC Practice','Choose an LDC syllabus subject to practise verified Kerala PSC previous-year questions. വിഷയം തിരഞ്ഞെടുത്ത് ചോദ്യങ്ങൾ പരിശീലിക്കൂ.','/topics');
export default function TopicsPage(){const marks=syllabus.reduce((sum,topic)=>sum+topic.marks,0);return <PublicFrame breadcrumbs={[{name:'Topics'}]}><section className="public-page-heading"><h1>Practise Kerala PSC LDC questions by topic</h1><p lang="ml">പാഠ്യവിഷയം തിരഞ്ഞെടുത്ത് മുൻവർഷ ചോദ്യങ്ങൾ പരിശീലിക്കൂ.</p><p>Choose a syllabus subject to review its mark share and verified questions from previous papers.</p></section><div className="public-card-grid">{publicTopics.map(topic=><a className="public-card" href={`/topics/${topic.slug}`} key={topic.slug}><strong>{topic.topic}</strong><span>{topic.marks} of {marks} syllabus marks ({Math.round(topic.marks/marks*100)}%)</span><span>{topic.questions.length} verified questions</span></a>)}</div></PublicFrame>}
