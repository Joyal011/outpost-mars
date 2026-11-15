import { Antenna, Car, Droplet, FlaskConical, HeartPulse, Home, Package, Radiation, Shield, Smile, Sprout, Sun, Wind, Zap, type LucideIcon } from "lucide-react";
import engineer from "@/assets/crew-engineer.webp";
import botanist from "@/assets/crew-botanist.webp";
import scientist from "@/assets/crew-scientist.webp";
import pilot from "@/assets/crew-pilot.webp";
import type { BuildingKey, Effects, Role, StatKey } from "@/game/sim";

export interface StatMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  text: string;
  bar: string;
}

export const STAT_META: Record<StatKey, StatMeta> = {
  oxygen: { label: "Oxygen", short: "Oxygen", icon: Wind, text: "text-oxygen", bar: "bg-oxygen" },
  power: { label: "Power", short: "Power", icon: Zap, text: "text-power", bar: "bg-power" },
  water: { label: "Water", short: "Water", icon: Droplet, text: "text-water", bar: "bg-water" },
  food: { label: "Food", short: "Food", icon: Sprout, text: "text-food", bar: "bg-food" },
  shielding: { label: "Shielding", short: "Shield", icon: Shield, text: "text-shielding", bar: "bg-shielding" },
  materials: { label: "Materials", short: "Materials", icon: Package, text: "text-highlight", bar: "bg-highlight" },
  morale: { label: "Crew Morale", short: "Morale", icon: Smile, text: "text-morale", bar: "bg-morale" },
  health: { label: "Crew Health", short: "Health", icon: HeartPulse, text: "text-bad", bar: "bg-good" },
  research: { label: "Research points", short: "Research", icon: FlaskConical, text: "text-research", bar: "bg-research" },
  dose: { label: "Radiation dose", short: "Radiation", icon: Radiation, text: "text-dose", bar: "bg-dose" },
};

export const BUILDING_ICON: Record<BuildingKey, LucideIcon> = {
  habitat: Home,
  solar: Sun,
  greenhouse: Sprout,
  moxie: Wind,
  recycler: Droplet,
  antenna: Antenna,
  rover: Car,
};

export const PORTRAIT: Record<Role, string> = { engineer, botanist, scientist, pilot };

const ORDER: StatKey[] = ["oxygen", "power", "water", "food", "shielding", "materials", "morale", "health", "research", "dose"];

export function EffectChips({ effects, compact = false }: { effects: Effects; compact?: boolean }) {
  const items = ORDER.filter((k) => effects[k]);
  if (!items.length) return <span className="chip bg-muted text-muted-foreground">no change</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((k) => {
        const v = effects[k]!;
        const good = k === "dose" ? v < 0 : v > 0;
        const Icon = STAT_META[k].icon;
        const value = k === "dose" ? `${v > 0 ? "+" : ""}${v} mSv` : `${v > 0 ? "+" : ""}${v}`;
        return (
          <span key={k} className={`chip ${good ? "bg-good text-paper-foreground" : "bg-bad text-destructive-foreground"}`} title={`${STAT_META[k].label} ${value}`}>
            <Icon className="size-3.5" aria-hidden />
            {compact ? <span className="sr-only">{STAT_META[k].short}</span> : <span className="sr-only sm:not-sr-only">{STAT_META[k].short}</span>}
            {value}
          </span>
        );
      })}
    </div>
  );
}

export function Bar({ value, className, max = 100, thin = false }: { value: number; className: string; max?: number; thin?: boolean }) {
  return (
    <div className={`${thin ? "h-1.5" : "h-2.5"} w-full overflow-hidden rounded-full bg-track`}>
      <div className={`h-full rounded-full transition-[width] duration-500 ${className}`} style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
    </div>
  );
}

export const firstName = (name: string) => name.split(" ")[0] ?? name;
