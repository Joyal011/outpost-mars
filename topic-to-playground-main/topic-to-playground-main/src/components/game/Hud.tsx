import { CalendarDays, CheckCircle2, Circle, Flag, MapPin, Rocket, Sun } from "lucide-react";
import { CHAPTERS, DOSE_LIMIT, MISSION_SOLS, RESOURCE_KEYS, TECHS, chapterFor, dailyBalance, objectiveDone, solsLeft, teamMorale, type GameState, type ResourceKey } from "@/game/sim";
import type { SpaceWeather } from "@/game/useSpaceWeather";
import { Bar, STAT_META } from "./meta";
import { cn } from "@/lib/utils";

export function SolCard({ state }: { state: GameState }) {
  const ch = chapterFor(state.sol);
  return (
    <div className="panel pointer-events-auto flex flex-1 items-center gap-3 px-4 py-2 lg:flex-none">
      <CalendarDays className="size-8 text-foreground" aria-hidden />
      <div>
        <div className="font-display text-2xl font-bold leading-tight">
          Sol {state.sol} <span className="text-muted-foreground">/ {MISSION_SOLS}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Chapter {ch.n}: {ch.name}
        </div>
      </div>
    </div>
  );
}

export function ResourceBars({ state }: { state: GameState }) {
  const bal = dailyBalance(state);
  const r = state.report;
  return (
    <div className="panel pointer-events-auto order-last grid w-full grid-cols-2 gap-x-5 gap-y-2 px-4 py-2.5 sm:grid-cols-3 lg:order-none lg:w-auto lg:flex-1 lg:grid-cols-6">
      {RESOURCE_KEYS.map((k) => (
        <Gauge key={k} k={k} value={state.res[k]} perSol={bal[k]} left={k === "shielding" ? null : solsLeft(state, k)} change={r?.deltas[k]} changeKey={r ? `${r.sol}-${k}` : k} empty={!!state.emptySols[k]} />
      ))}
      <Materials state={state} />
    </div>
  );
}

function Gauge({ k, value, perSol, left, change, changeKey, empty }: { k: ResourceKey; value: number; perSol: number; left: number | null; change?: number | undefined; changeKey: string; empty: boolean }) {
  const m = STAT_META[k];
  const Icon = m.icon;
  const low = value < 25;
  return (
    <div className={cn("min-w-0 rounded-lg", empty && "emergency-glow")}>
      <div className="flex items-center gap-2">
        <Icon className={cn("size-7 shrink-0", m.text, low && "animate-pulse")} aria-hidden />
        <div className="min-w-0 flex-1 leading-none">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate text-xs font-semibold text-muted-foreground">{m.label}</span>
            <span className={cn("whitespace-nowrap font-display text-xs font-semibold", perSol >= 0 ? "text-good" : "text-bad")} title="Change every sol from your base">
              {perSol >= 0 ? "+" : ""}
              {perSol}/sol
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={cn("font-display text-xl font-bold", low && "text-bad")}>{Math.round(value)}%</div>
            {change ? (
              <span key={changeKey} className={cn("delta-pop chip pointer-events-none font-display text-xs font-bold", change > 0 ? "bg-good text-paper-foreground" : "bg-bad text-primary-foreground")} aria-live="polite">
                {change > 0 ? "+" : ""}
                {change}
              </span>
            ) : left !== null && left <= 5 ? (
              <span className="chip bg-bad text-[0.65rem] text-destructive-foreground" title="Sols until it runs out at today's rate">
                {empty ? "EMPTY!" : `${left} sols left`}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <Bar value={value} className={m.bar} />
      </div>
    </div>
  );
}

function Materials({ state }: { state: GameState }) {
  const m = STAT_META.materials;
  const change = state.report?.deltas.materials;
  return (
    <div className="min-w-0" title="Building materials: used to build, repair and upgrade. Find more by salvaging or exploring.">
      <div className="flex items-center gap-2">
        <m.icon className="size-7 shrink-0 text-highlight" aria-hidden />
        <div className="min-w-0 flex-1 leading-none">
          <span className="truncate text-xs font-semibold text-muted-foreground">Materials</span>
          <div className="flex items-center gap-1.5">
            <div className="font-display text-xl font-bold">{state.materials}</div>
            {change ? (
              <span key={`${state.report?.sol}-m`} className={cn("delta-pop chip font-display text-xs font-bold", change > 0 ? "bg-good text-paper-foreground" : "bg-bad text-primary-foreground")}>
                {change > 0 ? "+" : ""}
                {change}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <Bar value={state.materials} max={60} className="bg-highlight" />
      </div>
    </div>
  );
}

export function StatusRow({ state, weather }: { state: GameState; weather: SpaceWeather }) {
  const Morale = STAT_META.morale.icon;
  const Research = STAT_META.research.icon;
  const Dose = STAT_META.dose.icon;
  const morale = teamMorale(state);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
      <ChapterCard state={state} />
      <div className="panel pointer-events-auto px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Morale className="size-6 text-morale" aria-hidden />
          <span className="text-sm font-semibold">Crew Morale</span>
          <span className="ml-auto font-display font-bold">{morale}%</span>
        </div>
        <div className="mt-2">
          <Bar value={morale} className="bg-morale" />
        </div>
      </div>
      <div className="panel pointer-events-auto px-4 py-2.5" title="Research points (RP) unlock new technology in the Tech tab.">
        <div className="flex items-center gap-2">
          <Research className="size-6 text-research" aria-hidden />
          <span className="text-sm font-semibold">Research</span>
          <span className="ml-auto font-display font-bold">{state.rp} RP</span>
        </div>
        <div className="mt-2 flex gap-1" aria-label={`${state.techs.length} of ${TECHS.length} technologies unlocked`}>
          {TECHS.map((t) => (
            <div key={t.key} className={cn("h-2.5 flex-1 rounded-full", state.techs.includes(t.key) ? "bg-research" : "bg-track")} title={t.name} />
          ))}
        </div>
      </div>
      <div className="panel pointer-events-auto col-span-2 px-4 py-2.5 md:col-span-1" title="Radiation the crew has absorbed. mSv = millisievert, a unit for radiation dose.">
        <div className="flex items-center gap-2">
          <Dose className={cn("size-6 text-dose", state.dose > DOSE_LIMIT * 0.7 && "animate-pulse")} aria-hidden />
          <span className="text-sm font-semibold">Radiation</span>
          <span className="ml-auto font-display font-bold">
            {state.dose.toFixed(1)} <span className="text-xs text-muted-foreground">/ {DOSE_LIMIT} mSv</span>
          </span>
        </div>
        <div className="mt-2">
          <Bar value={state.dose} max={DOSE_LIMIT} className="bg-dose" />
        </div>
      </div>
      <SunWatch weather={weather} state={state} />
    </div>
  );
}

function ChapterCard({ state }: { state: GameState }) {
  const ch = chapterFor(state.sol);
  return (
    <div className="panel pointer-events-auto col-span-2 flex items-center gap-3 px-4 py-2 md:col-span-3 xl:col-span-1">
      <Rocket className="size-7 shrink-0 text-primary" aria-hidden />
      <div className="min-w-0 text-sm leading-snug">
        <p className="font-display font-semibold">
          Chapter {ch.n} goals <span className="text-xs font-normal text-muted-foreground">(sols {ch.from}–{ch.to})</span>
        </p>
        <p className="text-xs leading-snug text-muted-foreground">{ch.story}</p>
        <ul className="text-xs">
          {ch.objectives.map((o) => {
            const done = state.objectivesDone.includes(o.key) || objectiveDone(state, o.key);
            return (
              <li key={o.key} className={cn("flex items-center gap-1", done && "text-good")}>
                {done ? <CheckCircle2 className="size-3.5 shrink-0" aria-hidden /> : <Circle className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />}
                <span className={cn(done && "line-through decoration-2")}>{o.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SunWatch({ weather, state }: { weather: SpaceWeather; state: GameState }) {
  const forecast = state.forecastUntil >= state.sol;
  const live = state.flareSource === "live";
  return (
    <div className="panel pointer-events-auto col-span-2 flex items-center gap-3 px-4 py-2.5 md:col-span-1">
      <Sun className="size-7 shrink-0 text-power" aria-hidden />
      <div className="min-w-0 text-xs leading-snug">
        <div className="flex items-center gap-1.5 font-display text-sm font-semibold">
          Sun watch
          <span className={cn("chip text-[0.65rem]", live ? "bg-good text-paper-foreground" : "bg-secondary text-muted-foreground")}>{live ? "LIVE NASA" : "ARCHIVED NASA"}</span>
        </div>
        {live ? (
          <p className="text-muted-foreground">
            This mission's flares came from NASA's live feed{weather.recentCount ? `: ${weather.recentCount} in the last 30 days` : ""}.
          </p>
        ) : (
          <p className="text-muted-foreground">This mission uses real past flares from NASA's DONKI records.</p>
        )}
        {state.blackoutSols > 0 ? <p className="font-semibold text-bad">Radio blackout: {state.blackoutSols} sols</p> : forecast && <p className="font-semibold text-highlight">Forecast active until sol {state.forecastUntil}</p>}
      </div>
    </div>
  );
}

export function SiteCard() {
  return (
    <div className="panel pointer-events-auto flex items-center gap-3 px-4 py-3">
      <MapPin className="size-7 shrink-0 text-bad" aria-hidden />
      <div className="text-sm leading-snug">
        <div className="text-xs text-muted-foreground">Mission site</div>
        <div className="font-display font-semibold">Mars · Valles Marineris</div>
        <div className="text-xs text-muted-foreground">Average temperature about −60 °C</div>
      </div>
    </div>
  );
}

export function Timeline({ sol }: { sol: number }) {
  const pct = ((sol - 1) / (MISSION_SOLS - 1)) * 100;
  return (
    <div className="panel pointer-events-auto px-6 pb-6 pt-3" aria-label={`Mission progress: sol ${sol} of ${MISSION_SOLS}`}>
      <div className="relative mx-2 h-10">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-track" />
        <div className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary transition-[width] duration-700" style={{ width: `${pct}%` }} />
        {CHAPTERS.map((c) => {
          const left = ((c.from - 1) / (MISSION_SOLS - 1)) * 100;
          return (
            <div key={c.n} className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <div className={cn("size-5 rounded-full border-2 border-rim", sol >= c.from ? "bg-primary" : "bg-muted")} />
              <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap text-[0.65rem] font-semibold text-muted-foreground">
                <span className="hidden sm:inline">
                  {c.name} ·{" "}
                </span>
                Sol {c.from}
              </div>
            </div>
          );
        })}
        <Flag className="absolute right-0 top-1/2 size-7 -translate-y-1/2 translate-x-1/2 text-foreground" aria-hidden />
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-[left] duration-700" style={{ left: `${pct}%` }}>
          <div className="animate-pulse-ring flex size-9 items-center justify-center rounded-full border-2 border-highlight bg-primary">
            <Rocket className="size-5 text-primary-foreground" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
