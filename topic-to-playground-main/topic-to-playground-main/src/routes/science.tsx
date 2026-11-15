import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ARCHIVED_FLARES, FACTS } from "@/game/data";
import { DOSE_LIMIT, EVA_DOSE, FLARE_BASE_DOSE, SHELTER_FACTOR, SHIELD_WEAR, SURFACE_DOSE_PER_SOL } from "@/game/sim";

export const Route = createFileRoute("/science")({
  head: () => ({
    meta: [
      { title: "The Science Behind Outpost Mars | NASA Data Sources" },
      { name: "description", content: "Which NASA datasets and mission results Outpost Mars uses, and where the game simplifies real science." },
      { property: "og:title", content: "The Science Behind Outpost Mars" },
      { property: "og:description", content: "Real NASA DONKI flares, Curiosity radiation readings, MOXIE oxygen and more, explained for players, parents and teachers." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Science,
});

const SOURCES = [
  { name: "NASA DONKI (Space Weather Database)", use: "Every solar flare in the game is a real flare. The game first asks DONKI's live feed for flares from the last 30 days; if it can't connect, it uses the archived real flares listed below and labels them ARCHIVED.", url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/" },
  { name: "Curiosity Radiation Assessment Detector (RAD)", use: `Daily background radiation of ${SURFACE_DOSE_PER_SOL} mSv per sol on the Mars surface (Hassler et al., Science 2014). The May 2024 solar storm reading is used in the X-flare alert.`, url: "https://science.nasa.gov/mission/msl-curiosity/" },
  { name: "NASA Open Science Data Repository (OSDR)", use: "Background on how radiation and spaceflight affect living things, which is why shielding and dose matter in the game.", url: "https://osdr.nasa.gov/" },
  { name: "Perseverance MOXIE", use: "The oxygen maker you can build is based on MOXIE, which made 122 g of oxygen from Mars air.", url: "https://science.nasa.gov/mission/mars-2020-perseverance/" },
  { name: "ISS Environmental Control and Life Support System", use: "Water recycling: the Space Station recovers 98% of its water.", url: "https://www.nasa.gov/" },
  { name: "Veggie, InSight, Opportunity, Phoenix", use: "Space-grown lettuce, 1,319 marsquakes, the 2018 global dust storm and buried Mars ice inspire the greenhouse, quake, dust storm and ice-digging cards.", url: "https://science.nasa.gov/mars/" },
];

const SIMPLIFIED = [
  "Resources are shown as 0–100% so they're easy to compare. Real habitats track kilograms of oxygen, liters of water and kilowatt-hours.",
  `Flare doses are game estimates: an X flare gives up to ${FLARE_BASE_DOSE.X} mSv, M ${FLARE_BASE_DOSE.M} and C ${FLARE_BASE_DOSE.C}. Shelter cuts that to ${SHELTER_FACTOR * 100}%. Mars's thin air means real surface flare doses are often smaller than in deep space.`,
  `Each spacewalk or rover trip adds ${EVA_DOSE} mSv in the game. The ${DOSE_LIMIT} mSv mission limit is a game rule; NASA's real career limit is 600 mSv.`,
  `Shielding wears down by ${SHIELD_WEAR}% every sol in the game, standing in for blowing dust and big day–night temperature swings. The real wear rate of soil shielding on Mars is not known yet.`,
  "The Earth–Mars message delay shown in the game is calculated from today's date using simple circular orbits, so it can be off by a couple of minutes.",
  "Dust storms, marsquakes, leaks and harvests happen at random so each mission is different. Their timing is invented, but each one is based on something that really happens.",
];

function Science() {
  return (
    <div className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Button variant="panel" size="lg" asChild>
          <Link to="/">
            <ArrowLeft /> Back to the mission
          </Link>
        </Button>
        <h1 className="mt-6 font-display text-4xl font-bold sm:text-5xl">The science behind Outpost Mars</h1>
        <p className="mt-3 max-w-2xl text-lg leading-snug text-muted-foreground">
          Outpost Mars teaches one big idea: on another planet, no choice is free. Here is the real NASA data the game is built on, and where we simplified things.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="panel block p-4 transition-transform hover:-translate-y-0.5">
              <h2 className="font-display text-lg font-semibold">{s.name}</h2>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">{s.use}</p>
            </a>
          ))}
        </section>

        <section className="panel mt-8 p-5">
          <h2 className="font-display text-2xl font-bold">Archived real flares</h2>
          <p className="mt-1 text-sm text-muted-foreground">Used when NASA's live feed can't be reached. Flare class letters: C, M, X, each 10× stronger than the one before.</p>
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {ARCHIVED_FLARES.map((f) => (
              <li key={f.date + f.classType} className="rounded-xl bg-secondary p-3">
                <span className="font-display font-bold">{f.classType}</span> · {f.date}
                <div className="text-xs text-muted-foreground">{f.note}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel mt-8 p-5">
          <h2 className="font-display text-2xl font-bold">Facts you'll meet in the game</h2>
          <ul className="mt-3 space-y-2 text-sm leading-snug">
            {Object.values(FACTS).map((f) => (
              <li key={f.text}>
                {f.text} <span className="text-muted-foreground">({f.source})</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel mt-8 p-5">
          <h2 className="font-display text-2xl font-bold">Where the game simplifies</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-snug">
            {SIMPLIFIED.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
