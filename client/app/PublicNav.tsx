'use client';

import {usePathname} from 'next/navigation';

const links=[
 ['/papers','Question Papers','ചോദ്യപേപ്പറുകൾ'],
 ['/topics','Topics','വിഷയങ്ങൾ'],
 ['/ldc-syllabus','Syllabus','പാഠ്യപദ്ധതി'],
 ['/practice','Practice','പരിശീലനം'],
 ['/facts','Knowledge','അറിവ്'],
] as const;

export default function PublicNav({authenticated=false,language='en'}:{authenticated?:boolean;language?:'en'|'ml'}){
 const pathname=usePathname()||'/',ml=language==='ml';
 const appLinks=[['/today','Today','ഇന്ന്'],['/practice','Practice','പരിശീലനം'],['/review','Review','ആവർത്തനം'],['/progress','Progress','പുരോഗതി']] as const;
 // Signed-in visitors already reach Knowledge from the app menu; keep this row short enough for one line.
 const items=authenticated?[...appLinks,...links.filter(([href])=>href!=='/facts'&&!appLinks.some(([appHref])=>appHref===href))]:links;
 return <nav className="public-nav" aria-label={ml?'പ്രധാന നാവിഗേഷൻ':'Main navigation'}>{items.map(([href,en,mlLabel])=><a key={href} href={href} aria-current={pathname===href||pathname.startsWith(`${href}/`)?'page':undefined}>{ml?mlLabel:en}</a>)}</nav>;
}
