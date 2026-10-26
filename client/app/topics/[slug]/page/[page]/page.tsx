import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {publicTopics,topicBySlug,topicPageCount} from '../../../../public-content';
import {publicMetadata} from '../../../../public-seo';
import TopicContent from '../../../TopicContent';
export const revalidate=86400;
export const dynamicParams=false;
export function generateStaticParams(){return publicTopics.flatMap(topic=>Array.from({length:Math.max(0,topicPageCount(topic)-1)},(_,index)=>({slug:topic.slug,page:String(index+2)})))}
export async function generateMetadata({params}:{params:{slug:string;page:string}}):Promise<Metadata>{const topic=topicBySlug(params.slug),page=Number(params.page);if(!topic)return{title:'Topic not found | LDC Practice',robots:{index:false,follow:false}};const shortName=topic.topic==='Simple Arithmetic, Mental Ability and Reasoning'?'Arithmetic & Reasoning':topic.topic==='Arts, Literature, Culture and Sports'?'Arts & Culture':topic.topic==='Kerala – Governance and System of Administration'?'Kerala Administration':topic.topic==='Regional Language: Malayalam'?'Malayalam':topic.topic==='Biology and Public Health'?'Biology & Health':topic.topic;return publicMetadata(`${shortName} – Page ${page} | LDC Practice`,`Kerala PSC LDC ${shortName} questions from previous papers, page ${page}. പി.എസ്.സി ചോദ്യങ്ങൾ.`,`/topics/${topic.slug}/page/${page}`)}
export default function TopicQuestionsPage({params}:{params:{slug:string;page:string}}){const page=Number(params.page),topic=topicBySlug(params.slug);if(!topic||!Number.isInteger(page)||page<2||page>topicPageCount(topic))notFound();return <TopicContent slug={params.slug} page={page}/>}
