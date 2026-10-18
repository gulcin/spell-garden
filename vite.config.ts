import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
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

function spellGardenPwa(): Plugin {
  let prefix = './';
  return {
    name: 'spell-garden-pwa',
    apply: 'build',
    configResolved(config) {
      prefix = sitePrefix(config.base);
    },
    closeBundle() {
      const dist = join(process.cwd(), 'dist');
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
        .filter((file) => file !== 'sw.js' && !file.startsWith('art/places/') && !file.startsWith('splash-'));
      const assets = files.map((file) => `${prefix}${file}`);
      const home = `${prefix}index.html`;
      const source = `const CACHE='spell-garden-v7';
const ASSETS=${JSON.stringify(assets)};
const HOME=${JSON.stringify(home)};
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',(event)=>{event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const hit=await cache.match(event.request);
    if(hit) return hit;
    try{
      const response=await fetch(event.request);
      if(response.ok) cache.put(event.request, response.clone());
      return response;
    }catch{
      if(event.request.mode==='navigate'){
        const home=await cache.match(HOME);
        if(home) return home;
      }
      return new Response('Offline',{status:503});
    }
  })());
});
`;
      writeFileSync(join(dist, 'sw.js'), source);
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
  },
  plugins: [react(), spellGardenPwa()],
  server: { host: '127.0.0.1', port: 43123, strictPort: true },
  preview: { host: '127.0.0.1', port: 43123, strictPort: true },
});
