'use client';
import {useState} from 'react';
import {motivationalQuotes} from './motivational-quotes';

export default function MotivationQuoteCard({language}:{language:'en'|'ml'}){
  const ml=language==='ml';
  const [index,setIndex]=useState(()=>dailyQuoteIndex());
  const quote=motivationalQuotes[index];
  const move=(step:number)=>setIndex(current=>(current+step+motivationalQuotes.length)%motivationalQuotes.length);
  return <section className="motivation-quote-card" aria-label={ml?'ഇന്നത്തെ പ്രചോദനവാക്ക്':'Daily inspiration'}>
    <div className="quote-card-heading"><span className="quote-card-mark" aria-hidden="true">✳</span><span className="quote-card-label">{ml?'ഇന്നത്തെ പ്രചോദനവാക്ക്':'A NOTE FOR TODAY'}</span><span className="quote-card-count">{index+1} / {motivationalQuotes.length}</span></div>
    <blockquote className={`motivation-quote-text${ml?' quote-malayalam':''}`} lang={ml?'ml':'en'} aria-live="polite">“{ml?quote.ml:quote.en}”</blockquote>
    <div className="quote-card-footer"><a href={quote.source} target="_blank" rel="noreferrer" aria-label={`${ml?'ഉദ്ധരണിയുടെ ഉറവിടം':'Quote source'}: ${quote.author}`}>— {quote.author}</a><div className="quote-card-controls"><button type="button" onClick={()=>move(-1)} aria-label={ml?'മുൻ ഉദ്ധരണി':'Previous quote'}>←</button><button type="button" onClick={()=>move(1)} aria-label={ml?'അടുത്ത ഉദ്ധരണി':'Next quote'}>→</button></div></div>
  </section>;
}

function dailyQuoteIndex(){const now=new Date(),day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000);return day%motivationalQuotes.length}
