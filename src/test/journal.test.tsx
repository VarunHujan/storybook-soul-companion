import { describe, expect, it } from "vitest";
import { getSpreads, readBook, STORAGE_KEY } from "@/lib/journal";
import type { UIMessage } from "ai";
import { libraryBooks, selectLibraryBook } from "@/lib/library";

const messages: UIMessage[] = [
  { id: "q1", role: "user", parts: [{ type: "text", text: "First question" }] },
  { id: "a1", role: "assistant", parts: [{ type: "text", text: "First answer" }] },
  { id: "q2", role: "user", parts: [{ type: "text", text: "Second question" }] },
  { id: "a2", role: "assistant", parts: [{ type: "text", text: "Second answer" }] },
];
describe("Single browser-saved conversation book", () => {
  it("opens every selected library book on page one with its cover theme", () => {
    for (const book of libraryBooks) {
      expect(selectLibraryBook(book.id)).toEqual({ book, page: 0, mobilePage: "question", theme: book.theme });
    }
    expect(selectLibraryBook("missing")).toBeUndefined();
  });
  it("restores all entries as one conversation from this browser", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    expect(readBook()).toEqual(messages);
    localStorage.removeItem(STORAGE_KEY);
    expect(readBook()).toEqual([]);
  });
  it("keeps each question on the spread with its corresponding answer", () => {
    expect(getSpreads(messages).map((s) => [s.question.id, s.answer?.id])).toEqual([
      ["q1", "a1"],
      ["q2", "a2"],
    ]);
  });
});
