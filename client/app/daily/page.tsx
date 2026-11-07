import type {Metadata} from 'next';
import DailyChallenge from '../DailyChallenge';
import {publicMetadata} from '../public-seo';
import {siteUrl} from '../site-url';

const base=publicMetadata('LDC Daily Challenge | LDC Practice','Ten Kerala PSC LDC previous-year questions, the same for everyone, every day. Finish today’s set, keep your streak and share your score.','/daily');
const image=new URL('/og?title=LDC%20Daily%20Challenge',siteUrl).toString();
export const metadata:Metadata={...base,openGraph:{...base.openGraph,images:[{url:image,width:1200,height:630,alt:'LDC Daily Challenge'}]},twitter:{...base.twitter,images:[image]}};

export default function DailyPage(){return <DailyChallenge/>}
