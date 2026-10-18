/** Notes Aida leaves for a grown-up. Stored beside progress, not inside it. */
export const REPORTS_KEY = 'prague.wizard-math.reports.v1';

/** Report ids still waiting for the shared endpoint. */
export const REPORTS_QUEUE_KEY = 'prague.wizard-math.reports-queue.v1';

export type ReportKind = 'love' | 'broken' | 'idea';

export type ReportContext = {
  screen: string;
  placeId: string;
  placeName: string;
  activity: string;
  question: string;
  lastAnswer: string;
  commit: string;
  version: string;
  userAgent: string;
  viewport: string;
  orientation: string;
  time: string;
};

export type Report = {
  id: string;
  kind: ReportKind;
  text: string;
  createdAt: number;
  context: ReportContext;
};

const KINDS = new Set<ReportKind>(['love', 'broken', 'idea']);

export function loadReports(): Report[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isReport).slice(-40);
  } catch {
    return [];
  }
}

export function saveReport(report: Report): Report[] {
  const next = [...loadReports(), report].slice(-40);
  localStorage.setItem(REPORTS_KEY, JSON.stringify(next));
  const kept = new Set(next.map((item) => item.id));
  const waiting = loadQueue().filter((id) => kept.has(id));
  if (!waiting.includes(report.id)) waiting.push(report.id);
  saveQueue(waiting);
  void postReport(report);
  return next;
}

/** `${VITE_FEEDBACK_URL}/feedback`, or null while that env var is unset. */
export function feedbackUrl(): string | null {
  const raw = import.meta.env.VITE_FEEDBACK_URL;
  if (typeof raw !== 'string') return null;
  const base = raw.trim().replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/feedback`;
}

export function deviceContext(live: Omit<ReportContext, 'commit' | 'version' | 'userAgent' | 'viewport' | 'orientation' | 'time'>): ReportContext {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const orientation = window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape';
  return {
    ...live,
    commit: __APP_COMMIT__,
    version: '1.0.0',
    userAgent: navigator.userAgent,
    viewport: `${width}x${height}`,
    orientation,
    time: new Date().toISOString(),
  };
}

export function formatReport(report: Report): string {
  const when = new Date(report.createdAt).toISOString();
  const ctx = report.context;
  return [
    `${labelKind(report.kind)} · ${when}`,
    report.text || '(no extra words)',
    `Screen: ${ctx.screen}`,
    `Place: ${ctx.placeName || ctx.placeId || 'garden'}`,
    `Activity: ${ctx.activity || 'none'}`,
    `Question: ${ctx.question || 'none'}`,
    `Last answer: ${ctx.lastAnswer || 'none yet'}`,
    `App: ${ctx.version} ${ctx.commit}`,
    `Device: ${ctx.viewport} ${ctx.orientation}`,
    ctx.userAgent,
  ].join('\n');
}

export function mumMailto(reports: Report[]): string {
  const body = reports.map(formatReport).join('\n\n---\n\n');
  const clipped = body.length > 1800 ? `${body.slice(0, 1800)}\n\n(${reports.length} notes; the newest fit in this letter.)` : body;
  const subject = "Aida's Spell Garden notes";
  return `mailto:yildirim.gulcin88@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(clipped)}`;
}

const sending = new Set<string>();

function browserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function loadQueue(): string[] {
  try {
    const raw = localStorage.getItem(REPORTS_QUEUE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string').slice(-40);
  } catch {
    return [];
  }
}

function saveQueue(ids: string[]): void {
  localStorage.setItem(REPORTS_QUEUE_KEY, JSON.stringify(ids.slice(-40)));
}

/** POSTs one report as JSON. Queues it when the iPad is offline or the post does not land. */
export async function postReport(report: Report): Promise<boolean> {
  const url = feedbackUrl();
  if (!url) return false;
  if (!browserOnline()) return false;
  if (sending.has(report.id)) return false;
  sending.add(report.id);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!response.ok) return false;
    saveQueue(loadQueue().filter((id) => id !== report.id));
    return true;
  } catch {
    return false;
  } finally {
    sending.delete(report.id);
  }
}

/** Posts each report on its own. Reports that cannot leave stay in the local queue. */
export async function postReports(reports: Report[]): Promise<boolean> {
  if (!feedbackUrl() || reports.length === 0) return false;
  if (!browserOnline()) return false;
  const results = await Promise.all(reports.map((report) => postReport(report)));
  return results.every(Boolean);
}

/** Sends every note still waiting. Does nothing while the endpoint is unset or the iPad is offline. */
export async function flushReportQueue(): Promise<boolean> {
  if (!feedbackUrl() || !browserOnline()) return false;
  const saved = new Map(loadReports().map((report) => [report.id, report]));
  const pending = loadQueue().map((id) => saved.get(id)).filter((report): report is Report => !!report);
  saveQueue(pending.map((report) => report.id));
  if (pending.length === 0) return false;
  const results = await Promise.all(pending.map((report) => postReport(report)));
  return results.every(Boolean);
}

/** Tries the queue now, and again whenever the iPad comes back online. */
export function watchReportQueue(): () => void {
  const flush = () => {
    void flushReportQueue();
  };
  window.addEventListener('online', flush);
  flush();
  return () => window.removeEventListener('online', flush);
}

function labelKind(kind: ReportKind): string {
  if (kind === 'love') return 'I love this';
  if (kind === 'broken') return 'Something is broken';
  return 'Idea';
}

function isReport(value: unknown): value is Report {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Report>;
  return typeof row.id === 'string' && KINDS.has(row.kind as ReportKind) && typeof row.createdAt === 'number' && !!row.context;
}
