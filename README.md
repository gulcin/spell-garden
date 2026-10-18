# Prague's Spell Garden

A touch-first maths garden. Prague is a wizard apprentice: counting, sharing, clocks, and fractions cast kind magic — lanterns, plants, bridges, and sleepy creatures. There is no combat, no timer, and no scary content.

The spells follow every mathematics topic in the Marble Skill Taxonomy (v1). A new garden starts around IB PYP Grade 3 (about age 8). Each chapter is six puzzles: a focus spell practised until it can be mastered, plus other manipulatives, with spaced review. If a spell is missing an earlier idea, the garden steps down and fills that gap. Mastery can climb with no age ceiling. A grown-up can change the starting level in the journal.

## Run it

```bash
npm install
npm run dev
```

The dev server is [http://127.0.0.1:43123](http://127.0.0.1:43123). It works offline after the first load of a production build (service worker, local fonts, no API keys, no runtime network calls).

```bash
npm test
npm run build
npm run preview
```

Add the site to the iPad home screen from Safari. Progress stays in this browser.

## GitHub Pages

Asset paths are relative (`base: './'`) so the built site can sit at any sub-path, including `https://<user>.github.io/<repo>/`.

To pin an absolute base instead, set `BASE_PATH` (for example `/spell-garden/`) before `npm run build`. The Pages workflow does that from `actions/configure-pages`. That build also rewrites the web app manifest `id`, `start_url`, and `scope`, plus service-worker precache URLs, to the same prefix so installation and offline caching stay inside `/spell-garden/`.

1. Push this project to GitHub.
2. In the repository settings, set Pages to **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` builds and deploys `dist/`.

## Progress a sibling app can read

Key: `prague.wizard-math.progress.v1` in `localStorage`.

The JSON `format` field is the same string, and `taxonomy` is `marble-skill-taxonomy-v1`. Topic ids are Marble ids (`mt_…`). Statuses shown to a grown-up are Mastered, Practising, Ready, and Locked. The full shape is in [docs/progress-format.md](docs/progress-format.md).

## What each topic plays like

Every maths topic maps to a touch activity. Drag templates (ten-frame, number line, base-ten, sharing, arrays, coins, clocks, balance, measure, patterns, sort, bar models, graphs, coordinates, angles, chance) are preferred when the selector builds a chapter. Fractions, shapes, and symmetry are tap puzzles. Topics that do not fit a manipulative — mostly habits of mathematical thinking, vocabulary, and late algebra — use a short worked example and a choice of answers.

A generated list of topic to template is in [docs/topic-templates.md](docs/topic-templates.md).

## Marble Skill Taxonomy

The curriculum text and the dependency graph are derived from the Marble Skill Taxonomy (v1):

**Marble Skill Taxonomy (v1) · © Generative Spark, Inc. (Marble) · https://withmarble.com · ODbL 1.0 (database) and CC BY-SA 4.0 (content)**

- Database (topics, dependencies, clusters): [ODbL 1.0](third_party/marble/LICENSE-ODbL)
- Content (names, descriptions, evidence): [CC BY-SA 4.0](third_party/marble/LICENSE-CONTENT-CC-BY-SA)
- Source: https://github.com/withmarbleapp/os-taxonomy

Only mathematics topics are bundled, in `src/curriculum/maths.json`. That file is vendored in the repository. The production build does not download taxonomy data, and the file is not gitignored. `scripts/extract-maths.mjs` is only for refreshing the bundle from a local Marble checkout. Dependencies whose prerequisite is outside mathematics are omitted, so a maths-only garden is not locked on another subject. Standards codes are not included. The app’s original art, interaction, and code are separate from that share-alike corpus; if you redistribute the vendored taxonomy text, keep the Marble credit and the ODbL / CC BY-SA terms.

The in-app About page shows the same credit line.
