import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { seededRandom, type MiniGameProps } from "./types";

const bits = [1, 2, 4, 8];
const directions = [
  [-1, 0],
  [0, 1],
  [1, 0],
  [0, -1],
] as const;

function rotate(mask: number, turns: number) {
  for (let n = 0; n < turns % 4; n++) mask = ((mask << 1) & 15) | (mask >>> 3);
  return mask;
}

function createPuzzle(seed: number) {
  const random = seededRandom(seed);
  const source = Math.floor(random() * 5) * 5;
  const target = Math.floor(random() * 5) * 5 + 4;
  const path = [source];
  const visited = new Set(path);

  function carve(cell: number): boolean {
    if (cell === target) return path.length >= 8;
    const choices = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [choices[i], choices[j]] = [choices[j]!, choices[i]!];
    }
    for (const d of choices) {
      const [dr, dc] = directions[d]!;
      const r = Math.floor(cell / 5) + dr;
      const c = (cell % 5) + dc;
      const next = r * 5 + c;
      if (r < 0 || r > 4 || c < 0 || c > 4 || visited.has(next)) continue;
      visited.add(next);
      path.push(next);
      if (carve(next)) return true;
      path.pop();
      visited.delete(next);
    }
    return false;
  }
  carve(source);

  const needed = new Map<number, number>();
  path.forEach((cell, i) => {
    let mask = 0;
    for (const neighbor of [path[i - 1], path[i + 1]]) {
      if (neighbor === undefined) continue;
      const delta = neighbor - cell;
      mask |= delta === -5 ? 1 : delta === 1 ? 2 : delta === 5 ? 4 : 8;
    }
    if (i === 0) mask |= 8;
    if (i === path.length - 1) mask |= 2;
    needed.set(cell, mask);
  });

  const shapes = [5, 3, 7];
  const tiles = Array.from({ length: 25 }, (_, i) => {
    const base = needed.get(i) ?? shapes[Math.floor(random() * 3)]!;
    let turns = Math.floor(random() * 4);
    if (path.slice(0, 6).includes(i) && rotate(base, turns) === base) turns = 1;
    return { base, turns };
  });

  const remaining = (cell: number, turns: number) => {
    const tile = tiles[cell]!;
    for (let n = 0; n < 4; n++) if (rotate(tile.base, turns + n) === needed.get(cell)) return n;
    return 0;
  };
  const par = path.reduce((sum, cell) => sum + remaining(cell, tiles[cell]!.turns), 0);
  return { source, target, path, needed, tiles, par };
}

export function PipeRepair({ seed, onDone }: MiniGameProps) {
  const puzzle = useMemo(() => createPuzzle(seed), [seed]);
  const [turns, setTurns] = useState(() => puzzle.tiles.map((tile) => tile.turns));
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const sent = useRef(false);

  const masks = puzzle.tiles.map((tile, i) => rotate(tile.base, turns[i] ?? 0));
  const connected = new Set<number>();
  if ((masks[puzzle.source] ?? 0) & 8) {
    connected.add(puzzle.source);
    const queue = [puzzle.source];
    for (let q = 0; q < queue.length; q++) {
      const cell = queue[q]!;
      directions.forEach(([dr, dc], d) => {
        const r = Math.floor(cell / 5) + dr;
        const c = (cell % 5) + dc;
        const next = r * 5 + c;
        if (r < 0 || r > 4 || c < 0 || c > 4 || connected.has(next)) return;
        if ((masks[cell] ?? 0) & bits[d]! && (masks[next] ?? 0) & bits[(d + 2) % 4]!) {
          connected.add(next);
          queue.push(next);
        }
      });
    }
  }
  const solved = connected.has(puzzle.target) && Boolean((masks[puzzle.target] ?? 0) & 2);
  useEffect(() => {
    if (solved) setResult((old) => old ?? (moves <= puzzle.par + 6 ? 1 : 0.75));
  }, [solved, moves, puzzle.par]);

  const correct = puzzle.path.filter((cell) => masks[cell] === puzzle.needed.get(cell)).length;
  const finished = result !== null || solved;

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3 text-foreground" data-minigame="pipes">
      <p className="text-sm text-muted-foreground">Tap pipes to turn them. Join the O₂ tank on the left to the habitat on the right.</p>
      <div className="flex justify-between gap-2 font-display">
        <span>Moves: {moves}</span>
        <span>Pipes flowing: {connected.size}</span>
      </div>
      <div className="flex justify-between text-sm font-semibold text-oxygen">
        <span>O₂ tank → row {Math.floor(puzzle.source / 5) + 1}</span>
        <span>Row {Math.floor(puzzle.target / 5) + 1} → Habitat</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 rounded-2xl border-4 border-rim bg-panel p-2">
        {puzzle.tiles.map((tile, i) => (
          <Button
            key={i}
            variant="ghost"
            disabled={finished}
            data-pipe={i}
            aria-label={`Row ${Math.floor(i / 5) + 1}, column ${(i % 5) + 1}. ${connected.has(i) ? "Oxygen flowing. " : ""}Turn pipe`}
            onClick={() => {
              if (finished) return;
              setTurns((old) => old.map((n, j) => (j === i ? n + 1 : n)));
              setMoves((n) => n + 1);
            }}
            className={cn("aspect-square h-auto min-h-11 min-w-11 rounded-xl border-2 border-rim p-0 [&_svg]:size-full", connected.has(i) ? "bg-oxygen/25" : "bg-paper")}
          >
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <g
                className={cn("motion-safe:transition-transform motion-safe:duration-150", connected.has(i) ? "stroke-oxygen" : "stroke-track")}
                style={{ transform: `rotate(${(turns[i] ?? 0) * 90}deg)`, transformOrigin: "50px 50px" }}
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
              >
                {bits.map((bit, d) => (tile.base & bit ? <path key={bit} d={["M50 50V0", "M50 50H100", "M50 50V100", "M50 50H0"][d]} /> : null))}
              </g>
            </svg>
          </Button>
        ))}
      </div>
      {result === null ? (
        <Button variant="panel" className="min-h-11" disabled={solved} onClick={() => setResult((0.25 * correct) / puzzle.path.length)}>
          Stop trying
        </Button>
      ) : (
        <div className="space-y-3" role="status">
          <p className="font-display">
            {solved ? "Great job! Oxygen is flowing again." : "Good effort! A quick patch will hold for now."} Score: {Math.round(result * 100)}%
          </p>
          <Button
            variant="mission"
            size="xl"
            onClick={() => {
              if (sent.current) return;
              sent.current = true;
              onDone(result);
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
