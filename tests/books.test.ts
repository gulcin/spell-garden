import { describe, expect, it } from 'vitest';
import { buildAdventure } from '../src/stories/adventure.ts';
import { appendNote, appendPuzzlePage, bookPageCount, emptyBooks, normalizeBooks, readBook, sealVisit } from '../src/stories/books.ts';
import { freshProgress, type Progress } from '../src/progress/types.ts';
import { withWardrobe } from '../src/progress/storage.ts';
import { STORIES } from '../src/stories/library.ts';

describe('place books', () => {
  it('keeps a book for every place, with the authored story as chapter one until she plays', () => {
    const books = emptyBooks();
    expect(books.map((book) => book.placeId)).toEqual([...STORIES.map((story) => story.id), 'witch-house']);
    const leaves = readBook('crystal-cave', books[2]);
    expect(leaves[0]?.title).toBe('Your story starts here');
    expect(leaves[0]?.text.startsWith('Your story starts here')).toBe(true);
    expect(leaves[0]?.spoken).toBe(true);
    expect(leaves[1]?.kicker).toBe('Chapter one');
    expect(leaves[1]?.spoken).toBe(false);
    expect(leaves[1]?.audioId).toBe('crystal-cave');
    expect(leaves.filter((leaf) => leaf.kicker === 'Chapter one')).toHaveLength(STORIES[2]!.pages.length);
  });

  it('adds a page as each puzzle is solved, and keeps the newest visit last', () => {
    let books = emptyBooks();
    books = appendPuzzlePage(books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-a',
      at: Date.UTC(2026, 9, 17),
      intro: { id: 'visit-a:intro', text: 'Today you visited the lantern grove.' },
      deed: { id: 'visit-a:1', text: 'You lit 7 lanterns.' },
    });
    books = appendPuzzlePage(books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-a',
      at: Date.UTC(2026, 9, 17),
      intro: { id: 'visit-a:intro', text: 'Today you visited the lantern grove.' },
      deed: { id: 'visit-a:1', text: 'You lit 7 lanterns.' },
    });
    books = appendPuzzlePage(books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-a',
      at: Date.UTC(2026, 9, 17),
      intro: { id: 'visit-a:intro', text: 'Today you visited the lantern grove.' },
      deed: { id: 'visit-a:2', text: 'You shared 12 crystals between 3 jars.' },
    });
    books = sealVisit(books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-a',
      pages: [{ id: 'visit-a:close:0', text: 'You earned 4 crystals in the lantern grove. They settled in your pocket.' }],
    });
    books = appendPuzzlePage(books, {
      placeId: 'lantern-grove',
      chapterId: 'visit-b',
      at: Date.UTC(2026, 9, 18),
      intro: { id: 'visit-b:intro', text: 'Today you visited the lantern grove again.' },
      deed: { id: 'visit-b:1', text: 'You lit 5 lanterns.' },
    });
    const grove = books.find((book) => book.placeId === 'lantern-grove');
    expect(grove?.chapters.map((chapter) => chapter.id)).toEqual(['visit-a', 'visit-b']);
    expect(bookPageCount(grove)).toBe(6);
    const leaves = readBook('lantern-grove', grove);
    expect(leaves.some((leaf) => leaf.title === 'Your story starts here')).toBe(false);
    expect(leaves.map((leaf) => leaf.kicker)).toEqual([
      '17 October 2026',
      '17 October 2026',
      '17 October 2026',
      '17 October 2026',
      '18 October 2026',
      '18 October 2026',
    ]);
    expect(leaves.at(-1)?.text).toBe('You lit 5 lanterns.');
    expect(leaves.every((leaf) => leaf.spoken)).toBe(true);
  });

  it('fills an older save with ten books and folds saved adventures in, newest last', () => {
    const saved = freshProgress('Aida');
    const older = buildAdventure({
      name: 'Aida',
      placeId: 'lantern-grove',
      deeds: ['You lit 7 lanterns.'],
      crystals: 1,
      wardrobe: saved.wardrobe,
      at: Date.UTC(2026, 9, 1),
    });
    const newer = buildAdventure({
      name: 'Aida',
      placeId: 'lantern-grove',
      deeds: ['You lit 5 lanterns.'],
      crystals: 2,
      wardrobe: saved.wardrobe,
      at: Date.UTC(2026, 9, 18),
    });
    const raw = { ...saved, adventures: [newer, older], books: [{ placeId: 'nope' }] } as Progress;
    const loaded = withWardrobe(raw);
    expect(loaded.books).toHaveLength(11);
    const grove = loaded.books.find((book) => book.placeId === 'lantern-grove');
    expect(grove?.chapters.map((chapter) => chapter.at)).toEqual([older.at, newer.at]);
    expect(readBook('lantern-grove', grove).at(-1)?.kicker).toBe('18 October 2026');
    expect(loaded.books.find((book) => book.placeId === 'crystal-shop')?.chapters).toEqual([]);
    expect(loaded.books.find((book) => book.placeId === 'witch-house')?.chapters).toEqual([]);
  });

  it('gives the witch house a welcome page, then a dated page for new furniture', () => {
    const welcome = readBook('witch-house', emptyBooks().find((book) => book.placeId === 'witch-house'));
    expect(welcome).toHaveLength(1);
    expect(welcome[0]?.text).toContain("witch's house");
    expect(welcome[0]?.spoken).toBe(true);
    const books = appendNote(emptyBooks(), {
      placeId: 'witch-house',
      at: Date.UTC(2026, 9, 18),
      page: { id: 'buy-rose-armchair', text: "You brought home the rose armchair for the witch's house." },
    });
    const again = appendNote(books, {
      placeId: 'witch-house',
      at: Date.UTC(2026, 9, 18),
      page: { id: 'buy-rose-armchair', text: "You brought home the rose armchair for the witch's house." },
    });
    const leaves = readBook('witch-house', again.find((book) => book.placeId === 'witch-house'));
    expect(leaves).toHaveLength(1);
    expect(leaves[0]?.kicker).toBe('18 October 2026');
    expect(leaves[0]?.text).toContain('rose armchair');
    expect(leaves[0]?.artPage).toBe(0);
  });
});
