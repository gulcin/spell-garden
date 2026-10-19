import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
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
        .filter(precacheFile);
      const assets = files.map((file) => `${prefix}${file}`);
      const home = `${prefix}index.html`;
      const source = `const CACHE='${SPELL_GARDEN_CACHE}';
const ASSETS=${JSON.stringify(assets)};
const HOME=${JSON.stringify(home)};
self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(ASSETS)))});
self.addEventListener('message',(event)=>{if(event.data==='skip-waiting') self.skipWaiting()});
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

function noCache(req: Connect.IncomingMessage, res: { setHeader: (name: string, value: string) => void }, next: () => void) {
  const path = req.url?.split('?')[0] ?? '';
  if (path.endsWith('/sw.js') || path.endsWith('/version.json')) {
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
