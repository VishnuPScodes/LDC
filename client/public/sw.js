const CACHE_NAME='ldc-practice-v3';
const OFFLINE_URL='/offline.html';
const APP_SHELL_URL='/';
const PRECACHE_URLS=[
  APP_SHELL_URL,
  OFFLINE_URL,
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/maskable-192.png',
  '/icons/maskable-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE_URLS)),
    self.skipWaiting()
  ]));
});

self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('ldc-practice-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  const url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;

  if(url.pathname.startsWith('/api/'))return;

  if(url.pathname.startsWith('/_next/static/')){
    event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
      const cached=await cache.match(request);
      if(cached){
        void fetch(request).then(response=>{if(response.ok)void cache.put(request,response.clone())}).catch(()=>{});
        return cached;
      }
      const response=await fetch(request);
      if(response.ok)void cache.put(request,response.clone());
      return response;
    }));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(async response=>{
      if(response.ok&&url.pathname==='/'){
        const cache=await caches.open(CACHE_NAME);
        await cache.put(APP_SHELL_URL,response.clone());
      }
      return response;
    }).catch(async()=>{
      const cache=await caches.open(CACHE_NAME);
      return await cache.match(request)||await cache.match(APP_SHELL_URL)||await cache.match(OFFLINE_URL);
    }));
  }
});
