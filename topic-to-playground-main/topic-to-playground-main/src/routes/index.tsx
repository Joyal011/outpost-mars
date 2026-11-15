import { createFileRoute } from "@tanstack/react-router";
import { Game } from "@/components/game/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Outpost Mars: Run a Mars Base for 30 Sols" },
      { name: "description", content: "A free browser game for kids 7–12: balance oxygen, power, water, food and radiation shielding on a Mars outpost using real NASA science." },
      { property: "og:title", content: "Outpost Mars: Run a Mars Base for 30 Sols" },
      { property: "og:description", content: "Every choice has a trade-off. Keep your crew alive through real solar flares and dust storms." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
