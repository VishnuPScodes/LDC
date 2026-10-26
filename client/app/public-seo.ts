import type {Metadata} from 'next';
import {siteUrl} from './site-url';

export function publicMetadata(title:string,description:string,path:string):Metadata{
 const canonical=new URL(path,siteUrl).toString(),image=new URL(`/og?title=${encodeURIComponent(title)}`,siteUrl).toString();
 return{title,description,alternates:{canonical},openGraph:{title,description,url:canonical,siteName:'LDC Practice',type:'website',locale:'en_IN',images:[{url:image,width:1200,height:630,alt:title}]},twitter:{card:'summary_large_image',title,description,images:[image]},robots:{index:true,follow:true}};
}
