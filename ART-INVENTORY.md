# Art inventory

Status words: **painted** (watercolor scene or cutout), **clear** (geometry kept readable on purpose), **shared** (reuses a painted piece).

## Screens

| Screen | Status |
| --- | --- |
| Home / garden map | painted map, apprentice, cream place pills |
| Placement and chapter intro | painted place scene, a short line and a creature or prop for each place |
| Watch-first demo | painted place scene, apprentice |
| Play (every activity) | painted place scene, apprentice, cream trays |
| Hint | cream note on the place scene |
| Success | star sparkles and a kind note |
| Walkthrough | place scene behind the steps |
| Reward | apprentice and the creature or gift, sparkles, place scene |
| Gate open (after placement) | cream card, Garden map button |
| Spell beds | greenhouse banner, apprentice |
| About | wizard-tower banner, apprentice |
| Grown-ups gate | potion-cottage banner |
| Grown-ups journal | observatory banner, book on the empty chapter note |
| Resting garden | apprentice and Nim |
| Worked example | painted book beside the example |

Every screen except the home map has a cream **Garden map** pill (painted map thumbnail, top left, large tap target). Tap reads “Garden map” aloud, saves progress quietly, and returns to the map. The browser Back button does the same, and Forward returns to the screen you left.

## Activity types

| Template | Place scene | Pieces | Status |
| --- | --- | --- | --- |
| Ten-frame | Lantern grove | tinted sparks (clear blue, gold, green, cloudy white) | painted |
| Number line | Lily pond | painted pond, lily pads, frog | painted |
| Base-ten | Wizard tower | wooden unit, ten-rod, hundred flat | painted |
| Sharing | Potion cottage | crystal gems, glass jars | painted |
| Array | Greenhouse | crystals | painted |
| Fraction | Potion cottage | pie and potion bar | clear wedges, painted cottage behind |
| Coins | Observatory | numbered spark-coins | painted |
| Clock | Observatory | moon-dial; short thick hour hand, long thin minute hand; opens away from 12 | painted dial |
| Balance | Potion cottage | coins or stones, beam and pans | painted coins, clear beam |
| Measure | Wizard tower | wooden planks, bridge spaces | painted planks |
| Shapes | Crystal cave | named shapes | clear geometry, soft fills |
| Symmetry | Mushroom ring | mirror cells | clear grid |
| Pattern | Lantern grove | painted tiles | painted |
| Sort | Greenhouse | painted tiles and hoops | painted |
| Bar model | Wizard tower | story blocks | painted blocks |
| Graph | Mushroom ring | painted stacks | painted |
| Coordinate | Observatory | starflower on a labelled grid | painted star, clear grid |
| Angle | Observatory | wand with a star tip | clear dial, painted star |
| Chance | Crystal cave | tinted seeds, jar pouch | painted |
| Fallback / worked example | Lantern grove | book and choices | painted book |

## Places

| Place | File | Status |
| --- | --- | --- |
| Lantern grove | `art/places/lantern-grove.webp` | painted |
| Potion cottage | `art/places/potion-cottage.webp` | painted |
| Crystal cave | `art/places/crystal-cave.webp` | painted |
| Observatory | `art/places/observatory.webp` | painted |
| Lily pond | `art/places/lily-pond.webp` | painted (shared with the number-line pond) |
| Greenhouse | `art/places/greenhouse.webp` | painted |
| Wizard tower | `art/places/wizard-tower.webp` | painted |
| Mushroom ring | `art/places/mushroom-ring.webp` | painted |

Place scenes are WebP at 1x and 2x. The service worker does not precache them; they load with the chapter and are cached after that. Cache name: `spell-garden-v11`.

The colouring corner is a painted nook inside the wizard tower (`art/places/colouring-nook.webp`). Its sheets are closed line-art SVGs in `art/colouring/`. Drawings stay in IndexedDB on the iPad.

The crystal shop is a painted cottage on the map. Clover the fox sells robes, hats, extras, and brooms. Solved spells add crystals (three in the crystal cave, one elsewhere). Purchases and what she is wearing live on the same progress save.

## Story time

Each place, the crystal shop, and the colouring corner has a four-page story. Page paintings live in `art/stories/{place}-{page}.webp` (1x 600×800, 2x 1200×1600). The shelf background is `art/bookshelf.webp`. Narration for those stories is `audio/stories/{place}/{page}.mp3` with word cues in the matching JSON. A visit also saves Today's adventure under My adventures, using the same place paintings and the device's en-US voice. The service worker precaches the audio and the 1x page art. The 2x page art is cached after it is shown.

## Rewards and creatures

| Reward | Art | Status |
| --- | --- | --- |
| Nim the moss-moth | fluffy moth, feathery antennae | painted |
| Lantern Glow | lantern | painted |
| Pebble the brook frog | frog | painted |
| Window vine | sprout | painted |
| Teacup the loft owl | owl | painted |
| Bridge Mend | star | painted |
| Moss-bunny | bunny | painted |
| Moon rug | coin | shared |
| Lumen the lantern beetle | beetle with shell, antennae, glowing belly | painted |
| Star kettle | potion | painted |
| Cloud kitten | kitten | painted |
| Kindness banner | book | painted |

## Apprentice, icon, splash

| Piece | Status |
| --- | --- |
| Aida on the home screen, in play, and on rewards | approved apprentice: long straight dark-blond hair, blue eyes, lily on the hat, owl, star wand |
| App icon `icon-192.png` / `icon-512.png` | painted apprentice in the garden |
| iPad splash portrait and landscape | painted apprentice and all eight places, linked as `apple-touch-startup-image` |
| Map mark on the Garden map button | small painted map |

## Empty states and hints

| Moment | Status |
| --- | --- |
| The nest is empty | painted mushroom beside the words |
| No chapters yet | painted book |
| The garden is resting | apprentice and Nim |
| Hints | cream note, read aloud |
| Success sparkles | painted stars |
