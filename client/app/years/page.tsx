import type {Metadata} from 'next';
import PublicFrame from '../PublicFrame';
import {publicPapers,publicYears} from '../public-content';
import {publicMetadata} from '../public-seo';
export const revalidate=86400;
export const metadata:Metadata=publicMetadata('Kerala PSC LDC Question Papers by Year | LDC Practice','Browse Kerala PSC LDC previous-year papers and verified answer keys by exam year. എൽഡിസി മുൻവർഷ ചോദ്യപേപ്പറുകൾ.','/years');
export default function YearsPage(){return <PublicFrame breadcrumbs={[{name:'Years'}]}><section className="public-page-heading"><h1>Kerala PSC LDC papers by year</h1><p lang="ml">വർഷം തിരഞ്ഞെടുത്ത് മുൻവർഷ ചോദ്യങ്ങൾ പരിശീലിക്കൂ.</p></section><div className="public-card-grid">{publicYears.map(year=><a className="public-card" href={`/years/${year}`} key={year}><strong>{year}</strong><span>{publicPapers.filter(paper=>paper.year===year).length} papers</span></a>)}</div></PublicFrame>}
