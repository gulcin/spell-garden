import { useState } from 'react';
import { furnitureById, wallpaperById, WALLPAPERS } from '../house/catalog.ts';
import {
  bringToFront,
  flipItem,
  moveItem,
  openSpot,
  placeItem,
  setWallpaper,
  storeItem,
  type HouseState,
  type PlacedItem,
} from '../house/layout.ts';
import { petById } from '../pets/catalog.ts';
import { callHome, ownedPet, restPet } from '../pets/state.ts';
import type { Progress } from '../progress/types.ts';
import { CrystalCounter } from './CrystalCounter.tsx';
import { PetArt } from './PetShop.tsx';
import { TalkDock } from './TalkDock.tsx';
import { DressedApprentice } from './DressedApprentice.tsx';
import { PlaceBookButton } from './StoryTime.tsx';

type Drag =
  | { kind: 'move'; placedId: string; dx: number; dy: number; x: number; y: number; moved: boolean }
  | { kind: 'new'; itemId: string; x: number; y: number; clientX: number; clientY: number; inside: boolean; moved: boolean };

export function WitchHouse({
  progress,
  update,
  onShop,
  onOpenBook,
}: {
  progress: Progress;
  update: (recipe: (current: Progress) => Progress) => void;
  onShop?: () => void;
  onOpenBook?: () => void;
}) {
  const house = progress.house;
  const paper = wallpaperById(house.wallpaper);
  const [selected, setSelected] = useState<string | null>(null);
  const [petPage, setPetPage] = useState(0);
  const [drag, setDrag] = useState<Drag | null>(null);
  const base = import.meta.env.BASE_URL;
  const roomArt = `${base}art/house/${paper.file}`;
  const waiting = house.owned.filter((id) => !house.placed.some((piece) => piece.itemId === id));
  const selectedPiece = house.placed.find((piece) => piece.id === selected) ?? null;

  function change(recipe: (current: HouseState) => HouseState) {
    update((current) => {
      const next = recipe(current.house);
      return next === current.house ? current : { ...current, house: next };
    });
  }

  function roomPoint(clientX: number, clientY: number, room: HTMLElement) {
    const rect = room.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
      inside: clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom,
      rect,
    };
  }

  function startMove(event: React.PointerEvent<HTMLButtonElement>, piece: PlacedItem) {
    const room = event.currentTarget.parentElement;
    if (!room) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const { rect } = roomPoint(event.clientX, event.clientY, room);
    const anchorX = rect.left + (piece.x / 100) * rect.width;
    const anchorY = rect.top + (piece.y / 100) * rect.height;
    setSelected(piece.id);
    setDrag({
      kind: 'move',
      placedId: piece.id,
      dx: event.clientX - anchorX,
      dy: event.clientY - anchorY,
      x: piece.x,
      y: piece.y,
      moved: false,
    });
  }

  function followMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag || drag.kind !== 'move') return;
    const room = event.currentTarget.parentElement;
    if (!room) return;
    const rect = room.getBoundingClientRect();
    const x = ((event.clientX - drag.dx - rect.left) / rect.width) * 100;
    const y = ((event.clientY - drag.dy - rect.top) / rect.height) * 100;
    setDrag({ ...drag, x, y, moved: drag.moved || Math.hypot(x - drag.x, y - drag.y) > 1.2 });
  }

  function finishMove() {
    if (!drag || drag.kind !== 'move') return;
    if (drag.moved) change((current) => moveItem(current, drag.placedId, drag.x, drag.y));
    setDrag(null);
  }

  function startNew(event: React.PointerEvent<HTMLButtonElement>, itemId: string) {
    const room = event.currentTarget.closest('.witch-house')?.querySelector('.house-room');
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const here = room instanceof HTMLElement ? roomPoint(event.clientX, event.clientY, room) : null;
    setDrag({
      kind: 'new',
      itemId,
      x: here?.x ?? 50,
      y: here?.y ?? 80,
      clientX: event.clientX,
      clientY: event.clientY,
      inside: here?.inside ?? false,
      moved: false,
    });
  }

  function followNew(event: React.PointerEvent<HTMLButtonElement>) {
    if (!drag || drag.kind !== 'new') return;
    const room = event.currentTarget.closest('.witch-house')?.querySelector('.house-room');
    const here = room instanceof HTMLElement ? roomPoint(event.clientX, event.clientY, room) : null;
    const moved = drag.moved || Math.hypot(event.clientX - drag.clientX, event.clientY - drag.clientY) > 8;
    setDrag({
      ...drag,
      x: here?.x ?? drag.x,
      y: here?.y ?? drag.y,
      clientX: event.clientX,
      clientY: event.clientY,
      inside: here?.inside ?? false,
      moved,
    });
  }

  function finishNew() {
    if (!drag || drag.kind !== 'new') return;
    const item = furnitureById(drag.itemId);
    if (item && (drag.inside || !drag.moved)) {
      const spot = drag.inside && drag.moved ? { x: drag.x, y: drag.y } : openSpot(house, item.surface);
      change((current) => placeItem(current, item.id, spot.x, spot.y));
      setSelected(`p-${item.id}`);
    }
    setDrag(null);
  }

  const pieces = [...house.placed].sort((a, b) => a.z - b.z);
  const housePets = progress.pets.home;
  const restingIds = new Set(housePets.map((pet) => pet.id));
  const waitingPets = progress.pets.owned
    .filter((pet) => !restingIds.has(pet.id))
    .sort((a, b) => {
      if (a.id === progress.pets.companionId) return -1;
      if (b.id === progress.pets.companionId) return 1;
      return b.at - a.at;
    });
  const companionHere = progress.pets.companionId && !restingIds.has(progress.pets.companionId) ? progress.pets.companionId : null;

  return (
    <section className="witch-house" data-testid="witch-house">
      <header className="shop-top house-top">
        <div>
          <p className="kicker">Witch's house</p>
          <h1>A room of her own</h1>
        </div>
        <div className="shop-tools">
          {onOpenBook ? <PlaceBookButton placeId="witch-house" books={progress.books} onOpen={onOpenBook} /> : null}
          <CrystalCounter count={progress.crystals} />
        </div>
      </header>
      <TalkDock progress={progress} update={update} placeId="witch-house" />
      <div className="house-papers" role="group" aria-label="Wallpaper">
        {WALLPAPERS.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className={house.wallpaper === choice.id ? 'house-paper on' : 'house-paper'}
            data-testid={`wallpaper-${choice.id}`}
            aria-pressed={house.wallpaper === choice.id}
            onClick={() => change((current) => setWallpaper(current, choice.id))}
          >
            <img src={`${base}art/house/${choice.file}.webp`} alt="" />
            {choice.name}
          </button>
        ))}
      </div>
      <div
        className="house-room"
        data-testid="house-room"
        data-wallpaper={house.wallpaper}
        style={{ backgroundImage: `image-set(url("${roomArt}.webp") 1x, url("${roomArt}@2x.webp") 2x)` }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) setSelected(null);
        }}
      >
        {pieces.map((piece) => {
          const item = furnitureById(piece.itemId);
          if (!item) return null;
          const moving = drag?.kind === 'move' && drag.placedId === piece.id;
          const x = moving ? drag.x : piece.x;
          const y = moving ? drag.y : piece.y;
          return (
            <button
              key={piece.id}
              type="button"
              className={`house-piece ${item.surface}${piece.flip ? ' flip' : ''}${selected === piece.id ? ' on' : ''}`}
              style={{ left: `${x}%`, top: `${y}%`, width: `${item.width}%`, zIndex: piece.z }}
              data-testid={`piece-${item.id}`}
              data-x={piece.x}
              data-y={piece.y}
              data-flip={piece.flip ? '1' : '0'}
              data-z={piece.z}
              aria-label={item.name}
              onPointerDown={(event) => startMove(event, piece)}
              onPointerMove={followMove}
              onPointerUp={finishMove}
              onPointerCancel={() => setDrag(null)}
            >
              <img
                src={`${base}art/house/${item.id}.webp`}
                srcSet={`${base}art/house/${item.id}.webp 1x, ${base}art/house/${item.id}@2x.webp 2x`}
                alt=""
                draggable={false}
              />
            </button>
          );
        })}
        {housePets.map((resting) => {
          const pet = petById(resting.id);
          const owned = ownedPet(progress.pets, resting.id);
          if (!pet) return null;
          return (
            <button
              key={resting.id}
              type="button"
              className={`house-piece floor house-pet${resting.flip ? ' flip' : ''}`}
              style={{ left: `${resting.x}%`, top: `${resting.y}%`, width: '16%', zIndex: 30 }}
              data-testid={`home-pet-${resting.id}`}
              aria-label={`Call ${owned?.name ?? pet.name} back`}
              onClick={() => update((current) => ({ ...current, pets: callHome(current.pets, resting.id) }))}
            >
              <PetArt id={resting.id} alt="" />
            </button>
          );
        })}
        {waitingPets.length > 0 ? (
          <div className="house-pets" data-testid="house-pets">
            {petPage > 0 ? (
              <button type="button" data-testid="pet-rest-prev" onClick={() => setPetPage(petPage - 1)} aria-label="Previous friends">
                ‹
              </button>
            ) : null}
            {waitingPets.slice(petPage, petPage + 2).map((owned) => {
              const pet = petById(owned.id);
              if (!pet) return null;
              return (
                <button
                  key={owned.id}
                  type="button"
                  className="house-chip"
                  data-testid={`rest-pet-${owned.id}`}
                  onClick={() => update((current) => ({ ...current, pets: restPet(current.pets, current.house, owned.id) }))}
                >
                  <PetArt id={owned.id} alt="" />
                  <span>{owned.name.trim() || pet.name}</span>
                </button>
              );
            })}
            {petPage + 2 < waitingPets.length ? (
              <button type="button" data-testid="pet-rest-next" onClick={() => setPetPage(petPage + 1)} aria-label="More friends">
                ›
              </button>
            ) : null}
          </div>
        ) : null}
        <DressedApprentice className="house-girl" alt="Aida standing in her witch's house" />
        {companionHere ? <PetArt id={companionHere} className="house-companion" alt="" /> : null}
        <img className="story-moth house-nim" data-testid="house-nim" src={`${base}art/moth.webp`} alt="" />
        {drag?.kind === 'new' && drag.moved ? (
          <img
            className="house-ghost"
            src={`${base}art/house/${drag.itemId}.webp`}
            alt=""
            style={{ left: drag.clientX, top: drag.clientY }}
          />
        ) : null}
      </div>
      {selectedPiece ? (
        <div className="house-tools">
          <button type="button" className="btn" data-testid="house-flip" onClick={() => change((current) => flipItem(current, selectedPiece.id))}>
            Flip
          </button>
          <button type="button" className="btn" data-testid="house-front" onClick={() => change((current) => bringToFront(current, selectedPiece.id))}>
            Bring to front
          </button>
          <button
            type="button"
            className="btn"
            data-testid="house-store"
            onClick={() => {
              change((current) => storeItem(current, selectedPiece.id));
              setSelected(null);
            }}
          >
            Store
          </button>
        </div>
      ) : (
        <p className="house-hint">Drag a piece into the room. Tap one to flip it, bring it forward, or put it away.</p>
      )}
      <div className="house-tray" data-testid="house-tray">
        {waiting.map((id) => {
          const item = furnitureById(id);
          if (!item) return null;
          return (
            <button
              key={id}
              type="button"
              className="house-chip"
              data-testid={`tray-${id}`}
              onPointerDown={(event) => startNew(event, id)}
              onPointerMove={followNew}
              onPointerUp={finishNew}
              onPointerCancel={() => setDrag(null)}
            >
              <img src={`${base}art/house/${id}.webp`} alt="" draggable={false} />
              <span>{item.name}</span>
            </button>
          );
        })}
        {waiting.length === 0 ? <p className="house-hint">Every piece she owns is in the room.</p> : null}
      </div>
      {onShop ? (
        <button type="button" className="btn gold xl" data-testid="house-shop" onClick={onShop}>
          Visit the crystal shop
        </button>
      ) : null}
    </section>
  );
}
