'use client';

import {useEffect,useRef,useState} from 'react';

type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

export default function PwaRegistration(){
  const [installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  const [mobile,setMobile]=useState(false);
  const [showGuide,setShowGuide]=useState(false);
  const installPromptRef=useRef<InstallPromptEvent|null>(null);

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
    const isMobile=/android|iphone|ipad|ipod/i.test(navigator.userAgent)||('ontouchstart' in window&&navigator.maxTouchPoints>1);
    setInstalled(standalone);
    setMobile(isMobile);

    const handleInstall=(event:Event)=>{event.preventDefault();installPromptRef.current=event as InstallPromptEvent;setInstallPrompt(event as InstallPromptEvent)};
    const handleMenuInstall=()=>{
      const prompt=installPromptRef.current;
      if(!prompt){
        const guide=/iphone|ipad|ipod/i.test(navigator.userAgent)?'Tap Share, then “Add to Home Screen”.':'Open your browser menu and choose “Install app” or “Add to Home screen”.';
        window.dispatchEvent(new CustomEvent('ldc:pwa-install-guide',{detail:guide}));
        setShowGuide(true);
        return;
      }
      void prompt.prompt().then(()=>prompt.userChoice).then(choice=>{if(choice.outcome==='accepted')setInstalled(true);installPromptRef.current=null;setInstallPrompt(null)}).catch(()=>setShowGuide(true));
    };
    const handleInstalled=()=>{setInstalled(true);installPromptRef.current=null;setInstallPrompt(null);setShowGuide(false)};
    window.addEventListener('beforeinstallprompt',handleInstall);
    window.addEventListener('appinstalled',handleInstalled);
    window.addEventListener('ldc:pwa-install',handleMenuInstall);
    if('serviceWorker' in navigator){
      if(process.env.NODE_ENV==='production')void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(error=>console.error('PWA service worker registration failed',error));
      // Dev chunk URLs are not content-hashed, so a cache-first worker serves stale scripts and breaks the page
      // ("Cannot read properties of undefined (reading 'call')"). Remove any worker left over and reload once.
      else void removeDevServiceWorker();
    }
    return()=>{window.removeEventListener('beforeinstallprompt',handleInstall);window.removeEventListener('appinstalled',handleInstalled);window.removeEventListener('ldc:pwa-install',handleMenuInstall)};
  },[]);

  if(installed||(!installPrompt&&!mobile))return null;

  const onInstall=async()=>{
    if(!installPrompt){setShowGuide(value=>!value);return}
    await installPrompt.prompt();
    const choice=await installPrompt.userChoice;
    if(choice.outcome==='accepted')setInstalled(true);
    setInstallPrompt(null);
  };

  return <aside className={`pwa-install${mobile?' is-mobile':''}`} aria-label="Install LDC Practice">
    {showGuide&&<p className="pwa-install-guide">{/iphone|ipad|ipod/i.test(navigator.userAgent)?'Tap Share, then “Add to Home Screen”.':'Open your browser menu and choose “Install app” or “Add to Home screen”.'}</p>}
    <button type="button" className="pwa-install-button" onClick={()=>void onInstall()}><span aria-hidden="true">↓</span> Install app</button>
  </aside>;
}

async function removeDevServiceWorker(){
  try{
    const registrations=await navigator.serviceWorker.getRegistrations();
    if(!registrations.length)return;
    await Promise.all(registrations.map(registration=>registration.unregister()));
    if('caches' in window){const keys=await caches.keys();await Promise.all(keys.filter(key=>key.startsWith('ldc-practice-')).map(key=>caches.delete(key)))}
    if(navigator.serviceWorker.controller&&!sessionStorage.getItem('ldc-dev-sw-cleared')){sessionStorage.setItem('ldc-dev-sw-cleared','1');window.location.reload()}
  }catch(error){console.error('Could not remove the development service worker',error)}
}
