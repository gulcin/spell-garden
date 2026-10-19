import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, relative } from 'node:path';
import { defineConfig, type Connect, type Plugin } from 'vite';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

function gitValue(command: string, fallback: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback;
  } catch {
    return fallback;
  }
}

export const APP_VERSION = process.env.SPELL_VERSION || pkg.version;
export const APP_DATE = process.env.SPELL_BUILD_DATE || gitValue('git log -1 --format=%cs', new Date().toISOString().slice(0, 10));
const versionJson = `${JSON.stringify({ version: APP_VERSION, sha: appCommit(), date: APP_DATE }, null, 2)}\n`;

export const SPELL_GARDEN_CACHE = `spell-garden-v${APP_VERSION}`;

/** Files the service worker installs up front. Story audio and 1x page art stay offline; 2x story art waits until it is shown. */
export function precacheFile(file: string): boolean {
  if (file === 'sw.js' || file === 'version.json' || file.startsWith('splash-') || file.startsWith('art/places/')) return false;
  if (file.startsWith('art/stories/') && file.includes('@2x')) return false;
  if (file.startsWith('art/house/') && file.includes('@2x')) return false;
  if (file.startsWith('art/crystals/') && file.includes('@2x')) return false;
  if (file.startsWith('art/cast/') && file.includes('@2x')) return false;
  if (file.startsWith('art/wear/look-') && file.includes('@2x')) return false;
  return true;
}

/** Relative by default so GitHub Pages project sites and local previews both work. */
export function assetBase(): string {
  const raw = process.env.BASE_PATH?.trim();
  if (!raw || raw === '/' || raw === './') return './';
  const withSlash = raw.endsWith('/') ? raw : `${raw}/`;
  return withSlash;
}

type ManifestIcon = { src: string; sizes?: string; type?: string; purpose?: string };
type WebManifest = {
  id?: string;
  start_url?: string;
  scope?: string;
  icons?: ManifestIcon[];
};

/** Absolute site prefix such as `/spell-garden/`, or `./` for a relative build. */
export function sitePrefix(base: string): string {
  if (!base || base === './' || base === '/' || base === '.') return './';
  return base.endsWith('/') ? base : `${base}/`;
}

/**
 * Shell files are fetched with a version query so a stale Pages copy is not installed.
 * Navigation tries that network copy before any cached index.html. A cached shell whose
 * hashed script has disappeared otherwise stays on screen forever, which is a blank iPhone.
 */
export function serviceWorkerSource(cacheName: string, assets: string[], home: string): string {
  return `const CACHE=${JSON.stringify(cacheName)};
const ASSETS=${JSON.stringify(assets)};
const HOME=${JSON.stringify(home)};
async function fresh(url){
  const u=new URL(url, self.registration.scope);
  u.searchParams.set('spell', CACHE);
  try {
    return await fetch(u.href,{cache:'reload'});
  } catch (error) {
    return fetch(u.href,{cache:'no-store'});
  }
}
async function precache(){
  const cache=await caches.open(CACHE);
  const queue=ASSETS.slice();
  async function take(){
    while(queue.length){
      const url=queue.shift();
      const response=await fresh(url);
      if(!response.ok) throw new Error(url);
      await cache.put(url, response);
    }
  }
  await Promise.all([take(),take(),take(),take(),take(),take()]);
}
async function cached(request){
  const keys=await caches.keys();
  for(const key of keys){
    const cache=await caches.open(key);
    const hit=await cache.match(request);
    if(hit) return hit;
  }
  return null;
}
function ping(client){
  return new Promise((resolve)=>{
    const channel=new MessageChannel();
    const timer=setTimeout(()=>resolve(false),1500);
    channel.port1.onmessage=()=>{clearTimeout(timer);resolve(true);};
    try { client.postMessage({type:'SPELL_PING'},[channel.port2]); }
    catch (error) { clearTimeout(timer); resolve(false); }
  });
}
self.addEventListener('install',(event)=>{
  event.waitUntil((async()=>{
    await precache();
    const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    let rescue=false;
    for(const client of clients){
      if(!(await ping(client))) rescue=true;
    }
    if(rescue) await self.skipWaiting();
  })());
});
self.addEventListener('message',(event)=>{
  const data=event.data;
  if(data==='SKIP_WAITING'||data==='skip-waiting'||(data&&data.type==='SKIP_WAITING')) self.skipWaiting();
});
self.addEventListener('activate',(event)=>{event.waitUntil(self.clients.claim())});
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.endsWith('/sw.js')||url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(event.request,{cache:'reload'}).catch(()=>fetch(event.request,{cache:'no-store'})));
    return;
  }
  if(event.request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fresh(HOME);
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put(HOME, response.clone());
          const keys=await caches.keys();
          await Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key)));
          return response;
        }
      }catch(error){}
      const home=await cached(HOME);
      if(home) return home;
      return new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}});
    })());
    return;
  }
  event.respondWith((async()=>{
    const hit=await cached(event.request);
    if(hit) return hit;
    try{
      const response=await fetch(event.request);
      if(response.ok){
        const cache=await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    }catch(error){
      return new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}});
    }
  })());
});
`;
}

function spellGardenPwa(): Plugin {
  let prefix = './';
  let dist = join(process.cwd(), 'dist');
  return {
    name: 'spell-garden-pwa',
    apply: 'build',
    configResolved(config) {
      prefix = sitePrefix(config.base);
      dist = isAbsolute(config.build.outDir) ? config.build.outDir : join(config.root, config.build.outDir);
    },
    closeBundle() {
      const manifestPath = join(dist, 'manifest.webmanifest');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as WebManifest;
      if (prefix.startsWith('/')) {
        manifest.id = prefix;
        manifest.start_url = prefix;
        manifest.scope = prefix;
        manifest.icons = (manifest.icons ?? []).map((icon) => ({
          ...icon,
          src: icon.src.startsWith('./') ? `${prefix}${icon.src.slice(2)}` : icon.src,
        }));
      } else {
        manifest.start_url = './';
        manifest.scope = './';
      }
      writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

      const files = listFiles(dist)
        .map((file) => relative(dist, file).split('\\').join('/'))
        .filter(precacheFile);
      const assets = files.map((file) => `${prefix}${file}`);
      const home = `${prefix}index.html`;
      writeFileSync(join(dist, 'sw.js'), serviceWorkerSource(SPELL_GARDEN_CACHE, assets, home));
    },
  };
}

function shellPath(path: string): boolean {
  return path === '/' || path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/sw.js') || path.endsWith('/version.json');
}

function noCache(req: Connect.IncomingMessage, res: { setHeader: (name: string, value: string) => void }, next: () => void) {
  const path = req.url?.split('?')[0] ?? '';
  if (shellPath(path)) {
    const setHeader = res.setHeader.bind(res);
    res.setHeader = (name: string, value: string) => {
      if (name.toLowerCase() === 'cache-control') return setHeader(name, 'no-cache');
      return setHeader(name, value);
    };
    res.setHeader('Cache-Control', 'no-cache');
  }
  next();
}

function spellVersionPlugin(): Plugin {
  return {
    name: 'spell-garden-version',
    transformIndexHtml(html) {
      const meta = `<meta name="spell-garden-version" content="${APP_VERSION}" />`;
      if (html.includes('name="spell-garden-version"')) return html;
      return html.replace('</head>', `    ${meta}\n  </head>`);
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: versionJson });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? '';
        if (path.endsWith('/version.json')) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(versionJson);
          return;
        }
        noCache(req, res, next);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(noCache);
    },
  };
}

function appCommit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  base: assetBase(),
  define: {
    __APP_COMMIT__: JSON.stringify(appCommit()),
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_DATE__: JSON.stringify(APP_DATE),
  },
  plugins: [react(), spellVersionPlugin(), spellGardenPwa()],
  server: { host: '127.0.0.1', port: 43123, strictPort: true },
  preview: { host: '127.0.0.1', port: 43123, strictPort: true },
});
