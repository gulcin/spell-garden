import tales from './tales.json' with { type: 'json' };

export type Tale = {
  id: string;
  place: string;
  title: string;
  blurb: string;
  pages: string[];
};

export const STORIES: Tale[] = tales;

export function storyById(id: string): Tale | null {
  return STORIES.find((story) => story.id === id) ?? null;
}

export function pageAudio(id: string, page: number): string {
  return `${import.meta.env.BASE_URL}audio/stories/${id}/${page}.mp3`;
}

export function pageCues(id: string, page: number): string {
  return `${import.meta.env.BASE_URL}audio/stories/${id}/${page}.json`;
}

export function pageArt(id: string, page: number): { src: string; srcSet: string } {
  const base = `${import.meta.env.BASE_URL}art/stories/${id}-${page}`;
  return { src: `${base}.webp`, srcSet: `${base}.webp 1x, ${base}@2x.webp 2x` };
}
