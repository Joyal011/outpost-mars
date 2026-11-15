import { useEffect, useRef, useState } from "react";
import { Pickaxe, type LucideIcon } from "lucide-react";
import scene from "@/assets/mars-outpost-cartoon.jpg";
import solarSprite from "@/assets/sprite-solar.webp";
import greenhouseSprite from "@/assets/sprite-greenhouse.webp";
import moxieSprite from "@/assets/sprite-moxie.webp";
import recyclerSprite from "@/assets/sprite-recycler.webp";
import walkerImg from "@/assets/crew-walker.png";
import carrierImg from "@/assets/crew-carrier.png";
import workerImg from "@/assets/astronaut-working.png";
import { BUILDINGS, conditionLabel, type Astronaut, type BuildingKey, type GameState, type StatKey, type WorkSite } from "@/game/sim";
import { BUILDING_ICON, PORTRAIT, STAT_META } from "./meta";
import { cn } from "@/lib/utils";

const IMG_W = 995;
const IMG_H = 596;

/** Where each structure sits in the background picture (percent of the image). */
const HOTSPOTS: Record<BuildingKey, { x: number; y: number }> = {
  greenhouse: { x: 16, y: 40 },
  recycler: { x: 28.5, y: 52 },
  moxie: { x: 46.3, y: 39 },
  habitat: { x: 56, y: 47 },
  antenna: { x: 66.5, y: 36 },
  solar: { x: 86, y: 44 },
  rover: { x: 77, y: 62 },
};

/** Extra units the player builds appear here (percent of the image, sprite width in % of image width). */
const EXTRA_SPOTS: Partial<Record<BuildingKey, { x: number; y: number }[]>> = {
  solar: [
    { x: 64, y: 74 },
    { x: 92, y: 80 },
    { x: 72, y: 84 },
    { x: 56, y: 82 },
  ],
  greenhouse: [
    { x: 8, y: 80 },
    { x: 24, y: 84 },
  ],
  moxie: [
    { x: 40, y: 72 },
    { x: 46, y: 78 },
  ],
  recycler: [
    { x: 31, y: 74 },
    { x: 36, y: 82 },
  ],
};
const BASE_COUNT: Partial<Record<BuildingKey, number>> = { solar: 2, greenhouse: 1, moxie: 1, recycler: 1 };
const SPRITE: Partial<Record<BuildingKey, { src: string; w: number }>> = {
  solar: { src: solarSprite, w: 7.5 },
  greenhouse: { src: greenhouseSprite, w: 9 },
  moxie: { src: moxieSprite, w: 4.5 },
  recycler: { src: recyclerSprite, w: 5 },
};

/** Matches `object-cover`: the on-screen box of the background picture. */
function useCoverBox() {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const scale = Math.max(W / IMG_W, H / IMG_H);
      const width = IMG_W * scale;
      const height = IMG_H * scale;
      setBox({ left: (W - width) / 2, top: (H - height) / 2, width, height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, box };
}

export function Scene({ state, onBuilding }: { state: GameState; onBuilding: (k: BuildingKey) => void }) {
  const { ref, box } = useCoverBox();
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <img src={scene} alt="A cartoon Mars outpost with a greenhouse dome, habitat modules, an antenna dish, solar panels and a rover in a red canyon" width={IMG_W} height={IMG_H} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
        {(Object.keys(EXTRA_SPOTS) as BuildingKey[]).flatMap((k) => {
          const extra = Math.max(0, state.buildings[k].count - (BASE_COUNT[k] ?? 0));
          const sprite = SPRITE[k]!;
          return (EXTRA_SPOTS[k] ?? []).slice(0, extra).map((p, i) => (
            <img
              key={`${k}-${i}`}
              src={sprite.src}
              alt=""
              aria-hidden
              loading="lazy"
              className={cn("built-pop absolute -translate-x-1/2 -translate-y-full drop-shadow-lg", state.buildings[k].condition <= 0 && "grayscale")}
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${sprite.w}%` }}
            />
          ));
        })}
        <CrewLayer state={state} />
        {(Object.keys(HOTSPOTS) as BuildingKey[]).map((k) => {
          const b = state.buildings[k];
          if (b.count <= 0) return null;
          const away = k === "rover" && !!state.expedition;
          const p = HOTSPOTS[k];
          const Icon = BUILDING_ICON[k];
          const broken = b.condition <= 0;
          const worn = b.condition < 50;
          return (
            <div key={k} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {broken && <span className="smoke-puff pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden />}
              <button
                type="button"
                data-hotspot={k}
                onClick={() => onBuilding(k)}
                className={cn(
                  "hotspot group relative flex items-center gap-1 rounded-full border-2 bg-panel-strong py-1 pl-1 pr-2 font-display text-xs font-bold text-foreground shadow-lg",
                  broken ? "border-bad" : worn ? "border-accent" : "border-rim",
                )}
                aria-label={`${BUILDINGS[k].name}: ${away ? "out exploring" : `${b.condition}%, ${conditionLabel(b.condition)}`}. Open details`}
              >
                <span className={cn("flex size-6 items-center justify-center rounded-full", broken ? "bg-bad" : worn ? "bg-accent text-accent-foreground" : "bg-secondary")}>
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="hidden sm:inline">{away ? "Away" : `${b.condition}%`}</span>
                {broken && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-bad text-[10px] text-destructive-foreground">!</span>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- crew at work (presentation only: reads state, never changes it) ---------- */

/** Ground spot in front of each work site (percent of the image). */
const WORK_SPOTS: Record<WorkSite, { x: number; y: number }> = {
  greenhouse: { x: 14, y: 57 },
  recycler: { x: 33, y: 58 },
  moxie: { x: 40, y: 56 },
  habitat: { x: 58, y: 57 },
  antenna: { x: 66, y: 55 },
  solar: { x: 86, y: 56 },
  rover: { x: 75, y: 58 },
  field: { x: 47, y: 58 },
};
const SITE_ICON: Record<WorkSite, LucideIcon> = { ...BUILDING_ICON, field: Pickaxe };
/** Which little effect plays next to the worker. */
const SITE_FX: Record<WorkSite, "spark" | "leaf" | "signal" | "dust"> = {
  greenhouse: "leaf",
  recycler: "spark",
  moxie: "spark",
  habitat: "spark",
  antenna: "signal",
  solar: "spark",
  rover: "spark",
  field: "dust",
};
const WALK_TRACKS = [
  { top: 66, dur: 22, delay: 0 },
  { top: 72, dur: 28, delay: -15 },
  { top: 76, dur: 25, delay: -7 },
  { top: 69, dur: 31, delay: -21 },
];
const PULSE_KEYS: StatKey[] = ["oxygen", "power", "water", "food", "shielding", "materials", "research"];

interface Pulse {
  id: number;
  crewId: string;
  site: WorkSite;
  deltas: [StatKey, number][];
}

/** What changed between two states, for the keys shown in a work pulse. */
function diff(a: GameState, b: GameState): [StatKey, number][] {
  const val = (s: GameState, k: StatKey) => (k === "materials" ? s.materials : k === "research" ? s.rp : s.res[k as keyof GameState["res"]]);
  return PULSE_KEYS.map((k) => [k, Math.round(val(b, k) - val(a, k))] as [StatKey, number]).filter(([, n]) => n !== 0);
}

/** Watches state changes and reports which astronaut's job just changed resources. */
function useWorkPulses(state: GameState) {
  const prev = useRef(state);
  const next = useRef(1);
  const alive = useRef(true);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (p === state || p.sol !== state.sol) return;
    const found: Pulse[] = [];
    // A job just started (its cost or reward is paid now).
    for (const c of state.crew) {
      const before = p.crew.find((x) => x.id === c.id);
      if (c.site && c.busy && !c.away && before && !before.busy) {
        const deltas = diff(p, state);
        if (deltas.length) found.push({ id: next.current++, crewId: c.id, site: c.site, deltas });
      }
    }
    // A mini-game job just finished and paid its reward.
    const src = p.task?.source;
    if (p.phase === "task" && state.phase !== "task" && src && "crewId" in src) {
      const c = state.crew.find((x) => x.id === src.crewId);
      const deltas = diff(p, state);
      if (c?.site && deltas.length) found.push({ id: next.current++, crewId: c.id, site: c.site, deltas });
    }
    if (!found.length) return;
    setPulses((all) => [...all, ...found]);
    const ids = new Set(found.map((f) => f.id));
    // Each pulse removes itself; a newer state change must not cancel older timers.
    setTimeout(() => {
      if (alive.current) setPulses((all) => all.filter((x) => !ids.has(x.id)));
    }, 2600);
  }, [state]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  return pulses;
}

function CrewLayer({ state }: { state: GameState }) {
  const pulses = useWorkPulses(state);
  const working = state.crew.filter((c) => c.busy && !c.away && c.site && c.health > 0);
  const idle = state.crew.filter((c) => !c.busy && !c.away && c.health > 0);
  // Several astronauts at the same site stand side by side.
  const slot = new Map<string, number>();
  const seen: Partial<Record<WorkSite, number>> = {};
  for (const c of working) {
    const n = seen[c.site!] ?? 0;
    seen[c.site!] = n + 1;
    slot.set(c.id, n);
  }
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {idle.map((c, i) => {
        const t = WALK_TRACKS[i % WALK_TRACKS.length]!;
        return (
          <div key={c.id} className={cn("crew-path absolute", i % 2 ? "crew-path-b" : "crew-path-a")} style={{ top: `${t.top}%`, width: "3.2%", animationDuration: `${t.dur}s`, animationDelay: `${t.delay}s` }}>
            <img src={i % 2 ? carrierImg : walkerImg} alt="" className="crew-bob w-full -translate-y-full" style={{ animationDuration: `${0.7 + i * 0.07}s` }} />
          </div>
        );
      })}
      {working.map((c) => (
        <Worker key={c.id} crew={c} slot={slot.get(c.id) ?? 0} pulse={pulses.find((p) => p.crewId === c.id)} />
      ))}
      {pulses
        .filter((p) => !working.some((c) => c.id === p.crewId))
        .map((p) => (
          <PulseChips key={p.id} pulse={p} at={WORK_SPOTS[p.site]} />
        ))}
    </div>
  );
}

function Worker({ crew, slot, pulse }: { crew: Astronaut; slot: number; pulse: Pulse | undefined }) {
  const site = crew.site!;
  const spot = WORK_SPOTS[site];
  const at = { x: spot.x + slot * 3.5, y: spot.y + slot * 1.5 };
  const Icon = SITE_ICON[site];
  const fx = SITE_FX[site];
  return (
    <div data-worker={crew.id} data-site={site} className="absolute" style={{ left: `${at.x}%`, top: `${at.y}%`, width: "4%" }}>
      <div className="absolute bottom-full left-1/2 w-full -translate-x-1/2">
        <img src={workerImg} alt="" className={cn("astronaut-work w-full", pulse && "work-burst")} style={{ animationDelay: `${-slot * 0.9}s` }} />
        <span className={cn("work-fx absolute", `work-fx-${fx}`, pulse && "work-fx-burst")} />
      </div>
      <span className="absolute bottom-full left-1/2 mb-[110%] flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-rim bg-panel-strong py-0.5 pl-0.5 pr-1.5 text-[10px] font-bold text-foreground shadow">
        <img src={PORTRAIT[crew.role]} alt="" className="size-4 rounded-full" />
        <Icon className="size-3 text-highlight" />
        {crew.name.split(" ")[0]}
      </span>
      {pulse && <PulseChips pulse={pulse} at={null} />}
    </div>
  );
}

function PulseChips({ pulse, at }: { pulse: Pulse; at: { x: number; y: number } | null }) {
  return (
    <div
      className={cn("work-pulse flex gap-1", at ? "absolute -translate-x-1/2" : "absolute bottom-full left-1/2 mb-[150%] -translate-x-1/2")}
      style={at ? { left: `${at.x}%`, top: `${at.y - 14}%` } : undefined}
    >
      {pulse.deltas.slice(0, 3).map(([k, n]) => {
        const m = STAT_META[k];
        const Icon = m.icon;
        return (
          <span key={k} className={cn("flex items-center gap-0.5 rounded-full border bg-panel-strong px-1.5 py-0.5 text-[11px] font-extrabold shadow-lg", n > 0 ? "border-good text-good" : "border-bad text-bad")}>
            <Icon className={cn("size-3", m.text)} />
            {n > 0 ? "+" : ""}
            {n}
          </span>
        );
      })}
    </div>
  );
}
