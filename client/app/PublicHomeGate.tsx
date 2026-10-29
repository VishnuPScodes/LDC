'use client';
import {useEffect,useState} from 'react';
export default function PublicHomeGate(){const[checking,setChecking]=useState(true);useEffect(()=>{let alive=true;void fetch('/api/auth/me',{credentials:'include'}).then(response=>{if(!alive)return;if(response.ok)window.location.replace('/today');else setChecking(false)}).catch(()=>alive&&setChecking(false));return()=>{alive=false}},[]);return checking?<div className="public-auth-check" role="status" aria-label="Checking sign-in status"/>:null}
