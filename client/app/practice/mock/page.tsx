import type {Metadata} from 'next';
import GuestPractice from '../../GuestPractice';

export const metadata:Metadata={title:'Full LDC mock exam | LDC Practice',description:'Take a full Kerala PSC LDC mock exam without creating an account.',robots:{index:false,follow:true}};
export default function GuestMockExamPage(){return <GuestPractice timer mock/>}
