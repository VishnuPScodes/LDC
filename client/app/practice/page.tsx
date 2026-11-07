import type {Metadata} from 'next';
import GuestPractice from '../GuestPractice';
import {paperBySlug,topicBySlug} from '../public-content';
import {cookies} from 'next/headers';
import AppShell from '../AppShell';
import LandingShell from '../LandingShell';
export const metadata:Metadata={title:'Guest practice | LDC Practice',description:'Practise Kerala PSC LDC verified questions without creating an account.',robots:{index:false,follow:true}};
export default function GuestPracticePage({searchParams}:{searchParams:{paper?:string;topic?:string;timer?:string;mock?:string;count?:string}}){// Signed-in learners get their practice setup; AppShell falls back to guest practice if the session has expired.
if(cookies().get('ldc_token')&&!searchParams.paper&&!searchParams.topic&&!searchParams.timer&&!searchParams.mock)return <AppShell landing={<LandingShell/>}/>;
const paper=searchParams.paper?paperBySlug(searchParams.paper):undefined,topic=searchParams.topic?topicBySlug(searchParams.topic):undefined,mock=searchParams.mock==='1',count=Number(searchParams.count);return <GuestPractice paper={paper?{slug:paper.slug,name:paper.paperCode,count:paper.questions.length}:undefined} topic={topic?{slug:topic.slug,name:topic.topic,count:topic.questions.length}:undefined} timer={mock||searchParams.timer==='1'} mock={mock} initialCount={Number.isInteger(count)&&count>0&&count<=200?count:20}/>}
