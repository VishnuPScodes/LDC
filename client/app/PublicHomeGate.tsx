'use client';
import {useEffect} from 'react';
export default function PublicHomeGate(){useEffect(()=>{let alive=true;const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),1200);void fetch('/api/auth/me',{credentials:'include',signal:controller.signal}).then(response=>{if(alive&&response.ok)window.location.replace('/today')}).catch(()=>{}).finally(()=>window.clearTimeout(timeout));return()=>{alive=false;window.clearTimeout(timeout);controller.abort()}},[]);return null}
