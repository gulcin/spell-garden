import { adventureDate } from './adventure.ts';
import { storyById, STORIES } from './library.ts';

export type BookPage = {
  id: string;
  text: string;
};

/** One visit, kept in the order she lived it. Newest chapters stay at the end. */
export type VisitChapter = {
  id: string;
  at: number;
  pages: BookPage[];
};

export type PlaceBook = {
  placeId: string;
  chapters: VisitChapter[];
};

export type BookLeaf = {
  key: string;
  kicker: string;
  title: string;
  text: string;
  artId: string;
  artPage: number;
  spoken: boolean;
  audioId?: string;
  audioPage?: number;
};

const MAX_CHAPTERS = 24;
const MAX_PAGES = 40;

const EXTRA_BOOKS = ['witch-house'] as const;

const BOOK_NAMES: Record<string, string> = {
  'witch-house': "Witch's house",
};

export const BOOK_PLACE_IDS: string[] = [...STORIES.map((story) => story.id), ...EXTRA_BOOKS];

export function emptyBooks(): PlaceBook[] {
  return BOOK_PLACE_IDS.map((placeId) => ({ placeId, chapters: [] }));
}

function isPage(value: unknown): value is BookPage {
  if (!value || typeof value !== 'object') return false;
  const page = value as Partial<BookPage>;
  return typeof page.id === 'string' && page.id.length > 0 && typeof page.text === 'string' && page.text.length > 0;
}

function pagesFrom(value: unknown, chapterId: string): BookPage[] {
  if (!Array.isArray(value)) return [];
  const pages: BookPage[] = [];
  value.forEach((item, index) => {
    if (typeof item === 'string' && item.trim()) {
      pages.push({ id: `${chapterId}:${index}`, text: item.trim() });
      return;
    }
    if (isPage(item)) pages.push({ id: item.id, text: item.text.trim() });
  });
  return pages.slice(0, MAX_PAGES);
}

function isChapter(value: unknown): value is VisitChapter {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<VisitChapter>;
  return typeof row.id === 'string' && row.id.length > 0 && typeof row.at === 'number' && Array.isArray(row.pages);
}

export function isPlaceBook(value: unknown): value is PlaceBook {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<PlaceBook>;
  return typeof row.placeId === 'string' && BOOK_PLACE_IDS.includes(row.placeId) && Array.isArray(row.chapters);
}

export function normalizeBooks(value: unknown, adventures: { id: string; placeId: string; at: number; pages: string[] }[]): PlaceBook[] {
  const books = emptyBooks();
  if (Array.isArray(value)) {
    for (const row of value) {
      if (!isPlaceBook(row)) continue;
      const book = books.find((item) => item.placeId === row.placeId);
      if (!book) continue;
      book.chapters = row.chapters.filter(isChapter).slice(-MAX_CHAPTERS).map((chapter) => ({
        id: chapter.id,
        at: chapter.at,
        pages: pagesFrom(chapter.pages, chapter.id),
      })).filter((chapter) => chapter.pages.length > 0);
    }
  }
  for (const book of books) {
    if (book.chapters.length > 0) continue;
    const visits = adventures.filter((item) => item.placeId === book.placeId).slice(0, MAX_CHAPTERS).reverse();
    book.chapters = visits
      .map((visit) => ({
        id: visit.id,
        at: visit.at,
        pages: pagesFrom(visit.pages, visit.id),
      }))
      .filter((chapter) => chapter.pages.length > 0);
  }
  return books;
}

export function bookByPlace(books: PlaceBook[] | null | undefined, placeId: string): PlaceBook {
  return books?.find((book) => book.placeId === placeId) ?? { placeId, chapters: [] };
}

export function bookPageCount(book: PlaceBook | null | undefined): number {
  return book?.chapters.reduce((total, chapter) => total + chapter.pages.length, 0) ?? 0;
}

function withBook(books: PlaceBook[], placeId: string, recipe: (book: PlaceBook) => PlaceBook): PlaceBook[] {
  const base = normalizeBooks(books, []);
  return base.map((book) => (book.placeId === placeId ? recipe(book) : book));
}

/** Adds one page as soon as a puzzle is solved. The same page id is kept once. */
export function appendPuzzlePage(
  books: PlaceBook[],
  input: { placeId: string; chapterId: string; at: number; intro: BookPage; deed: BookPage },
): PlaceBook[] {
  if (!BOOK_PLACE_IDS.includes(input.placeId)) return normalizeBooks(books, []);
  return withBook(books, input.placeId, (book) => {
    const chapters = book.chapters.map((chapter) => ({ ...chapter, pages: [...chapter.pages] }));
    const chapter = chapters.find((item) => item.id === input.chapterId);
    if (!chapter) {
      const pages = [input.intro, input.deed].filter((page, index, all) => all.findIndex((item) => item.id === page.id) === index);
      chapters.push({ id: input.chapterId, at: input.at, pages });
      return { ...book, chapters: chapters.slice(-MAX_CHAPTERS) };
    }
    for (const page of [input.intro, input.deed]) {
      if (chapter.pages.some((item) => item.id === page.id) || chapter.pages.length >= MAX_PAGES) continue;
      chapter.pages.push(page);
    }
    return { ...book, chapters };
  });
}

/** One dated page, such as a piece of furniture she brought home. The same page id is kept once. */
export function appendNote(books: PlaceBook[], input: { placeId: string; at: number; page: BookPage }): PlaceBook[] {
  if (!BOOK_PLACE_IDS.includes(input.placeId) || !input.page.text.trim()) return normalizeBooks(books, []);
  return withBook(books, input.placeId, (book) => {
    if (book.chapters.some((chapter) => chapter.pages.some((page) => page.id === input.page.id))) return book;
    const chapters = [...book.chapters, { id: `note-${input.page.id}`, at: input.at, pages: [input.page] }];
    return { ...book, chapters: chapters.slice(-MAX_CHAPTERS) };
  });
}

export function sealVisit(books: PlaceBook[], input: { placeId: string; chapterId: string; pages: BookPage[] }): PlaceBook[] {
  if (!BOOK_PLACE_IDS.includes(input.placeId)) return normalizeBooks(books, []);
  return withBook(books, input.placeId, (book) => ({
    ...book,
    chapters: book.chapters.map((chapter) => {
      if (chapter.id !== input.chapterId) return chapter;
      const pages = [...chapter.pages];
      for (const page of input.pages) {
        if (!page.text.trim() || pages.some((item) => item.id === page.id) || pages.length >= MAX_PAGES) continue;
        pages.push(page);
      }
      return { ...chapter, pages };
    }),
  }));
}

export function readBook(placeId: string, book: PlaceBook | null | undefined): BookLeaf[] {
  const tale = storyById(placeId);
  const place = tale?.place ?? BOOK_NAMES[placeId] ?? 'This place';
  const home = placeId === 'witch-house';
  const chapters = book?.chapters ?? [];
  if (chapters.length === 0) {
    const leaves: BookLeaf[] = [
      {
        key: `${placeId}-welcome`,
        kicker: place,
        title: 'Your story starts here',
        text: home
          ? "Your story starts here. This book is for the witch's house. When you bring something home, it becomes a new page."
          : `Your story starts here. This book is for the ${place.toLowerCase()}. When you play here, each spell you finish turns into a new page.`,
        artId: placeId,
        artPage: 0,
        spoken: true,
      },
    ];
    tale?.pages.forEach((text, index) => {
      leaves.push({
        key: `${placeId}-tale-${index}`,
        kicker: 'Chapter one',
        title: tale.title,
        text,
        artId: placeId,
        artPage: index,
        spoken: false,
        audioId: placeId,
        audioPage: index,
      });
    });
    return leaves;
  }
  const leaves: BookLeaf[] = [];
  for (const chapter of chapters) {
    const when = adventureDate(chapter.at);
    chapter.pages.forEach((page, index) => {
      leaves.push({
        key: `${chapter.id}-${page.id}`,
        kicker: when,
        title: home ? "Witch's house" : "Today's adventure",
        text: page.text,
        artId: placeId,
        artPage: home ? 0 : index % 4,
        spoken: true,
      });
    });
  }
  return leaves;
}
