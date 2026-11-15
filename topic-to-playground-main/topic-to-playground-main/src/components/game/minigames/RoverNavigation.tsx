import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Gem, Home, Mountain, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seededRandom, type MiniGameProps } from "./types";

const COLS = 8;
const ROWS = 6;
const START = 40;
const BATTERY = 22;
const steps = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

function makeTerrain(seed: number) {
  const random = seededRandom(seed);
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => i).filter((i) => i !== START);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [cells[i], cells[j]] = [cells[j]!, cells[i]!];
  }
  const rocks = new Set<number>();
  function connected() {
    const visited = new Set([START]);
    const queue = [START];
    for (let i = 0; i < queue.length; i++) {
      const cell = queue[i]!;
      for (const [dx, dy] of steps) {
        const x = (cell % COLS) + dx;
        const y = Math.floor(cell / COLS) + dy;
        const next = y * COLS + x;
        if (x < 0 || x >= COLS || y < 0 || y >= ROWS || rocks.has(next) || visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }
    return visited.size === COLS * ROWS - rocks.size;
  }
  for (const cell of cells) {
    if (rocks.size === 9) break;
    rocks.add(cell);
    if (!connected()) rocks.delete(cell);
  }
  const open = cells.filter((cell) => !rocks.has(cell));
  return { rocks, samples: new Set(open.slice(0, 3)), pits: new Set(open.slice(3, 5)) };
}

interface DriveState {
  position: number;
  battery: number;
  collected: number[];
  result: number | null;
  towed: boolean;
  bumped: number;
}

export function RoverNavigation({ seed, onDone }: MiniGameProps) {
  const terrain = useMemo(() => makeTerrain(seed), [seed]);
  const area = useRef<HTMLDivElement>(null);
  const sent = useRef(false);
  const [drive, setDrive] = useState<DriveState>({ position: START, battery: BATTERY, collected: [], result: null, towed: false, bumped: 0 });
  const [bump, setBump] = useState(false);

  useEffect(() => {
    area.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!drive.bumped) return;
    setBump(true);
    const timer = window.setTimeout(() => setBump(false), 400);
    return () => window.clearTimeout(timer);
  }, [drive.bumped]);

  function move(dx: number, dy: number) {
    setDrive((old) => {
      if (old.result !== null) return old;
      const x = (old.position % COLS) + dx;
      const y = Math.floor(old.position / COLS) + dy;
      const next = y * COLS + x;
      if (x < 0 || x >= COLS || y < 0 || y >= ROWS || terrain.rocks.has(next)) return { ...old, bumped: old.bumped + 1 };
      const collected = terrain.samples.has(next) && !old.collected.includes(next) ? [...old.collected, next] : old.collected;
      const battery = Math.max(0, old.battery - (terrain.pits.has(next) ? 2 : 1));
      const home = next === START;
      const done = battery === 0 || (home && collected.length === 3);
      const towed = battery === 0 && !home;
      return { ...old, position: next, battery, collected, towed, result: done ? (collected.length / 3) * (towed ? 0.5 : 1) : null };
    });
  }

  const controls = [
    { Icon: ArrowUp, label: "Drive up", dx: 0, dy: -1, place: "col-start-2 row-start-1" },
    { Icon: ArrowLeft, label: "Drive left", dx: -1, dy: 0, place: "col-start-1 row-start-2" },
    { Icon: ArrowDown, label: "Drive down", dx: 0, dy: 1, place: "col-start-2 row-start-2" },
    { Icon: ArrowRight, label: "Drive right", dx: 1, dy: 0, place: "col-start-3 row-start-2" },
  ];

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3 text-foreground" data-minigame="rover">
      <p id="rover-help" className="text-sm text-muted-foreground">
        Drive around the boulders, pick up 3 rock samples and come home. Use the arrow keys, WASD or the buttons. Soft sand pits use 2 battery.
      </p>
      <div className="flex justify-between font-display">
        <span>Samples {drive.collected.length}/3</span>
        <span>
          Battery {drive.battery}/{BATTERY}
        </span>
      </div>
      <div role="progressbar" aria-label="Rover battery" aria-valuenow={drive.battery} aria-valuemin={0} aria-valuemax={BATTERY} className="h-4 overflow-hidden rounded-full border-2 border-rim bg-track">
        <div className="h-full bg-power transition-[width]" style={{ width: `${(drive.battery / BATTERY) * 100}%` }} />
      </div>
      <div
        ref={area}
        tabIndex={0}
        role="group"
        aria-label="Rover driving area"
        aria-describedby="rover-help"
        className={cn("rounded-2xl border-4 border-rim bg-panel p-2 outline-offset-4 focus-visible:outline-2 focus-visible:outline-highlight", bump && "rover-bump")}
        onKeyDown={(event) => {
          const direction = ({ arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] } as Record<string, [number, number]>)[event.key.toLowerCase()];
          if (!direction) return;
          event.preventDefault();
          move(direction[0], direction[1]);
        }}
      >
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: COLS * ROWS }, (_, cell) => {
            const sample = terrain.samples.has(cell);
            const collected = drive.collected.includes(cell);
            const rock = terrain.rocks.has(cell);
            const pit = terrain.pits.has(cell);
            const here = drive.position === cell;
            const label = cell === START ? "Home base" : rock ? "Boulder" : sample ? (collected ? "Collected sample" : "Rock sample") : pit ? "Sand pit: costs 2 battery" : "Open ground";
            return (
              <div
                key={cell}
                role="img"
                aria-label={`Row ${Math.floor(cell / COLS) + 1}, column ${(cell % COLS) + 1}: ${label}${here ? ", rover is here" : ""}`}
                className={cn("flex aspect-square items-center justify-center rounded-lg border border-rim bg-dose/30", rock && "bg-track", pit && "border-2 border-dashed border-dose", collected && "bg-good/20", here && "ring-2 ring-highlight")}
              >
                {here ? (
                  <Truck className="size-6 rounded-md bg-paper p-0.5 text-primary" aria-hidden />
                ) : cell === START ? (
                  <Home className="size-5 text-highlight" aria-hidden />
                ) : rock ? (
                  <Mountain className="size-5 text-muted-foreground" aria-hidden />
                ) : sample ? (
                  <Gem className={cn("size-5", collected ? "text-good" : "text-research")} aria-hidden />
                ) : pit ? (
                  <span className="font-display text-sm text-foreground">−2</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <p className="min-h-5 text-sm" role="status">
        {bump ? "Bump! A boulder is in the way. Try another direction." : `Rover: row ${Math.floor(drive.position / COLS) + 1}, column ${(drive.position % COLS) + 1}.`}
      </p>
      {drive.result === null ? (
        <>
          <div className="mx-auto grid w-44 grid-cols-3 gap-2">
            {controls.map(({ Icon, label, dx, dy, place }) => (
              <Button key={label} variant="panel" aria-label={label} className={cn("h-12 min-w-11 p-0 [&_svg]:size-6", place)} onClick={() => move(dx, dy)}>
                <Icon aria-hidden="true" />
              </Button>
            ))}
          </div>
          <Button variant="sunny" className="min-h-11" onClick={() => setDrive((old) => (old.result !== null ? old : { ...old, position: START, result: old.collected.length / 3 }))}>
            Drive home now
          </Button>
        </>
      ) : (
        <div role="status" className="space-y-3">
          <p className="font-display">
            {drive.towed ? "Battery empty! The crew towed you home." : "Welcome home, explorer!"} {drive.collected.length}/3 samples. Score: {Math.round(drive.result * 100)}%
          </p>
          <Button
            variant="mission"
            size="xl"
            onClick={() => {
              if (sent.current || drive.result === null) return;
              sent.current = true;
              onDone(drive.result);
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
