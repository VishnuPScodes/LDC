import AppShell from '../AppShell';
import LandingShell from '../LandingShell';
import type {Metadata} from 'next';

export async function generateMetadata({params}:{params:{path:string[]}}):Promise<Metadata>{const path=params.path.join('/'),title=path.startsWith('session/')?'Practice session':path.startsWith('history/')?'Session results':path==='today'?'Today':path==='review'?'Review questions':path==='history'?'Practice history':path==='progress'?'Study progress':path==='feedback'?'Feedback':path==='syllabus'?'My syllabus':path==='login'?'Sign in':'LDC Practice';return{title:`${title} | LDC Practice`,robots:{index:false,follow:false}}}
export default function AppRoute(){return <AppShell landing={<LandingShell/>}/>}
