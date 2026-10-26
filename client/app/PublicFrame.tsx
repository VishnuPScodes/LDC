import type {ReactNode} from 'react';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import {siteUrl} from './site-url';

export default function PublicFrame({children,breadcrumbs=[]}:{children:ReactNode;breadcrumbs?:{name:string;url?:string}[]}){
 const trail=[{name:'Home',url:'/'},...breadcrumbs];
 const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:trail.map((item,index)=>({'@type':'ListItem',position:index+1,name:item.name,...(item.url?{item:new URL(item.url,siteUrl).toString()}:{})}))};
 return <main className="landing-shell public-site"><div className="shell"><PublicHeader/>{children}<nav className="public-internal-links" aria-label="Explore public resources"><a href="/papers">Question Papers</a><a href="/topics">Topics</a><a href="/ldc-syllabus">LDC Syllabus</a></nav><PublicFooter/></div><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/></main>
}
