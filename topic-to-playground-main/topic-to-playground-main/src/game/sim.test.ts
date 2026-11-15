import { describe, expect, it } from "vitest";
import { ARCHIVED_FLARES, earthMarsDelayMinutes } from "./data";
import {
  ACTIONS,
  DOSE_LIMIT,
  EMPTY_GRACE,
  LOCATIONS,
  MISSION_SOLS,
  RESOURCE_KEYS,
  TECHS,
  advanceSol,
  beginDay,
  blockedReason,
  buildEvent,
  dailyBalance,
  doJob,
  evaluate,
  finishTask,
  isSave,
  launchExpedition,
  newGame,
  nextSol,
  repairBuilding,
  resolveEvent,
  unlockTech,
  upgradeBuilding,
  type GameState,
} from "./sim";

const fresh = (seed = 1) => newGame(seed, ARCHIVED_FLARES, 12);
const calm = (s: GameState): GameState => ({ ...s, schedule: s.schedule.map(() => null) });
const day = (seed = 1) => beginDay(calm(fresh(seed)));
/** End the day on a calm sol and wake up on the next one. */
const endSol = (s: GameState) => nextSol(advanceSol(s));

describe("crew work sites", () => {
  it("an astronaut with a job stands at that job's site until the next sol", () => {
    let s = doJob(day(), "manage-water", "ava");
    expect(s.crew.find((c) => c.id === "ava")!.site).toBe("recycler");
    s = repairBuilding(s, "habitat", "leo");
    expect(s.crew.find((c) => c.id === "leo")!.site).toBe("habitat");
    s = endSol(s);
    expect(s.crew.every((c) => c.site === undefined)).toBe(true);
  });

  it("every job has a work site", () => {
    for (const a of ACTIONS) expect(a.site, a.id).toBeTruthy();
  });
});

describe("mission rules", () => {
  it("no job is free: every job costs at least one thing", () => {
    for (const a of ACTIONS) {
      const costs = Object.entries(a.effects).filter(([k, v]) => (k === "dose" ? v! > 0 : v! < 0));
      expect(costs.length + a.energy > 0 && costs.length, a.id).toBeGreaterThan(0);
    }
  });

  it("each astronaut can do only one job per sol", () => {
    let s = day();
    s = doJob(s, "manage-water", "ava");
    expect(s.crew.find((c) => c.id === "ava")?.busy).toBe(true);
    const again = doJob(s, "comm-family", "ava");
    expect(again).toBe(s);
  });

  it("the sol only ends when you press Advance Sol", () => {
    let s = day();
    s = doJob(s, "manage-water", "ava");
    expect(s.sol).toBe(1);
    expect(s.phase).toBe("day");
    s = advanceSol(s);
    expect(s.phase).toBe("report");
    s = nextSol(s);
    expect(s.sol).toBe(2);
    expect(s.phase).toBe("morning");
    expect(s.crew.every((c) => !c.busy)).toBe(true);
  });

  it("the mission lasts 30 sols and is won after the 30th", () => {
    let s = fresh();
    s = calm(s);
    for (let i = 0; i < MISSION_SOLS; i++) {
      s = beginDay({ ...s, res: { oxygen: 100, power: 100, water: 100, food: 100, shielding: 100 }, crew: s.crew.map((c) => ({ ...c, morale: 100, health: 100 })) });
      s = advanceSol(s);
      if (i < MISSION_SOLS - 1) s = nextSol(s);
    }
    expect(s.status).toBe("won");
    expect(s.sol).toBe(30);
    expect(nextSol(s).phase).toBe("ended");
  });

  it("shielding wears down by 1 every sol", () => {
    const s = day();
    const next = advanceSol(s);
    expect(next.res.shielding).toBe(s.res.shielding - 1);
  });

  it("each sol the base's daily balance is applied", () => {
    const s = day();
    const bal = dailyBalance(s);
    const next = advanceSol(s);
    for (const k of ["oxygen", "water", "food"] as const) expect(next.res[k]).toBe(s.res[k] + bal[k]);
  });

  it("buildings wear out and work at half strength below 50%", () => {
    const s = day();
    const worn = { ...s, buildings: { ...s.buildings, moxie: { ...s.buildings.moxie, condition: 40 } } };
    expect(dailyBalance(worn).oxygen).toBe(dailyBalance(s).oxygen - 3);
    const broken = { ...s, buildings: { ...s.buildings, moxie: { ...s.buildings.moxie, condition: 0 } } };
    expect(dailyBalance(broken).oxygen).toBe(dailyBalance(s).oxygen - 6);
  });

  it("building a solar panel adds 6 power every sol", () => {
    const s = day();
    const built = doJob(s, "build-solar", "leo");
    expect(built.buildings.solar.count).toBe(3);
    expect(dailyBalance(built).power).toBe(dailyBalance(s).power + 6);
  });

  it("the engineer builds with 3 fewer materials", () => {
    const s = day();
    expect(doJob(s, "build-solar", "ava").materials).toBe(s.materials - 5);
    expect(doJob(s, "build-solar", "leo").materials).toBe(s.materials - 8);
  });

  it("repairing raises condition, the engineer repairs more", () => {
    const base = day();
    const s = { ...base, buildings: { ...base.buildings, solar: { ...base.buildings.solar, condition: 30 } } };
    expect(repairBuilding(s, "solar", "ava").buildings.solar.condition).toBe(90);
    expect(repairBuilding(s, "solar", "leo").buildings.solar.condition).toBe(65);
  });

  it("upgrading raises the level and output", () => {
    const s = { ...day(), materials: 30 };
    const up = upgradeBuilding(s, "solar", "ava");
    expect(up.buildings.solar.level).toBe(2);
    expect(dailyBalance(up).power).toBeGreaterThan(dailyBalance(s).power);
  });

  it("dust on the panels lowers solar power, cleaning brings it back", () => {
    const s = day();
    const dusty = { ...s, panelDust: 50 };
    expect(dailyBalance(dusty).power).toBeLessThan(dailyBalance(s).power);
    const cleaning = doJob(dusty, "manage-clean", "sonam");
    expect(cleaning.phase).toBe("task");
    const done = finishTask(cleaning, 1);
    expect(done.panelDust).toBe(0);
    expect(done.phase).toBe("day");
  });

  it("flat batteries shut down the oxygen maker", () => {
    const s = day();
    expect(dailyBalance(s, true).oxygen).toBeLessThan(dailyBalance(s, false).oxygen);
  });

  it("an empty supply gives one sol to fix it, then the mission ends", () => {
    const s = { ...day(), res: { ...day().res, oxygen: 0 }, buildings: { ...day().buildings, moxie: { count: 1, level: 1, condition: 0 } } };
    const first = advanceSol(s);
    expect(first.status).toBe("playing");
    expect(first.emptySols.oxygen).toBe(1);
    let after = nextSol(first);
    for (let i = 1; i < EMPTY_GRACE; i++) after = nextSol(advanceSol(beginDay(after)));
    expect(after.status === "lost" || advanceSol(beginDay(after)).status === "lost").toBe(true);
  });

  it("tired astronauts can't take heavy jobs", () => {
    const s = day();
    const tired = { ...s, crew: s.crew.map((c) => (c.id === "ava" ? { ...c, energy: 20 } : c)) };
    const ava = tired.crew.find((c) => c.id === "ava")!;
    expect(blockedReason(tired, ACTIONS.find((a) => a.id === "build-solar")!, ava)).toContain("tired");
  });

  it("sheltering from a flare gives a smaller dose than working through it", () => {
    const ev = buildEvent(fresh(), { kind: "flare", flareIndex: 0 });
    const [shelter, work] = ev.choices;
    expect(shelter!.effects.dose!).toBeLessThan(work!.effects.dose!);
  });

  it("a forecast from Earth warns about a flare in the next 3 sols", () => {
    const base = day();
    const schedule = [...base.schedule];
    schedule[3] = { kind: "flare", flareIndex: 0 };
    let s = doJob({ ...base, schedule }, "comm-forecast", "priya");
    expect(s.log[0]?.text).toContain("sol 3");
    s = endSol(s);
    s = endSol(beginDay(s));
    s = advanceSol(beginDay(s));
    expect(s.pending?.warned).toBe(true);
    s = resolveEvent(s, "shelter");
    expect(s.phase).toBe("report");
  });

  it("a broken machine event can be fixed with the pipe mini-game", () => {
    const base = day();
    const schedule = [...base.schedule];
    schedule[1] = { kind: "moxieFail" };
    let s = advanceSol({ ...base, schedule });
    expect(s.phase).toBe("event");
    s = resolveEvent(s, "fix");
    expect(s.phase).toBe("task");
    expect(s.task?.kind).toBe("pipes");
    s = finishTask(s, 1);
    expect(s.buildings.moxie.condition).toBeGreaterThanOrEqual(90);
    expect(s.phase).toBe("report");
  });

  it("a dust storm is a two-step event", () => {
    const base = day();
    const schedule = [...base.schedule];
    schedule[1] = { kind: "dust" };
    let s = resolveEvent(advanceSol({ ...base, schedule }), "run");
    expect(s.phase).toBe("event");
    expect(s.pending?.step).toBe(1);
    s = resolveEvent(s, "wait");
    expect(s.dustStormSols).toBeGreaterThan(0);
    expect(s.panelDust).toBeGreaterThanOrEqual(25);
  });

  it("rover trips take sols, bring rewards and find new places", () => {
    let s = { ...day(), res: { ...day().res, power: 100 } };
    const before = s.materials;
    s = launchExpedition(s, "canyon", "ava");
    expect(s.expedition).not.toBeNull();
    expect(s.crew.find((c) => c.id === "ava")?.away).toBe(true);
    s = advanceSol(s);
    expect(s.expedition).toBeNull();
    expect(s.visited).toContain("canyon");
    expect(s.discovered.length).toBe(3);
    expect(s.materials).toBeGreaterThan(before - 1);
  });

  it("the pilot makes long trips shorter", () => {
    const s = { ...day(), discovered: LOCATIONS.map((l) => l.key), res: { ...day().res, power: 100 } };
    expect(launchExpedition(s, "crater", "sonam").expedition?.returnSol).toBe(1);
    expect(launchExpedition(s, "crater", "priya").expedition?.returnSol).toBe(2);
  });

  it("technology costs research points and needs exploring first", () => {
    const s = { ...day(), rp: 10 };
    const t = unlockTech(s, "o2");
    expect(t.techs).toContain("o2");
    expect(t.rp).toBe(10 - TECHS.find((x) => x.key === "o2")!.cost);
    expect(dailyBalance(t).oxygen).toBe(dailyBalance(s).oxygen + 2);
    expect(unlockTech(s, "water")).toBe(s);
  });

  it("jobs you cannot afford are refused", () => {
    const s = { ...day(), res: { ...day().res, power: 5 } };
    expect(doJob(s, "comm-science", "priya")).toBe(s);
  });

  it("resources stay between 0 and 100", () => {
    let s = doJob(day(), "research-ice", "ava");
    s = advanceSol(s);
    for (const k of RESOURCE_KEYS) {
      expect(s.res[k]).toBeGreaterThanOrEqual(0);
      expect(s.res[k]).toBeLessThanOrEqual(100);
    }
  });

  it("radiation at the limit ends the mission", () => {
    const s = { ...day(), dose: DOSE_LIMIT - 0.1 };
    expect(advanceSol(s).status).toBe("lost");
  });

  it("saved games survive a JSON round trip", () => {
    const s = doJob(day(), "manage-water", "ava");
    const back = JSON.parse(JSON.stringify(s));
    expect(isSave(back)).toBe(true);
    expect(advanceSol(back).sol).toBe(1);
  });

  it("Earth–Mars light delay stays within the real 3 to 22 minute range", () => {
    for (let d = 0; d < 800; d += 20) {
      const m = earthMarsDelayMinutes(new Date(Date.UTC(2025, 0, 16) + d * 86_400_000));
      expect(m).toBeGreaterThan(2.5);
      expect(m).toBeLessThan(23);
    }
  });
});

// ---------- whole-mission balance ----------
function careful(s: GameState): GameState {
  const job = (id: string) => ACTIONS.find((a) => a.id === id)!;
  const bal = dailyBalance(s);
  for (const k of ["oxygen", "water", "food"] as const) {
    if (s.res[k] < 45) {
      const fix = { oxygen: "repair-moxie", water: "research-ice", food: "manage-garden" }[k];
      for (const c of s.crew) {
        if (fix === "repair-moxie") s = repairBuilding(s, "moxie", c.id);
        else s = doJob(s, fix, c.id);
        if (s.phase === "task") s = finishTask(s, 0.7);
      }
    }
  }
  if (!s.expedition && s.res.power > 50) {
    const loc = LOCATIONS.find((l) => s.discovered.includes(l.key) && !s.visited.includes(l.key));
    if (loc) s = launchExpedition(s, loc.key, "sonam");
  }
  for (const t of TECHS) s = unlockTech(s, t.key);
  const wants = ["build-solar", "manage-clean", "research-ice", "build-solar", "manage-garden", "build-shield", "build-greenhouse", "research-quake", "manage-salvage", "comm-forecast", "comm-family", "manage-movie", "build-recycler", "build-moxie", "research-plants", "manage-water"];
  for (const key of ["moxie", "recycler", "solar", "greenhouse", "habitat", "antenna", "rover"] as const) {
    if (s.buildings[key].condition < 50) for (const c of s.crew) if (!c.busy) s = repairBuilding(s, key, c.id);
    if (s.phase === "task") s = finishTask(s, 0.7);
  }
  for (const c of s.crew) {
    for (const id of wants) {
      if (c.energy < 60 && id !== "comm-family") continue;
      if (id === "build-solar" && bal.power > 6) continue;
      if (id === "manage-clean" && s.panelDust < 25) continue;
      if (id === "research-ice" && s.res.water > 75) continue;
      if (id === "manage-garden" && s.res.food > 75) continue;
      if (id === "build-shield" && s.res.shielding > 70) continue;
      if (id === "comm-family" && (s.crew.find((x) => x.id === c.id)?.morale ?? 100) > 60) continue;
      if (blockedReason(s, job(id), s.crew.find((x) => x.id === c.id)!)) continue;
      s = doJob(s, id, c.id);
      if (s.phase === "task") s = finishTask(s, 0.7);
      break;
    }
  }
  return s;
}

function playMission(seed: number, strategy: "careful" | "random"): GameState {
  let s = newGame(seed, ARCHIVED_FLARES, 12);
  let r = seed;
  const rnd = () => ((r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let guard = 0; guard < 400 && s.status === "playing"; guard++) {
    s = beginDay(s);
    if (strategy === "careful") s = careful(s);
    else {
      for (const c of s.crew) {
        const a = ACTIONS[Math.floor(rnd() * ACTIONS.length)]!;
        s = doJob(s, a.id, c.id);
        if (s.phase === "task") s = finishTask(s, rnd());
      }
    }
    s = advanceSol(s);
    while (s.phase === "event" || s.phase === "task") {
      if (s.phase === "event") s = resolveEvent(s, strategy === "careful" ? s.pending!.choices[0]!.id : s.pending!.choices[Math.floor(rnd() * s.pending!.choices.length)]!.id);
      else s = finishTask(s, strategy === "careful" ? 0.7 : rnd());
    }
    s = nextSol(s);
  }
  return s;
}

describe("mission balance", () => {
  it("a careful commander usually wins, random choices often lose", () => {
    const seeds = Array.from({ length: 60 }, (_, i) => i + 1);
    const careWins = seeds.filter((x) => playMission(x, "careful").status === "won").length;
    const randWins = seeds.filter((x) => playMission(x, "random").status === "won").length;
    console.log(`careful ${careWins}/60, random ${randWins}/60`);
    expect(careWins).toBeGreaterThanOrEqual(45);
    expect(randWins).toBeLessThan(careWins);
    const won = playMission(1, "careful");
    expect(evaluate(won).score).toBeGreaterThan(0);
  }, 20000);
});
