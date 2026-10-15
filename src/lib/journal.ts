import type { UIMessage } from "ai";

export const STORAGE_KEY = "folio-conversation-v1";
export type BookTheme = "parchment" | "cyberpunk" | "japanese";
export function messageText(message?: UIMessage) {
  return message?.parts.filter(part => part.type === "text").map(part => part.text).join("\n") ?? "";
}
export function getSpreads(messages: UIMessage[]) {
  const spreads: { question: UIMessage; answer?: UIMessage }[] = [];
  for (const message of messages) {
    if (message.role === "user") spreads.push({ question: message });
    if (message.role === "assistant") {
      const spread = spreads.at(-1);
      if (spread) spread.answer = message;
    }
  }
  return spreads;
}
export function readBook(): UIMessage[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter(m => typeof m.id === "string" && ["user", "assistant"].includes(m.role) && Array.isArray(m.parts)) : [];
  } catch { return []; }
}