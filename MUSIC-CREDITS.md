# Music credits

Spell Garden’s place music is original. The tunes are composed in the app and played by the browser’s Web Audio API. There are no borrowed recordings, sample libraries, or third-party tracks.

## Licence

These compositions are dedicated to the public domain under the [Creative Commons CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) dedication.

You may copy, change, and share them, including with this app. No attribution is required. The About screen in the garden still names the music so a grown-up can see where it came from.

## Sources

| Loop | Where it plays | How it is made |
| --- | --- | --- |
| Garden map | The map, the topic garden, and the grown-ups’ journal | Soft pad and a plucked walk, original |
| Lantern grove | Lantern grove | A low hum and slow bells, original |
| Potion cottage | Potion cottage | A plucked tune and rising bubbles, original |
| Crystal cave | The crystal mines | A hum-along line, a working melody, and tapped pickaxes, original |
| Observatory | Observatory | A held chord and a twinkly celesta, original |
| Lily pond | Lily pond | Filtered water, a harp-like pluck, and chimes, original |
| Greenhouse | Greenhouse | A light plucked pattern and a few bells, original |
| Wizard tower | Wizard tower | A low hum and a careful plucked line, original |
| Mushroom ring | Mushroom ring | A short fairy-dance jig, original |
| Crystal shop | Crystal shop and the wardrobe mirror | Shop bells over a light pluck, original |
| Pet shop | Pet shop | A bouncy pluck and a small bell, original |
| Witch’s house | Witch’s house | A cosy hum, a quiet bell, and a soft clock, original |
| Colouring corner | Colouring corner | A calm pad and a rare bell, original |
| Story | Story shelf, story offer, and story time | A very quiet pad and pluck, original |
| Bedtime | Bedtime listen | The softest pad and a far-off bell, original |

The scores live in `src/music/scores.ts`. The player lives in `src/music/engine.ts`.

## How it is played

- No music files are downloaded. The service worker precaches the app script, and the music is inside that script, so the cache stays small.
- Each loop repeats on its own bar line. The water and the soft noise fade at the seam so the join does not click.
- Changing place crossfades for 1.6 seconds.
- The loudest slider position is still only 14% of full level. While a voice or a story is audible, the music drops to a fifth of that.
- The first tap or key press starts the audio. Nothing plays before that, which is what iOS requires.
- Grown-ups can turn sound and music on or off, and set the music volume, in the journal. Those choices are stored on the device under `spell-garden.audio.v1`, apart from lesson progress.
