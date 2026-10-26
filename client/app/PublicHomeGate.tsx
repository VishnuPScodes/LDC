'use client';
import {useEffect} from 'react';
export default function PublicHomeGate(){useEffect(()=>{let alive=true;void fetch('/api/auth/me',{credentials:'include'}).then(response=>{if(alive&&response.ok)window.location.replace('/today')}).catch(()=>{});return()=>{alive=false}},[]);return null}
