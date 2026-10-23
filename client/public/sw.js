const CACHE_NAME='ldc-practice-v1';
const OFFLINE_URL='/offline.html';

self.addEventListener('install',event=>{
  event.waitUntil(Promise.all([
    caches.open(CACHE_NAME).then(cache=>cache.addAll([OFFLINE_URL,'/icons/icon.svg','/icons/icon-192.png','/icons/icon-512.png','/icons/apple-touch-icon.png','/icons/maskable-512.png'])),
    self.skipWaiting()
  ]));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))));
  self.clients.claim();
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
    event.respondWith(fetch(request).catch(()=>caches.match(OFFLINE_URL)));
  }
});
