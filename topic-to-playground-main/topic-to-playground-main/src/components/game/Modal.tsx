import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({ open, labelledBy, children, className }: { open: boolean; labelledBy: string; children: ReactNode; className?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      <div className={cn("panel-strong animate-pop max-h-[92vh] w-full max-w-xl overflow-y-auto p-5 sm:p-7", className)}>{children}</div>
    </div>
  );
}

export function ScienceNote({ text, source }: { text: string; source: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-rim bg-secondary/60 p-3 text-sm">
      <div className="font-display text-xs font-semibold uppercase tracking-wider text-highlight">Real science</div>
      <p className="mt-1 leading-snug">{text}</p>
      <p className="mt-1 text-xs text-muted-foreground">Source: {source}</p>
    </div>
  );
}
