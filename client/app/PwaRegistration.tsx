'use client';

import {useEffect,useState} from 'react';

type InstallPromptEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};

export default function PwaRegistration(){
  const [installPrompt,setInstallPrompt]=useState<InstallPromptEvent|null>(null);
  const [installed,setInstalled]=useState(false);
  const [mobile,setMobile]=useState(false);
  const [showGuide,setShowGuide]=useState(false);

  useEffect(()=>{
    const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
    const isMobile=/android|iphone|ipad|ipod/i.test(navigator.userAgent)||('ontouchstart' in window&&navigator.maxTouchPoints>1);
    setInstalled(standalone);
    setMobile(isMobile);

    const handleInstall=(event:Event)=>{event.preventDefault();setInstallPrompt(event as InstallPromptEvent)};
    const handleInstalled=()=>{setInstalled(true);setInstallPrompt(null);setShowGuide(false)};
    window.addEventListener('beforeinstallprompt',handleInstall);
    window.addEventListener('appinstalled',handleInstalled);
    if('serviceWorker' in navigator)void navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(error=>console.error('PWA service worker registration failed',error));
    return()=>{window.removeEventListener('beforeinstallprompt',handleInstall);window.removeEventListener('appinstalled',handleInstalled)};
  },[]);

  if(installed||(!installPrompt&&!mobile))return null;

  const onInstall=async()=>{
    if(!installPrompt){setShowGuide(value=>!value);return}
    await installPrompt.prompt();
    const choice=await installPrompt.userChoice;
    if(choice.outcome==='accepted')setInstalled(true);
    setInstallPrompt(null);
  };

  return <aside className="pwa-install" aria-label="Install LDC Practice">
    {showGuide&&<p className="pwa-install-guide">{/iphone|ipad|ipod/i.test(navigator.userAgent)?'Tap Share, then “Add to Home Screen”.':'Open your browser menu and choose “Install app” or “Add to Home screen”.'}</p>}
    <button type="button" className="pwa-install-button" onClick={()=>void onInstall()}><span aria-hidden="true">↓</span> Install app</button>
  </aside>;
}
