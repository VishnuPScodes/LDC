'use client';
import {useEffect,useState} from 'react';
type Tone='white'|'cream'|'night';type Size='small'|'normal'|'large'|'xlarge';
export default function PaperSettings(){
 const [open,setOpen]=useState(false),[tone,setTone]=useState<Tone>('cream'),[size,setSize]=useState<Size>('normal');
 useEffect(()=>{const night=!!document.querySelector('.dark');try{const saved=JSON.parse(localStorage.getItem('ldc-paper-reading')||'{}');setTone(saved.tone||(night?'night':'cream'));setSize(saved.size||'normal')}catch{setTone(night?'night':'cream')}},[]);
 useEffect(()=>{const root=document.documentElement;root.dataset.paperTone=tone;root.dataset.paperSize=size;try{localStorage.setItem('ldc-paper-reading',JSON.stringify({tone,size}))}catch{}},[tone,size]);
 return <div className="paper-settings"><button type="button" aria-expanded={open} aria-label="Reading settings" onClick={()=>setOpen(v=>!v)}>Aa</button>{open&&<div className="paper-settings-popover"><label>Text size<select value={size} onChange={e=>setSize(e.target.value as Size)}><option value="small">Small</option><option value="normal">Normal</option><option value="large">Large</option><option value="xlarge">Extra large</option></select></label><label>Paper<select value={tone} onChange={e=>setTone(e.target.value as Tone)}><option value="white">White</option><option value="cream">Cream</option><option value="night">Night</option></select></label></div>}</div>
}
