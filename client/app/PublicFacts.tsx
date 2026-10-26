'use client';
import KnowledgeCards from './KnowledgeCards';
import LandingThemeToggle from './LandingThemeToggle';
import PublicNav from './PublicNav';
export default function PublicFacts(){return <main className="landing-shell public-site"><div className="shell public-guest-shell"><header className="header public-header"><a className="brand" href="/">LDC<span>.</span> practice</a><PublicNav/><div className="public-header-actions"><LandingThemeToggle/><a className="secondary-button" href="/login">Sign in</a></div></header><KnowledgeCards onExit={()=>window.location.assign('/')} onPractice={()=>window.location.assign('/practice')}/></div></main>}
