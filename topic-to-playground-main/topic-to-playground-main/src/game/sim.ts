// Mission rules. Plain TypeScript: no React, no DOM. The UI only renders this state
// and calls the exported actions (beginDay, doJob, advanceSol, resolveEvent, ...).
import { FACTS, type Fact, type Flare } from "./data";
import {
  ACHIEVEMENTS,
  ACTIONS,
  BUILDINGS,
  BUILDING_ORDER,
  CHAPTERS,
  CREW_ROSTER,
  DOSE_LIMIT,
  EVA_DOSE,
  LOCATIONS,
  MAX_LEVEL,
  MISSION_SOLS,
  OBJECTIVE_REWARD,
  RESOURCE_KEYS,
  START_LOCATIONS,
  TECHS,
  type AchievementKey,
  type Action,
  type BuildingKey,
  type Effects,
  type LocationKey,
  type MiniKind,
  type ObjectiveKey,
  type ResourceKey,
  type Role,
  type TechKey,
  type WorkSite,
} from "./content";

export * from "./content";

export const SAVE_VERSION = 2;

/** Curiosity RAD, Gale crater surface (Hassler et al. 2014). */
export const SURFACE_DOSE_PER_SOL = 0.64;
/** Best-case fraction of radiation a full habitat shield blocks (game estimate). */
export const SHIELD_BLOCK_MAX = 0.6;
export const SHIELD_WEAR = 1;
export const SOLAR_OUTPUT = 6;
export const CREW_OXYGEN_USE = 8;
export const CREW_WATER_USE = 8;
export const CREW_FOOD_USE = 8;
export const DUST_PER_SOL = 3;
export const STORM_DUST_PER_SOL = 10;
export const STORM_SOLAR_FACTOR = 0.35;
export const DUST_STORM_SOLS = 3;
/** Sols a resource may sit at 0 before the mission ends. */
export const EMPTY_GRACE = 2;
export const FLARE_BASE_DOSE = { X: 8, M: 3, C: 1 } as const;
export const SHELTER_FACTOR = 0.2;

// ---------- state ----------
export interface Building {
  count: number;
  level: number;
  /** 0 = broken, 100 = like new. Below 50 it works at half strength. */
  condition: number;
}

export interface Astronaut {
  id: string;
  name: string;
  role: Role;
  roleLabel: string;
  health: number;
  energy: number;
  morale: number;
  /** What they're doing right now. */
  activity: string;
  /** Already has a job this sol. */
  busy: boolean;
  away: boolean;
  /** Where they are working today, if they have a job at the base. */
  site?: WorkSite | undefined;
}

export interface Expedition {
  location: LocationKey;
  crewId: string | null;
  startSol: number;
  returnSol: number;
}

export type EventKind = "flare" | "dust" | "moxieFail" | "recyclerFail" | "blight" | "blackout" | "roverBreak" | "cold" | "discovery" | "quake" | "leak" | "message" | "bloom";

export interface ScheduledEvent {
  kind: EventKind;
  flareIndex?: number;
}

export interface EventChoice {
  id: string;
  label: string;
  detail: string;
  effects: Effects;
  task?: MiniKind;
}

export interface GameEvent {
  kind: EventKind;
  step: number;
  tone: "danger" | "warning" | "good";
  title: string;
  story: string;
  /** Short countdown or deadline shown in the alert. */
  countdown?: string;
  /** What will keep happening after this sol. */
  longTerm?: string;
  fact: Fact;
  choices: EventChoice[];
  flare?: Flare;
  warned?: boolean;
}

export type TaskSource =
  | { type: "job"; actionId: string; crewId: string }
  | { type: "repair"; building: BuildingKey; crewId: string }
  | { type: "event"; kind: EventKind; choiceId: string };

export interface Task {
  kind: MiniKind;
  seed: number;
  title: string;
  source: TaskSource;
}

export interface LogEntry {
  sol: number;
  text: string;
  tone: "good" | "bad" | "info";
}

export interface ChatLine {
  crewId: string;
  text: string;
}

export interface SolReport {
  sol: number;
  deltas: Effects;
  notes: string[];
  unlocked: string[];
}

export type Phase = "morning" | "day" | "event" | "task" | "report" | "ended";
export type Status = "playing" | "won" | "lost";

export interface Stats {
  builds: number;
  repairs: number;
  upgrades: number;
  trips: number;
  flares: number;
  storms: number;
  goodTask: boolean;
}

interface Snapshot {
  res: Record<ResourceKey, number>;
  materials: number;
  rp: number;
  dose: number;
  morale: number;
  health: number;
}

export interface GameState {
  version: number;
  sol: number;
  phase: Phase;
  status: Status;
  endReason?: string | undefined;
  res: Record<ResourceKey, number>;
  materials: number;
  /** Research points to spend on technology. */
  rp: number;
  rpEarned: number;
  dose: number;
  crew: Astronaut[];
  buildings: Record<BuildingKey, Building>;
  panelDust: number;
  dustStormSols: number;
  coldSols: number;
  blackoutSols: number;
  iceSupply: boolean;
  forecastUntil: number;
  emptySols: Partial<Record<ResourceKey, number>>;
  techs: TechKey[];
  discovered: LocationKey[];
  visited: LocationKey[];
  expedition: Expedition | null;
  schedule: (ScheduledEvent | null)[];
  flares: Flare[];
  flareSource: "live" | "archived";
  delayMinutes: number;
  pending: GameEvent | null;
  task: Task | null;
  report: SolReport | null;
  morning: string[];
  chatter: ChatLine[];
  log: LogEntry[];
  objectivesDone: ObjectiveKey[];
  achievements: AchievementKey[];
  stats: Stats;
  solStart?: Snapshot | undefined;
  rng: number;
}

// ---------- random ----------
function nextRandom(seed: number): [number, number] {
  const t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t];
}

function rand(s: GameState): number {
  const [v, n] = nextRandom(s.rng);
  s.rng = n;
  return v;
}

function makeRandom(seed: number) {
  let x = seed >>> 0;
  return () => {
    const [v, n] = nextRandom(x);
    x = n;
    return v;
  };
}

function pick<T>(r: () => number, list: readonly T[]): T {
  return list[Math.floor(r() * list.length)] ?? (list[0] as T);
}

// ---------- helpers ----------
const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const clone = (s: GameState): GameState => structuredClone(s);

export const chapterFor = (sol: number) => CHAPTERS.find((c) => sol >= c.from && sol <= c.to) ?? CHAPTERS[CHAPTERS.length - 1]!;
export const locationDef = (k: LocationKey) => LOCATIONS.find((l) => l.key === k)!;
export const techDef = (k: TechKey) => TECHS.find((t) => t.key === k)!;
export const has = (s: Pick<GameState, "techs">, t: TechKey) => s.techs.includes(t);

/** 1 when working well (50+), 0.5 when worn, 0 when broken. */
export function conditionFactor(c: number) {
  return c <= 0 ? 0 : c < 50 ? 0.5 : 1;
}
export function conditionLabel(c: number) {
  return c <= 0 ? "Broken" : c < 50 ? "Worn: half strength" : c < 75 ? "OK" : "Working well";
}
const levelFactor = (lvl: number) => 1 + 0.3 * (lvl - 1);

export function avg(crew: Astronaut[], key: "health" | "energy" | "morale") {
  return crew.length ? crew.reduce((n, c) => n + c[key], 0) / crew.length : 0;
}
export const teamMorale = (s: Pick<GameState, "crew">) => Math.round(avg(s.crew, "morale"));
export const atBase = (s: Pick<GameState, "crew">) => s.crew.filter((c) => !c.away);
export const canWork = (c: Astronaut) => !c.away && !c.busy && c.health > 0;
const roleHome = (s: GameState, role: Role) => s.crew.some((c) => c.role === role && !c.away && c.health > 0);

export function shieldFactor(s: Pick<GameState, "res" | "techs">) {
  return (1 - SHIELD_BLOCK_MAX * (s.res.shielding / 100)) * (has(s, "rad") ? 0.7 : 1);
}

function pushLog(s: GameState, text: string, tone: LogEntry["tone"]) {
  s.log = [{ sol: s.sol, text, tone }, ...s.log].slice(0, 50);
}

/** Applies a change to the base. Morale and health go to every astronaut at the base. */
export function applyEffects(s: GameState, e: Effects) {
  for (const k of RESOURCE_KEYS) if (e[k]) s.res[k] = clamp(s.res[k] + (e[k] ?? 0));
  if (e.materials) s.materials = clamp(s.materials + e.materials, 0, 99);
  if (e.research) {
    s.rp = Math.max(0, s.rp + e.research);
    if (e.research > 0) s.rpEarned += e.research;
  }
  if (e.dose) s.dose = round1(s.dose + e.dose);
  for (const c of s.crew) {
    if (c.away) continue;
    if (e.morale) c.morale = clamp(c.morale + e.morale);
    if (e.health) c.health = clamp(c.health + e.health);
  }
}

function snapshot(s: GameState): Snapshot {
  return { res: { ...s.res }, materials: s.materials, rp: s.rpEarned, dose: s.dose, morale: teamMorale(s), health: Math.round(avg(s.crew, "health")) };
}

function diff(a: Snapshot, b: Snapshot): Effects {
  const d: Effects = {};
  for (const k of RESOURCE_KEYS) if (Math.round(b.res[k] - a.res[k])) d[k] = Math.round(b.res[k] - a.res[k]);
  if (b.materials !== a.materials) d.materials = b.materials - a.materials;
  if (b.rp !== a.rp) d.research = b.rp - a.rp;
  if (b.dose !== a.dose) d.dose = round1(b.dose - a.dose);
  if (b.morale !== a.morale) d.morale = b.morale - a.morale;
  if (b.health !== a.health) d.health = b.health - a.health;
  return d;
}

function grant(s: GameState, key: AchievementKey, unlocked?: string[]) {
  if (s.achievements.includes(key)) return;
  s.achievements.push(key);
  const name = ACHIEVEMENTS.find((a) => a.key === key)?.name ?? key;
  pushLog(s, `Achievement unlocked: ${name}!`, "good");
  unlocked?.push(`Achievement: ${name}`);
}

// ---------- production ----------
export type Flow = Partial<Record<ResourceKey, number>>;

/** What each building makes (+) and uses (−) every sol right now. */
export function buildingFlows(s: GameState, shortage = false): Record<BuildingKey | "crew" | "other", Flow> {
  const b = s.buildings;
  const f = (k: BuildingKey) => conditionFactor(b[k].condition) * levelFactor(b[k].level);
  const dustFactor = (1 - 0.6 * (s.panelDust / 100)) * (s.dustStormSols > 0 ? STORM_SOLAR_FACTOR : 1);
  const solarEach = SOLAR_OUTPUT + (has(s, "solar") ? 1 : 0);
  const habitatPower = Math.max(2, 6 + (s.coldSols > 0 ? 5 : 0) - 2 * (b.habitat.level - 1));
  const habitatLeak = b.habitat.condition <= 0 ? -5 : b.habitat.condition < 50 ? -2 : 0;
  const plantsWatered = s.res.water > 5;
  const ghFood = 5 + (has(s, "hydro") ? 2 : 0) + (roleHome(s, "botanist") ? 1 : 0);
  const moxieOn = !shortage && b.moxie.condition > 0;
  const recyclerOn = !shortage && b.recycler.condition > 0;
  return {
    habitat: { power: -habitatPower, ...(habitatLeak ? { oxygen: habitatLeak } : {}) },
    solar: { power: Math.round(b.solar.count * solarEach * f("solar") * dustFactor) },
    greenhouse: {
      food: plantsWatered ? Math.round(b.greenhouse.count * ghFood * f("greenhouse")) : 0,
      oxygen: Math.round(b.greenhouse.count * 2 * conditionFactor(b.greenhouse.condition)),
      water: -b.greenhouse.count * (has(s, "hydro") ? 1 : 2),
    },
    moxie: { oxygen: moxieOn ? Math.round(b.moxie.count * 6 * f("moxie")) : 0, power: b.moxie.condition > 0 ? -3 * b.moxie.count : 0 },
    recycler: { water: recyclerOn ? Math.round(b.recycler.count * 6 * f("recycler")) : 0, power: b.recycler.condition > 0 ? -2 * b.recycler.count : 0 },
    antenna: { power: b.antenna.condition > 0 ? -1 : 0 },
    rover: {},
    crew: { oxygen: -(CREW_OXYGEN_USE - (has(s, "o2") ? 2 : 0)), water: -CREW_WATER_USE, food: -CREW_FOOD_USE },
    other: { shielding: -SHIELD_WEAR, water: (has(s, "water") ? 2 : 0) + (s.iceSupply ? 3 : 0) },
  };
}

export type DailyBalance = Record<ResourceKey, number>;

/** What the whole base makes minus what it uses each sol, before jobs and events. */
export function dailyBalance(s: GameState, shortage = false): DailyBalance {
  const total: DailyBalance = { oxygen: 0, power: 0, water: 0, food: 0, shielding: 0 };
  for (const flow of Object.values(buildingFlows(s, shortage))) for (const k of RESOURCE_KEYS) total[k] += flow[k] ?? 0;
  return total;
}

/** Sols until a resource runs out at today's rate, or null if it isn't dropping. */
export function solsLeft(s: GameState, k: ResourceKey): number | null {
  const bal = dailyBalance(s)[k];
  if (bal >= 0) return null;
  return Math.floor(s.res[k] / -bal);
}

// ---------- setup ----------
export function buildSchedule(seed: number, flareCount: number): (ScheduledEvent | null)[] {
  const r = makeRandom(seed ^ 0x9e3779b9);
  const schedule: (ScheduledEvent | null)[] = new Array(MISSION_SOLS + 1).fill(null);
  const flare = (): ScheduledEvent => ({ kind: "flare", flareIndex: Math.floor(r() * Math.max(1, flareCount)) });
  const pools: { from: number; to: number; chance: number; kinds: EventKind[] }[] = [
    { from: 2, to: 5, chance: 0.5, kinds: ["discovery", "message", "bloom", "quake", "flare"] },
    { from: 6, to: 10, chance: 0.7, kinds: ["moxieFail", "recyclerFail", "leak", "blight", "flare", "dust", "message", "cold"] },
    { from: 11, to: 15, chance: 0.6, kinds: ["discovery", "roverBreak", "flare", "quake", "bloom", "cold", "message"] },
    { from: 16, to: 23, chance: 0.8, kinds: ["flare", "flare", "dust", "cold", "blackout", "leak", "quake", "moxieFail", "recyclerFail", "blight"] },
    { from: 24, to: 30, chance: 0.65, kinds: ["flare", "dust", "leak", "cold", "bloom", "message", "discovery"] },
  ];
  let lastDust = -10;
  let blackout = false;
  for (const p of pools) {
    for (let sol = p.from; sol <= p.to; sol++) {
      if (r() > p.chance) continue;
      let kind = pick(r, p.kinds);
      if (kind === "dust" && sol - lastDust < 7) kind = "quake";
      if (kind === "blackout" && blackout) kind = "discovery";
      if (kind === "dust") lastDust = sol;
      if (kind === "blackout") blackout = true;
      schedule[sol] = kind === "flare" ? flare() : { kind };
    }
  }
  const count = (k: EventKind) => schedule.filter((e) => e?.kind === k).length;
  const place = (from: number, to: number, ev: () => ScheduledEvent) => {
    for (let guard = 0; guard < 100; guard++) {
      const sol = from + Math.floor(r() * (to - from + 1));
      const cur = schedule[sol];
      if (!cur || (cur.kind !== "flare" && cur.kind !== "dust")) {
        schedule[sol] = ev();
        return;
      }
    }
  };
  while (count("flare") < 3) place(4, MISSION_SOLS, flare);
  if (count("dust") < 1) place(12, 22, () => ({ kind: "dust" }));
  if (!schedule.slice(6, 11).some((e) => e?.kind === "moxieFail" || e?.kind === "recyclerFail")) place(6, 10, () => ({ kind: r() < 0.5 ? "moxieFail" : "recyclerFail" }));
  return schedule;
}

export function newGame(seed: number, flares: Flare[], delayMinutes: number, flareSource: "live" | "archived" = flares[0]?.source === "live" ? "live" : "archived"): GameState {
  const building = (count: number, condition = 90): Building => ({ count, level: 1, condition });
  const s: GameState = {
    version: SAVE_VERSION,
    sol: 1,
    phase: "morning",
    status: "playing",
    res: { oxygen: 85, power: 70, water: 85, food: 85, shielding: 50 },
    materials: 25,
    rp: 0,
    rpEarned: 0,
    dose: 0,
    crew: CREW_ROSTER.map((c) => ({ id: c.id, name: c.name, role: c.role, roleLabel: c.roleLabel, health: 100, energy: 100, morale: 85, activity: "Unpacking", busy: false, away: false })),
    buildings: { habitat: building(1), solar: building(2), greenhouse: building(1), moxie: building(1), recycler: building(1), antenna: building(1), rover: building(1, 100) },
    panelDust: 0,
    dustStormSols: 0,
    coldSols: 0,
    blackoutSols: 0,
    iceSupply: false,
    forecastUntil: 0,
    emptySols: {},
    techs: [],
    discovered: [...START_LOCATIONS],
    visited: [],
    expedition: null,
    schedule: buildSchedule(seed, flares.length),
    flares,
    flareSource,
    delayMinutes,
    pending: null,
    task: null,
    report: null,
    morning: ["Touchdown! Your crew of four landed safely in Valles Marineris.", "Chapter 1: Landing. Set up the base and learn how everything connects."],
    chatter: [{ crewId: "ava", text: "Everyone ready? Let's get this base running!" }],
    log: [{ sol: 1, text: "Touchdown! Keep the crew safe for 30 sols until the rocket home arrives.", tone: "info" }],
    objectivesDone: [],
    achievements: [],
    stats: { builds: 0, repairs: 0, upgrades: 0, trips: 0, flares: 0, storms: 0, goodTask: false },
    rng: seed >>> 0,
  };
  return s;
}

/** Morning report read: start the working day. */
export function beginDay(state: GameState): GameState {
  if (state.phase !== "morning") return state;
  const s = clone(state);
  s.phase = "day";
  s.solStart = snapshot(s);
  return s;
}

// ---------- jobs ----------
/** The job's real effects for this astronaut, including speciality bonuses. */
export function jobEffects(s: GameState, action: Action, crew: Astronaut | null): Effects {
  const e: Effects = { ...action.effects };
  const role = crew?.role;
  if (role === "engineer" && action.build) e.materials = (e.materials ?? 0) + 3;
  if (role === "engineer" && action.id === "build-shield") e.shielding = (e.shielding ?? 0) + 5;
  if (role === "engineer" && action.id === "manage-salvage") e.materials = (e.materials ?? 0) + 3;
  if (role === "scientist" && (action.id === "research-plants" || action.id === "research-quake")) e.research = (e.research ?? 0) + 1;
  if (action.id === "research-ice" && has(s, "water")) e.water = (e.water ?? 0) + 8;
  return e;
}

function costProblem(s: GameState, e: Effects): string | null {
  for (const k of RESOURCE_KEYS) {
    const d = e[k] ?? 0;
    if (d < 0 && s.res[k] + d < 0) return `Not enough ${k}`;
  }
  if ((e.materials ?? 0) < 0 && s.materials + (e.materials ?? 0) < 0) return "Not enough materials";
  return null;
}

export function crewProblem(c: Astronaut, energy: number): string | null {
  if (c.away) return `${c.name.split(" ")[0]} is out exploring`;
  if (c.health <= 0) return `${c.name.split(" ")[0]} is in the sick bay`;
  if (c.busy) return `${c.name.split(" ")[0]} already has a job today`;
  if (c.energy < energy) return `${c.name.split(" ")[0]} is too tired`;
  if (c.morale < 10) return `${c.name.split(" ")[0]} is too sad to work`;
  return null;
}

/** Why a job can't be done right now (by anyone, or by this astronaut), or null. */
export function blockedReason(s: GameState, action: Action, crew: Astronaut | null = null): string | null {
  const b = action.build ? s.buildings[action.build] : null;
  if (b && action.max !== undefined && b.count >= action.max) return "Already built the most you can";
  if (action.needsAntenna && s.blackoutSols > 0) return "No signal: the Sun is blocking Earth";
  if (action.needsAntenna && s.buildings.antenna.condition <= 0) return "The antenna is broken";
  if (action.needsRover && (s.expedition || s.buildings.rover.condition < 30)) return s.expedition ? "The rover is out exploring" : "The rover needs repairs";
  if (action.id === "manage-clean" && s.panelDust < 5) return "Panels are already clean";
  if (action.id === "manage-garden" && s.buildings.greenhouse.condition <= 0) return "The greenhouse is broken";
  if (action.id === "manage-water" && s.buildings.recycler.condition <= 0) return "The recycler is broken";
  if (action.forecast && s.forecastUntil > s.sol) return "You already have a forecast";
  if (action.mapPhotos && s.discovered.length >= LOCATIONS.length) return "Every place is already on the map";
  const cost = costProblem(s, jobEffects(s, action, crew));
  if (cost) return cost;
  if (crew) return crewProblem(crew, action.energy);
  if (!s.crew.some((c) => !crewProblem(c, action.energy))) return "Nobody has the energy for this";
  return null;
}

function startTask(s: GameState, kind: MiniKind, title: string, source: TaskSource) {
  s.task = { kind, title, source, seed: Math.floor(rand(s) * 2 ** 31) };
  s.phase = "task";
}

function setWorker(s: GameState, crewId: string, energy: number, activity: string, site?: WorkSite): Astronaut | null {
  const c = s.crew.find((x) => x.id === crewId);
  if (!c) return null;
  c.energy = clamp(c.energy - energy);
  c.busy = true;
  c.activity = activity;
  c.site = site;
  return c;
}

/** Give one astronaut one job for today. */
export function doJob(state: GameState, actionId: string, crewId: string): GameState {
  if (state.phase !== "day" || state.status !== "playing") return state;
  const action = ACTIONS.find((a) => a.id === actionId);
  const who = state.crew.find((c) => c.id === crewId) ?? null;
  if (!action || !who || blockedReason(state, action, who)) return state;
  const s = clone(state);
  const effects = jobEffects(s, action, who);
  applyEffects(s, effects);
  const c = setWorker(s, crewId, action.energy, action.title, action.site)!;
  const first = c.name.split(" ")[0];
  if (action.build) {
    const b = s.buildings[action.build];
    b.condition = Math.round((b.condition * b.count + 100) / (b.count + 1));
    b.count += 1;
    s.stats.builds += 1;
    grant(s, "builder");
    pushLog(s, `${first} built a new ${BUILDINGS[action.build].name.toLowerCase().replace(/s$/, "")}.`, "good");
  } else if (action.forecast) {
    const until = s.sol + 3 + 2 * (s.buildings.antenna.level - 1);
    const coming = s.schedule
      .map((e, sol) => ({ e, sol }))
      .filter(({ e, sol }) => e?.kind === "flare" && sol > s.sol && sol <= until)
      .map(({ e, sol }) => `sol ${sol} (${s.flares[e!.flareIndex ?? 0]?.classType ?? "?"})`);
    s.forecastUntil = until;
    pushLog(s, coming.length ? `Earth replied after ${Math.round(s.delayMinutes)} minutes: flare coming on ${coming.join(", ")}!` : `Earth replied after ${Math.round(s.delayMinutes)} minutes: no flares expected until sol ${until}.`, coming.length ? "bad" : "good");
  } else if (action.mapPhotos) {
    const found = LOCATIONS.find((l) => !s.discovered.includes(l.key));
    if (found) {
      s.discovered.push(found.key);
      pushLog(s, `Orbit photos found a new place: ${found.name}!`, "good");
    }
  } else {
    pushLog(s, `${first}: ${action.title}.`, "info");
  }
  if (action.task) startTask(s, action.task, action.title, { type: "job", actionId, crewId });
  return s;
}

export function repairCost(s: GameState, key: BuildingKey): Effects {
  return { materials: -BUILDINGS[key].repairMaterials, power: -2 };
}
export function upgradeCost(s: GameState, key: BuildingKey): Effects {
  return { materials: -8 * s.buildings[key].level, power: -6 };
}
export const REPAIR_ENERGY = 30;
export const UPGRADE_ENERGY = 40;

export function repairBlocked(s: GameState, key: BuildingKey, crew: Astronaut | null): string | null {
  const b = s.buildings[key];
  if (b.count <= 0) return "Nothing to repair yet";
  if (b.condition >= 95) return "Already in great shape";
  if (key === "rover" && s.expedition) return "The rover is out exploring";
  return costProblem(s, repairCost(s, key)) ?? (crew ? crewProblem(crew, REPAIR_ENERGY) : null);
}
export function upgradeBlocked(s: GameState, key: BuildingKey, crew: Astronaut | null): string | null {
  const b = s.buildings[key];
  if (b.count <= 0) return "Build one first";
  if (b.level >= MAX_LEVEL) return "Fully upgraded";
  if (b.condition < 50) return "Repair it first";
  if (key === "rover" && s.expedition) return "The rover is out exploring";
  return costProblem(s, upgradeCost(s, key)) ?? (crew ? crewProblem(crew, UPGRADE_ENERGY) : null);
}

export function repairBuilding(state: GameState, key: BuildingKey, crewId: string): GameState {
  if (state.phase !== "day") return state;
  const who = state.crew.find((c) => c.id === crewId) ?? null;
  if (!who || repairBlocked(state, key, who)) return state;
  const s = clone(state);
  applyEffects(s, repairCost(s, key));
  const def = BUILDINGS[key];
  const c = setWorker(s, crewId, REPAIR_ENERGY, `Repairing the ${def.name.toLowerCase()}`, key)!;
  if (def.repairTask) {
    startTask(s, def.repairTask, `Repair the ${def.name.toLowerCase()}`, { type: "repair", building: key, crewId });
    return s;
  }
  const b = s.buildings[key];
  b.condition = clamp(b.condition + (c.role === "engineer" ? 60 : 35));
  finishRepair(s, key, c.name);
  return s;
}

function finishRepair(s: GameState, key: BuildingKey, name: string) {
  s.stats.repairs += 1;
  if (s.stats.repairs >= 3) grant(s, "fixer");
  pushLog(s, `${name.split(" ")[0]} repaired the ${BUILDINGS[key].name.toLowerCase()} (${s.buildings[key].condition}%).`, "good");
}

export function upgradeBuilding(state: GameState, key: BuildingKey, crewId: string): GameState {
  if (state.phase !== "day") return state;
  const who = state.crew.find((c) => c.id === crewId) ?? null;
  if (!who || upgradeBlocked(state, key, who)) return state;
  const s = clone(state);
  applyEffects(s, upgradeCost(s, key));
  const c = setWorker(s, crewId, UPGRADE_ENERGY, `Upgrading the ${BUILDINGS[key].name.toLowerCase()}`, key)!;
  s.buildings[key].level += 1;
  s.stats.upgrades += 1;
  pushLog(s, `${c.name.split(" ")[0]} upgraded the ${BUILDINGS[key].name.toLowerCase()} to level ${s.buildings[key].level}.`, "good");
  return s;
}

// ---------- exploration ----------
export const EXPEDITION_ENERGY = 40;

export function tripPlan(s: GameState, key: LocationKey, crew: Astronaut | null) {
  const loc = locationDef(key);
  const pilot = crew?.role === "pilot";
  const sols = pilot && loc.sols > 1 ? loc.sols - 1 : loc.sols;
  const roverLevel = s.buildings.rover.level;
  let risk = loc.risk * (pilot ? 0.5 : 1) * (has(s, "rover") ? 0.6 : 1) * (1 - 0.3 * (roverLevel - 1));
  if (s.buildings.rover.condition < 50) risk *= 1.5;
  return { sols, risk: Math.min(0.9, Math.round(risk * 100) / 100), cost: loc.cost };
}

export function expeditionBlocked(s: GameState, key: LocationKey, crew: Astronaut | null): string | null {
  if (!s.discovered.includes(key)) return "Not found yet";
  if (s.expedition) return "The rover is already out";
  if (s.buildings.rover.condition < 30) return "The rover needs repairs first";
  if (!crew && !has(s, "rover")) return "Choose a driver (or unlock Autonomous rover)";
  const plan = tripPlan(s, key, crew);
  if (s.sol + plan.sols - 1 > MISSION_SOLS) return "Not enough sols left for this trip";
  return costProblem(s, plan.cost) ?? (crew ? crewProblem(crew, EXPEDITION_ENERGY) : null);
}

export function launchExpedition(state: GameState, key: LocationKey, crewId: string | null): GameState {
  if (state.phase !== "day") return state;
  const who = crewId ? (state.crew.find((c) => c.id === crewId) ?? null) : null;
  if (crewId && !who) return state;
  if (expeditionBlocked(state, key, who)) return state;
  const s = clone(state);
  const plan = tripPlan(s, key, who);
  applyEffects(s, plan.cost);
  const loc = locationDef(key);
  if (crewId) {
    const c = setWorker(s, crewId, EXPEDITION_ENERGY, `Driving to ${loc.name}`)!;
    c.away = true;
  }
  s.expedition = { location: key, crewId, startSol: s.sol, returnSol: s.sol + plan.sols - 1 };
  pushLog(s, `${who ? who.name.split(" ")[0] : "The robot rover"} set off for ${loc.name} (${loc.distanceKm} km). Back after sol ${s.expedition.returnSol}.`, "info");
  return s;
}

function finishExpedition(s: GameState, notes: string[], unlocked: string[]) {
  const ex = s.expedition;
  if (!ex) return;
  const loc = locationDef(ex.location);
  const crew = ex.crewId ? (s.crew.find((c) => c.id === ex.crewId) ?? null) : null;
  const plan = tripPlan(s, ex.location, crew);
  const trouble = rand(s) < plan.risk;
  const firstVisit = !s.visited.includes(loc.key);
  const reward: Effects = {};
  for (const [k, v] of Object.entries(loc.reward) as [keyof Effects, number][]) {
    let n = firstVisit ? v : Math.floor(v / 2);
    if (k === "research" && !firstVisit) n = 0;
    if (trouble) n = Math.floor(n / 2);
    if (n) reward[k] = n;
  }
  applyEffects(s, reward);
  const rover = s.buildings.rover;
  rover.condition = clamp(rover.condition - (trouble ? 30 : 8));
  if (crew) {
    crew.away = false;
    crew.activity = "Back from the trip";
    if (trouble) crew.health = clamp(crew.health - 10);
    crew.morale = clamp(crew.morale + (trouble ? -5 : 8));
  }
  if (firstVisit) s.visited.push(loc.key);
  if (loc.key === "ice" && firstVisit) s.iceSupply = true;
  s.stats.trips += 1;
  const who = crew ? crew.name.split(" ")[0] : "The robot rover";
  const text = trouble
    ? `${who} came back from ${loc.name}, but the trip was rough: the rover got banged up and half the haul was lost.`
    : `${who} came back from ${loc.name}! ${firstVisit ? loc.discovery : "Nothing new there this time."}`;
  notes.push(text);
  pushLog(s, text, trouble ? "bad" : "good");
  if (firstVisit) {
    const next = LOCATIONS.find((l) => !s.discovered.includes(l.key));
    if (next) {
      s.discovered.push(next.key);
      notes.push(`The crew spotted a new place on the horizon: ${next.name}.`);
    }
  }
  if (s.discovered.length >= LOCATIONS.length) grant(s, "explorer", unlocked);
  s.expedition = null;
}

// ---------- technology ----------
export function techBlocked(s: GameState, key: TechKey): string | null {
  const t = techDef(key);
  if (has(s, key)) return "Unlocked";
  if (t.needsVisit && !s.visited.includes(t.needsVisit)) return `Explore ${locationDef(t.needsVisit).name} first`;
  if (s.rp < t.cost) return `Needs ${t.cost} research points`;
  return costProblem(s, t.effects);
}

export function unlockTech(state: GameState, key: TechKey): GameState {
  if (state.phase !== "day" || techBlocked(state, key)) return state;
  const s = clone(state);
  const t = techDef(key);
  s.rp -= t.cost;
  applyEffects(s, t.effects);
  s.techs.push(key);
  if (s.techs.length >= 3) grant(s, "brain");
  pushLog(s, `New technology: ${t.name}! ${t.benefit}.`, "good");
  return s;
}

// ---------- events ----------
export function flareStrength(classType: string): "X" | "M" | "C" {
  const c = classType.trim().charAt(0).toUpperCase();
  return c === "X" ? "X" : c === "M" ? "M" : "C";
}

/** Can this scheduled event happen right now? Otherwise a discovery happens instead. */
function eventPossible(s: GameState, kind: EventKind): boolean {
  const b = s.buildings;
  switch (kind) {
    case "moxieFail":
      return b.moxie.count > 0 && b.moxie.condition > 0;
    case "recyclerFail":
      return b.recycler.count > 0 && b.recycler.condition > 0;
    case "blight":
      return b.greenhouse.count > 0 && b.greenhouse.condition > 0;
    case "roverBreak":
      return !s.expedition && b.rover.condition > 0;
    case "message":
      return s.blackoutSols <= 0 && b.antenna.condition > 0;
    case "dust":
      return s.dustStormSols <= 0;
    case "cold":
      return s.coldSols <= 0;
    default:
      return true;
  }
}

function lastsText(s: GameState, k: ResourceKey, withoutOutput: number): string {
  const bal = dailyBalance(s)[k] - withoutOutput;
  if (bal >= 0) return `Your ${k} won't drop yet, but the base is weaker without it.`;
  return `Without it, ${k} runs out in about ${Math.max(0, Math.floor(s.res[k] / -bal))} sols!`;
}

export function buildEvent(s: GameState, ev: ScheduledEvent, step = 0): GameEvent {
  const delay = Math.round(s.delayMinutes);
  const flows = buildingFlows(s);
  switch (ev.kind) {
    case "flare": {
      const flare = s.flares[ev.flareIndex ?? 0] ?? { classType: "M5.0", date: "unknown" };
      const strength = flareStrength(flare.classType);
      const base = FLARE_BASE_DOSE[strength] * (has(s, "rad") ? 0.7 : 1);
      const warned = s.forecastUntil >= s.sol;
      const exposed = round1(FLARE_BASE_DOSE[strength] * shieldFactor(s));
      const glitch = s.res.shielding < 40 ? (strength === "X" ? -10 : strength === "M" ? -5 : 0) : 0;
      return {
        kind: "flare",
        step,
        tone: "danger",
        flare,
        warned,
        title: `${strength}-class solar flare!`,
        story: warned ? "Earth warned you this was coming, so the storm shelter is ready." : "No warning! A burst of radiation is racing in from the Sun.",
        countdown: warned ? "Shelter ready: you have time to get inside" : "Particles arrive in minutes!",
        fact: strength === "X" ? FACTS.may2024 : FACTS.flareClass,
        choices: [
          { id: "shelter", label: "Everyone into the storm shelter", detail: warned ? "Shelter was prepared early, so it costs less" : "Rushing in costs power and spoils the crew's day", effects: { dose: round1(base * SHELTER_FACTOR), power: warned ? -3 : -8, morale: warned ? -1 : -4 } },
          { id: "work", label: "Keep working", detail: glitch ? "Thin walls let radiation reach the crew and fry some electronics" : "Your walls block some radiation, but not all", effects: { dose: exposed, health: -Math.round(exposed * 1.5), ...(glitch ? { power: glitch } : {}) } },
        ],
      };
    }
    case "dust":
      if (step === 0)
        return {
          kind: "dust",
          step,
          tone: "warning",
          title: "Dust storm rolling in",
          story: "A huge orange cloud is swallowing the sky. Solar panels will make only about a third of their power.",
          countdown: `The storm lasts ${DUST_STORM_SOLS} sols`,
          longTerm: "Less sunlight and extra dust on the panels every sol",
          fact: FACTS.dust2018,
          choices: [
            { id: "save", label: "Power down the extras", detail: "Charge the batteries before the dark days", effects: { power: 8, morale: -4 } },
            { id: "run", label: "Keep everything running", detail: "Business as usual for now", effects: {} },
          ],
        };
      return {
        kind: "dust",
        step,
        tone: "warning",
        title: "Dust is piling on the panels",
        story: "Fine red dust is settling on the solar panels like flour. Someone could go out and brush it off.",
        countdown: `${DUST_STORM_SOLS} stormy sols ahead`,
        fact: FACTS.dust2018,
        choices: [
          { id: "clean", label: "Spacewalk to clean them", detail: "Play: brush off the dust yourself", effects: { oxygen: -2, dose: EVA_DOSE }, task: "solar" },
          { id: "wait", label: "Wait it out inside", detail: "Safe, but panels get much dustier (+25 dust)", effects: { morale: -2 } },
        ],
      };
    case "moxieFail":
    case "recyclerFail": {
      const key = ev.kind === "moxieFail" ? "moxie" : "recycler";
      const res: ResourceKey = key === "moxie" ? "oxygen" : "water";
      const out = (key === "moxie" ? flows.moxie.oxygen : flows.recycler.water) ?? 0;
      return {
        kind: ev.kind,
        step,
        tone: "danger",
        title: key === "moxie" ? "The oxygen maker stopped!" : "The water recycler broke!",
        story: key === "moxie" ? "A pipe cracked in the freezing night and the oxygen maker shut itself off." : "Fine Mars dust clogged the pipes and the water recycler stopped.",
        countdown: lastsText(s, res, out),
        longTerm: "A switched-off machine stays broken until someone repairs it",
        fact: key === "moxie" ? FACTS.moxie : FACTS.water,
        choices: [
          { id: "fix", label: "Fix the pipes now", detail: "Play: connect the pipes. Better repair = machine in better shape", effects: { materials: -3 }, task: "pipes" },
          { id: "patch", label: "Quick patch", detail: "Works, but only at 40% condition", effects: { materials: -6, power: -4 } },
          { id: "off", label: "Switch it off for now", detail: "Free today, but it stays broken", effects: {} },
        ],
      };
    }
    case "blight":
      return {
        kind: "blight",
        step,
        tone: "danger",
        title: "Food shortage: the plants are sick!",
        story: "A fuzzy mold is spreading through the greenhouse. The leaves are drooping.",
        countdown: s.res.food < 40 ? `Food is already at ${Math.round(s.res.food)}%` : "Act before the whole crop is lost",
        longTerm: "A damaged greenhouse grows less food every sol",
        fact: FACTS.zinnia,
        choices: [
          { id: "save", label: "Nurse the plants back", detail: "Play: give each plant the right water", effects: { water: -4 }, task: "greenhouse" },
          { id: "pull", label: "Pull out the sick plants", detail: "Lose food now, greenhouse only a bit damaged", effects: { food: -8 } },
          { id: "ration", label: "Eat emergency rations", detail: "Saves food, but the mold wrecks the greenhouse", effects: { food: -3, morale: -6 } },
        ],
      };
    case "blackout":
      return {
        kind: "blackout",
        step,
        tone: "warning",
        title: "Radio blackout!",
        story: "The Sun has moved right between Earth and Mars. Its glare will scramble radio signals.",
        countdown: "No contact with Earth for 3 sols",
        longTerm: "Communicate jobs and forecasts won't work during the blackout",
        fact: FACTS.conjunction,
        choices: [
          { id: "dump", label: "Send a big data dump first", detail: "Beam everything home before the signal goes", effects: { power: -10, research: 1 } },
          { id: "letters", label: "Record letters to send later", detail: "Crew misses home a bit", effects: { morale: -3 } },
        ],
      };
    case "roverBreak":
      return {
        kind: "roverBreak",
        step,
        tone: "warning",
        title: "Rover wheel cracked!",
        story: "Sharp rocks punched a hole in one of the rover's metal wheels.",
        countdown: "The rover can't explore below 30% condition",
        fact: FACTS.spirit,
        choices: [
          { id: "fix", label: "Fix it right away", detail: "A spacewalk to swap the wheel", effects: { materials: -5, dose: EVA_DOSE } },
          { id: "careful", label: "Drive it carefully", detail: "Rover loses 30% condition", effects: {} },
          { id: "park", label: "Park it for now", detail: "Rover is broken until repaired", effects: { morale: -2 } },
        ],
      };
    case "cold":
      return {
        kind: "cold",
        step,
        tone: "warning",
        title: "Extreme cold snap!",
        story: "Tonight will be colder than −90 °C. The habitat walls are frosting over.",
        countdown: "The cold lasts 2 sols",
        longTerm: "Heaters use 5 extra power every sol while it's cold",
        fact: FACTS.cold,
        choices: [
          { id: "heat", label: "Turn up the heaters", detail: "Warm and safe, but uses extra power for 2 sols", effects: { power: -4 } },
          { id: "huddle", label: "Huddle in one warm module", detail: "No extra power, but cramped and chilly", effects: { morale: -8, health: -5 } },
          { id: "fuel", label: "Burn spare fuel cells", detail: "Uses up building materials", effects: { materials: -6 } },
        ],
      };
    case "discovery":
      return {
        kind: "discovery",
        step,
        tone: "good",
        title: "Something strange in the rocks!",
        story: "Priya spotted rocks with thin stripes right outside the airlock.",
        fact: FACTS.lakes,
        choices: [
          { id: "study", label: "Study them closely", detail: "Uses the lab's power", effects: { research: 2, power: -6 } },
          { id: "keep", label: "Collect one for Earth", detail: "A cool souvenir cheers everyone up", effects: { research: 1, morale: 6 } },
        ],
      };
    case "quake":
      return {
        kind: "quake",
        step,
        tone: "warning",
        title: "Marsquake!",
        story: "The ground shook! Cracks opened in the soil piled on your habitat.",
        longTerm: "Leaving it makes the habitat weaker",
        fact: FACTS.quakes,
        choices: [
          { id: "fix", label: "Fix the cracks now", detail: "Uses the digger and some materials", effects: { power: -6, materials: -3, shielding: -3 } },
          { id: "later", label: "Leave it for now", detail: "Shielding drops and the habitat gets damaged", effects: { shielding: -10, morale: -2 } },
        ],
      };
    case "leak":
      return {
        kind: "leak",
        step,
        tone: "danger",
        title: "Air leak!",
        story: "A pipe in the air system is hissing. Precious air is escaping into the thin Martian sky.",
        countdown: "Every hour leaks more air",
        fact: FACTS.thinAir,
        choices: [
          { id: "reroute", label: "Reroute the air pipes", detail: "Play: connect the pipes. Faster fix = less air lost", effects: {}, task: "pipes" },
          { id: "patch", label: "Patch with spare parts", detail: "Quick and sure", effects: { materials: -5, oxygen: -3 } },
          { id: "seal", label: "Close off that module", detail: "Less air lost, but everyone is squeezed together", effects: { oxygen: -2, morale: -8 } },
        ],
      };
    case "message":
      return {
        kind: "message",
        step,
        tone: "good",
        title: "Message from home",
        story: `Your families sent a video! Travelling at the speed of light, it took about ${delay} minutes to reach Mars.`,
        fact: FACTS.delay,
        choices: [
          { id: "reply", label: "Record a video reply", detail: "The antenna needs power", effects: { power: -5, morale: 10 } },
          { id: "save", label: "Just watch it", detail: "Saves power", effects: { morale: 3 } },
        ],
      };
    case "bloom":
      return {
        kind: "bloom",
        step,
        tone: "good",
        title: "Bumper harvest!",
        story: "The greenhouse tomatoes and lettuce grew faster than expected.",
        fact: FACTS.veggie,
        choices: [
          { id: "party", label: "Have a pizza party", detail: "Fresh food makes the crew happy", effects: { food: 4, morale: 12 } },
          { id: "store", label: "Save it for later", detail: "More food in the store room", effects: { food: 10 } },
        ],
      };
  }
}

/** End the working day: space weather and surprises happen, then the sol ends. */
export function advanceSol(state: GameState): GameState {
  if (state.phase !== "day" || state.status !== "playing") return state;
  const s = clone(state);
  let ev = s.schedule[s.sol] ?? null;
  if (ev && !eventPossible(s, ev.kind)) ev = { kind: "discovery" };
  if (ev) {
    s.pending = buildEvent(s, ev);
    s.phase = "event";
    return s;
  }
  return closeSol(s, []);
}

function applyEventChoice(s: GameState, ev: GameEvent, choiceId: string, notes: string[]) {
  const b = s.buildings;
  switch (ev.kind) {
    case "flare":
      s.stats.flares += 1;
      if (s.stats.flares >= 3) grant(s, "sunShield");
      break;
    case "dust":
      if (ev.step === 0) s.dustStormSols = DUST_STORM_SOLS;
      if (ev.step === 1 && choiceId === "wait") s.panelDust = clamp(s.panelDust + 25);
      break;
    case "moxieFail":
    case "recyclerFail": {
      const key = ev.kind === "moxieFail" ? "moxie" : "recycler";
      if (choiceId === "patch") b[key].condition = 40;
      if (choiceId === "off") {
        b[key].condition = 0;
        notes.push(`The ${BUILDINGS[key].name.toLowerCase()} is off. Repair it from the base view.`);
      }
      if (choiceId === "fix") b[key].condition = 0; // the mini-game sets the final condition
      break;
    }
    case "blight":
      if (choiceId === "pull") b.greenhouse.condition = clamp(b.greenhouse.condition - 10);
      if (choiceId === "ration") b.greenhouse.condition = clamp(b.greenhouse.condition - 35);
      break;
    case "blackout":
      s.blackoutSols = 3;
      break;
    case "roverBreak":
      if (choiceId === "fix") b.rover.condition = Math.max(b.rover.condition - 5, 60);
      if (choiceId === "careful") b.rover.condition = clamp(b.rover.condition - 30);
      if (choiceId === "park") b.rover.condition = 0;
      break;
    case "cold":
      if (choiceId === "heat") s.coldSols = 2;
      break;
    case "quake":
      b.habitat.condition = clamp(b.habitat.condition - (choiceId === "later" ? 25 : 5));
      break;
    default:
      break;
  }
}

export function resolveEvent(state: GameState, choiceId: string): GameState {
  const ev = state.pending;
  if (state.phase !== "event" || !ev) return state;
  const choice = ev.choices.find((c) => c.id === choiceId);
  if (!choice) return state;
  const s = clone(state);
  const notes: string[] = [];
  applyEffects(s, choice.effects);
  applyEventChoice(s, ev, choiceId, notes);
  pushLog(s, `${ev.title} You chose: ${choice.label}.`, ev.tone === "good" ? "good" : "bad");
  s.pending = null;
  if (choice.task) {
    startTask(s, choice.task, choice.label, { type: "event", kind: ev.kind, choiceId });
    return s;
  }
  if (ev.kind === "dust" && ev.step === 0) {
    s.pending = buildEvent(s, { kind: "dust" }, 1);
    return s;
  }
  return closeSol(s, notes);
}

/** A mini-game finished with a score from 0 to 1. */
export function finishTask(state: GameState, rawScore: number): GameState {
  const task = state.task;
  if (state.phase !== "task" || !task) return state;
  const score = clamp(Number.isFinite(rawScore) ? rawScore : 0, 0, 1);
  const s = clone(state);
  s.task = null;
  if (score >= 0.6) s.stats.goodTask = true;
  const pct = Math.round(score * 100);
  const src = task.source;
  const b = s.buildings;
  const crew = "crewId" in src ? s.crew.find((c) => c.id === src.crewId) : undefined;
  const engineer = crew?.role === "engineer";
  if (task.kind === "pipes" && score >= 1) grant(s, "pipeMaster");
  if (task.kind === "solar" && score >= 0.9) grant(s, "sparkle");
  if (task.kind === "greenhouse" && score >= 0.9) grant(s, "greenThumb");
  if (task.kind === "rover" && score >= 0.99) grant(s, "driver");

  if (src.type === "job") {
    if (src.actionId === "manage-clean") {
      s.panelDust = clamp(s.panelDust - Math.round(100 * score));
      pushLog(s, `Panels cleaned (${pct}%). Dust left: ${s.panelDust}%.`, "good");
    } else if (src.actionId === "manage-garden") {
      const food = Math.round(3 + 9 * score) + (crew?.role === "botanist" ? 3 : 0);
      applyEffects(s, { food });
      b.greenhouse.condition = clamp(b.greenhouse.condition + Math.round(20 * score));
      pushLog(s, `Harvest score ${pct}%: +${food} food.`, "good");
    } else if (src.actionId === "research-drive") {
      const rp = 1 + Math.round(2 * score) + (crew?.role === "pilot" ? 1 : 0);
      applyEffects(s, { research: rp });
      b.rover.condition = clamp(b.rover.condition - 5);
      pushLog(s, `Rock drive done (${pct}%): +${rp} research points.`, "good");
    }
    s.phase = "day";
    return s;
  }
  if (src.type === "repair") {
    b[src.building].condition = clamp(b[src.building].condition + 30 + Math.round(60 * score) + (engineer ? 10 : 0));
    finishRepair(s, src.building, crew?.name ?? "The crew");
    s.phase = "day";
    return s;
  }
  // Event follow-ups end the sol.
  const notes: string[] = [];
  const helper = s.crew.some((c) => c.role === "engineer" && !c.away && c.health > 0);
  switch (src.kind) {
    case "dust":
      s.panelDust = clamp(s.panelDust - Math.round(100 * score));
      notes.push(`Spacewalk cleaned the panels (${pct}%).`);
      break;
    case "moxieFail":
    case "recyclerFail": {
      const key = src.kind === "moxieFail" ? "moxie" : "recycler";
      b[key].condition = clamp(25 + Math.round(65 * score) + (helper ? 10 : 0));
      notes.push(`Pipe repair score ${pct}%: the ${BUILDINGS[key].name.toLowerCase()} is back at ${b[key].condition}%.`);
      s.stats.repairs += 1;
      if (s.stats.repairs >= 3) grant(s, "fixer");
      break;
    }
    case "blight": {
      const food = Math.round(14 * score - 6);
      applyEffects(s, { food });
      b.greenhouse.condition = clamp(b.greenhouse.condition + Math.round(50 * score - 30));
      notes.push(`Plant rescue score ${pct}%: ${food >= 0 ? "+" : ""}${food} food.`);
      break;
    }
    case "leak": {
      const lost = 1 + Math.round(10 * (1 - score));
      applyEffects(s, { oxygen: -lost });
      notes.push(`Air pipes rerouted (${pct}%). Lost ${lost} oxygen.`);
      break;
    }
    default:
      break;
  }
  return closeSol(s, notes);
}

// ---------- end of sol ----------
const CHATTER: Record<Role, string[]> = {
  engineer: ["I tightened every bolt on the habitat today!", "The dust here is finer than flour. It gets into everything!", "If it squeaks, I can fix it."],
  botanist: ["The lettuce sprouted! Fresh salad soon!", "Plants make oxygen. They're my favourite crewmates.", "I'm talking to the tomatoes. They seem to like it."],
  scientist: ["Sunsets on Mars are blue! The dust scatters the light.", "I found a rock that looks just like a potato.", "Every sample tells us a story about old Mars."],
  pilot: ["The rover's wheels are ready for adventure.", "From the ridge you can see the whole canyon!", "Mars has the tallest volcano in the solar system. Road trip?"],
};

function chatterFor(s: GameState): ChatLine {
  const by = (role: Role) => s.crew.find((c) => c.role === role)!;
  const tired = s.crew.find((c) => !c.away && c.energy < 25);
  const sad = s.crew.find((c) => !c.away && c.morale < 35);
  if (s.res.oxygen < 30) return { crewId: by("engineer").id, text: "The air feels thin. We need more oxygen, fast!" };
  if (s.res.food < 30) return { crewId: by("botanist").id, text: "My tummy is rumbling. We need a bigger harvest!" };
  if (s.res.water < 30) return { crewId: by("scientist").id, text: "Every drop counts. Can someone dig for ice?" };
  if (s.res.power < 15) return { crewId: by("engineer").id, text: "The lights are flickering. We need more solar power." };
  if (s.dose > DOSE_LIMIT * 0.6) return { crewId: by("scientist").id, text: "My radiation badge keeps climbing. More shielding, please!" };
  if (tired) return { crewId: tired.id, text: "I'm so tired... can I have a rest tomorrow?" };
  if (sad) return { crewId: sad.id, text: "I miss home. A call with my family would really help." };
  if (s.panelDust > 40) return { crewId: by("pilot").id, text: "The solar panels look like they're covered in cinnamon!" };
  const crew = pick(() => rand(s), s.crew.filter((c) => !c.away));
  return { crewId: crew.id, text: pick(() => rand(s), CHATTER[crew.role]) };
}

export function objectiveDone(s: GameState, key: ObjectiveKey): boolean {
  switch (key) {
    case "build1":
      return s.stats.builds >= 1;
    case "fix1":
      return s.stats.repairs + s.stats.upgrades >= 1;
    case "minigame":
      return s.stats.goodTask;
    case "tech1":
      return s.techs.length >= 1;
    case "trips2":
      return s.stats.trips >= 2;
    case "find4":
      return s.discovered.length >= 4;
    case "flares2":
      return s.stats.flares >= 2;
    case "tech3":
      return s.techs.length >= 3;
    case "visit4":
      return s.visited.length >= 4;
    case "healthy":
      return s.sol >= MISSION_SOLS && s.crew.every((c) => c.health >= 50);
  }
}

function lossReason(s: GameState): string | null {
  for (const k of ["oxygen", "water", "food"] as const) {
    if ((s.emptySols[k] ?? 0) >= EMPTY_GRACE) {
      if (k === "oxygen") return "The habitat ran out of oxygen. Oxygen makers and plants both need power and repairs to keep working.";
      if (k === "water") return "The crew ran out of water. On Mars every drop has to be recycled or dug out of ice.";
      return "The food ran out. Greenhouses need water, care and repairs, or the crew goes hungry.";
    }
  }
  if (s.crew.every((c) => c.health <= 0)) return "Every astronaut ended up in the sick bay. Nobody was left to run the base.";
  if (teamMorale(s) <= 0) return "The crew became too tired and unhappy to keep working. Rest and contact with home matter too!";
  if (s.dose >= DOSE_LIMIT) return "The crew soaked up too much radiation and had to head home. Thicker shielding and sheltering from flares keep doses low.";
  return null;
}

function closeSol(s: GameState, notes: string[]): GameState {
  const unlocked: string[] = [];
  // Rover trips come home.
  if (s.expedition && s.sol >= s.expedition.returnSol) finishExpedition(s, notes, unlocked);
  // The base runs: production, use, wear and radiation.
  const first = dailyBalance(s);
  const shortage = s.res.power + first.power < 0;
  const bal = shortage ? dailyBalance(s, true) : first;
  if (shortage) notes.push("Batteries ran flat! The oxygen maker and water recycler shut down.");
  if (s.dustStormSols > 0) notes.push("Dust storm: the panels made much less power.");
  if (s.coldSols > 0) notes.push("Cold snap: the heaters used extra power.");
  applyEffects(s, { ...bal, dose: round1(SURFACE_DOSE_PER_SOL * shieldFactor(s)) });
  if (shortage) s.res.power = 0;
  s.panelDust = clamp(s.panelDust + (s.dustStormSols > 0 ? STORM_DUST_PER_SOL : DUST_PER_SOL) * (has(s, "solar") ? 0.5 : 1));
  for (const key of BUILDING_ORDER) {
    const b = s.buildings[key];
    if (b.count > 0 && b.condition > 0) {
      const before = b.condition;
      b.condition = clamp(b.condition - BUILDINGS[key].wear);
      if (before >= 50 && b.condition < 50) notes.push(`The ${BUILDINGS[key].name.toLowerCase()} is wearing out and works at half strength. Repair it!`);
    }
  }
  // Empty supplies are an emergency with a short countdown.
  for (const k of ["oxygen", "water", "food"] as const) {
    if (s.res[k] <= 0) {
      s.emptySols[k] = (s.emptySols[k] ?? 0) + 1;
      if ((s.emptySols[k] ?? 0) < EMPTY_GRACE) notes.push(`EMERGENCY: ${k} is empty! Fix it next sol or the mission ends.`);
    } else delete s.emptySols[k];
  }
  // The crew.
  const lows = (["oxygen", "water", "food"] as const).filter((k) => s.res[k] < 20);
  const empty = (["oxygen", "water", "food"] as const).some((k) => s.res[k] <= 0);
  for (const c of s.crew) {
    if (c.away) {
      c.energy = clamp(c.energy + 10);
      continue;
    }
    c.energy = clamp(c.energy + (c.busy ? 15 : 35));
    let mood = -1 + (c.busy ? 0 : 2) - (lows.length ? 4 : 0) - (shortage ? 3 : 0) - (c.energy < 20 ? 3 : 0);
    if (!lows.length && s.res.power > 30 && c.health > 70) mood += 1;
    c.morale = clamp(c.morale + mood);
    const wasSick = c.health <= 0;
    c.health = clamp(c.health + (empty ? -15 : lows.length ? -4 : wasSick ? 10 : 4) - (c.energy < 15 ? 3 : 0));
    if (!wasSick && c.health <= 0) notes.push(`${c.name.split(" ")[0]} is sick and must rest in the sick bay.`);
  }
  // Weather moves on.
  if (s.dustStormSols > 0) {
    s.dustStormSols -= 1;
    if (s.dustStormSols === 0) {
      s.stats.storms += 1;
      grant(s, "storm", unlocked);
      notes.push("The dust storm is over. Blue skies... well, pink ones!");
    }
  }
  s.coldSols = Math.max(0, s.coldSols - 1);
  if (s.blackoutSols > 0) {
    s.blackoutSols -= 1;
    if (s.blackoutSols === 0) notes.push("The radio blackout is over. Earth can hear you again!");
  }
  // Goals.
  for (const ch of CHAPTERS) {
    for (const o of ch.objectives) {
      if (!s.objectivesDone.includes(o.key) && objectiveDone(s, o.key)) {
        s.objectivesDone.push(o.key);
        applyEffects(s, OBJECTIVE_REWARD);
        unlocked.push(`Goal complete: ${o.text} (+5 materials, +5 morale)`);
        pushLog(s, `Goal complete: ${o.text}!`, "good");
      }
    }
  }
  const line = chatterFor(s);
  s.chatter = [line, ...s.chatter].slice(0, 6);
  const before = s.solStart ?? snapshot(s);
  s.report = { sol: s.sol, deltas: diff(before, snapshot(s)), notes, unlocked };
  s.solStart = undefined;
  const reason = lossReason(s);
  if (reason) {
    s.status = "lost";
    s.endReason = reason;
    pushLog(s, reason, "bad");
  } else if (s.sol >= MISSION_SOLS) {
    s.status = "won";
    s.endReason = "Mission complete! The rocket home has landed.";
    if (s.dose < DOSE_LIMIT / 2) grant(s, "safe");
    if (s.crew.every((c) => c.health >= 60 && c.morale >= 60)) grant(s, "team");
    pushLog(s, "Mission complete!", "good");
  }
  s.phase = "report";
  return s;
}

/** After the end-of-sol report: wake up on the next sol (or end the mission). */
export function nextSol(state: GameState): GameState {
  if (state.phase !== "report") return state;
  const s = clone(state);
  if (s.status !== "playing") {
    s.phase = "ended";
    return s;
  }
  const prevChapter = chapterFor(s.sol);
  s.sol += 1;
  const chapter = chapterFor(s.sol);
  const morning: string[] = [];
  if (chapter.n !== prevChapter.n) morning.push(`Chapter ${chapter.n}: ${chapter.name}. ${chapter.story}`);
  for (const c of s.crew) {
    c.busy = false;
    c.site = undefined;
    c.activity = c.away ? "Out exploring" : c.health <= 0 ? "Resting in the sick bay" : c.energy < 30 ? "Tired, needs rest" : "Ready for work";
  }
  if (s.expedition) {
    const loc = locationDef(s.expedition.location);
    morning.push(`The rover is out at ${loc.name}. It comes back at the end of sol ${s.expedition.returnSol}.`);
  }
  if (s.dustStormSols > 0) morning.push(`Dust storm: ${s.dustStormSols} more sol${s.dustStormSols > 1 ? "s" : ""}. Panels make much less power.`);
  if (s.coldSols > 0) morning.push("Cold snap: heaters are using extra power.");
  if (s.blackoutSols > 0) morning.push(`Radio blackout: no contact with Earth for ${s.blackoutSols} more sol${s.blackoutSols > 1 ? "s" : ""}.`);
  for (const key of BUILDING_ORDER) if (s.buildings[key].count > 0 && s.buildings[key].condition <= 0) morning.push(`The ${BUILDINGS[key].name.toLowerCase()} is broken. Tap it on the base to repair it.`);
  for (const k of ["oxygen", "water", "food"] as const) if (s.emptySols[k]) morning.push(`EMERGENCY: ${k} is empty! Get some before the sol ends or the mission is over.`);
  if (s.panelDust >= 40) morning.push(`The solar panels are ${Math.round(s.panelDust)}% dusty. Cleaning them gives more power.`);
  if (s.sol === MISSION_SOLS) morning.push("Final sol! The rocket home lands tonight.");
  s.morning = morning.length ? morning : ["A calm morning on Mars. The crew is ready for orders."];
  s.phase = "morning";
  s.report = null;
  return s;
}

// ---------- results ----------
export interface Evaluation {
  score: number;
  title: string;
  stars: number;
  parts: { label: string; points: number; max: number }[];
}

export function evaluate(s: GameState): Evaluation {
  const survived = s.status === "won" ? MISSION_SOLS : Math.max(0, s.sol - 1);
  const avgRes = (s.res.oxygen + s.res.water + s.res.food + s.res.power) / 4;
  const parts = [
    { label: "Sols survived", points: Math.round((survived / MISSION_SOLS) * 40), max: 40 },
    { label: "Crew health", points: Math.round(avg(s.crew, "health") / 5), max: 20 },
    { label: "Research", points: Math.min(15, s.rpEarned * 1), max: 15 },
    { label: "Exploration", points: Math.min(15, s.visited.length * 3), max: 15 },
    { label: "Supplies left", points: Math.round(avgRes / 10), max: 10 },
  ];
  const score = parts.reduce((n, p) => n + p.points, 0);
  const title = s.status !== "won" ? "Brave Commander" : score >= 85 ? "Legendary Commander" : score >= 70 ? "Expert Commander" : score >= 55 ? "Skilled Commander" : "Rookie Commander";
  const stars = s.status !== "won" ? 0 : score >= 85 ? 3 : score >= 65 ? 2 : 1;
  return { score, title, stars, parts };
}

// ---------- saving ----------
export function isSave(x: unknown): x is GameState {
  if (!x || typeof x !== "object") return false;
  const o = x as Partial<GameState>;
  return o.version === SAVE_VERSION && typeof o.sol === "number" && Array.isArray(o.crew) && !!o.buildings && !!o.res && Array.isArray(o.schedule);
}
