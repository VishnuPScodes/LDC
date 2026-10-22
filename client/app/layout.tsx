import './globals.css';import type {Metadata} from 'next';import type {ReactNode} from 'react';
export const metadata:Metadata={title:'LDC Practice | Kerala PSC',description:'A focused Kerala PSC LDC exam practice workspace'};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en"><body>{children}</body></html>}
