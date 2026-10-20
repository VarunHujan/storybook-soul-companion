import type { BookTheme } from "./journal";

export const libraryBooks: { id: string; title: string; subtitle: string; theme: BookTheme; tone: string }[] = [
  { id: "spellbook", title: "The Spellbook", subtitle: "Parchment & possibility", theme: "parchment", tone: "forest" },
  { id: "wandering", title: "A Wandering Mind", subtitle: "Thoughts without borders", theme: "parchment", tone: "wine" },
  { id: "notebook", title: "The Quiet Notebook", subtitle: "Less noise. More clarity.", theme: "japanese", tone: "sage" },
  { id: "future", title: "Letters to Tomorrow", subtitle: "A future worth imagining", theme: "cyberpunk", tone: "teal" },
  { id: "wonder", title: "Small Wonders", subtitle: "The extraordinary everyday", theme: "parchment", tone: "ochre" },
  { id: "moon", title: "After Midnight", subtitle: "Room for a little mystery", theme: "cyberpunk", tone: "blue" },
  { id: "garden", title: "The Inner Garden", subtitle: "Space to grow", theme: "japanese", tone: "sage" },
  { id: "stories", title: "Unwritten Stories", subtitle: "Begin anywhere", theme: "parchment", tone: "wine" },
  { id: "possibility", title: "On Possibility", subtitle: "Follow your curiosity", theme: "cyberpunk", tone: "teal" },
  { id: "stillness", title: "A Book of Stillness", subtitle: "A moment to yourself", theme: "japanese", tone: "forest" },
  { id: "gold", title: "The Golden Hour", subtitle: "A different perspective", theme: "parchment", tone: "ochre" },
  { id: "beyond", title: "Beyond the Familiar", subtitle: "Something new awaits", theme: "cyberpunk", tone: "blue" },
];

export function selectLibraryBook(id: string) {
  const book = libraryBooks.find((item) => item.id === id);
  if (!book) return undefined;
  return { book, page: 0, mobilePage: "question" as const, theme: book.theme };
}