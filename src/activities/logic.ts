import type { Action, BoardState, Goal, Item, Piece } from './types.ts';

export function initialState(item: Item): BoardState {
  const at: Record<string, string | null> = {};
  for (const piece of item.pieces) at[piece.id] = item.initial[piece.id] ?? null;
  return {
    at,
    shaded: [],
    choice: null,
    clock: item.clockStart ? { ...item.clockStart } : { hour: 12, minute: 0 },
    angle: item.angleStart ?? 0,
    toggled: [],
    symmetryOn: [...(item.symmetry?.given ?? [])],
  };
}

function zoneOf(item: Item, id: string) {
  return item.zones.find((zone) => zone.id === id);
}

export function applyAction(item: Item, state: BoardState, action: Action): BoardState {
  if (action.op === 'move') {
    const zone = zoneOf(item, action.zoneId);
    if (!zone) return state;
    if (zone.capacity != null) {
      const filled = item.pieces.filter((piece) => piece.id !== action.pieceId && state.at[piece.id] === zone.id).length;
      if (filled >= zone.capacity) return state;
    }
    return { ...state, at: { ...state.at, [action.pieceId]: action.zoneId } };
  }
  if (action.op === 'bundle') {
    const units = item.pieces.filter((piece) => piece.art === 'unit' && state.at[piece.id] === action.zoneId);
    const rod = item.pieces.find((piece) => piece.art === 'rod' && state.at[piece.id] == null);
    if (units.length < 10 || !rod) return state;
    const at = { ...state.at };
    for (const unit of units.slice(0, 10)) at[unit.id] = '_boxed';
    at[rod.id] = action.zoneId;
    return { ...state, at };
  }
  if (action.op === 'clock') return { ...state, clock: { hour: action.hour, minute: action.minute } };
  if (action.op === 'angle') return { ...state, angle: action.degrees };
  if (action.op === 'tap') {
    if (item.choices?.some((choice) => choice.id === action.id)) return { ...state, choice: action.id };
    if (item.slices?.some((slice) => slice.id === action.id)) {
      const shaded = state.shaded.includes(action.id)
        ? state.shaded.filter((id) => id !== action.id)
        : [...state.shaded, action.id];
      return { ...state, shaded };
    }
    if (item.toggles?.some((toggle) => toggle.id === action.id)) {
      const toggled = state.toggled.includes(action.id)
        ? state.toggled.filter((id) => id !== action.id)
        : [...state.toggled, action.id];
      return { ...state, toggled };
    }
    if (item.compare?.some((card) => card.id === action.id)) return { ...state, choice: action.id };
    if (item.symmetry && !item.symmetry.given.includes(action.id)) {
      const symmetryOn = state.symmetryOn.includes(action.id)
        ? state.symmetryOn.filter((id) => id !== action.id)
        : [...state.symmetryOn, action.id];
      return { ...state, symmetryOn };
    }
  }
  return state;
}

export function applyAll(item: Item, actions: Action[]): BoardState {
  return actions.reduce((state, action) => applyAction(item, state, action), initialState(item));
}

function placed(piece: Piece, state: BoardState, zonePrefix?: string, group?: string): boolean {
  const zone = state.at[piece.id];
  if (!zone || zone === '_boxed') return false;
  if (zonePrefix && !zone.startsWith(zonePrefix)) return false;
  if (group && piece.group !== group) return false;
  return true;
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((value, index) => value === right[index]);
}

function goalMet(item: Item, state: BoardState, goal: Goal): boolean {
  if (goal.kind === 'fill-count') {
    return item.pieces.filter((piece) => placed(piece, state, goal.zonePrefix, goal.group)).length === goal.count;
  }
  if (goal.kind === 'mix') {
    const placedCount = item.pieces.filter((piece) => placed(piece, state, goal.zonePrefix)).length;
    const want = Object.values(goal.counts).reduce((sum, count) => sum + count, 0);
    if (placedCount !== want) return false;
    return Object.entries(goal.counts).every(([group, count]) => {
      return item.pieces.filter((piece) => placed(piece, state, goal.zonePrefix, group)).length === count;
    });
  }
  if (goal.kind === 'zone-counts') {
    return Object.entries(goal.counts).every(([zoneId, count]) => {
      return item.pieces.filter((piece) => state.at[piece.id] === zoneId).length === count;
    });
  }
  if (goal.kind === 'sum' || goal.kind === 'value') {
    const pieces = item.pieces.filter((piece) => state.at[piece.id] === goal.zoneId);
    const total = pieces.reduce((sum, piece) => sum + (piece.value ?? 0), 0);
    if (total !== goal.total) return false;
    if (goal.kind === 'value') {
      const ones = pieces.filter((piece) => piece.art === 'unit').length;
      const tens = pieces.filter((piece) => piece.art === 'rod').length;
      if (goal.onesAtMost != null && ones > goal.onesAtMost) return false;
      if (goal.tensAtMost != null && tens > goal.tensAtMost) return false;
    }
    return true;
  }
  if (goal.kind === 'array') {
    const rowCols = new Map<number, Set<number>>();
    for (const zone of item.zones) {
      if (zone.row == null || zone.col == null) continue;
      const here = item.pieces.some((piece) => state.at[piece.id] === zone.id);
      if (!here) continue;
      const set = rowCols.get(zone.row) ?? new Set<number>();
      set.add(zone.col);
      rowCols.set(zone.row, set);
    }
    const used = [...rowCols.entries()];
    if (used.length !== goal.rows) return false;
    return used.every(([, cols]) => {
      if (cols.size !== goal.cols) return false;
      for (let col = 0; col < goal.cols; col++) if (!cols.has(col)) return false;
      return true;
    });
  }
  if (goal.kind === 'piece-at') return state.at[goal.pieceId] === goal.zoneId;
  if (goal.kind === 'groups') {
    return item.pieces.every((piece) => {
      const want = piece.group ? goal.groupZone[piece.group] : undefined;
      return want != null && state.at[piece.id] === want;
    });
  }
  if (goal.kind === 'shaded') return state.shaded.length === goal.count;
  if (goal.kind === 'choice') return state.choice === goal.id;
  if (goal.kind === 'clock') {
    return state.clock.hour % 12 === goal.hour % 12 && state.clock.minute === goal.minute;
  }
  if (goal.kind === 'angle') return state.angle === goal.degrees;
  if (goal.kind === 'toggles') return sameSet(state.toggled, goal.ids);
  if (goal.kind === 'symmetry') return sameSet(state.symmetryOn, goal.ids);
  if (goal.kind === 'equal') {
    const counts = new Map<string, number>();
    for (const group of goal.groups) counts.set(group, 0);
    for (const piece of item.pieces) {
      if (state.at[piece.id] !== goal.zoneId || !piece.group) continue;
      if (!counts.has(piece.group)) continue;
      counts.set(piece.group, (counts.get(piece.group) ?? 0) + 1);
    }
    const values = goal.groups.map((group) => counts.get(group) ?? 0);
    return values.every((value) => value >= goal.min && value === values[0]);
  }
  return false;
}

export function isSolved(item: Item, state: BoardState): boolean {
  return goalMet(item, state, item.goal);
}
