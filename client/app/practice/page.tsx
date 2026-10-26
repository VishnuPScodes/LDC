import type {Metadata} from 'next';
import GuestPractice from '../GuestPractice';
import {paperBySlug,topicBySlug} from '../public-content';
export const metadata:Metadata={title:'Guest practice | LDC Practice',description:'Practise Kerala PSC LDC verified questions without creating an account.',robots:{index:false,follow:true}};
export default function GuestPracticePage({searchParams}:{searchParams:{paper?:string;topic?:string;timer?:string}}){const paper=searchParams.paper?paperBySlug(searchParams.paper):undefined,topic=searchParams.topic?topicBySlug(searchParams.topic):undefined;return <GuestPractice paper={paper?{slug:paper.slug,name:paper.paperCode,count:paper.questions.length}:undefined} topic={topic?{slug:topic.slug,name:topic.topic,count:topic.questions.length}:undefined} timer={searchParams.timer==='1'}/>}
