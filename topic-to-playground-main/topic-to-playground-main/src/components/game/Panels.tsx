import { useState, type ReactNode } from "react";
import { ArrowRight, Cpu, FlaskConical, Hammer, Lightbulb, Map as MapIcon, MessageCircle, RadioTower, Settings2, Star, Sun, type LucideIcon } from "lucide-react";
import astronaut from "@/assets/astronaut.png";
import marsMap from "@/assets/mars-map.webp";
import { Button } from "@/components/ui/button";
import {
  ACTIONS,
  BUILDINGS,
  BUILDING_ORDER,
  CREW_ROSTER,
  DOSE_LIMIT,
  EXPEDITION_ENERGY,
  LOCATIONS,
  MISSION_SOLS,
  TECHS,
  blockedReason,
  canWork,
  conditionLabel,
  crewProblem,
  dailyBalance,
  expeditionBlocked,
  has,
  jobEffects,
  techBlocked,
  tripPlan,
  type Action,
  type Astronaut,
  type BuildingKey,
  type GameState,
  type LocationKey,
  type Tab,
  type TechKey,
} from "@/game/sim";
import { BUILDING_ICON, Bar, EffectChips, PORTRAIT, firstName } from "./meta";
import { cn } from "@/lib/utils";

export const TABS: { id: Tab; label: string; icon: LucideIcon; prompt: string }[] = [
  { id: "build", label: "Build", icon: Hammer, prompt: "Build something that helps every sol" },
  { id: "manage", label: "Manage", icon: Settings2, prompt: "Keep the base running smoothly" },
  { id: "research", label: "Research", icon: FlaskConical, prompt: "Do science, the reason you came!" },
  { id: "communicate", label: "Communicate", icon: RadioTower, prompt: "Talk to Earth, millions of km away" },
  { id: "explore", label: "Explore", icon: MapIcon, prompt: "Send the rover on a trip" },
  { id: "tech", label: "Tech", icon: Cpu, prompt: "Spend research points on new technology" },
];

export function TabMenu({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <nav className="pointer-events-auto grid grid-cols-3 gap-2 lg:grid-cols-2" aria-label="Action types">
      {TABS.map((t) => (
        <Button key={t.id} variant="tab" size="default" data-active={tab === t.id} aria-pressed={tab === t.id} onClick={() => onTab(t.id)} className="h-11 justify-center px-2 text-sm lg:justify-start">
          <t.icon className="text-highlight" aria-hidden />
          {t.label}
        </Button>
      ))}
    </nav>
  );
}

export function BaseCard({ state, onBuilding }: { state: GameState; onBuilding: (k: BuildingKey) => void }) {
  return (
    <div className="panel pointer-events-auto p-3">
      <h3 className="font-display text-base font-semibold">Your base</h3>
      <p className="text-[11px] text-muted-foreground">Tap a building to repair or upgrade it</p>
      <ul className="mt-1.5 space-y-1">
        {BUILDING_ORDER.map((k) => {
          const b = state.buildings[k];
          const Icon = BUILDING_ICON[k];
          const away = k === "rover" && !!state.expedition;
          return (
            <li key={k}>
              <button type="button" onClick={() => onBuilding(k)} className="w-full rounded-lg px-1.5 py-1 text-left text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-highlight" aria-label={`${BUILDINGS[k].name}, ${b.count} built, ${b.condition}% condition`}>
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-4", b.condition <= 0 ? "text-bad" : "text-highlight")} aria-hidden />
                  <span className="flex-1 truncate">{BUILDINGS[k].name}</span>
                  {b.count > 1 && <span className="font-display text-xs font-bold">×{b.count}</span>}
                  {b.level > 1 && <span className="chip bg-research px-1.5 text-[10px] text-paper-foreground">L{b.level}</span>}
                  <span className={cn("w-10 text-right font-display text-xs font-bold", b.condition <= 0 ? "text-bad" : b.condition < 50 && "text-accent")}>{away ? "away" : `${b.condition}%`}</span>
                </div>
                <div className="mt-0.5 pl-6">
                  <Bar thin value={b.condition} className={b.condition < 50 ? "bg-bad" : "bg-good"} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
      {state.panelDust >= 10 && <p className="mt-2 rounded-lg bg-secondary px-2 py-1 text-xs">Solar panel dust: {Math.round(state.panelDust)}%</p>}
      {state.dustStormSols > 0 && <p className="mt-2 rounded-lg bg-primary/25 px-2 py-1 text-xs font-semibold">Dust storm: {state.dustStormSols} sols left</p>}
    </div>
  );
}

// ---------- crew picker ----------
export function CrewPicker({ state, chosen, onChoose, energy, bonusRole, problemFor }: { state: GameState; chosen: string | null; onChoose: (id: string) => void; energy: number; bonusRole?: string | undefined; problemFor?: (c: Astronaut) => string | null }) {
  return (
    <div role="radiogroup" aria-label="Who does it?" className="flex flex-wrap gap-1.5">
      {state.crew.map((c) => {
        const problem = problemFor ? problemFor(c) : crewProblem(c, energy);
        const star = bonusRole === c.role;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={chosen === c.id}
            disabled={!!problem}
            title={problem ?? `${c.name}, ${c.roleLabel}. Energy ${c.energy}%`}
            onClick={() => onChoose(c.id)}
            data-crew={c.id}
            className={cn("relative flex items-center gap-1.5 rounded-xl border-2 bg-paper py-1 pl-1 pr-2 text-left text-paper-foreground disabled:cursor-not-allowed disabled:opacity-45", chosen === c.id ? "border-highlight shadow-[var(--shadow-highlight)]" : "border-transparent")}
          >
            <img src={PORTRAIT[c.role]} alt="" className="size-8 rounded-full bg-secondary object-cover" />
            <span className="leading-tight">
              <span className="block font-display text-xs font-bold">{firstName(c.name)}</span>
              <span className="block text-[10px]">{problem ? problem.replace(`${firstName(c.name)} `, "") : `${c.roleLabel} · ⚡${c.energy}`}</span>
            </span>
            {star && !problem && (
              <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground" title="Speciality bonus">
                <Star className="size-3 fill-current" aria-hidden />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function bestCrew(state: GameState, ok: (c: Astronaut) => boolean, role?: string): string | null {
  const free = state.crew.filter(ok);
  return (free.find((c) => c.role === role) ?? [...free].sort((a, b) => b.energy - a.energy)[0])?.id ?? null;
}

// ---------- center panel ----------
function CenterShell({ state, title, hint, onAdvance, children }: { state: GameState; title: string; hint: string; onAdvance: () => void; children: ReactNode }) {
  const free = state.crew.filter(canWork).length;
  return (
    <section className="panel pointer-events-auto p-3" aria-labelledby="action-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="action-title" className="font-display text-lg font-bold leading-tight">
            {title}
          </h2>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{free ? `${free} of ${state.crew.length} crew still free` : "Everyone is busy"}</span>
          <Button variant="sunny" size="default" onClick={onAdvance} disabled={state.phase !== "day"} className="h-10" data-advance>
            End sol {state.sol}
            <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function ActionPanel({ state, tab, onJob, onAdvance, onExpedition, onTech }: { state: GameState; tab: Tab; onJob: (actionId: string, crewId: string) => void; onAdvance: () => void; onExpedition: (loc: LocationKey, crewId: string | null) => void; onTech: (t: TechKey) => void }) {
  const meta = TABS.find((t) => t.id === tab) ?? TABS[0]!;
  const title = tab === "explore" ? "Rover exploration" : tab === "tech" ? "Technology" : `Sol ${state.sol}: give each astronaut a job`;
  return (
    <CenterShell state={state} title={title} hint={`${meta.label}: ${meta.prompt}`} onAdvance={onAdvance}>
      {tab === "explore" ? <ExplorePanel key="explore" state={state} onLaunch={onExpedition} /> : tab === "tech" ? <TechPanel state={state} onUnlock={onTech} /> : <JobsPanel key={tab} state={state} tab={tab} onJob={onJob} />}
    </CenterShell>
  );
}

function JobsPanel({ state, tab, onJob }: { state: GameState; tab: Tab; onJob: (actionId: string, crewId: string) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [crewId, setCrewId] = useState<string | null>(null);
  const actions = ACTIONS.filter((a) => a.tab === tab);
  const chosen = actions.find((a) => a.id === selected) ?? null;
  const worker = chosen && crewId ? (state.crew.find((c) => c.id === crewId) ?? null) : null;
  const workerOk = chosen && worker ? !blockedReason(state, chosen, worker) : false;
  const pick = (a: Action) => {
    setSelected(a.id);
    setCrewId(bestCrew(state, (c) => !blockedReason(state, a, c), a.bonus?.role));
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {actions.map((a) => (
          <ActionCard key={a.id} action={a} state={state} selected={a.id === selected} onSelect={() => pick(a)} />
        ))}
      </div>
      <div className="mt-2 flex flex-col gap-2 rounded-xl bg-secondary/50 p-2 md:flex-row md:items-center">
        {chosen ? (
          <>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-xs font-semibold">
                Who does "{chosen.title}"? <span className="font-normal text-muted-foreground">Uses {chosen.energy} energy.</span>
                {chosen.bonus && <span className="ml-1 text-highlight">★ {chosen.bonus.text}</span>}
              </p>
              <CrewPicker state={state} chosen={crewId} onChoose={setCrewId} energy={chosen.energy} bonusRole={chosen.bonus?.role} problemFor={(c) => blockedReason(state, chosen, c)} />
              <p className="text-[11px] leading-snug text-muted-foreground">
                <span className="font-semibold text-highlight">Real science: </span>
                {chosen.fact.text}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {worker && <EffectChips effects={jobEffects(state, chosen, worker)} compact />}
              <Button
                variant="mission"
                disabled={!workerOk}
                onClick={() => {
                  if (!crewId) return;
                  onJob(chosen.id, crewId);
                  setSelected(null);
                  setCrewId(null);
                }}
              >
                {chosen.task ? "Do it (play!)" : "Do it!"}
              </Button>
            </div>
          </>
        ) : (
          <p className="flex-1 text-xs leading-snug text-muted-foreground">Pick a job, then pick who does it. Each astronaut can do one job per sol. When you're done, press "End sol". Every job helps something and costs something else.</p>
        )}
      </div>
    </>
  );
}

function ActionCard({ action, state, selected, onSelect }: { action: Action; state: GameState; selected: boolean; onSelect: () => void }) {
  const blocked = blockedReason(state, action);
  const b = action.build ? state.buildings[action.build] : null;
  return (
    <Button variant="ghost" type="button" className="choice-card h-auto min-h-32 min-w-0 flex-col items-stretch justify-start gap-1 whitespace-normal p-2 text-left hover:bg-paper" data-selected={selected} data-job={action.id} disabled={!!blocked} onClick={onSelect} aria-pressed={selected}>
      <div className="flex items-start justify-between gap-1">
        <span className="font-display text-sm font-bold leading-tight">{action.title}</span>
        {b && <span className="shrink-0 rounded-full bg-paper-foreground/10 px-1 text-xs">×{b.count}</span>}
        {action.task && <span className="shrink-0 rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">PLAY</span>}
      </div>
      <span className="text-xs leading-snug">{action.blurb}</span>
      <div className="mt-auto pt-1">{blocked ? <span className="block rounded-md bg-paper-foreground/10 px-1 py-1 text-[11px] leading-tight">{blocked}</span> : <EffectChips effects={action.effects} compact />}</div>
    </Button>
  );
}

// ---------- exploration ----------
function ExplorePanel({ state, onLaunch }: { state: GameState; onLaunch: (loc: LocationKey, crewId: string | null) => void }) {
  const [loc, setLoc] = useState<LocationKey | null>(null);
  const [driver, setDriver] = useState<string | null>(null);
  const def = LOCATIONS.find((l) => l.key === loc) ?? null;
  const driverC = driver ? (state.crew.find((c) => c.id === driver) ?? null) : null;
  const plan = def ? tripPlan(state, def.key, driverC) : null;
  const blocked = def ? expeditionBlocked(state, def.key, driverC) : "Pick a place";
  const ex = state.expedition;
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="relative overflow-hidden rounded-xl border-2 border-rim">
        <img src={marsMap} alt="Cartoon map of the canyon around the base" className="block h-auto w-full" width={1280} height={768} />
        <div className="absolute left-1/2 top-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary px-2 py-0.5 font-display text-[10px] font-bold text-primary-foreground shadow">BASE</div>
        {LOCATIONS.map((l) => {
          const found = state.discovered.includes(l.key);
          const visited = state.visited.includes(l.key);
          const here = ex?.location === l.key;
          return (
            <button
              key={l.key}
              type="button"
              data-location={l.key}
              disabled={!found}
              onClick={() => {
                setLoc(l.key);
                setDriver(bestCrew(state, (c) => !expeditionBlocked(state, l.key, c), "pilot"));
              }}
              className={cn("map-pin absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full border-2 px-2 py-0.5 font-display text-[11px] font-bold shadow-lg", !found ? "border-dashed border-rim bg-panel text-muted-foreground" : loc === l.key ? "border-highlight bg-accent text-accent-foreground" : visited ? "border-good bg-paper text-paper-foreground" : "border-rim bg-paper text-paper-foreground")}
              style={{ left: `${l.x}%`, top: `${l.y}%` }}
              aria-label={found ? `${l.name}${visited ? ", visited" : ""}` : "Unknown place, not found yet"}
            >
              {found ? l.name : "?"}
              {here && <span className="rover-dot" aria-hidden />}
            </button>
          );
        })}
      </div>
      <div className="space-y-2 text-sm">
        {ex && (
          <p className="rounded-lg bg-primary/25 p-2 text-xs font-semibold">
            The rover is out at {LOCATIONS.find((l) => l.key === ex.location)?.name}. It returns at the end of sol {ex.returnSol}.
          </p>
        )}
        {def && plan ? (
          <>
            <h3 className="font-display text-lg font-bold leading-tight">{def.name}</h3>
            <ul className="grid grid-cols-2 gap-1 text-xs">
              <li className="rounded-md bg-secondary px-2 py-1">Distance: {def.distanceKm} km</li>
              <li className="rounded-md bg-secondary px-2 py-1">
                Trip: {plan.sols} sol{plan.sols > 1 ? "s" : ""}
              </li>
              <li className={cn("col-span-2 rounded-md px-2 py-1", plan.risk >= 0.3 ? "bg-bad/40" : "bg-secondary")}>Danger: {Math.round(plan.risk * 100)}% chance of a rough trip</li>
            </ul>
            <div className="text-xs">
              <span className="font-semibold">Costs:</span> <EffectChips effects={plan.cost} compact />
            </div>
            <div className="text-xs">
              <span className="font-semibold">Reward:</span> {def.rewardText}
              <div className="mt-1">
                <EffectChips effects={def.reward} compact />
              </div>
              {state.visited.includes(def.key) && <p className="mt-1 text-muted-foreground">Already visited: a second trip brings back half as much.</p>}
            </div>
            <p className="text-xs font-semibold">Driver ({EXPEDITION_ENERGY} energy, away for the trip):</p>
            <CrewPicker state={state} chosen={driver} onChoose={setDriver} energy={EXPEDITION_ENERGY} bonusRole="pilot" problemFor={(c) => expeditionBlocked(state, def.key, c)} />
            <div className="flex flex-wrap gap-2">
              <Button variant="mission" disabled={!!blocked} onClick={() => onLaunch(def.key, driver)}>
                Send the rover
              </Button>
              {has(state, "rover") && (
                <Button variant="panel" disabled={!!expeditionBlocked(state, def.key, null)} onClick={() => onLaunch(def.key, null)}>
                  Send it alone (robot mode)
                </Button>
              )}
            </div>
            {blocked && blocked !== "Pick a place" && <p className="text-xs text-bad">{blocked}</p>}
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-highlight">Real science: </span>
              {def.fact.text}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Tap a place on the map. The pilot (Sonam) makes trips safer and shorter. Each new place you visit can reveal another one. "?" places can also be found with orbit photos from Earth.</p>
        )}
      </div>
    </div>
  );
}

// ---------- technology ----------
function TechPanel({ state, onUnlock }: { state: GameState; onUnlock: (t: TechKey) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {TECHS.map((t) => {
        const blocked = techBlocked(state, t.key);
        const done = has(state, t.key);
        return (
          <div key={t.key} className={cn("flex flex-col gap-1 rounded-xl border-2 p-2 text-sm", done ? "border-research bg-research/20" : "border-rim bg-panel")} data-tech={t.key}>
            <div className="flex items-start justify-between gap-2">
              <span className="font-display font-bold leading-tight">{t.name}</span>
              <span className="chip shrink-0 bg-research text-paper-foreground">{t.cost} RP</span>
            </div>
            <p className="text-xs leading-snug">{t.benefit}</p>
            {!done && <EffectChips effects={t.effects} compact />}
            <div className="mt-auto pt-1">
              {done ? (
                <span className="font-display text-xs font-bold text-research">Unlocked!</span>
              ) : (
                <Button variant="panel" size="sm" disabled={!!blocked} onClick={() => onUnlock(t.key)} className="h-8 w-full text-xs">
                  {blocked ?? "Unlock"}
                </Button>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
        You have <b>{state.rp} research points</b>. Earn more from experiments, rock drives, exploring and beaming data home. Unlocking doesn't use an astronaut.
      </p>
    </div>
  );
}

// ---------- crew ----------
export function CrewPanel({ state, onCrew }: { state: GameState; onCrew: (id: string) => void }) {
  const latest = state.chatter[0];
  const speaker = latest ? state.crew.find((c) => c.id === latest.crewId) : null;
  return (
    <section className="panel pointer-events-auto p-3" aria-labelledby="crew-title">
      <h2 id="crew-title" className="font-display text-lg font-bold">
        Crew
      </h2>
      <ul className="mt-1 space-y-1.5">
        {state.crew.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onCrew(c.id)} className="flex w-full items-center gap-2 rounded-xl p-1 text-left hover:bg-secondary" data-crew-row={c.id}>
              <img src={PORTRAIT[c.role]} alt="" className={cn("size-10 shrink-0 rounded-full bg-secondary object-cover", c.health <= 0 && "grayscale")} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="truncate font-display text-sm font-bold">{firstName(c.name)}</span>
                  <span className="text-[10px] text-muted-foreground">{c.roleLabel}</span>
                </div>
                <div className="grid grid-cols-3 gap-1" aria-label={`Health ${c.health}, energy ${c.energy}, happiness ${c.morale}`}>
                  <Bar thin value={c.health} className="bg-good" />
                  <Bar thin value={c.energy} className="bg-power" />
                  <Bar thin value={c.morale} className="bg-morale" />
                </div>
                <p className={cn("truncate text-[11px]", c.busy || c.away ? "text-highlight" : "text-muted-foreground")}>{c.activity}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span className="text-good">■ health</span>
        <span className="text-power">■ energy</span>
        <span className="text-morale">■ happiness</span>
      </p>
      {latest && speaker && (
        <div key={`${state.sol}-${latest.text}`} className="animate-pop mt-2 flex items-start gap-2 rounded-xl bg-paper p-2 text-paper-foreground">
          <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="text-xs leading-snug">
            <b>{firstName(speaker.name)}:</b> "{latest.text}"
          </p>
        </div>
      )}
    </section>
  );
}

export function LogPanel({ state }: { state: GameState }) {
  return (
    <section className="panel pointer-events-auto flex min-h-0 flex-col p-3" aria-labelledby="log-title">
      <h2 id="log-title" className="font-display text-sm font-semibold text-muted-foreground">
        Mission log
      </h2>
      <ol className="mt-1 max-h-28 space-y-1 overflow-y-auto pr-1 text-xs leading-snug lg:max-h-36">
        {state.log.map((l, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 font-display font-semibold text-muted-foreground">S{l.sol}</span>
            <span className={cn(l.tone === "bad" && "text-bad", l.tone === "good" && "text-good")}>{l.text}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function tipFor(s: GameState): string {
  const bal = dailyBalance(s);
  const free = s.crew.filter(canWork).length;
  const broken = BUILDING_ORDER.find((k) => s.buildings[k].count > 0 && s.buildings[k].condition <= 0);
  if (Object.keys(s.emptySols).length) return "Emergency! Something is empty. Fix it this sol or the mission ends.";
  if (broken) return `The ${BUILDINGS[broken].name.toLowerCase()} is broken. Tap it on the base to repair it.`;
  if (s.dustStormSols > 0) return "Dust storms block sunlight. Save power and avoid big power jobs until it clears.";
  if (s.res.oxygen < 35 || (bal.oxygen < 0 && s.res.oxygen < 50)) return "Oxygen is low! Repair or build oxygen makers. They need power to run.";
  if (s.res.water < 35 || (bal.water < -3 && s.res.water < 50)) return "Water is low! Dig for ice, run the recycler harder or explore the Frozen Crater.";
  if (s.res.food < 35 || (bal.food < 0 && s.res.food < 50)) return "Food is low! Tend the greenhouse (Manage) for a bigger harvest.";
  if (s.res.power < 25 || bal.power < 0) return "Your base uses more power than it makes. Add solar panels or clean the dusty ones.";
  if (s.dose > DOSE_LIMIT * 0.6) return "Radiation is adding up. Pile on soil and shelter from flares.";
  if (s.crew.some((c) => c.energy < 35)) return "Tired astronauts need a sol off. Anyone without a job rests and gets more energy back.";
  if (s.rp >= 3 && s.techs.length < TECHS.length) return "You have research points! Visit the Tech tab to unlock something new.";
  if (s.materials < 10) return "Low on materials. Salvage spare parts or explore Rocky Canyon.";
  if (s.forecastUntil < s.sol && s.sol > 3 && s.sol % 4 === 0) return "Ask Earth for a Sun forecast so a flare can't surprise you.";
  if (free === s.crew.length) return `Give your crew jobs, then press "End sol ${s.sol}". Astronauts with no job rest.`;
  if (s.sol > 25) return `Only ${MISSION_SOLS - s.sol + 1} sols left! Keep everyone healthy for the trip home.`;
  return "Watch the +/sol numbers: they show what your base makes or uses every day.";
}

export function TipCard({ text }: { text: string }) {
  return (
    <div className="panel pointer-events-auto relative flex items-end gap-2 p-4 pr-2">
      <div className="absolute -top-3 left-4 flex items-center gap-1 rounded-full bg-accent px-3 py-0.5 font-display text-sm font-bold text-accent-foreground">
        <Lightbulb className="size-4" aria-hidden /> Tip
      </div>
      <p className="flex-1 pt-2 text-sm font-semibold leading-snug">{text}</p>
      <img src={astronaut} alt="" width={768} height={1024} className="animate-float -mb-2 w-16 shrink-0 drop-shadow-xl" />
    </div>
  );
}

export const crewDef = (id: string) => CREW_ROSTER.find((c) => c.id === id);
export { conditionLabel };
