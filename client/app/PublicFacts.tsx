'use client';
import KnowledgeCards from './KnowledgeCards';
import PublicHeader from './PublicHeader';
export default function PublicFacts(){return <main className="landing-shell public-site"><div className="shell public-guest-shell"><PublicHeader/><KnowledgeCards onExit={()=>window.location.assign('/')} onPractice={()=>window.location.assign('/practice')}/></div></main>}
