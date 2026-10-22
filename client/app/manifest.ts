import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    id:'/',
    name:'LDC Practice | Kerala PSC',
    short_name:'LDC Practice',
    description:'A focused Kerala PSC LDC exam practice workspace',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#f2f6f2',
    theme_color:'#176342',
    icons:[
      {src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
    ]
  };
}
