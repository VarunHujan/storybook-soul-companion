import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { createResponsesCall } from "./ai/responses.ts";
import { messageText } from "./journal";

function demoAnswer(prompt: string, messages: UIMessage[]) {
  if (/previous|remember|earlier|first question/i.test(prompt))
    return `Looking back through our book, your earlier question was: **${messageText(messages.find((m) => m.role === "user"))}**.\n\nEach entry is a small part of the same conversation. We can keep exploring that thought, or turn to something new.`;
  if (/story|write|creative|poem/i.test(prompt))
    return `### The keeper of small things\n\nEvery morning, Ada collected one thing the world had almost forgotten: a fallen leaf, a sentence overheard, the particular blue of the sky before rain.\n\nShe kept them in a book with no title. Its pages did not make her life extraordinary. They taught her to notice that it already was.\n\n*And on the last page, she left a little room for tomorrow.*`;
  if (/learn|explain|curious|why|how/i.test(prompt))
    return `### A little curiosity goes a long way\n\nThe best way to explore **${prompt.replace(/[?!.]+$/, "")}** is to make the idea smaller and more tangible.\n\n1. **Start with what you know.** Connect the new idea to something familiar.\n2. **Find a concrete example.** An example gives an abstract thought a place to land.\n3. **Ask one more question.** What changes if you look at it from another angle?\n\nUnderstanding isn’t a single moment. It’s a collection of small discoveries.\n\n*This is a demo response; switch off Demo mode for a live answer.*`;
  return `### Make room for the thought\n\n“${prompt}”\n\nSometimes, putting a thought into words is the first step toward seeing it clearly. There’s no need to arrive at a perfect answer right away.\n\n**Begin with one small thing:** what matters most to you about this? Then consider what you can do today, rather than everything you might do someday.\n\nA useful next step is often simple: write down three possibilities, choose the one that feels most meaningful, and give it your undivided attention.\n\n*This is a demo response; switch off Demo mode for a live answer.*`;
}

export async function handleChat(request: Request) {
  if (
    request.headers.get("origin") &&
    request.headers.get("origin") !== new URL(request.url).origin
  )
    return new Response("Not allowed", { status: 403 });
  try {
    const body = (await request.json()) as { messages?: UIMessage[]; mock?: boolean };
    const messages = body.messages;
    if (
      !Array.isArray(messages) ||
      !messages.length ||
      messages.some((m) => !["user", "assistant"].includes(m.role) || !Array.isArray(m.parts))
    )
      return new Response("Invalid conversation", { status: 400 });
    if (body.mock) {
      const text = demoAnswer(messageText(messages.at(-1)), messages);
      const stream = createUIMessageStream({
        originalMessages: messages,
        execute: async ({ writer }) => {
          writer.write({ type: "start" });
          writer.write({ type: "text-start", id: "demo-answer" });
          for (const chunk of text.match(/.{1,14}/gs) ?? []) {
            if (request.signal.aborted) break;
            writer.write({ type: "text-delta", id: "demo-answer", delta: chunk });
            await new Promise((resolve) => setTimeout(resolve, 24));
          }
          writer.write({ type: "text-end", id: "demo-answer" });
          writer.write({ type: "finish" });
        },
        onFinish: () => {
          /* The browser saves completed UI messages. */
        },
      });
      return createUIMessageStreamResponse({ stream });
    }
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey)
      return new Response("Live AI is not configured. Demo mode is still available.", {
        status: 401,
      });
    const modelMessages = await convertToModelMessages(messages);
    const call = createResponsesCall(
      request,
      { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
      modelMessages,
      "You are Folio, a thoughtful companion inside a conversation journal. Be warm, precise and useful. Answer the user's actual question. Use readable markdown, short paragraphs, and a concise answer unless the user asks for depth. Never claim to have performed external actions. All earlier turns are part of the same conversation.",
    );
    return await call.response(messages);
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return new Response(
      error instanceof Error ? error.message : "The answer could not be written. Please try again.",
      { status: 500 },
    );
  }
}
