import type { TemplateId } from '../curriculum/classify.ts';

export type Art =
  | 'spark'
  | 'gem'
  | 'crystal'
  | 'coin'
  | 'rod'
  | 'unit'
  | 'flat'
  | 'frog'
  | 'star'
  | 'moon'
  | 'leaf'
  | 'drop'
  | 'plank'
  | 'stone'
  | 'block'
  | 'marble'
  | 'token'
  | 'moth'
  | 'owl'
  | 'fish'
  | 'ribbon';

export type ShapeName =
  | 'triangle'
  | 'square'
  | 'circle'
  | 'rectangle'
  | 'pentagon'
  | 'hexagon'
  | 'cube'
  | 'cone'
  | 'sphere';

export type Piece = {
  id: string;
  art: Art;
  label?: string;
  value?: number;
  group?: string;
  tone?: number;
};

export type Zone = {
  id: string;
  label?: string;
  role: string;
  row?: number;
  col?: number;
  capacity?: number;
};

export type Goal =
  | { kind: 'fill-count'; count: number; zonePrefix?: string; group?: string }
  | { kind: 'mix'; counts: Record<string, number>; zonePrefix?: string }
  | { kind: 'zone-counts'; counts: Record<string, number> }
  | { kind: 'sum'; zoneId: string; total: number }
  | { kind: 'value'; zoneId: string; total: number; onesAtMost?: number; tensAtMost?: number }
  | { kind: 'array'; rows: number; cols: number }
  | { kind: 'piece-at'; pieceId: string; zoneId: string }
  | { kind: 'groups'; groupZone: Record<string, string> }
  | { kind: 'shaded'; count: number }
  | { kind: 'choice'; id: string }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'angle'; degrees: number }
  | { kind: 'toggles'; ids: string[] }
  | { kind: 'symmetry'; ids: string[] }
  | { kind: 'equal'; groups: string[]; zoneId: string; min: number };

export type Action =
  | { op: 'move'; pieceId: string; zoneId: string }
  | { op: 'bundle'; zoneId: string }
  | { op: 'tap'; id: string }
  | { op: 'clock'; hour: number; minute: number }
  | { op: 'angle'; degrees: number };

export type Item = {
  key: string;
  topicId: string;
  topicName: string;
  template: TemplateId;
  prompt: string;
  hints: [string, string, string];
  walkthrough: string[];
  example?: string[];
  pieces: Piece[];
  zones: Zone[];
  initial: Record<string, string>;
  slices?: { id: string }[];
  choices?: { id: string; label: string; sub?: string }[];
  toggles?: { id: string; shape: ShapeName; label: string }[];
  symmetry?: { cols: number; rows: number; given: string[] };
  clockStart?: { hour: number; minute: number };
  angleStart?: number;
  goal: Goal;
  solution: Action[];
  lead?: { art: Art; label?: string }[];
  equation?: { left: string; right: string };
  mushrooms?: number;
  spanCount?: number;
  compare?: { id: string; num: number; den: number; caption: string }[];
  /** Static groups drawn beside a question (pictograms, more/fewer). */
  pools?: { label: string; count: number; art: Art }[];
  /** Fraction pictures render as a round pie or a long potion bar. */
  layout?: 'pie' | 'bar';
};

export type BoardState = {
  at: Record<string, string | null>;
  shaded: string[];
  choice: string | null;
  clock: { hour: number; minute: number };
  angle: number;
  toggled: string[];
  symmetryOn: string[];
};
