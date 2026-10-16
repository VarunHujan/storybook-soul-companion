import { createFileRoute } from "@tanstack/react-router";
import { Journal } from "@/components/Journal";
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Folio — Conversation Journal" },
      {
        name: "description",
        content:
          "A thoughtful AI conversation journal in an interactive 3D book. Write, discover, and revisit your ideas.",
      },
      { property: "og:title", content: "Folio — Conversation Journal" },
      {
        property: "og:description",
        content:
          "Your thoughts, bound together. An interactive book for a quieter kind of AI conversation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Journal,
});
