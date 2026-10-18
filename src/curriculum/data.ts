import raw from './maths.json' with { type: 'json' };
import type { Cluster, Dependency, MathsFile, Topic } from './types.ts';

export const MATHS = raw as MathsFile;

const byId = new Map<string, Topic>(MATHS.topics.map((t) => [t.id, t]));

export function allTopics(): Topic[] {
  return MATHS.topics;
}

export function topicById(id: string): Topic | undefined {
  return byId.get(id);
}

export function topicByName(name: string): Topic {
  const found = MATHS.topics.find((t) => t.name === name);
  if (!found) throw new Error(`Missing Marble topic: ${name}`);
  return found;
}

export function domains(): string[] {
  const seen: string[] = [];
  for (const t of MATHS.topics) {
    if (!seen.includes(t.domain)) seen.push(t.domain);
  }
  return seen;
}

const hard = new Map<string, Dependency[]>();
const soft = new Map<string, Dependency[]>();
for (const dep of MATHS.dependencies) {
  const bucket = dep.strength === 'hard' ? hard : soft;
  const list = bucket.get(dep.topicId) ?? [];
  list.push(dep);
  bucket.set(dep.topicId, list);
}

export function hardPrereqs(topicId: string): Dependency[] {
  return hard.get(topicId) ?? [];
}

export function allPrereqs(topicId: string): Dependency[] {
  return [...(hard.get(topicId) ?? []), ...(soft.get(topicId) ?? [])];
}

export function clustersFor(domain: string): Cluster[] {
  return MATHS.clusters
    .filter((c) => c.domain === domain)
    .sort((a, b) => a.ageRangeStart - b.ageRangeStart);
}
