import type {MetadataRoute} from 'next';

export default function manifest():MetadataRoute.Manifest {
  return {
    id:'/',
    name:'Kerala PSC LDC Practice | Previous Year Questions',
    short_name:'LDC Practice',
    description:'Practice Kerala PSC LDC previous-year questions with topic-wise drills, mock exams, and progress tracking.',
    start_url:'/',
    scope:'/',
    display:'standalone',
    background_color:'#FAF8F3',
    theme_color:'#FAF8F3',
    icons:[
      {src:'/icons/icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
      {src:'/icons/maskable-192.png',sizes:'192x192',type:'image/png',purpose:'maskable'},
      {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
      {src:'/icons/maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
    ]
  };
}
