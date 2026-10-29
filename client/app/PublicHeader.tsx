'use client';
import {useEffect,useState} from 'react';
import LandingThemeToggle from './LandingThemeToggle';
import PublicNav from './PublicNav';

export default function PublicHeader(){const[authenticated,setAuthenticated]=useState<boolean|null>(null);useEffect(()=>{let alive=true;void fetch('/api/auth/me',{credentials:'include'}).then(response=>{if(alive)setAuthenticated(response.ok)}).catch(()=>{if(alive)setAuthenticated(false)});return()=>{alive=false}},[]);return <header className="header public-header"><a className="brand" href="/">LDC<span>.</span> practice</a><PublicNav authenticated={authenticated===true}/><div className="public-header-actions"><LandingThemeToggle/>{authenticated!==null&&<a className="secondary-button public-sign-in" href={authenticated?'/today':'/login'}>{authenticated?'Today':'Sign in'}</a>}</div></header>}
