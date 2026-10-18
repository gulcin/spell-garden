import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import type { BoardState, Item, Piece, Zone } from './types.ts';
import { applyAction, initialState } from './logic.ts';
import { Glyph, ShapeGlyph, wedgePath } from './art.tsx';
import { Prop } from '../ui/pictures.tsx';

export type BoardHandle = { getState: () => BoardState };

type Props = { item: Item; api: { current: BoardHandle | null } };

function zoneAt(x: number, y: number): string | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    let node: HTMLElement | null = el as HTMLElement;
    while (node) {
      const zone = node.dataset?.dropzone;
      if (zone) return zone;
      node = node.parentElement;
    }
  }
  return null;
}

function angleOf(clientX: number, clientY: number, el: HTMLElement | null): number | null {
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  let deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

export function Board({ item, api }: Props) {
  const [state, setState] = useState<BoardState>(() => initialState(item));
  const stateRef = useRef(state);
  stateRef.current = state;
  const itemRef = useRef(item);
  itemRef.current = item;
  const faceRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef<HTMLDivElement | null>(null);
  const handRef = useRef<'hour' | 'minute' | null>(null);
  const turning = useRef(false);
  const dragRef = useRef<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setState(initialState(item));
    setSelected(null);
    setGhost(null);
  }, [item]);

  useEffect(() => {
    api.current = { getState: () => stateRef.current };
  });

  const put = (pieceId: string, zoneId: string) => {
    if (zoneId === 'bank') {
      setState((prev) => ({ ...prev, at: { ...prev.at, [pieceId]: null } }));
      return;
    }
    setState((prev) => applyAction(itemRef.current, prev, { op: 'move', pieceId, zoneId }));
  };

  const updateHand = (which: 'hour' | 'minute', clientX: number, clientY: number) => {
    const deg = angleOf(clientX, clientY, faceRef.current);
    if (deg == null) return;
    setState((prev) => {
      if (which === 'minute') {
        const minute = Math.round(deg / 6) % 60;
        return { ...prev, clock: { ...prev.clock, minute } };
      }
      let hour = Math.round(deg / 30) % 12;
      if (hour === 0) hour = 12;
      return { ...prev, clock: { ...prev.clock, hour } };
    });
  };

  const updateAngle = (clientX: number, clientY: number) => {
    const deg = angleOf(clientX, clientY, angleRef.current);
    if (deg == null) return;
    const snapped = Math.round(deg / 15) * 15;
    const degrees = snapped >= 360 ? 0 : snapped;
    setState((prev) => ({ ...prev, angle: degrees }));
  };

  const handlers = useRef({ put, updateHand, updateAngle });
  handlers.current = { put, updateHand, updateAngle };

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (handRef.current) {
        handlers.current.updateHand(handRef.current, event.clientX, event.clientY);
        return;
      }
      if (turning.current) {
        handlers.current.updateAngle(event.clientX, event.clientY);
        return;
      }
      const drag = dragRef.current;
      if (!drag) return;
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) drag.moved = true;
      setGhost({ id: drag.id, x: event.clientX, y: event.clientY });
    };
    const up = (event: PointerEvent) => {
      if (handRef.current) {
        handlers.current.updateHand(handRef.current, event.clientX, event.clientY);
        handRef.current = null;
        return;
      }
      if (turning.current) {
        handlers.current.updateAngle(event.clientX, event.clientY);
        turning.current = false;
        return;
      }
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;
      setGhost(null);
      if (!drag.moved) {
        setSelected((prev) => (prev === drag.id ? null : drag.id));
        return;
      }
      const zone = zoneAt(event.clientX, event.clientY);
      if (zone) handlers.current.put(drag.id, zone);
      setSelected(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, []);

  const tap = (id: string) => {
    setState((prev) => applyAction(itemRef.current, prev, { op: 'tap', id }));
  };

  const onPieceDown = (event: ReactPointerEvent, id: string) => {
    event.preventDefault();
    dragRef.current = { id, x: event.clientX, y: event.clientY, moved: false };
    setGhost({ id, x: event.clientX, y: event.clientY });
  };

  const onZoneUp = (zoneId: string) => {
    if (dragRef.current?.moved) return;
    if (!selected) return;
    put(selected, zoneId);
    setSelected(null);
  };

  const pieceById = new Map(item.pieces.map((piece) => [piece.id, piece]));
  const ghostPiece = ghost ? pieceById.get(ghost.id) : undefined;
  const bank = item.pieces.filter((piece) => !state.at[piece.id]);
  const inZone = (zoneId: string) => item.pieces.filter((piece) => state.at[piece.id] === zoneId);

  return (
    <div className={`board board-${item.template}`} data-testid="board">
      {item.example && item.example.length > 0 ? (
        <div className="example">
          {item.example.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : null}
      {item.equation ? (
        <p className="equation">
          <span>{item.equation.left}</span>
          <span className="eq-gap">?</span>
          <span>{item.equation.right}</span>
        </p>
      ) : null}
      {item.mushrooms ? (
        <div className="mushrooms" aria-label={`${item.mushrooms} mushrooms`}>
          {Array.from({ length: item.mushrooms }, (_, i) => (
            <span key={i} className="mushroom" />
          ))}
        </div>
      ) : null}
      {item.lead && item.lead.length > 0 ? (
        <div className="lead">
          {item.lead.map((tile, i) => (
            <span key={`${tile.art}-${i}`} className="lead-tile">
              <Glyph art={tile.art} label={tile.label} />
              {tile.label ? <em>{tile.label}</em> : null}
            </span>
          ))}
        </div>
      ) : null}
      {item.pools && item.template === 'graph' ? <StaticPools item={item} /> : null}
      {item.template === 'clock' ? (
        <ClockFace
          faceRef={faceRef}
          hour={state.clock.hour}
          minute={state.clock.minute}
          onDown={(which, event) => {
            event.preventDefault();
            handRef.current = which;
            updateHand(which, event.clientX, event.clientY);
          }}
        />
      ) : null}
      {item.template === 'angle' ? (
        <AngleFace
          faceRef={angleRef}
          degrees={state.angle}
          onDown={(event) => {
            event.preventDefault();
            turning.current = true;
            updateAngle(event.clientX, event.clientY);
          }}
        />
      ) : null}
      {item.slices && item.slices.length > 0 ? (
        item.layout === 'bar' ? (
          <div className="potion-bar">
            {item.slices.map((slice) => (
              <button
                key={slice.id}
                type="button"
                data-testid={`tap:${slice.id}`}
                className={state.shaded.includes(slice.id) ? 'slice on' : 'slice'}
                onClick={() => tap(slice.id)}
                aria-label="Colour this piece"
              />
            ))}
          </div>
        ) : (
          <svg viewBox="-1.2 -1.2 2.4 2.4" className="pie">
            {item.slices.map((slice, index) => (
              <path
                key={slice.id}
                data-testid={`tap:${slice.id}`}
                d={wedgePath(index, item.slices!.length)}
                className={state.shaded.includes(slice.id) ? 'wedge on' : 'wedge'}
                onClick={() => tap(slice.id)}
              />
            ))}
          </svg>
        )
      ) : null}
      {item.compare ? (
        <div className="compare">
          {item.compare.map((card) => (
            <button
              key={card.id}
              type="button"
              data-testid={`tap:${card.id}`}
              className={state.choice === card.id ? 'compare-card on' : 'compare-card'}
              onClick={() => tap(card.id)}
            >
              {card.id === 'same' ? null : (
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="pie mini">
                  {Array.from({ length: card.den }, (_, index) => (
                    <path key={index} d={wedgePath(index, card.den)} className={index < card.num ? 'wedge on' : 'wedge'} />
                  ))}
                </svg>
              )}
              <span>{card.caption}</span>
            </button>
          ))}
        </div>
      ) : null}
      {item.toggles ? (
        <div className="shape-grid">
          {item.toggles.map((toggle) => (
            <button
              key={toggle.id}
              type="button"
              data-testid={`tap:${toggle.id}`}
              className={state.toggled.includes(toggle.id) ? 'shape-card on' : 'shape-card'}
              onClick={() => tap(toggle.id)}
            >
              <ShapeGlyph shape={toggle.shape} />
              <span>{toggle.label}</span>
            </button>
          ))}
        </div>
      ) : null}
      {item.symmetry ? <Mirror item={item} onCells={state.symmetryOn} tap={tap} /> : null}
      {item.choices && !item.compare ? (
        <div className="choices">
          {item.choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              data-testid={`tap:${choice.id}`}
              className={state.choice === choice.id ? 'choice on' : 'choice'}
              onClick={() => tap(choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
      {item.pieces.length > 0 ? (
        <>
          <div
            className="tray"
            data-dropzone="bank"
            data-testid="zone:bank"
            onPointerUp={(event) => {
              if ((event.target as HTMLElement).closest('.piece')) return;
              onZoneUp('bank');
            }}
          >
            {bank.map((piece) => (
              <PieceView key={piece.id} piece={piece} selected={selected === piece.id} onDown={onPieceDown} />
            ))}
            {bank.length === 0 ? <p className="tray-empty">The nest is empty.</p> : null}
          </div>
          <Stage item={item} inZone={inZone} onPieceDown={onPieceDown} onZoneUp={onZoneUp} selected={selected} />
        </>
      ) : null}
      {item.template === 'base-ten' ? (
        <button
          type="button"
          className="btn gold snap"
          data-testid="bundle"
          onClick={() => setState((prev) => applyAction(item, prev, { op: 'bundle', zoneId: 'mat' }))}
        >
          Snap 10 ones into a rod
        </button>
      ) : null}
      {item.template === 'coins' ? <p className="sum-read">Palm: {sumZone(item, state, 'palm')} sparks</p> : null}
      {ghost && ghostPiece ? (
        <div className="ghost" style={{ left: ghost.x, top: ghost.y }}>
          <Glyph art={ghostPiece.art} label={ghostPiece.label} tone={ghostPiece.tone} />
        </div>
      ) : null}
    </div>
  );
}

function sumZone(item: Item, state: BoardState, zoneId: string): number {
  return item.pieces.filter((piece) => state.at[piece.id] === zoneId).reduce((sum, piece) => sum + (piece.value ?? 0), 0);
}

function PieceView({
  piece,
  selected,
  onDown,
}: {
  piece: Piece;
  selected: boolean;
  onDown: (event: ReactPointerEvent, id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      className={selected ? 'piece is-selected' : 'piece'}
      data-testid={`piece:${piece.id}`}
      onPointerDown={(event) => onDown(event, piece.id)}
      aria-label={piece.label || piece.art}
    >
      <Glyph art={piece.art} label={piece.label} tone={piece.tone} />
      {piece.label && piece.art !== 'coin' && piece.art !== 'token' && piece.art !== 'stone' ? <em>{piece.label}</em> : null}
    </div>
  );
}

function ZoneBox({
  zone,
  children,
  onUp,
  className = '',
  backdrop,
}: {
  zone: Zone;
  children: ReactNode;
  onUp: (id: string) => void;
  className?: string;
  backdrop?: 'jar' | 'pad';
}) {
  return (
    <div
      className={`zone zone-${zone.role} ${className} ${backdrop ? `zone-back-${backdrop}` : ''}`}
      data-testid={`zone:${zone.id}`}
      data-dropzone={zone.id}
      onPointerUp={(event) => {
        if ((event.target as HTMLElement).closest('.piece')) return;
        onUp(zone.id);
      }}
    >
      {backdrop === 'jar' ? <Prop name="jar" className="jar-art" /> : null}
      {backdrop === 'pad' ? (
        <svg className="lily-pad" viewBox="0 0 64 64" aria-hidden>
          <ellipse cx="32" cy="36" rx="26" ry="18" fill="#b7dd9a" stroke="#5f8f58" strokeWidth="2" />
          <path d="M32 22 L32 50" stroke="#5f8f58" strokeWidth="2" />
        </svg>
      ) : null}
      {zone.label ? <span className="zone-label">{zone.label}</span> : null}
      <div className="zone-pieces">{children}</div>
    </div>
  );
}

function Stage({
  item,
  inZone,
  onPieceDown,
  onZoneUp,
  selected,
}: {
  item: Item;
  inZone: (id: string) => Piece[];
  onPieceDown: (event: ReactPointerEvent, id: string) => void;
  onZoneUp: (id: string) => void;
  selected: string | null;
}) {
  const renderPieces = (zoneId: string) =>
    inZone(zoneId).map((piece) => (
      <PieceView key={piece.id} piece={piece} selected={selected === piece.id} onDown={onPieceDown} />
    ));

  if (item.template === 'ten-frame') {
    const slots = item.zones.filter((zone) => zone.role === 'slot');
    const frames: Zone[][] = [];
    for (let i = 0; i < slots.length; i += 10) frames.push(slots.slice(i, i + 10));
    const nest = item.zones.find((zone) => zone.role === 'nest');
    return (
      <div className="stage">
        {frames.map((frame, index) => (
          <div className="ten" key={index}>
            <div className="ten-row">
              {frame.slice(0, 5).map((zone) => (
                <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp}>
                  {renderPieces(zone.id)}
                </ZoneBox>
              ))}
            </div>
            <div className="ten-row">
              {frame.slice(5, 10).map((zone) => (
                <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp}>
                  {renderPieces(zone.id)}
                </ZoneBox>
              ))}
            </div>
          </div>
        ))}
        {nest ? (
          <ZoneBox zone={nest} onUp={onZoneUp}>
            {renderPieces(nest.id)}
          </ZoneBox>
        ) : null}
      </div>
    );
  }

  if (item.template === 'number-line') {
    return (
      <div className="stage line">
        <svg className="lily-water" viewBox="0 0 600 80" preserveAspectRatio="none" aria-hidden>
          <path d="M0 48 C 80 20 140 70 220 42 C 300 14 380 68 460 40 C 520 22 560 58 600 36 L 600 80 L 0 80 Z" fill="#8ec8d8" opacity="0.85" />
          <path d="M0 58 C 90 36 160 72 250 50 C 340 28 420 70 600 46 L 600 80 L 0 80 Z" fill="#c5e7ef" />
        </svg>
        {item.zones.map((zone) => (
          <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp} backdrop="pad">
            {renderPieces(zone.id)}
          </ZoneBox>
        ))}
      </div>
    );
  }

  if (item.template === 'array' || item.template === 'coordinate') {
    const coords = item.template === 'coordinate';
    const cols = Math.max(...item.zones.map((zone) => (zone.col ?? 0) + 1));
    const maxRow = Math.max(...item.zones.map((zone) => zone.row ?? 0));
    const rows = coords
      ? Array.from({ length: maxRow + 1 }, (_, row) => maxRow - row)
      : Array.from({ length: maxRow + 1 }, (_, row) => row);
    return (
      <div className="stage grid-stage">
        {coords ? <p className="axis">across, then up</p> : null}
        {rows.map((row) => (
          <div className="grid-row" key={row} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {coords ? <span className="axis-n">{row}</span> : null}
            {Array.from({ length: cols }, (_, col) => {
              const zone = item.zones.find((candidate) => candidate.row === row && candidate.col === col);
              if (!zone) return <span key={col} />;
              return (
                <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp}>
                  {renderPieces(zone.id)}
                </ZoneBox>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (item.template === 'measure') {
    const spans = item.zones.filter((zone) => zone.role === 'span');
    const extras = item.zones.filter((zone) => zone.role === 'extra');
    return (
      <div className="stage bridge">
        {spans.map((zone) => (
          <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp}>
            {renderPieces(zone.id)}
          </ZoneBox>
        ))}
        <div className="flag" aria-hidden>
          ★
        </div>
        {extras.map((zone) => (
          <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp} className="grass">
            {renderPieces(zone.id)}
          </ZoneBox>
        ))}
      </div>
    );
  }

  if (item.template === 'sort' && item.pools) {
    return (
      <div className="stage pools">
        {item.zones.map((zone, index) => (
          <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp}>
            <span className="pool-count">{item.pools?.[index]?.count ?? 0}</span>
            <div className="mini-sparks">
              {Array.from({ length: item.pools?.[index]?.count ?? 0 }, (_, n) => (
                <Glyph key={n} art="spark" tone={index} />
              ))}
            </div>
            {renderPieces(zone.id)}
          </ZoneBox>
        ))}
      </div>
    );
  }

  const backdrop = item.template === 'sharing' || item.template === 'chance' ? 'jar' : undefined;
  return (
    <div className={`stage plain stage-${item.template}`}>
      {item.template === 'balance' ? (
        <svg className="scale-beam" viewBox="0 0 320 48" aria-hidden>
          <polygon points="160,4 172,28 148,28" fill="#c4a06a" />
          <rect x="24" y="24" width="272" height="10" rx="5" fill="#e7d3a4" stroke="#a8753a" strokeWidth="2" />
          <circle cx="160" cy="29" r="7" fill="#f0c56b" stroke="#8a6230" strokeWidth="2" />
        </svg>
      ) : null}
      {item.zones.map((zone) => (
        <ZoneBox key={zone.id} zone={zone} onUp={onZoneUp} backdrop={backdrop}>
          {renderPieces(zone.id)}
        </ZoneBox>
      ))}
    </div>
  );
}

function ClockFace({
  faceRef,
  hour,
  minute,
  onDown,
}: {
  faceRef: { current: HTMLDivElement | null };
  hour: number;
  minute: number;
  onDown: (which: 'hour' | 'minute', event: ReactPointerEvent) => void;
}) {
  const hourDeg = (hour % 12) * 30 + minute * 0.5;
  const minuteDeg = minute * 6;
  return (
    <div className="clock" data-testid="clock-face" ref={faceRef}>
      <svg className="clock-ring" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="46" fill="#fffaf3" stroke="#c4a06a" strokeWidth="4" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e7d3a8" strokeWidth="2" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = ((i * 30 - 90) * Math.PI) / 180;
          const x1 = 50 + Math.cos(a) * 34;
          const y1 = 50 + Math.sin(a) * 34;
          const x2 = 50 + Math.cos(a) * 40;
          const y2 = 50 + Math.sin(a) * 40;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8b6bb5" strokeWidth={i % 3 === 0 ? 2.4 : 1.2} strokeLinecap="round" />;
        })}
      </svg>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className="clock-num" style={{ transform: `rotate(${i * 30}deg) translateY(-72px) rotate(${-i * 30}deg)` }}>
          {i === 0 ? 12 : i}
        </span>
      ))}
      <div
        className="hand hour"
        data-testid="hand-hour"
        style={{ transform: `rotate(${hourDeg}deg)` }}
        onPointerDown={(event) => onDown('hour', event)}
      />
      <div
        className="hand minute"
        data-testid="hand-minute"
        style={{ transform: `rotate(${minuteDeg}deg)` }}
        onPointerDown={(event) => onDown('minute', event)}
      />
      <i className="clock-cap" />
    </div>
  );
}

function AngleFace({
  faceRef,
  degrees,
  onDown,
}: {
  faceRef: { current: HTMLDivElement | null };
  degrees: number;
  onDown: (event: ReactPointerEvent) => void;
}) {
  return (
    <div className="angle-face" data-testid="angle-face" ref={faceRef}>
      <div className="angle-base" />
      <div className="hand wand" data-testid="angle-wand" style={{ transform: `rotate(${degrees}deg)` }} onPointerDown={onDown} />
      <p className="angle-read">{degrees}°</p>
    </div>
  );
}

function Mirror({ item, onCells, tap }: { item: Item; onCells: string[]; tap: (id: string) => void }) {
  const symmetry = item.symmetry;
  if (!symmetry) return null;
  const cells = [];
  for (let row = 0; row < symmetry.rows; row++) {
    for (let col = 0; col < symmetry.cols; col++) {
      const id = `g${row}-${col}`;
      const on = onCells.includes(id);
      const locked = symmetry.given.includes(id);
      cells.push(
        <button
          key={id}
          type="button"
          data-testid={`tap:${id}`}
          className={on ? 'cell on' : 'cell'}
          aria-pressed={on}
          onClick={() => tap(id)}
          disabled={locked}
        />,
      );
    }
  }
  return (
    <div className="mirror" style={{ gridTemplateColumns: `repeat(${symmetry.cols}, 1fr)` }}>
      {cells}
    </div>
  );
}

function StaticPools({ item }: { item: Item }) {
  if (!item.pools) return null;
  return (
    <div className="static-graph">
      {item.pools.map((pool) => (
        <div key={pool.label} className="graph-col">
          <div className="stack">
            {Array.from({ length: pool.count }, (_, i) => (
              <Glyph key={i} art={pool.art} />
            ))}
          </div>
          <span>{pool.label}</span>
        </div>
      ))}
    </div>
  );
}
