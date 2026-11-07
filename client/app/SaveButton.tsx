'use client';

// Star toggle for keeping a question in the learner's Saved list.
export default function SaveButton({saved,onToggle,compact=false}:{saved:boolean;onToggle:()=>void;compact?:boolean}){
 return <button type="button" className={`save-star${saved?' is-saved':''}${compact?' is-compact':''}`} aria-pressed={saved} aria-label={saved?'Saved':'Save question'} title={saved?'Remove from saved questions':'Save question'} onClick={onToggle}>
  <span className="save-star-icon" aria-hidden="true">{saved?'★':'☆'}</span><span className="save-star-text" aria-hidden="true">{saved?'Saved':'Save'}</span>
 </button>;
}
