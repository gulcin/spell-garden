# Progress format

A sibling app can read Aida's garden from `localStorage`.

| | |
| --- | --- |
| Key | `prague.wizard-math.progress.v1` |
| `format` | `"prague.wizard-math.progress.v1"` |
| `taxonomy` | `"marble-skill-taxonomy-v1"` |

`parseProgress` in `src/progress/storage.ts` rejects any other `format`.

```json
{
  "format": "prague.wizard-math.progress.v1",
  "taxonomy": "marble-skill-taxonomy-v1",
  "learnerName": "Aida",
  "updatedAt": 0,
  "placement": {
    "done": true,
    "correct": 5,
    "asked": 5,
    "frontierAge": 8,
    "completedAt": 0
  },
  "seenTemplates": ["ten-frame"],
  "rewards": ["moth"],
  "sessions": [
    {
      "id": "s-1",
      "startedAt": 0,
      "endedAt": 0,
      "chapterTitle": "The sleepy lanterns",
      "topicIds": ["mt_…"],
      "correct": 6,
      "incorrect": 0,
      "rewardId": "moth"
    }
  ],
  "topics": {
    "mt_…": {
      "correct": 3,
      "incorrect": 0,
      "streak": 3,
      "attempts": [{ "correct": true, "at": 0, "sessionId": "s-1", "template": "ten-frame" }],
      "masteredAt": 0,
      "via": "practice",
      "lastAt": 0,
      "nextReviewAt": 0,
      "reviewStage": 0,
      "reviewFails": 0
    }
  }
}
```

Topic keys are Marble mathematics ids.

## How status is derived

Status is not stored. `statusOf` computes it:

- **Mastered** when `masteredAt` is set.
- **Locked** when any hard prerequisite is not mastered. Soft prerequisites never lock a topic; they only appear under “Builds on”.
- **Practising** when there is at least one attempt and the topic is not mastered.
- **Ready** otherwise.

## Mastery

Three correct answers in a row, with at least three correct in total, set `masteredAt` and `via: "practice"`. The next review is one day later, then 3, 7, 21, and 60 days after each successful review. Two failed reviews clear mastery.

Placement can also set `masteredAt` with `via: "placement"` for topics below the starting band. That path does not add to the success count. A grown-up can mark a topic mastered (`via: "parent"`) or delete its record.

A new garden defaults to `frontierAge` 8 (IB PYP Grade 3, about age 8). The short placement can lower that to 5, 6, or 7. A grown-up can set it anywhere from 4 through 15 in the journal; topics that finish before the chosen age are marked `via: "placement"`, and moving the start younger clears those placement marks without erasing practice. The selector offers topics up to one year past the effective frontier, steps down into a ready prerequisite when a nearer spell is still locked, and the frontier itself rises after a handful of topics at the current age are mastered. There is no fixed age ceiling.
