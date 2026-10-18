export type Topic = {
  id: string;
  type: string;
  subject: string;
  domain: string;
  name: string;
  description: string;
  ageRangeStart: number;
  ageRangeEnd: number;
  centrality: number;
  evidence: string[];
  assessmentPrompt: string;
};

export type Dependency = {
  topicId: string;
  prerequisiteId: string;
  strength: 'hard' | 'soft' | string;
  reason: string;
};

export type Cluster = {
  subject: string;
  domain: string;
  ageRangeStart: number;
  summary: string;
};

export type MathsFile = {
  version: string;
  source: string;
  attribution: string;
  topicCount: number;
  topics: Topic[];
  dependencies: Dependency[];
  clusters: Cluster[];
};

export const ATTRIBUTION =
  'Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com · ODbL 1.0 (database) and CC BY-SA 4.0 (content)';
