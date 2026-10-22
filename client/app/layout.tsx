import './globals.css';import type {Metadata,Viewport} from 'next';import type {ReactNode} from 'react';import PwaRegistration from './PwaRegistration';
export const metadata:Metadata={title:'LDC Practice | Kerala PSC',description:'A focused Kerala PSC LDC exam practice workspace',applicationName:'LDC Practice',appleWebApp:{capable:true,statusBarStyle:'default',title:'LDC Practice'},icons:{icon:[{url:'/icons/icon.svg',type:'image/svg+xml'},{url:'/icons/icon-192.png',type:'image/png',sizes:'192x192'}],apple:'/icons/apple-touch-icon.png'}};
export const viewport:Viewport={themeColor:'#176342',width:'device-width',initialScale:1,viewportFit:'cover'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body><PwaRegistration/>{children}</body></html>}
