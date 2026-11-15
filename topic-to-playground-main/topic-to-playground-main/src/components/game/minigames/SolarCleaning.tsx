import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { seededRandom, type MiniGameProps } from "./types";

const SECONDS = 20;
const BLOWS = 6;

export function SolarCleaning({ seed, onDone }: MiniGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const started = useRef<number | null>(null);
  const finished = useRef(false);
  const sent = useRef(false);
  const pointer = useRef<number | null>(null);
  const previous = useRef<{ x: number; y: number } | null>(null);
  const presses = useRef(0);
  const [blows, setBlows] = useState(0);
  const [clean, setClean] = useState(0);
  const [seconds, setSeconds] = useState(SECONDS);
  const [result, setResult] = useState<number | null>(null);

  function finish(fraction: number) {
    if (finished.current) return;
    finished.current = true;
    setResult(Math.round(Math.max(0, Math.min(1, fraction)) * 100) / 100);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const backup = document.createElement("canvas");
      backup.width = canvas.width;
      backup.height = canvas.height;
      const hadImage = canvas.dataset["ready"] === "yes";
      if (hadImage) backup.getContext("2d")?.drawImage(canvas, 0, 0);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (hadImage) {
        ctx.drawImage(backup, 0, 0, canvas.width, canvas.height);
        return;
      }
      const colors = getComputedStyle(document.documentElement);
      ctx.fillStyle = colors.getPropertyValue("--dose").trim() || "orange";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.getPropertyValue("--track").trim() || "brown";
      ctx.globalAlpha = 0.35;
      const texture = seededRandom(seed);
      for (let i = 0; i < 650; i++) {
        ctx.beginPath();
        ctx.arc(texture() * canvas.width, texture() * canvas.height, (0.5 + texture() * 1.5) * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      canvas.dataset["ready"] = "yes";
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const timer = window.setInterval(() => {
      if (finished.current || started.current === null) return;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !canvas.width || !canvas.height) return;
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let transparent = 0;
      let total = 0;
      const step = Math.max(1, Math.floor(canvas.width / 75));
      for (let y = Math.floor(step / 2); y < canvas.height; y += step) {
        for (let x = Math.floor(step / 2); x < canvas.width; x += step) {
          transparent += 1 - (image.data[(y * canvas.width + x) * 4 + 3] ?? 255) / 255;
          total++;
        }
      }
      const fraction = total ? transparent / total : 0;
      const remaining = Math.max(0, SECONDS - (performance.now() - started.current) / 1000);
      setClean(fraction);
      setSeconds(Math.ceil(remaining));
      if (fraction >= 0.95 || remaining <= 0 || presses.current >= BLOWS) finish(fraction);
    }, 250);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [seed]);

  function wipe(clientX: number, clientY: number, first = false) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || finished.current) return;
    if (started.current === null) started.current = performance.now();
    const rect = canvas.getBoundingClientRect();
    const point = { x: ((clientX - rect.left) * canvas.width) / rect.width, y: ((clientY - rect.top) * canvas.height) / rect.height };
    const radius = (canvas.width * 22) / 500;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = radius * 2;
    ctx.beginPath();
    const from = first ? point : (previous.current ?? point);
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    previous.current = point;
  }

  function blow() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || finished.current || presses.current >= BLOWS) return;
    if (started.current === null) started.current = performance.now();
    // Six randomly ordered strips cover 90% of the panel: a slower, keyboard-friendly way to clean.
    const order = Array.from({ length: BLOWS }, (_, i) => i);
    const orderRandom = seededRandom(seed ^ 0x51a7);
    for (let i = BLOWS - 1; i > 0; i--) {
      const j = Math.floor(orderRandom() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const patch = order[presses.current]!;
    const width = canvas.width / BLOWS;
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(patch * width, canvas.height * 0.05, width, canvas.height * 0.9);
    ctx.globalCompositeOperation = "source-over";
    presses.current++;
    setBlows(presses.current);
  }

  return (
    <div className="mx-auto w-full max-w-[560px] space-y-3 text-foreground" data-minigame="solar">
      <p className="text-sm text-muted-foreground">Drag to brush the red dust off, or use the air blower. You have {SECONDS} seconds once you start!</p>
      <div className="flex justify-between font-display">
        <span>Clean: {Math.round(clean * 100)}%</span>
        <span>{seconds}s left</span>
      </div>
      <div role="progressbar" aria-label="Panel cleanliness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(clean * 100)} className="h-4 overflow-hidden rounded-full border-2 border-rim bg-track">
        <div className="h-full bg-power transition-[width]" style={{ width: `${clean * 100}%` }} />
      </div>
      <div className="relative h-60 overflow-hidden rounded-2xl border-4 border-rim bg-panel">
        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-3" aria-hidden="true">
          {[0, 1, 2].map((panel) => (
            <div key={panel} className="grid grid-cols-3 grid-rows-6 gap-0.5 rounded-xl border-2 border-rim bg-rim p-1">
              {Array.from({ length: 18 }, (_, cell) => (
                <div key={cell} className="rounded-sm border border-rim bg-water/70" />
              ))}
            </div>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          aria-label="Dusty solar panels. Drag to clean, or use the air blower button below."
          className="absolute inset-0 h-full w-full cursor-grab touch-none"
          onPointerDown={(event) => {
            if (finished.current || pointer.current !== null) return;
            pointer.current = event.pointerId;
            event.currentTarget.setPointerCapture(event.pointerId);
            wipe(event.clientX, event.clientY, true);
          }}
          onPointerMove={(event) => {
            if (pointer.current === event.pointerId) wipe(event.clientX, event.clientY);
          }}
          onPointerUp={(event) => {
            if (pointer.current !== event.pointerId) return;
            pointer.current = null;
            previous.current = null;
          }}
          onPointerCancel={() => {
            pointer.current = null;
            previous.current = null;
          }}
          onLostPointerCapture={() => {
            pointer.current = null;
            previous.current = null;
          }}
        />
      </div>
      {result === null ? (
        <Button variant="sunny" className="min-h-11" disabled={blows >= BLOWS} onClick={blow}>
          Use the air blower ({BLOWS - blows} left)
        </Button>
      ) : (
        <div role="status" className="space-y-3">
          <p className="font-display">Panels are {Math.round(result * 100)}% clean! More sunlight means more power.</p>
          <Button
            variant="mission"
            size="xl"
            onClick={() => {
              if (sent.current) return;
              sent.current = true;
              onDone(result);
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
