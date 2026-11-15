import { useEffect, useMemo, useRef, useState } from "react";
import { Droplet, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seededRandom, type MiniGameProps } from "./types";

const PLANTS = [
  { name: "Lettuce", need: 3 },
  { name: "Tomato", need: 4 },
  { name: "Potato", need: 2 },
  { name: "Wheat", need: 3 },
  { name: "Radish", need: 2 },
  { name: "Beans", need: 4 },
];

function choosePlants(seed: number) {
  const random = seededRandom(seed);
  const plants = [...PLANTS];
  for (let i = plants.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [plants[i], plants[j]] = [plants[j]!, plants[i]!];
  }
  return plants.slice(0, 3);
}

export function GreenhouseManager({ seed, onDone }: MiniGameProps) {
  const plants = useMemo(() => choosePlants(seed), [seed]);
  const budget = plants.reduce((sum, plant) => sum + plant.need, 1);
  const [given, setGiven] = useState([0, 0, 0]);
  const [phase, setPhase] = useState<"watering" | "growing" | "done">("watering");
  const sent = useRef(false);
  const remaining = budget - given.reduce((sum, drops) => sum + drops, 0);

  useEffect(() => {
    if (phase !== "growing") return;
    const timer = window.setTimeout(() => setPhase("done"), 1500);
    return () => window.clearTimeout(timer);
  }, [phase]);

  function change(index: number, delta: number) {
    if (phase !== "watering") return;
    setGiven((old) => {
      const next = (old[index] ?? 0) + delta;
      const available = budget - old.reduce((sum, drops) => sum + drops, 0);
      if (next < 0 || next > 6 || (delta > 0 && available <= 0)) return old;
      return old.map((drops, i) => (i === index ? next : drops));
    });
  }

  const score = Math.round((plants.reduce((sum, plant, i) => sum + Math.max(0, 1 - Math.abs((given[i] ?? 0) - plant.need) / plant.need), 0) / plants.length) * 100) / 100;

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-4 text-foreground" data-minigame="greenhouse">
      <p className="text-sm text-muted-foreground">Share the water. Read each plant's thirst hint, then press Grow!</p>
      <div className="rounded-2xl border-2 border-rim bg-panel p-3">
        <p className="font-display" aria-live="polite">
          Water left: {remaining}/{budget} drops
        </p>
        <div className="mt-2 flex flex-wrap gap-1" aria-hidden="true">
          {Array.from({ length: budget }, (_, i) => (
            <Droplet key={i} className={cn("size-5 text-water", i < remaining ? "fill-water" : "fill-none opacity-40")} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {plants.map((plant, i) => {
          const amount = given[i] ?? 0;
          const status = amount === plant.need ? "Just right!" : amount < plant.need ? "Too thirsty." : "Soggy roots.";
          return (
            <section key={plant.name} aria-label={`${plant.name} plant bed`} className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border-2 border-rim bg-paper p-2 text-center text-paper-foreground">
              <h3 className="font-display text-base">{plant.name}</h3>
              <div className="flex h-24 w-full items-end justify-center overflow-hidden rounded-xl border-b-4 border-dose bg-good/10 pb-2">
                <div className="relative origin-bottom text-good motion-safe:transition-transform motion-safe:duration-[1500ms]" style={{ transform: `scale(${phase === "watering" ? 0.65 : 1.15})` }} aria-hidden="true">
                  <Sprout className="size-14" strokeWidth={3} />
                  <Leaf className="absolute -right-1 top-2 size-5 fill-good/30" />
                </div>
              </div>
              <p className="min-h-10 text-xs">{phase === "done" ? `${status} Needs ${plant.need} drops.` : plant.need === 2 ? "needs a little" : plant.need === 3 ? "needs some" : "needs a lot"}</p>
              <p className="font-display" aria-live="polite">
                {amount} {amount === 1 ? "drop" : "drops"}
              </p>
              <div className="flex w-full flex-wrap justify-center gap-1">
                <Button variant="panel" className="h-11 w-11 min-w-11 p-0 text-xl" disabled={phase !== "watering" || amount === 0} aria-label={`Give ${plant.name} one less drop`} onClick={() => change(i, -1)}>
                  −
                </Button>
                <Button variant="panel" className="h-11 w-11 min-w-11 p-0 text-xl" disabled={phase !== "watering" || amount >= 6 || remaining === 0} aria-label={`Give ${plant.name} one more drop`} onClick={() => change(i, 1)}>
                  +
                </Button>
              </div>
            </section>
          );
        })}
      </div>
      {phase === "watering" ? (
        <Button variant="sunny" size="xl" onClick={() => setPhase("growing")}>
          Grow!
        </Button>
      ) : phase === "growing" ? (
        <p className="font-display" role="status">
          Roots drinking… leaves growing!
        </p>
      ) : (
        <div className="space-y-3" role="status">
          <p className="font-display">Harvest score: {Math.round(score * 100)}%. Thanks for tending the Mars garden!</p>
          <Button
            variant="mission"
            size="xl"
            onClick={() => {
              if (sent.current) return;
              sent.current = true;
              onDone(score);
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
