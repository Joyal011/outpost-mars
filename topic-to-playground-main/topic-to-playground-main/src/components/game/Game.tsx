import { useCallback, useEffect, useRef, useState } from "react";
import { CircleHelp, Settings } from "lucide-react";
import workingAstronaut from "@/assets/astronaut-working.png";
import crewWalker from "@/assets/crew-walker.png";
import crewCarrier from "@/assets/crew-carrier.png";
import { Button } from "@/components/ui/button";
import { earthMarsDelayMinutes } from "@/game/data";
import {
  advanceSol,
  beginDay,
  doJob,
  finishTask,
  isSave,
  launchExpedition,
  newGame,
  nextSol,
  repairBuilding,
  resolveEvent,
  unlockTech,
  upgradeBuilding,
  type BuildingKey,
  type GameState,
  type Tab,
} from "@/game/sim";
import { useSpaceWeather } from "@/game/useSpaceWeather";
import { BuildingDialog, CrewDialog, EndDialog, EventDialog, HelpDialog, MorningDialog, ReportDialog, SettingsDialog, TaskDialog, TitleDialog } from "./Dialogs";
import { ResourceBars, SiteCard, SolCard, StatusRow, Timeline } from "./Hud";
import { ActionPanel, BaseCard, CrewPanel, LogPanel, TabMenu, TipCard, tipFor } from "./Panels";
import { Scene } from "./Scene";
import { isMuted, play, setMuted } from "./sound";

const SAVE_KEY = "outpost-mars-save";
const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

function loadSave(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSave(parsed) && parsed.phase !== "ended" ? parsed : null;
  } catch {
    return null;
  }
}

export function Game() {
  const weather = useSpaceWeather();
  const [state, setState] = useState<GameState>(() => newGame(1, weather.flares, earthMarsDelayMinutes(new Date())));
  const [started, setStarted] = useState(false);
  const [saved, setSaved] = useState<GameState | null>(null);
  const [tab, setTab] = useState<Tab>("build");
  const [building, setBuilding] = useState<BuildingKey | null>(null);
  const [crewId, setCrewId] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [settings, setSettings] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [flash, setFlash] = useState(0);
  const prev = useRef<GameState | null>(null);

  // Browser-only reads happen after hydration.
  useEffect(() => {
    setSaved(loadSave());
    setMutedState(isMuted());
  }, []);

  // Keep the mission saved so a refresh doesn't lose it.
  useEffect(() => {
    if (!started) return;
    try {
      if (state.phase === "ended") localStorage.removeItem(SAVE_KEY);
      else localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch {
      /* storage may be blocked */
    }
  }, [state, started]);

  // Sounds and flare flash when the phase changes.
  useEffect(() => {
    const p = prev.current;
    prev.current = state;
    if (!started || !p || p.phase === state.phase) return;
    if (state.phase === "event" && state.pending) {
      if (state.pending.kind === "flare") setFlash((f) => f + 1);
      play(state.pending.tone === "good" ? "good" : "alarm");
    } else if (state.phase === "report") play("sol");
    else if (state.phase === "ended") play(state.status === "won" ? "win" : "bad");
  }, [state, started]);

  const update = useCallback((fn: (s: GameState) => GameState) => setState((s) => fn(s)), []);

  const start = useCallback(() => {
    setState(newGame(randomSeed(), weather.flares, earthMarsDelayMinutes(new Date())));
    prev.current = null;
    setStarted(true);
    setSaved(null);
    setTab("build");
    setBuilding(null);
    setCrewId(null);
    setSettings(false);
    play("click");
  }, [weather.flares]);

  const resume = useCallback(() => {
    if (!saved) return;
    setState(saved);
    prev.current = saved;
    setStarted(true);
    setSaved(null);
    play("click");
  }, [saved]);

  const onMute = (m: boolean) => {
    setMuted(m);
    setMutedState(m);
  };

  // Dev hook for automated checks.
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __game: unknown }).__game = { state };
  }, [state]);

  return (
    <div className="relative min-h-screen overflow-hidden" data-scene-ready={started ? "true" : undefined}>
      <Scene state={state} onBuilding={setBuilding} />
      <div className="bg-sky-fade pointer-events-none absolute inset-0" />
      {state.dustStormSols > 0 && <div className="dust-haze pointer-events-none absolute inset-0" />}
      {flash > 0 && <div key={flash} className="flare-flash pointer-events-none absolute inset-0 z-40" />}

      <div className="pointer-events-none relative z-10 flex min-h-screen flex-col gap-3 p-3 lg:p-4">
        <header className="flex flex-wrap items-stretch gap-3">
          <SolCard state={state} />
          <ResourceBars state={state} />
          <div className="pointer-events-auto flex gap-2">
            <Button variant="panel" size="iconLg" aria-label="How to play" onClick={() => setHelp(true)}>
              <CircleHelp />
            </Button>
            <Button variant="panel" size="iconLg" aria-label="Settings" onClick={() => setSettings(true)}>
              <Settings />
            </Button>
          </div>
        </header>

        <StatusRow state={state} weather={weather} />

        <main className="grid flex-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
          <aside className="flex flex-col gap-3">
            <TabMenu tab={tab} onTab={setTab} />
            <BaseCard state={state} onBuilding={setBuilding} />
            <div className="mt-auto hidden lg:block">
              <SiteCard />
            </div>
          </aside>

          <div className="flex min-h-[18rem] flex-col justify-end">
            <div className="pointer-events-none relative min-h-40 flex-1 lg:min-h-48" aria-hidden="true">
              <div className="astronaut-work absolute bottom-3 left-[6%] w-28 sm:w-32">
                <img src={workingAstronaut} alt="" loading="lazy" width={1024} height={768} className="h-auto w-full" />
                <span className="repair-spark absolute left-[53%] top-[48%]" />
              </div>
              <div className="crew-path crew-path-a absolute bottom-2">
                <img src={crewWalker} alt="" loading="lazy" width={136} height={240} className="crew-bob h-14 w-auto sm:h-16" />
              </div>
              <div className="crew-path crew-path-b absolute bottom-5">
                <img src={crewCarrier} alt="" loading="lazy" width={160} height={240} className="crew-bob h-12 w-auto sm:h-14" />
              </div>
            </div>
            <div className="pointer-events-auto">
              <ActionPanel
                state={state}
                tab={tab}
                onJob={(actionId, id) => {
                  play("click");
                  update((s) => doJob(s, actionId, id));
                }}
                onAdvance={() => update(advanceSol)}
                onExpedition={(loc, id) => {
                  play("click");
                  update((s) => launchExpedition(s, loc, id));
                }}
                onTech={(t) => {
                  play("good");
                  update((s) => unlockTech(s, t));
                }}
              />
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <CrewPanel state={state} onCrew={setCrewId} />
            <LogPanel state={state} />
            <div className="mt-auto pt-2">
              <TipCard text={tipFor(state)} />
            </div>
          </aside>
        </main>

        <Timeline sol={state.sol} />
      </div>

      <TitleDialog open={!started} weather={weather} saved={saved} onStart={start} onContinue={resume} />
      {started && (
        <>
          <MorningDialog state={state} onBegin={() => update(beginDay)} />
          <EventDialog state={state} onChoose={(id) => update((s) => resolveEvent(s, id))} />
          <TaskDialog
            state={state}
            onDone={(score) => {
              play(score >= 0.6 ? "good" : "bad");
              update((s) => finishTask(s, score));
            }}
          />
          <ReportDialog state={state} onNext={() => update(nextSol)} />
          <EndDialog state={state} onRestart={start} />
          <BuildingDialog
            state={state}
            building={state.phase === "day" ? building : null}
            onClose={() => setBuilding(null)}
            onRepair={(k, id) => {
              play("click");
              update((s) => repairBuilding(s, k, id));
            }}
            onUpgrade={(k, id) => {
              play("good");
              update((s) => upgradeBuilding(s, k, id));
            }}
          />
          <CrewDialog state={state} crewId={crewId} onClose={() => setCrewId(null)} />
        </>
      )}
      <HelpDialog open={help} onClose={() => setHelp(false)} />
      <SettingsDialog open={settings} muted={muted} onMute={onMute} onClose={() => setSettings(false)} onRestart={start} />
    </div>
  );
}
