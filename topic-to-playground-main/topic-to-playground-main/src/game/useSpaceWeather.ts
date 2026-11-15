import { useEffect, useState } from "react";
import { ARCHIVED_FLARES, type Flare } from "./data";

export type WeatherStatus = "loading" | "live" | "archived";

export interface SpaceWeather {
  status: WeatherStatus;
  /** Flares the mission will use. */
  flares: Flare[];
  /** Number of flares NASA logged in the last 30 days (live only). */
  recentCount?: number | undefined;
  strongest?: Flare | undefined;
}

interface DonkiFlare {
  flrID?: string;
  classType?: string;
  beginTime?: string;
  peakTime?: string;
  sourceLocation?: string;
  activeRegionNum?: number | null;
}

const strength = (c: string) => {
  const letter = { X: 1000, M: 100, C: 10, B: 1, A: 0.1 }[c.charAt(0).toUpperCase()] ?? 0;
  return letter * (parseFloat(c.slice(1)) || 1);
};

/** Tries NASA DONKI's live flare feed; falls back to archived real flares and says so. */
export function useSpaceWeather(): SpaceWeather {
  const [weather, setWeather] = useState<SpaceWeather>({ status: "loading", flares: ARCHIVED_FLARES });

  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 86_400_000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    fetch(`https://api.nasa.gov/DONKI/FLR?startDate=${fmt(start)}&endDate=${fmt(end)}&api_key=DEMO_KEY`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: unknown) => {
        if (!Array.isArray(data)) throw new Error("bad data");
        const flares: Flare[] = (data as DonkiFlare[])
          .filter((f) => f.classType)
          .map((f) => {
            const flare: Flare = { classType: f.classType!, date: (f.peakTime ?? f.beginTime ?? "").slice(0, 10), source: "live" };
            if (f.flrID) flare.id = f.flrID;
            if (f.sourceLocation) flare.location = f.sourceLocation;
            if (typeof f.activeRegionNum === "number") flare.region = f.activeRegionNum;
            return flare;
          });
        const strongest = [...flares].sort((a, b) => strength(b.classType) - strength(a.classType))[0];
        // Too few recent flares to build a mission: use archived ones, and say so.
        if (flares.length < 3) {
          setWeather({ status: "archived", flares: ARCHIVED_FLARES, recentCount: flares.length, strongest });
          return;
        }
        setWeather({
          status: "live",
          flares: flares.slice(-40),
          recentCount: flares.length,
          strongest,
        });
      })
      .catch(() => setWeather({ status: "archived", flares: ARCHIVED_FLARES }))
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  return weather;
}
