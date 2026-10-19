# Changelog

All notable changes to Spell Garden are written here, in plain language.

Add an entry for every change before it ships. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.2] - 2026-10-19

Spell Garden opens again on an iPhone that got stuck after an update.

### Fixed

- The home screen app was keeping an old copy of the page. After an update that copy asked for a script that was gone, and the iPhone stayed blank.
- Opening the garden now asks the network for the page first. A saved copy is only used when the phone is offline.
- If a new spell cannot load, the app reloads once. If it is still stuck, Start again clears the saved pages and keeps her garden.

### For Aida

- If the garden will not open, tap Start again. Your flowers and crystals stay.

## [1.3.1] - 2026-10-19

The mirror shows one shelf at a time, and the block spell only names the blocks in the tray.

### Fixed

- Robes, hats, extras, brooms, and friends each have a shelf, so every piece fits on an iPad and an iPhone without scrolling.
- Every wardrobe tile shows its name and Put it on or Take it off inside the tile.
- “Build the number” names a flat, a rod, or a cube only when that block is in the tray.

### For Aida

- The mirror has shelves. Tap a shelf, then put a piece on or take it off.
- The block spell talks about the blocks you can see.

## [1.3.0] - 2026-10-19

The app on the home screen brings in a new spell by itself.

### Added

- Spell Garden looks for a new version when it opens, when Aida comes back to it, and every half hour.
- A painted note says “A new spell is ready!” The Update button is a large tap. If she is in the middle of something, the note waits until she is on the garden map. If she leaves it, the next opening brings the new spell in.
- Progress, notes, and colouring stay in the same places across updates.

### For Aida

- A golden button says a new spell is ready. You can tap Update.

## [1.2.0] - 2026-10-19

Grown-ups can read what changed, and Aida hears about it in her own words.

### Added

- The grown-ups’ area shows Version x.y.z (sha), and What’s new opens these notes.
- After an update, a “New in the garden!” note appears for Aida. She can close it. A first visit stays quiet.

### For Aida

- A little note says what is new, and you can close it.

## [1.1.4] - 2026-10-19

Every spell fits the visible screen, including base-ten on an iPad with the browser bar showing.

### Fixed

- Activities stay inside the visible screen on iPad landscape, iPad portrait, and iPhone. The page does not scroll to reach the pieces.
- The base-ten tray sits beside the mat in landscape, and the flats, rods, and cubes stay big enough to drag.
- A hint or a miss floats as a note and no longer covers the mat or pushes it off the screen.
- The prompt wraps smaller when the screen is short.

### For Aida

- Every spell fits on the screen. The number blocks sit beside the mat.

## [1.1.3] - 2026-10-18

Outfits are painted on Aida, and Tell us keeps a note from an iPad tap.

### Fixed

- Each robe is the whole apprentice in that cloth, and each hat is painted with her, so the purple robe and hat never show through a paper cutout.
- Brooms and little extras sit on her as their own pieces, after the outfit.
- Put it on and Take it off toggle in the shop and at the mirror, and the piece she is wearing is marked.
- Tell us opens from a tap, the choices tap, the note stays on the iPad even if storage is full, it shows in the grown-ups’ list, and Send to Mum opens the letter.

### For Aida

- Your dresses and hats are painted on you. Tell us keeps what you write.

## [1.1.2] - 2026-10-18

The shapes list is Aida's, and every spell on it can be played.

### Fixed

- Tapping anywhere on a spell card starts the activity, on iPhone and iPad.
- Spell beds open at grade 3. Age labels and Locked rows stay off her list. The “Your child is…” note lives in the grown-ups’ journal.
- The list sits below the Garden map pill, including on a narrow phone.

### For Aida

- Tap a spell on the list and it opens.

## [1.1.1] - 2026-10-18

Every spell can be missed, hinted, skipped, and then cast correctly, including with a finger on the iPad.

### Fixed

- A wrong cast fizzles softly. Hint and Skip stay available, and Skip returns to the spell beds.
- Prompts say “1 moth” and “1 rod”. Like terms are pink sparks she can count.
- Dragging a piece or a clock hand follows a touch, the way a finger does on the iPad.

### For Aida

- A miss fizzles softly. You can drag pieces with your finger.

## [1.1.0] - 2026-10-18

Outfits, notes, puzzles, and the spell beds fit the way Aida uses them, and a new copy can arrive without leaving the garden map.

### Fixed

- Robes are painted as the whole apprentice. The old purple robe no longer shows through a flat overlay.
- Tell us keeps a note even when the post box is not set up, shows a confirmation, and offers Send to Mum.
- Activities, including Build 35, fit on one screen on iPad portrait, iPad landscape, and iPhone.
- Spell beds are tappable, with no age labels, no locks, and no rows hidden under the corner pill.
- Type stays a readable size. iOS no longer inflates it.

### Added

- A version, a changelog, and version.json.
- An update note that waits until she is on the garden map, and Check for updates for grown-ups.
- The app version on every bug report.

### For Aida

- Robes look like real cloth, and the spells fit on one screen.

## [1.0.0] - 2026-10-18

The garden as Aida first played it: painted places, a way home, a shop, and a note for Mum.

### Added

- The places, the apprentice, and the little creatures are painted.
- A home pill on every screen leads back to the garden map.
- Colours and the clock are easy to read at a glance.
- The crystal shop is open, so she can dress her witch.
- Every place on the map opens.
- Tell us keeps a note for Mum.
- Pieces drop where she lets go of them.
- When a feedback address is set, notes go to the garden post box, and they wait if the iPad is offline.

### For Aida

- The garden is painted, the shop is open, and you can tell us what you think.

[1.3.2]: https://github.com/gulcin/spell-garden/releases/tag/v1.3.2
[1.3.1]: https://github.com/gulcin/spell-garden/releases/tag/v1.3.1
[1.3.0]: https://github.com/gulcin/spell-garden/releases/tag/v1.3.0
[1.2.0]: https://github.com/gulcin/spell-garden/releases/tag/v1.2.0
[1.1.4]: https://github.com/gulcin/spell-garden/releases/tag/v1.1.4
[1.1.3]: https://github.com/gulcin/spell-garden/releases/tag/v1.1.3
[1.1.2]: https://github.com/gulcin/spell-garden/releases/tag/v1.1.2
[1.1.1]: https://github.com/gulcin/spell-garden/releases/tag/v1.1.1
[1.1.0]: https://github.com/gulcin/spell-garden/releases/tag/v1.1.0
[1.0.0]: https://github.com/gulcin/spell-garden/releases/tag/v1.0.0
