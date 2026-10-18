import { useEffect, useRef, useState } from 'react';
import { PALETTE, PAPER, BRUSH_SIZES } from '../colouring/palette.ts';
import {
  applyFill,
  crayonWidth,
  demoArtwork,
  emptyArtwork,
  finishReward,
  paintStrokes,
  pushHistory,
  redoArt,
  undoArt,
  clampView,
  zoomAt,
  type ArtAction,
  type Artwork,
  type Stroke,
  type StrokePoint,
  type View,
} from '../colouring/model.ts';
import { SHEETS, sheetById } from '../colouring/sheets.ts';
import { listArtworks, loadArtwork, saveArtwork, type SavedArt } from '../colouring/store.ts';
import { useReportLive } from '../feedback/live.tsx';
import type { Progress } from '../progress/types.ts';
import { speak } from '../speech.ts';
import { awardCrystals } from '../wardrobe/economy.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { placeStyle } from './pictures.tsx';

type Tool = 'fill' | 'brush' | 'eraser';

const REST: View = { scale: 1, x: 0, y: 0 };

export function ColouringCorner({
  progress,
  update,
  startSheet = null,
  demoPaint = false,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  startSheet?: string | null;
  demoPaint?: boolean;
}) {
  const { setLive } = useReportLive();
  const [sheetId, setSheetId] = useState<string | null>(startSheet);
  const [saved, setSaved] = useState<SavedArt[]>([]);

  useEffect(() => {
    const sheet = sheetById(sheetId ?? '');
    setLive({
      screen: 'colour',
      placeId: 'colouring-nook',
      placeName: 'Colouring corner',
      activity: sheet?.title ?? '',
      question: '',
    });
  }, [setLive, sheetId]);

  useEffect(() => {
    if (sheetId) return;
    let gone = false;
    listArtworks()
      .then((rows) => {
        if (!gone) setSaved(rows);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [sheetId]);

  if (!sheetId) {
    return <ColourLobby saved={saved} crystals={progress.crystals} onOpen={setSheetId} />;
  }

  return (
    <ColourPage
      key={sheetId}
      sheetId={sheetId}
      crystals={progress.crystals}
      demoPaint={demoPaint}
      onBack={() => setSheetId(null)}
      onReward={(amount) => update((current) => awardCrystals(current, amount))}
    />
  );
}

function ColourLobby({
  saved,
  crystals,
  onOpen,
}: {
  saved: SavedArt[];
  crystals: number;
  onOpen: (id: string) => void;
}) {
  const previews = usePreviewUrls(saved);
  return (
    <section className="colour-lobby place-scene" style={placeStyle('colouring-nook')} data-testid="colouring-corner">
      <header className="shop-top">
        <div>
          <p className="kicker">Colouring corner</p>
          <h1>The tower nook</h1>
        </div>
        <CrystalCounter count={crystals} />
      </header>
      <p className="colour-intro">
        A quiet table in the tower. Colour a page if you like. Nothing is marked, and you can stop whenever you want.
      </p>
      <div className="sheet-grid">
        {SHEETS.map((sheet) => (
          <button key={sheet.id} type="button" className="sheet-card" data-testid={`sheet-${sheet.id}`} onClick={() => onOpen(sheet.id)}>
            <SheetThumb id={sheet.id} />
            <strong>{sheet.title}</strong>
            <span>{sheet.blurb}</span>
          </button>
        ))}
      </div>
      {saved.length > 0 ? (
        <div className="picture-row" data-testid="colour-gallery">
          <h2>Your pictures</h2>
          <div className="sheet-grid">
            {saved.map((row) => {
              const sheet = sheetById(row.sheetId);
              return (
                <button key={row.sheetId} type="button" className="sheet-card" onClick={() => onOpen(row.sheetId)}>
                  {previews[row.sheetId] ? <img src={previews[row.sheetId]} alt="" /> : <SheetThumb id={row.sheetId} />}
                  <strong>{sheet?.title ?? 'A picture'}</strong>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ColourPage({
  sheetId,
  crystals,
  demoPaint,
  onBack,
  onReward,
}: {
  sheetId: string;
  crystals: number;
  demoPaint: boolean;
  onBack: () => void;
  onReward: (amount: number) => void;
}) {
  const sheet = sheetById(sheetId);
  const svgText = useSheetSvg(sheetId);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [art, setArt] = useState<Artwork>(() => emptyArtwork(sheetId));
  const [history, setHistory] = useState<ArtAction[]>([]);
  const [future, setFuture] = useState<ArtAction[]>([]);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<Tool>('fill');
  const [colour, setColour] = useState<string>(PALETTE[0]!.hex);
  const [size, setSize] = useState<number>(BRUSH_SIZES[1]);
  const [view, setView] = useState<View>(REST);
  const [note, setNote] = useState<string | null>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);
  const artRef = useRef(art);
  artRef.current = art;
  const viewRef = useRef(view);
  viewRef.current = view;
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const colourRef = useRef(colour);
  colourRef.current = colour;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const drawing = useRef<StrokePoint[] | null>(null);
  const pinch = useRef<{ scale: number; dist: number; sx: number; sy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const down = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let gone = false;
    if (demoPaint) {
      setReady(true);
      return;
    }
    loadArtwork(sheetId)
      .then((saved) => {
        if (gone) return;
        if (saved) setArt(saved);
        setReady(true);
      })
      .catch(() => {
        if (!gone) setReady(true);
      });
    return () => {
      gone = true;
    };
  }, [demoPaint, sheetId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !svgText) return;
    const ids = [...host.querySelectorAll('[data-region]')].map((node) => node.getAttribute('data-region') ?? '');
    if (demoPaint) setArt(demoArtwork(sheetId, ids));
    host.querySelectorAll<SVGElement>('[data-region]').forEach((node) => {
      const id = node.getAttribute('data-region') ?? '';
      const fill = (demoPaint ? demoArtwork(sheetId, ids).fills : artRef.current.fills)[id] ?? PAPER;
      node.setAttribute('fill', fill);
    });
  }, [svgText, demoPaint, sheetId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    host.querySelectorAll<SVGElement>('[data-region]').forEach((node) => {
      const id = node.getAttribute('data-region') ?? '';
      node.setAttribute('fill', art.fills[id] ?? PAPER);
    });
  }, [art.fills]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const svg = hostRef.current?.querySelector('svg');
    if (!canvas || !svg) return;
    const draw = () => redraw(canvas, svg, artRef.current.strokes);
    draw();
    const watch = new ResizeObserver(draw);
    watch.observe(svg);
    return () => watch.disconnect();
  }, [svgText, art.strokes]);

  useEffect(() => {
    if (!ready || demoPaint) return;
    const current = artRef.current;
    const hasWork = Object.keys(current.fills).length > 0 || current.strokes.length > 0 || current.rewarded;
    if (!hasWork) return;
    const handle = window.setTimeout(() => {
      const svg = hostRef.current?.querySelector('svg');
      const current = artRef.current;
      const preview = svg ? renderSheetPng(svg, current.strokes, 480).catch(() => null) : Promise.resolve(null);
      void preview.then((blob) => saveArtwork(current, blob)).catch(() => undefined);
    }, 700);
    return () => window.clearTimeout(handle);
  }, [art, ready, demoPaint]);

  function remember(action: ArtAction, next: Artwork) {
    const stamped = { ...next, updatedAt: Date.now() };
    artRef.current = stamped;
    setArt(stamped);
    setHistory((stack) => pushHistory(stack, action));
    setFuture([]);
  }

  function fillAt(clientX: number, clientY: number) {
    const node = document.elementFromPoint(clientX, clientY);
    const region = node?.closest?.('[data-region]')?.getAttribute('data-region');
    if (!region) return;
    const result = applyFill(artRef.current.fills, region, colourRef.current);
    if (!result.changed) return;
    remember(
      { kind: 'fill', region, prev: result.prev, next: colourRef.current },
      { ...artRef.current, fills: result.fills },
    );
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2) {
      drawing.current = null;
      const [a, b] = [...pointers.current.values()];
      const viewport = viewportRef.current?.getBoundingClientRect();
      if (!a || !b || !viewport) return;
      const ax = (a.x + b.x) / 2 - viewport.left;
      const ay = (a.y + b.y) / 2 - viewport.top;
      const current = viewRef.current;
      pinch.current = {
        scale: current.scale,
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        sx: (ax - current.x) / current.scale,
        sy: (ay - current.y) / current.scale,
      };
      return;
    }
    down.current = { x: event.clientX, y: event.clientY };
    if (toolRef.current === 'fill') return;
    const svg = hostRef.current?.querySelector('svg');
    if (!svg) return;
    const point = pointInSheet(svg, event, sizeRef.current);
    drawing.current = [point];
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const viewport = viewportRef.current?.getBoundingClientRect();
      if (!a || !b || !viewport) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const ax = (a.x + b.x) / 2 - viewport.left;
      const ay = (a.y + b.y) / 2 - viewport.top;
      const scale = Math.min(4, Math.max(1, pinch.current.scale * (dist / pinch.current.dist)));
      setView(
        clampView(
          { scale, x: ax - pinch.current.sx * scale, y: ay - pinch.current.sy * scale },
          viewport.width,
          viewport.height,
        ),
      );
      return;
    }
    if (!drawing.current) return;
    const svg = hostRef.current?.querySelector('svg');
    if (!svg) return;
    drawing.current.push(pointInSheet(svg, event, sizeRef.current));
    const canvas = canvasRef.current;
    if (canvas) {
      redraw(canvas, svg, [
        ...artRef.current.strokes,
        { tool: toolRef.current === 'eraser' ? 'eraser' : 'brush', color: colourRef.current, points: drawing.current },
      ]);
    }
  }

  function finishPointer(event: React.PointerEvent<HTMLDivElement>) {
    const pinching = pinch.current != null;
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pinching) {
      drawing.current = null;
      down.current = null;
      return;
    }
    const stroke = drawing.current;
    drawing.current = null;
    const start = down.current;
    down.current = null;
    if (stroke && stroke.length > 0 && toolRef.current !== 'fill') {
      const committed: Stroke = {
        tool: toolRef.current === 'eraser' ? 'eraser' : 'brush',
        color: colourRef.current,
        points: stroke,
      };
      remember({ kind: 'stroke', stroke: committed }, { ...artRef.current, strokes: [...artRef.current.strokes, committed] });
      return;
    }
    if (!start || toolRef.current !== 'fill' || pinch.current) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
    fillAt(event.clientX, event.clientY);
  }

  function undo() {
    const result = undoArt(artRef.current, history, future);
    if (!result) return;
    artRef.current = result.art;
    setArt(result.art);
    setHistory(result.history);
    setFuture(result.future);
  }

  function redo() {
    const result = redoArt(artRef.current, history, future);
    if (!result) return;
    artRef.current = result.art;
    setArt(result.art);
    setHistory(result.history);
    setFuture(result.future);
  }

  function zoom(factor: number) {
    const viewport = viewportRef.current?.getBoundingClientRect();
    if (!viewport) return;
    setView(zoomAt(viewRef.current, factor, viewport.width / 2, viewport.height / 2, viewport.width, viewport.height));
  }

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = node.getBoundingClientRect();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      setView(zoomAt(viewRef.current, factor, event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  async function pngBlob() {
    const svg = hostRef.current?.querySelector('svg');
    if (!svg) return null;
    return renderSheetPng(svg, artRef.current.strokes, 1200);
  }

  async function savePhotos() {
    const blob = await pngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aida-${sheetId}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    setNote('Saved as a picture. A grown-up can keep it in Photos.');
  }

  async function printPicture() {
    const blob = await pngBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPrintUrl(url);
    window.setTimeout(() => window.print(), 60);
  }

  function finish() {
    const reward = finishReward(artRef.current);
    if (reward.gained === 0) {
      setNote('This page already kept its little crystal.');
      return;
    }
    const stamped = { ...reward.art, updatedAt: Date.now() };
    artRef.current = stamped;
    setArt(stamped);
    onReward(reward.gained);
    const line = 'A little crystal, because you finished this page.';
    setNote(line);
    speak(line);
  }

  return (
    <section className="colour-app" data-testid="colour-page">
      <header className="colour-top">
        <button type="button" className="btn quiet" data-testid="colour-back" onClick={onBack}>
          All pages
        </button>
        <div>
          <p className="kicker">Colouring corner</p>
          <h1>{sheet?.title ?? 'A page'}</h1>
        </div>
        <CrystalCounter count={crystals} />
      </header>
      <div
        className="colour-viewport"
        ref={viewportRef}
        data-testid="colour-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
        <div className="colour-zoom" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          <div className="sheet-stack">
            <div ref={hostRef} className="sheet-svg" dangerouslySetInnerHTML={{ __html: svgText }} />
            <canvas ref={canvasRef} className={tool === 'fill' ? 'brush-layer is-quiet' : 'brush-layer'} />
          </div>
        </div>
      </div>
      {note ? (
        <p className="note good colour-note" role="status">
          {note}
        </p>
      ) : null}
      <div className="colour-tools">
        <div className="palette" role="listbox" aria-label="Colours">
          {PALETTE.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              role="option"
              aria-selected={colour === swatch.hex}
              aria-label={swatch.name}
              className={colour === swatch.hex ? 'swatch on' : 'swatch'}
              style={{ background: swatch.hex }}
              data-testid={`swatch-${swatch.id}`}
              onClick={() => setColour(swatch.hex)}
            />
          ))}
        </div>
        <div className="tool-row">
          <button type="button" className={tool === 'fill' ? 'on' : ''} data-testid="colour-fill" onClick={() => setTool('fill')}>
            Fill
          </button>
          <button type="button" className={tool === 'brush' ? 'on' : ''} data-testid="colour-brush" onClick={() => setTool('brush')}>
            Crayon
          </button>
          <button type="button" className={tool === 'eraser' ? 'on' : ''} data-testid="colour-eraser" onClick={() => setTool('eraser')}>
            Eraser
          </button>
          {BRUSH_SIZES.map((brush) => (
            <button
              key={brush}
              type="button"
              className={size === brush ? 'size on' : 'size'}
              aria-label={`Crayon size ${brush}`}
              data-testid={`brush-size-${brush}`}
              onClick={() => setSize(brush)}
            >
              <i style={{ width: 6 + brush / 3, height: 6 + brush / 3 }} />
            </button>
          ))}
          <button type="button" data-testid="colour-undo" onClick={undo} disabled={history.length === 0}>
            Undo
          </button>
          <button type="button" data-testid="colour-redo" onClick={redo} disabled={future.length === 0}>
            Redo
          </button>
          <button type="button" data-testid="zoom-out" onClick={() => zoom(1 / 1.25)}>
            −
          </button>
          <button type="button" data-testid="zoom-in" onClick={() => zoom(1.25)}>
            +
          </button>
        </div>
        <div className="tool-row actions">
          <button type="button" className="btn quiet" data-testid="colour-save" onClick={() => void savePhotos()}>
            Save to Photos
          </button>
          <button type="button" className="btn quiet" data-testid="colour-print" onClick={() => void printPicture()}>
            Print
          </button>
          <button type="button" className="btn gold" data-testid="colour-finish" onClick={finish}>
            This page feels finished
          </button>
        </div>
      </div>
      {printUrl ? (
        <div className="print-art">
          <img src={printUrl} alt="" />
        </div>
      ) : null}
    </section>
  );
}

function pointInSheet(svg: SVGSVGElement, event: React.PointerEvent | PointerEvent, size: number): StrokePoint {
  const matrix = svg.getScreenCTM();
  const local = svg.createSVGPoint();
  local.x = event.clientX;
  local.y = event.clientY;
  const mapped = matrix ? local.matrixTransform(matrix.inverse()) : local;
  return {
    x: mapped.x,
    y: mapped.y,
    w: crayonWidth(size, event.pointerType, event.pressure),
  };
}

function redraw(canvas: HTMLCanvasElement, svg: SVGSVGElement, strokes: Stroke[]) {
  const vb = svg.viewBox.baseVal;
  const cssW = Math.max(1, svg.clientWidth);
  const cssH = Math.max(1, svg.clientHeight);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx || !vb.width || !vb.height) return;
  ctx.setTransform(canvas.width / vb.width, 0, 0, canvas.height / vb.height, 0, 0);
  ctx.clearRect(0, 0, vb.width, vb.height);
  paintStrokes(ctx, strokes);
}

async function renderSheetPng(svg: SVGSVGElement, strokes: Stroke[], width: number): Promise<Blob> {
  const vb = svg.viewBox.baseVal;
  const height = Math.round(width * (vb.height / vb.width));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(vb.width));
  clone.setAttribute('height', String(vb.height));
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    ctx.setTransform(width / vb.width, 0, 0, height / vb.height, 0, 0);
    paintStrokes(ctx, strokes);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('png');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function useSheetSvg(id: string) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let gone = false;
    fetch(`${import.meta.env.BASE_URL}art/colouring/${id}.svg`)
      .then((response) => response.text())
      .then((text) => {
        if (!gone) setSvg(text);
      })
      .catch(() => undefined);
    return () => {
      gone = true;
    };
  }, [id]);
  return svg;
}

function SheetThumb({ id }: { id: string }) {
  const svg = useSheetSvg(id);
  return <div className="sheet-thumb" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function usePreviewUrls(saved: SavedArt[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const row of saved) {
      if (row.preview) next[row.sheetId] = URL.createObjectURL(row.preview);
    }
    setUrls(next);
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url);
    };
  }, [saved]);
  return urls;
}
