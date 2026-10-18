import { STARTER_IDS } from '../house/catalog.ts';
import type { Progress } from '../progress/types.ts';
import { appendNote } from '../stories/books.ts';
import { outfitPhrase } from '../stories/adventure.ts';
import { awardCrystals } from '../wardrobe/economy.ts';
import { rewardSpeech } from '../wardrobe/purse.ts';
import { PEOPLE, giftPhrase, personAt, personById, personByQuest, type Person, type TalkQuestion } from './people.ts';

export type TalkMemory = { characterId: string; visits: number };

export type QuestRecord = {
  id: string;
  characterId: string;
  status: 'active' | 'done';
  progress: number;
  startedAt: number;
  doneAt: number | null;
};

export type TalkReply = { id: string; label: string };

export type TalkView = { line: string; replies: TalkReply[] };

export type TalkStep = { at: 'menu' } | { at: 'hint' } | { at: 'ask'; questionId: string } | { at: 'quest' };

const MENU: TalkStep = { at: 'menu' };

function visitPhrase(visits: number): string {
  if (visits === 2) return 'your second visit';
  if (visits === 3) return 'your third visit';
  return `visit number ${visits}`;
}

function say(person: Person, which: 'hello' | 'again', name: string, outfit: string, visits: number): string {
  const template = which === 'hello' ? person.hello : person.again;
  return template.replaceAll('{name}', name).replaceAll('{outfit}', outfit).replaceAll('{visit}', visitPhrase(visits));
}

function menuReplies(quest: QuestRecord | null, ready: boolean): TalkReply[] {
  const questLabel = !quest ? 'A little quest' : quest.status === 'done' ? 'About that quest' : ready ? 'I did it' : 'How is my quest?';
  return [
    { id: 'hint', label: 'A hint, please' },
    { id: 'ask', label: 'Ask me something' },
    { id: 'quest', label: questLabel },
  ];
}

export function normalizeTalks(value: unknown): TalkMemory[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const talks: TalkMemory[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object') continue;
    const memory = row as Partial<TalkMemory>;
    if (typeof memory.characterId !== 'string' || !personById(memory.characterId) || seen.has(memory.characterId)) continue;
    const visits = typeof memory.visits === 'number' && Number.isFinite(memory.visits) ? Math.max(0, Math.floor(memory.visits)) : 0;
    seen.add(memory.characterId);
    talks.push({ characterId: memory.characterId, visits });
  }
  return talks;
}

export function normalizeQuests(value: unknown): QuestRecord[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const quests: QuestRecord[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object') continue;
    const quest = row as Partial<QuestRecord>;
    if (typeof quest.id !== 'string' || !personByQuest(quest.id) || seen.has(quest.id)) continue;
    if (typeof quest.characterId !== 'string' || personByQuest(quest.id)?.id !== quest.characterId) continue;
    const status = quest.status === 'done' ? 'done' : quest.status === 'active' ? 'active' : null;
    if (!status) continue;
    seen.add(quest.id);
    quests.push({
      id: quest.id,
      characterId: quest.characterId,
      status,
      progress: typeof quest.progress === 'number' && Number.isFinite(quest.progress) ? Math.max(0, Math.floor(quest.progress)) : 0,
      startedAt: typeof quest.startedAt === 'number' ? quest.startedAt : 0,
      doneAt: typeof quest.doneAt === 'number' ? quest.doneAt : null,
    });
  }
  return quests;
}

function memoryOf(progress: Progress, characterId: string): TalkMemory {
  return progress.talks.find((talk) => talk.characterId === characterId) ?? { characterId, visits: 0 };
}

function questOf(progress: Progress, questId: string): QuestRecord | null {
  return progress.quests.find((quest) => quest.id === questId) ?? null;
}

function houseExtra(progress: Progress): number {
  return progress.house.owned.filter((id) => !STARTER_IDS.includes(id)).length;
}

function measured(person: Person, progress: Progress, quest: QuestRecord | null): number {
  if (person.quest.kind === 'worth') return Math.max(0, progress.crystals);
  if (person.quest.kind === 'house') return houseExtra(progress);
  return quest?.progress ?? 0;
}

function waiting(person: Person, done: number): string {
  const { goal, unit, kind } = person.quest;
  if (kind === 'worth') return `Your pocket is worth ${done}. ${goal} would be enough, and you may keep it.`;
  if (done === 1 && !unit.endsWith('s')) return `You have ${done} of ${goal} ${unit}.`;
  return `You have ${done} of ${goal} ${unit}.`;
}

function questionFor(person: Person, visits: number): TalkQuestion {
  const maths = person.questions.find((question) => question.kind === 'maths') ?? person.questions[0]!;
  const story = person.questions.find((question) => question.kind === 'story') ?? maths;
  return visits % 2 === 1 ? maths : story;
}

function askView(question: TalkQuestion): TalkView {
  return {
    line: question.prompt,
    replies: question.choices.map((choice) => ({ id: `answer-${question.id}-${choice.id}`, label: choice.label })),
  };
}

function withMemory(progress: Progress, memory: TalkMemory): Progress {
  const talks = progress.talks.some((talk) => talk.characterId === memory.characterId)
    ? progress.talks.map((talk) => (talk.characterId === memory.characterId ? memory : talk))
    : [...progress.talks, memory];
  return { ...progress, talks };
}

function withQuest(progress: Progress, quest: QuestRecord): Progress {
  const quests = progress.quests.some((item) => item.id === quest.id)
    ? progress.quests.map((item) => (item.id === quest.id ? quest : item))
    : [...progress.quests, quest];
  return { ...progress, quests };
}

function finishQuest(progress: Progress, person: Person, current: QuestRecord, placeId: string, name: string, now: number) {
  const before = progress.crystals;
  const finished: QuestRecord = {
    ...current,
    status: 'done',
    progress: Math.max(current.progress, person.quest.goal),
    doneAt: now,
  };
  const saved = awardCrystals(withQuest(progress, finished), person.quest.reward);
  const noted = appendNote(saved.books, {
    placeId,
    at: now,
    page: {
      id: `quest-${person.quest.id}-done`,
      text: `${name} finished ${person.name}'s quest. ${person.name} gave ${giftPhrase(person.quest.reward)}.`,
    },
  });
  return {
    progress: { ...saved, books: noted },
    step: MENU,
    view: { line: `${person.quest.done} ${rewardSpeech(before, person.quest.reward)}`, replies: menuReplies(finished, true) },
  };
}

/** Puzzle spells and finished colouring pages move an open quest forward. The reward waits until she talks. */
export function bumpPlaceQuests(progress: Progress, placeId: string): Progress {
  const watched = new Set(
    PEOPLE.filter((person) => person.placeId === placeId && (person.quest.kind === 'puzzle' || person.quest.kind === 'colour')).map(
      (person) => person.quest.id,
    ),
  );
  let changed = false;
  const quests = progress.quests.map((quest) => {
    if (quest.status !== 'active' || !watched.has(quest.id)) return quest;
    const person = personByQuest(quest.id);
    if (!person) return quest;
    const progressCount = Math.min(person.quest.goal, quest.progress + 1);
    if (progressCount === quest.progress) return quest;
    changed = true;
    return { ...quest, progress: progressCount };
  });
  return changed ? { ...progress, quests } : progress;
}

export function applyTalk(
  progress: Progress,
  placeId: string,
  replyId: string | null,
  step: TalkStep = MENU,
  now = Date.now(),
): { progress: Progress; step: TalkStep; view: TalkView } {
  const person = personAt(placeId);
  if (!person) {
    return { progress, step: MENU, view: { line: 'The garden is quiet here.', replies: [] } };
  }
  const name = progress.learnerName || 'friend';
  const outfit = outfitPhrase(progress.wardrobe);
  const memory = memoryOf(progress, person.id);
  const quest = questOf(progress, person.quest.id);
  const ready = measured(person, progress, quest) >= person.quest.goal;

  if (replyId == null) {
    const visits = memory.visits + 1;
    const line = say(person, visits === 1 ? 'hello' : 'again', name, outfit, visits);
    const next = withMemory(progress, { characterId: person.id, visits });
    const noted = appendNote(next.books, {
      placeId,
      at: now,
      page: {
        id: `talk-${person.id}-v${visits}`,
        text: `You talked with ${person.name}. ${person.name} said hello to ${name}, who was wearing ${outfit}.`,
      },
    });
    return {
      progress: { ...next, books: noted },
      step: MENU,
      view: { line, replies: menuReplies(quest, ready) },
    };
  }

  if (step.at === 'ask' && replyId.startsWith(`answer-${step.questionId}-`)) {
    const question = person.questions.find((item) => item.id === step.questionId) ?? questionFor(person, memory.visits);
    const choiceId = replyId.slice(`answer-${question.id}-`.length);
    const choice = question.choices.find((item) => item.id === choiceId);
    if (choice?.ok) {
      const noted = appendNote(progress.books, {
        placeId,
        at: now,
        page: {
          id: `talk-${person.id}-${question.id}-v${memory.visits}`,
          text: `${person.name} asked ${name}: ${question.prompt} ${name} said ${choice.label}.`,
        },
      });
      return {
        progress: { ...progress, books: noted },
        step: MENU,
        view: { line: question.praise, replies: menuReplies(quest, ready) },
      };
    }
    return {
      progress,
      step,
      view: { line: `${question.nudge} ${question.prompt}`, replies: askView(question).replies },
    };
  }

  if (replyId === 'hint') {
    return { progress, step: { at: 'hint' }, view: { line: person.hint, replies: menuReplies(quest, ready) } };
  }

  if (replyId === 'ask') {
    const question = questionFor(person, Math.max(1, memory.visits));
    return { progress, step: { at: 'ask', questionId: question.id }, view: askView(question) };
  }

  if (replyId === 'quest' || replyId === 'accept' || step.at === 'quest') {
    if (quest?.status === 'done') {
      return {
        progress,
        step: MENU,
        view: { line: `You already did that for me. I still smile about it.`, replies: menuReplies(quest, true) },
      };
    }
    if (replyId === 'later') {
      return { progress, step: MENU, view: { line: say(person, memory.visits <= 1 ? 'hello' : 'again', name, outfit, Math.max(1, memory.visits)), replies: menuReplies(quest, ready) } };
    }
    if (!quest && replyId !== 'accept') {
      return {
        progress,
        step: { at: 'quest' },
        view: {
          line: person.quest.offer,
          replies: [
            { id: 'accept', label: "I'll do it" },
            { id: 'later', label: 'Not now' },
          ],
        },
      };
    }
    if (!quest && replyId === 'accept') {
      const record: QuestRecord = {
        id: person.quest.id,
        characterId: person.id,
        status: 'active',
        progress: person.quest.kind === 'puzzle' || person.quest.kind === 'colour' ? 0 : measured(person, progress, null),
        startedAt: now,
        doneAt: null,
      };
      const accepted = withQuest(progress, record);
      const noted = appendNote(accepted.books, {
        placeId,
        at: now,
        page: { id: `quest-${person.quest.id}-accept`, text: `${person.name} asked ${name} to ${person.quest.bookAsk}.` },
      });
      const holding = { ...accepted, books: noted };
      if (measured(person, holding, record) >= person.quest.goal) return finishQuest(holding, person, record, placeId, name, now);
      return {
        progress: holding,
        step: MENU,
        view: {
          line: `I will wait. ${waiting(person, measured(person, holding, record))}`,
          replies: menuReplies(record, false),
        },
      };
    }
    const current = quest ?? {
      id: person.quest.id,
      characterId: person.id,
      status: 'active' as const,
      progress: 0,
      startedAt: now,
      doneAt: null,
    };
    const amount = measured(person, progress, current);
    if (amount >= person.quest.goal) return finishQuest(progress, person, current, placeId, name, now);
    const stored = person.quest.kind === 'puzzle' || person.quest.kind === 'colour' ? current.progress : amount;
    const refreshed = stored === current.progress ? progress : withQuest(progress, { ...current, progress: stored });
    return {
      progress: refreshed,
      step: MENU,
      view: { line: waiting(person, amount), replies: menuReplies(current, false) },
    };
  }

  return {
    progress,
    step: MENU,
    view: { line: say(person, memory.visits <= 1 ? 'hello' : 'again', name, outfit, Math.max(1, memory.visits)), replies: menuReplies(quest, ready) },
  };
}
