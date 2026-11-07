'use client';

import {useEffect,useState} from 'react';
import LandingThemeToggle from './LandingThemeToggle';
import PublicNav from './PublicNav';

export default function PublicHeader(){
 const [authenticated,setAuthenticated]=useState<boolean|null>(null),[ml,setMl]=useState(false),[menuOpen,setMenuOpen]=useState(false),[installGuide,setInstallGuide]=useState('');
 useEffect(()=>{
  let alive=true;const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),2000);
  void fetch('/api/auth/me',{credentials:'include',signal:controller.signal}).then(response=>{if(alive)setAuthenticated(response.ok)}).catch(()=>{if(alive)setAuthenticated(false)}).finally(()=>window.clearTimeout(timeout));
  try{const selected=localStorage.getItem('ldc-language')==='ml';setMl(selected);document.documentElement.lang=selected?'ml':'en-IN'}catch{}
  return()=>{alive=false;window.clearTimeout(timeout);controller.abort()};
 },[]);
 useEffect(()=>{const show=(event:Event)=>setInstallGuide(String((event as CustomEvent).detail||''));window.addEventListener('ldc:pwa-install-guide',show);return()=>window.removeEventListener('ldc:pwa-install-guide',show)},[]);
 const toggleLanguage=()=>{const next=!ml;setMl(next);try{localStorage.setItem('ldc-language',next?'ml':'en');document.documentElement.lang=next?'ml':'en-IN'}catch{}};
 const isAccount=authenticated===true;
 return <header className="header public-header">
  <a className="brand" href={isAccount?'/today':'/'}>LDC<span>.</span> practice</a>
  <PublicNav authenticated={isAccount} language={ml?'ml':'en'}/>
  <div className="public-header-controls">
   <button type="button" className="public-language-toggle" onClick={toggleLanguage} aria-label={ml?'Switch to English':'മലയാളത്തിലേക്ക് മാറുക'} title={ml?'Switch to English':'മലയാളം'}><svg className="nav-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.5 3.5 5.3 3.5 8.5s-1.1 6-3.5 8.5c-2.4-2.5-3.5-5.3-3.5-8.5s1.1-6 3.5-8.5Z"/></svg><span>{ml?'EN':'മല'}</span></button>
   <div className="public-header-actions"><LandingThemeToggle/><a className="secondary-button public-sign-in" href={isAccount?'/today':'/login'}>{isAccount?(ml?'അക്കൗണ്ട്':'Account'):(ml?'സൈൻ ഇൻ':'Sign in')}</a></div>
   <button type="button" className="public-menu-toggle" aria-label={menuOpen?(ml?'മെനു അടയ്ക്കുക':'Close menu'):(ml?'മെനു തുറക്കുക':'Open menu')} aria-expanded={menuOpen} aria-controls="public-mobile-menu" onClick={()=>setMenuOpen(value=>!value)}><span aria-hidden="true">{menuOpen?'×':'☰'}</span></button>
  </div>
  {menuOpen&&<><button className="mobile-menu-scrim" type="button" aria-label={ml?'മെനു അടയ്ക്കുക':'Close menu'} onClick={()=>setMenuOpen(false)}/><nav className="mobile-site-menu public-mobile-menu" id="public-mobile-menu" aria-label={ml?'കൂടുതൽ നാവിഗേഷൻ':'More navigation'}>
   <div className="mobile-menu-brand-block"><a className="mobile-menu-brand" href={isAccount?'/today':'/'}>LDC<span>.</span> practice</a></div>
   <div className="mobile-public-menu-links"><PublicNav authenticated={isAccount} language={ml?'ml':'en'}/></div>
   <LandingThemeToggle/>
   <a href={isAccount?'/today':'/login'}>{isAccount?(ml?'അക്കൗണ്ട്':'Account'):(ml?'സൈൻ ഇൻ':'Sign in')}</a>
   <a href="/login?next=%2Ffeedback">{ml?'അഭിപ്രായം':'Feedback'}</a>
   <button type="button" className="mobile-install-link" onClick={()=>{setInstallGuide('');window.dispatchEvent(new Event('ldc:pwa-install'))}}>{ml?'ആപ്പ് ഇൻസ്റ്റാൾ ചെയ്യുക':'Install app'}</button>
   {installGuide&&<p className="mobile-install-guide" role="status">{ml?'ഹോം സ്‌ക്രീനിലേക്ക് ചേർക്കാൻ ബ്രൗസർ മെനു തുറക്കുക.':installGuide}</p>}
  </nav></>}
 </header>;
}
