import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Moon, PartyPopper, Star, Sun, Sunrise, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACHIEVEMENTS, BUILDINGS, CREW_ROSTER, DOSE_LIMIT, MAX_LEVEL, MISSION_SOLS, REPAIR_ENERGY, UPGRADE_ENERGY, buildingFlows, conditionLabel, evaluate, repairBlocked, repairCost, upgradeBlocked, upgradeCost, type BuildingKey, type GameState, type MiniKind } from "@/game/sim";
import type { SpaceWeather } from "@/game/useSpaceWeather";
import { FACTS } from "@/game/data";
import { Bar, EffectChips, PORTRAIT, firstName } from "./meta";
import { CrewPicker } from "./Panels";
import { Modal, ScienceNote } from "./Modal";
import { PipeRepair } from "./minigames/PipeRepair";
import { SolarCleaning } from "./minigames/SolarCleaning";
import { RoverNavigation } from "./minigames/RoverNavigation";
import { GreenhouseManager } from "./minigames/GreenhouseManager";
import astronaut from "@/assets/astronaut.png";
import { cn } from "@/lib/utils";

export function TitleDialog({ open, weather, saved, onStart, onContinue }: { open: boolean; weather: SpaceWeather; saved: GameState | null; onStart: () => void; onContinue: () => void }) {
  return (
    <Modal open={open} labelledBy="title-heading" className="max-w-2xl">
      <div className="flex items-start gap-4">
        <img src={astronaut} alt="" width={768} height={1024} className="animate-float hidden w-28 shrink-0 sm:block" />
        <div>
          <p className="font-display text-sm font-semibold uppercase tracking-widest text-highlight">Mission Commander needed</p>
          <h1 id="title-heading" className="font-display text-4xl font-bold leading-none sm:text-5xl">
            Outpost Mars
          </h1>
          <p className="mt-3 leading-snug">
            Your crew of 4 just landed in a giant Mars canyon. A faint signal from an abandoned lander hints at a discovery nearby.
            Keep the crew safe for {MISSION_SOLS} sols, uncover the message, and make it home.
          </p>
        </div>
      </div>
      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-3">
        <li className="rounded-xl bg-secondary p-3">
          <b className="font-display">Lead 4 astronauts.</b> Give each one a job every sol.
        </li>
        <li className="rounded-xl bg-secondary p-3">
          <b className="font-display">Fix, build, explore.</b> Machines wear out. The rover finds new places.
        </li>
        <li className="rounded-xl bg-secondary p-3">
          <b className="font-display">Real NASA science.</b> Solar flares and facts come from real missions.
        </li>
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        The crew and signal are fictional; the science and solar-weather records are based on NASA missions.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {weather.status === "loading" && "Checking NASA's live solar flare feed…"}
        {weather.status === "live" && "Connected to NASA DONKI: a new mission will face real flares from the last 30 days."}
        {weather.status === "archived" && "NASA's live flare feed didn't answer, so a new mission uses archived real flares from NASA DONKI (2003–2024)."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {saved && (
          <Button variant="sunny" size="xl" onClick={onContinue}>
            Continue (sol {saved.sol})
          </Button>
        )}
        <Button variant="mission" size="xl" onClick={onStart}>
          {saved ? "New mission" : "Start mission"}
        </Button>
        <Link to="/science" className="text-sm font-semibold text-highlight underline-offset-4 hover:underline">
          Where does the science come from?
        </Link>
      </div>
    </Modal>
  );
}

export function MorningDialog({ state, onBegin }: { state: GameState; onBegin: () => void }) {
  if (state.phase !== "morning") return null;
  const line = state.chatter[0];
  const who = line ? state.crew.find((c) => c.id === line.crewId) : null;
  return (
    <Modal open labelledBy="morning-title">
      <div className="flex items-center gap-3">
        <Sunrise className="size-10 text-accent" aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Morning report</p>
          <h2 id="morning-title" className="font-display text-3xl font-bold">
            Good morning, Sol {state.sol}!
          </h2>
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm leading-snug">
        {state.morning.map((m, i) => (
          <li key={i} className={cn("rounded-lg bg-secondary px-3 py-1.5", m.startsWith("EMERGENCY") && "bg-bad text-destructive-foreground")}>
            {m}
          </li>
        ))}
      </ul>
      {line && who && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-paper p-2 text-paper-foreground">
          <img src={PORTRAIT[who.role]} alt="" className="size-10 rounded-full" />
          <p className="text-sm">
            <b>{firstName(who.name)}:</b> "{line.text}"
          </p>
        </div>
      )}
      <div className="mt-4">
        <Button variant="mission" size="xl" onClick={onBegin}>
          Start the day
        </Button>
      </div>
    </Modal>
  );
}

export function EventDialog({ state, onChoose }: { state: GameState; onChoose: (id: string) => void }) {
  const ev = state.pending;
  if (state.phase !== "event" || !ev) return null;
  const f = ev.flare;
  return (
    <Modal open labelledBy="event-title" className={cn(ev.tone === "danger" && "alert-frame")}>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", ev.tone === "good" ? "bg-good" : "bg-bad")}>
          {ev.kind === "flare" ? <Sun className="size-7 text-primary-foreground" /> : ev.tone === "good" ? <PartyPopper className="size-7 text-paper-foreground" /> : <AlertTriangle className="size-7 text-primary-foreground" />}
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sol {state.sol} · {ev.tone === "good" ? "Good news" : "Alert"}</div>
          <h2 id="event-title" className="font-display text-2xl font-bold leading-tight">
            {ev.title}
          </h2>
        </div>
      </div>
      <p className="mt-3 leading-snug">{ev.story}</p>
      {(ev.countdown || ev.longTerm) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
          {ev.countdown && <span className="rounded-lg bg-bad px-2 py-1 text-destructive-foreground">⏱ {ev.countdown}</span>}
          {ev.longTerm && <span className="rounded-lg bg-secondary px-2 py-1">Later: {ev.longTerm}</span>}
        </div>
      )}
      {f && (
        <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-xl border-2 border-rim bg-secondary/60 p-2">
            <div className="font-display font-semibold uppercase tracking-wider text-highlight">NASA observation</div>
            <p>Event: Solar flare (FLR), class {f.classType}</p>
            <p>Observed: {f.date}</p>
            {f.location && <p>Place on the Sun: {f.location}</p>}
            {f.region !== undefined && <p>Active region: {f.region}</p>}
            <p className="mt-1 text-muted-foreground">Source: NASA DONKI ({f.source === "live" ? "live feed" : "archived record"})</p>
            {f.note && <p className="mt-1 text-muted-foreground">{f.note}</p>}
          </div>
          <div className="rounded-xl border-2 border-dashed border-rim p-2">
            <div className="font-display font-semibold uppercase tracking-wider text-accent">Game effect (simulated)</div>
            <p>The doses below are game numbers, not NASA measurements.</p>
          </div>
        </div>
      )}
      <div className={cn("mt-4 grid gap-3", ev.choices.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        {ev.choices.map((c) => (
          <button key={c.id} type="button" data-choice={c.id} className="choice-card flex flex-col gap-2 p-3 text-left" onClick={() => onChoose(c.id)}>
            <span className="font-display text-lg font-bold leading-tight">{c.label}</span>
            <span className="text-sm leading-snug">{c.detail}</span>
            {c.task && <span className="w-fit rounded-full bg-accent px-2 text-[11px] font-bold text-accent-foreground">MINI-GAME</span>}
            <div className="mt-auto">
              <EffectChips effects={c.effects} />
            </div>
          </button>
        ))}
      </div>
      <div className="mt-4">
        <ScienceNote {...ev.fact} />
      </div>
    </Modal>
  );
}

const GAMES: Record<MiniKind, typeof PipeRepair> = { pipes: PipeRepair, solar: SolarCleaning, rover: RoverNavigation, greenhouse: GreenhouseManager };

export function TaskDialog({ state, onDone }: { state: GameState; onDone: (score: number) => void }) {
  const t = state.task;
  if (state.phase !== "task" || !t) return null;
  const Game = GAMES[t.kind];
  return (
    <Modal open labelledBy="task-title" className="max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <h2 id="task-title" className="font-display text-2xl font-bold">
          {t.title}
        </h2>
        <Button variant="ghost" size="sm" onClick={() => onDone(0.3)}>
          Skip (quick, weaker result)
        </Button>
      </div>
      <div className="mt-3">
        <Game key={t.seed} seed={t.seed} onDone={onDone} />
      </div>
    </Modal>
  );
}

export function ReportDialog({ state, onNext }: { state: GameState; onNext: () => void }) {
  const r = state.report;
  if (state.phase !== "report" || !r) return null;
  return (
    <Modal open labelledBy="report-title">
      <div className="flex items-center gap-3">
        <Moon className="size-10 text-research" aria-hidden />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">End of sol report</p>
          <h2 id="report-title" className="font-display text-3xl font-bold">
            Sol {r.sol} is over
          </h2>
        </div>
      </div>
      <div className="mt-3">
        <EffectChips effects={r.deltas} />
      </div>
      {r.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm leading-snug">
          {r.notes.map((n, i) => (
            <li key={i} className={cn("rounded-lg bg-secondary px-3 py-1.5", n.startsWith("EMERGENCY") && "bg-bad text-destructive-foreground")}>
              {n}
            </li>
          ))}
        </ul>
      )}
      {r.unlocked.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm font-semibold text-good">
          {r.unlocked.map((u, i) => (
            <li key={i} className="flex items-center gap-2">
              <Trophy className="size-4" aria-hidden /> {u}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4">
        <Button variant="mission" size="xl" onClick={onNext}>
          {state.status === "playing" ? `Sleep → Sol ${r.sol + 1}` : "See mission results"}
        </Button>
      </div>
    </Modal>
  );
}

export function EndDialog({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  if (state.phase !== "ended") return null;
  const won = state.status === "won";
  const ev = evaluate(state);
  return (
    <Modal open labelledBy="end-title" className="max-w-2xl">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-highlight">{won ? "Mission complete" : `Mission ended on sol ${state.sol}`}</p>
      <h2 id="end-title" className="font-display text-4xl font-bold leading-tight">
        {ev.title}
      </h2>
      {won && (
        <div className="mt-3 flex gap-1" aria-label={`${ev.stars} of 3 stars`}>
          {[0, 1, 2].map((i) => (
            <Star key={i} className={cn("size-10", i < ev.stars ? "fill-accent text-accent" : "text-track")} aria-hidden />
          ))}
        </div>
      )}
      <p className="mt-3 leading-snug">{state.endReason}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {ev.parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="w-28 shrink-0">{p.label}</span>
            <Bar value={p.points} max={p.max} className="bg-highlight" />
            <span className="w-14 shrink-0 text-right font-display font-bold">
              {p.points}/{p.max}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-display text-xl font-bold">Score: {ev.score} / 100</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {ACHIEVEMENTS.map((a) => (
          <span key={a.key} title={a.text} className={cn("chip", state.achievements.includes(a.key) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground opacity-60")}>
            <Trophy className="size-3" aria-hidden /> {a.name}
          </span>
        ))}
      </div>
      <div className="mt-4">
        <ScienceNote {...FACTS.limit} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="mission" size="xl" onClick={onRestart}>
          New mission
        </Button>
        <span className="text-sm text-muted-foreground">Every mission has different events. Try a new strategy!</span>
      </div>
    </Modal>
  );
}

export function BuildingDialog({ state, building, onClose, onRepair, onUpgrade }: { state: GameState; building: BuildingKey | null; onClose: () => void; onRepair: (k: BuildingKey, crewId: string) => void; onUpgrade: (k: BuildingKey, crewId: string) => void }) {
  const [crewId, setCrewId] = useState<string | null>(null);
  if (!building) return null;
  const def = BUILDINGS[building];
  const b = state.buildings[building];
  const flow = buildingFlows(state)[building];
  const who = crewId ? (state.crew.find((c) => c.id === crewId) ?? null) : null;
  const canDay = state.phase === "day";
  const rBlock = !canDay ? "Only during the day" : repairBlocked(state, building, who) ?? (who ? null : "Pick who does it");
  const uBlock = !canDay ? "Only during the day" : upgradeBlocked(state, building, who) ?? (who ? null : "Pick who does it");
  return (
    <Modal open labelledBy="building-title">
      <h2 id="building-title" className="font-display text-3xl font-bold">
        {def.name} {b.count > 1 && <span className="text-lg text-muted-foreground">×{b.count}</span>}
      </h2>
      <p className="mt-1 text-sm leading-snug">{def.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-secondary p-2">
          <div className="text-xs text-muted-foreground">Condition</div>
          <div className="font-display text-xl font-bold">{b.condition}%</div>
          <Bar value={b.condition} className={b.condition < 50 ? "bg-bad" : "bg-good"} />
          <div className="mt-1 text-xs">{conditionLabel(b.condition)}</div>
        </div>
        <div className="rounded-xl bg-secondary p-2">
          <div className="text-xs text-muted-foreground">Level</div>
          <div className="font-display text-xl font-bold">
            {b.level} / {MAX_LEVEL}
          </div>
          <div className="mt-1 text-xs">Wears {def.wear}% per sol</div>
        </div>
      </div>
      <div className="mt-3 text-sm">
        <span className="font-semibold">Every sol right now: </span>
        <EffectChips effects={flow} compact />
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-xs font-semibold">Who does the work?</p>
        <CrewPicker state={state} chosen={crewId} onChoose={setCrewId} energy={REPAIR_ENERGY} bonusRole="engineer" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border-2 border-rim p-2 text-xs">
            <p className="font-display text-sm font-bold">Repair {def.repairTask && "(pipe puzzle)"}</p>
            <EffectChips effects={repairCost(state, building)} compact />
            <Button className="mt-2 w-full" variant="mission" size="sm" disabled={!!rBlock} onClick={() => crewId && onRepair(building, crewId)}>
              {rBlock ?? `Repair (${REPAIR_ENERGY} energy)`}
            </Button>
          </div>
          <div className="rounded-xl border-2 border-rim p-2 text-xs">
            <p className="font-display text-sm font-bold">Upgrade</p>
            <p>{def.upgradeText}</p>
            <EffectChips effects={upgradeCost(state, building)} compact />
            <Button className="mt-2 w-full" variant="panel" size="sm" disabled={!!uBlock} onClick={() => crewId && onUpgrade(building, crewId)}>
              {uBlock ?? `Upgrade (${UPGRADE_ENERGY} energy)`}
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <ScienceNote {...def.fact} />
      </div>
      <Button className="mt-4" variant="ghost" onClick={onClose}>
        Close
      </Button>
    </Modal>
  );
}

export function CrewDialog({ state, crewId, onClose }: { state: GameState; crewId: string | null; onClose: () => void }) {
  const c = crewId ? state.crew.find((x) => x.id === crewId) : null;
  if (!c) return null;
  const def = CREW_ROSTER.find((d) => d.id === c.id);
  return (
    <Modal open labelledBy="crew-title-d" className="max-w-md">
      <div className="flex items-center gap-3">
        <img src={PORTRAIT[c.role]} alt={`Portrait of ${c.name}`} className="size-20 rounded-full bg-secondary" />
        <div>
          <h2 id="crew-title-d" className="font-display text-2xl font-bold">
            {c.name}
          </h2>
          <p className="text-sm text-highlight">{c.roleLabel}</p>
        </div>
      </div>
      <p className="mt-2 text-sm">★ {def?.perk}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {(
          [
            ["Health", c.health, "bg-good"],
            ["Energy", c.energy, "bg-power"],
            ["Happiness", c.morale, "bg-morale"],
          ] as const
        ).map(([l, v, cls]) => (
          <li key={l}>
            <div className="flex justify-between">
              <span>{l}</span>
              <b>{v}%</b>
            </div>
            <Bar value={v} className={cls} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm">Now: {c.activity}</p>
      <p className="mt-1 text-xs text-muted-foreground">Astronauts with no job rest and get more energy back. Low supplies hurt health. Health at 0 means a stay in the sick bay.</p>
      <Button className="mt-4" variant="mission" onClick={onClose}>
        Close
      </Button>
    </Modal>
  );
}

export function HelpDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} labelledBy="help-title">
      <h2 id="help-title" className="font-display text-3xl font-bold">
        How to play
      </h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 leading-snug">
        <li>Every sol starts with a morning report. Then pick a job and an astronaut to do it. Each astronaut does one job per sol.</li>
        <li>Jobs marked PLAY are mini-games: the better you do, the better the result.</li>
        <li>Tap buildings on the base (or in "Your base") to repair or upgrade them. Below 50% they work at half strength.</li>
        <li>Explore sends the rover to new places. Tech spends research points on upgrades.</li>
        <li>Press "End sol" when you're ready. Surprises happen at night: flares, dust storms, broken machines.</li>
        <li>If oxygen, water or food stays empty for 2 sols, morale hits 0, everyone is sick, or radiation reaches {DOSE_LIMIT} mSv, the mission ends.</li>
        <li>Your game saves by itself. Come back any time and press Continue.</li>
      </ol>
      <div className="mt-5">
        <Button variant="mission" size="lg" onClick={onClose}>
          Got it!
        </Button>
      </div>
    </Modal>
  );
}

export function SettingsDialog({ open, muted, onMute, onClose, onRestart }: { open: boolean; muted: boolean; onMute: (m: boolean) => void; onClose: () => void; onRestart: () => void }) {
  return (
    <Modal open={open} labelledBy="settings-title" className="max-w-md">
      <h2 id="settings-title" className="font-display text-3xl font-bold">
        Mission settings
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        <Button variant="panel" size="xl" onClick={() => onMute(!muted)}>
          Sound: {muted ? "Off" : "On"}
        </Button>
        <Button variant="sunny" size="xl" onClick={onRestart}>
          Start a new mission
        </Button>
        <Button variant="panel" size="xl" asChild>
          <Link to="/science">See the NASA data we used</Link>
        </Button>
        <Button variant="ghost" size="lg" onClick={onClose}>
          Back to the game
        </Button>
      </div>
    </Modal>
  );
}
