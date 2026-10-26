import type {Metadata} from 'next';
import {publicTopics,topicBySlug} from '../../public-content';
import {publicMetadata} from '../../public-seo';
import TopicContent from '../TopicContent';
export const revalidate=86400;
export const dynamicParams=false;
export function generateStaticParams(){return publicTopics.map(topic=>({slug:topic.slug}))}
export async function generateMetadata({params}:{params:{slug:string}}):Promise<Metadata>{const topic=topicBySlug(params.slug);if(!topic)return{title:'Topic not found | LDC Practice',robots:{index:false,follow:false}};const shortName=topic.topic==='Simple Arithmetic, Mental Ability and Reasoning'?'Arithmetic & Reasoning':topic.topic==='Arts, Literature, Culture and Sports'?'Arts & Culture':topic.topic==='Kerala – Governance and System of Administration'?'Kerala Administration':topic.topic==='Regional Language: Malayalam'?'Malayalam':topic.topic==='Biology and Public Health'?'Biology & Health':topic.topic;return publicMetadata(`${shortName} LDC Questions | LDC Practice`,`Verified Kerala PSC LDC ${shortName} questions and answers from previous papers. പി.എസ്.സി മുൻവർഷ ചോദ്യങ്ങൾ.`,`/topics/${topic.slug}`)}
export default function TopicPage({params}:{params:{slug:string}}){return <TopicContent slug={params.slug} page={1}/>}
