/** Notes Aida leaves for a grown-up. Stored beside progress, not inside it. */
export const REPORTS_KEY = 'prague.wizard-math.reports.v1';

/**
 * Optional collector. Leave null until a backend exists.
 * No secrets live here. A grown-up deploy can set this to a URL.
 */
export const REPORT_ENDPOINT: string | null = null;

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
  return next;
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

/** Posts when REPORT_ENDPOINT is set. Does nothing while it is empty. */
export async function postReports(reports: Report[]): Promise<boolean> {
  if (!REPORT_ENDPOINT || reports.length === 0) return false;
  const response = await fetch(REPORT_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reports }),
  });
  return response.ok;
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
