import type {Metadata} from 'next';
import GuestPractice from '../../GuestPractice';
import {cookies} from 'next/headers';
import AppShell from '../../AppShell';
import LandingShell from '../../LandingShell';

export const metadata:Metadata={title:'Full LDC mock exam | LDC Practice',description:'Take a full Kerala PSC LDC mock exam without creating an account.',robots:{index:false,follow:true}};
export default function GuestMockExamPage(){if(cookies().get('ldc_token'))return <AppShell landing={<LandingShell/>}/>;return <GuestPractice timer mock/>}
