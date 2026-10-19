declare const __APP_COMMIT__: string;
declare const __APP_VERSION__: string;
declare const __APP_DATE__: string;

declare module '*.md?raw' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  /** Lumi Worker origin, for example https://lumi-api.gulcin-lumi.workers.dev. Unset until that worker is ready. */
  readonly VITE_FEEDBACK_URL?: string;
}
