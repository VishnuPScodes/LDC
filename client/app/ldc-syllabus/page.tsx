import type {Metadata} from 'next';
import type {CSSProperties} from 'react';
import PublicFrame from '../PublicFrame';
import {officialLdcSyllabus,publicTopics,slugify} from '../public-content';
import {publicMetadata} from '../public-seo';

export const revalidate=86400;
export const metadata:Metadata=publicMetadata(
 `Kerala PSC LDC Detailed Syllabus (${officialLdcSyllabus.categoryNumbers.join(' & ')}) | LDC Practice`,
 'Detailed Kerala PSC LDC syllabus and official 100-mark distribution for categories 503/2023 and 504/2023, with a link to the original Kerala PSC PDF.',
 '/ldc-syllabus',
);

const syllabusTotal=officialLdcSyllabus.parts.reduce((sum,part)=>sum+part.marks,0);

export default function PublicSyllabusPage(){
 return <PublicFrame breadcrumbs={[{name:'Syllabus'}]}>
  <section className="public-page-heading ldc-syllabus-hero">
   <p className="eyebrow">KERALA PSC · LOWER DIVISION CLERK</p>
   <h1>Detailed LDC syllabus and mark distribution</h1>
   <p lang="ml">കേരള പി.എസ്.സി എൽ.ഡി.സി പരീക്ഷയുടെ വിശദമായ പാഠ്യപദ്ധതിയും മാർക്ക് വിഭജനവും.</p>
   <p>This is the detailed syllabus for LDC (Various Departments), category numbers {officialLdcSyllabus.categoryNumbers.join(' and ')}. The topic list and marks follow the Kerala PSC syllabus PDF.</p>
   <div className="ldc-syllabus-facts"><span><strong>{syllabusTotal}</strong> total marks</span><span><strong>{officialLdcSyllabus.parts.length}</strong> exam parts</span><span><strong>503/2023 · 504/2023</strong> category numbers</span></div>
   <a className="button" href={officialLdcSyllabus.sourceUrl} target="_blank" rel="noreferrer">Open official Kerala PSC syllabus PDF <span aria-hidden="true">↗</span></a>
  </section>

  <nav className="ldc-syllabus-part-nav" aria-label="Syllabus parts">
   {officialLdcSyllabus.parts.map(part=><a key={part.number} href={`#syllabus-part-${part.number}`}>Part {part.number}<span>{part.marks} marks</span></a>)}
  </nav>
  <div className="ldc-mark-distribution" aria-label="Marks by exam part">
   {officialLdcSyllabus.parts.map(part=><a key={part.number} href={`#syllabus-part-${part.number}`} style={{'--part-share':`${part.marks/syllabusTotal*100}%`} as CSSProperties}><span>Part {part.number}</span><strong>{part.marks}</strong></a>)}
  </div>

  <div className="ldc-syllabus-parts">
   {officialLdcSyllabus.parts.map((part,index)=><details className="ldc-syllabus-part" id={`syllabus-part-${part.number}`} key={part.number} open={index===0}>
    <summary><span className="ldc-part-number">{part.number}</span><span className="ldc-part-heading"><span className="eyebrow">PART {part.number}</span><strong>{part.title}</strong></span><span className="ldc-part-marks">{part.marks}<small>marks</small></span></summary>
    <div className="ldc-part-content">
     {part.sections.map((section,sectionIndex)=>{
      const topicAliases:Record<string,string>={
       'Kerala: Governance and System of Administration':'Kerala – Governance and System of Administration',
       'Life Science and Public Health':'Biology and Public Health',
       'Arts, Sports, Literature and Culture':'Arts, Literature, Culture and Sports',
       'Computer: Basics':'Basics of Computer',
      };
      const linkedTopic=publicTopics.find(topic=>topic.topic===(topicAliases[section.title]||section.title))||publicTopics.find(topic=>topic.slug===slugify(section.title));
      return <details className="ldc-syllabus-topic" key={`${section.title}-${sectionIndex}`}>
       <summary><span><strong>{section.title}</strong>{section.groups.length>0&&<small>{section.groups.reduce((count,group)=>count+group.topics.length,0)} listed areas</small>}</span><span className="ldc-topic-marks">{section.marks} marks</span></summary>
       <div className="ldc-topic-content">
        {section.groups.length===0?<p className="ldc-syllabus-note">Kerala PSC lists this part by subject; the original syllabus does not enumerate subtopics here.</p>:section.groups.map((group,groupIndex)=>{const groupTitle='title' in group?group.title:undefined;return <div className="ldc-syllabus-group" key={`${groupTitle||'topics'}-${groupIndex}`}>
         {groupTitle&&<h3>{groupTitle}</h3>}
         <ul>{group.topics.map((topic,topicIndex)=><li key={`${topicIndex}-${topic}`}>{topic}</li>)}</ul>
        </div>})}
        {linkedTopic&&<a className="ldc-practice-link" href={`/topics/${linkedTopic.slug}`}>Practise questions from this topic →</a>}
       </div>
      </details>;
     })}
     {part.number==='V'&&<p className="ldc-syllabus-note">The 10 marks are for the regional language selected for the examination. Malayalam, Kannada and Tamil are alternatives; they are not added together.</p>}
    </div>
   </details>)}
  </div>

  <p className="ldc-syllabus-note ldc-official-note">{officialLdcSyllabus.note}</p>
  <p className="ldc-syllabus-source">Source: <a href={officialLdcSyllabus.sourceUrl} target="_blank" rel="noreferrer">{officialLdcSyllabus.sourceLabel}</a>. Topic descriptions are presented in English for readability; use the official PDF for the original document.</p>
  <a className="button" href="/topics">Browse previous-year questions by topic →</a>
 </PublicFrame>;
}
