// Filters the Marble Skill Taxonomy to mathematics and writes a slim bundle.
// Source: https://github.com/withmarbleapp/os-taxonomy (v1). Run only when refreshing data.
import { readFileSync, writeFileSync } from 'node:fs';

const root = process.env.MARBLE_DIR || '/tmp/marble';
const topicsFile = JSON.parse(readFileSync(`${root}/topics.json`, 'utf8'));
const depsFile = JSON.parse(readFileSync(`${root}/dependencies.json`, 'utf8'));
const clustersFile = JSON.parse(readFileSync(`${root}/clusters.json`, 'utf8'));

const topics = topicsFile.topics
  .filter((t) => t.subject === 'Mathematics')
  .map((t) => ({
    id: t.id,
    type: t.type,
    subject: t.subject,
    domain: t.domain,
    name: t.name,
    description: t.description,
    ageRangeStart: t.ageRangeStart,
    ageRangeEnd: t.ageRangeEnd,
    centrality: t.centrality,
    evidence: t.evidence ?? [],
    assessmentPrompt: t.assessmentPrompt ?? '',
  }));

const ids = new Set(topics.map((t) => t.id));
const dependencies = depsFile.dependencies
  .filter((d) => ids.has(d.topicId) && ids.has(d.prerequisiteId))
  .map((d) => ({
    topicId: d.topicId,
    prerequisiteId: d.prerequisiteId,
    strength: d.strength,
    reason: d.reason,
  }));

const clusters = clustersFile.clusters
  .filter((c) => c.subject === 'Mathematics')
  .map((c) => ({
    subject: c.subject,
    domain: c.domain,
    ageRangeStart: c.ageRangeStart,
    summary: c.summary,
  }));

const out = {
  version: topicsFile.version,
  source: 'https://github.com/withmarbleapp/os-taxonomy',
  attribution:
    'Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com · ODbL 1.0 (database) and CC BY-SA 4.0 (content)',
  topicCount: topics.length,
  topics,
  dependencies,
  clusters,
};

writeFileSync('src/curriculum/maths.json', JSON.stringify(out));
console.log(
  `maths topics ${topics.length}, deps ${dependencies.length}, clusters ${clusters.length}`,
);
