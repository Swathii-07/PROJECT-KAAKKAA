import type { RefObject } from "react";
import type { TrackerStatus } from "@/lib/handTracking";

export function Bar({
  label,
  value,
  tone = "fun",
}: {
  label: string;
  value: number;
  tone?: "fun" | "water" | "fun-2";
}) {
  const bg = tone === "water" ? "bg-water" : tone === "fun-2" ? "bg-fun-2" : "bg-fun";
  return (
    <div className="w-full">
      <div className="mb-1 flex justify-between text-xs font-bold uppercase tracking-wider text-foreground/80">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <div className="h-5 w-full overflow-hidden rounded-full border-[3px] border-foreground bg-muted">
        <div
          className={`h-full ${bg} transition-[width] duration-200`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-foreground/25 py-1 text-sm">
      <span className="font-semibold text-foreground/70">{label}</span>
      <span className="font-display text-lg font-extrabold text-primary">{value}</span>
    </div>
  );
}

export function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  const colors = ["var(--fun)", "var(--fun-2)", "var(--water)", "var(--accent)", "var(--primary)"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {[...Array(60)].map((_, i) => (
        <span
          key={i}
          className="absolute block h-3 w-2 rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animation: `confetti-fall ${1.6 + (i % 5) * 0.35}s linear ${(i % 10) * 0.12}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

export function HandCursor({ x, y, pinch, tool }: { x: number; y: number; pinch: boolean; tool: string }) {
  return (
    <div
      className="pointer-events-none fixed z-40 -translate-x-1/2 -translate-y-1/2 text-5xl transition-transform duration-75"
      style={{ left: x, top: y, transform: `translate(-50%,-50%) scale(${pinch ? 0.8 : 1}) rotate(${pinch ? -12 : 0}deg)` }}
    >
      <span className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]">{tool}</span>
      <span
        className={`absolute left-1/2 top-1/2 -z-10 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] ${
          pinch ? "border-primary bg-primary/20" : "border-foreground/40"
        }`}
      />
    </div>
  );
}

export function WebcamPip({
  videoRef,
  status,
  detected,
  message,
  pinch,
  open,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  status: TrackerStatus;
  detected: boolean;
  message: string;
  pinch: boolean;
  open: boolean;
}) {
  return (
    <div className="fixed bottom-4 right-4 z-40 w-52 fun-panel p-2 text-xs">
      <div className="relative overflow-hidden rounded-xl border-2 border-foreground bg-foreground/80">
        <video
          ref={videoRef}
          muted
          playsInline
          className="h-28 w-full scale-x-[-1] object-cover"
        />
        <span
          className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
            detected ? "bg-fun-2 text-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {status === "ready" ? (detected ? "HAND LOCKED" : "SHOW HAND") : status.toUpperCase()}
        </span>
      </div>
      <div className="mt-2 flex gap-1 font-bold">
        <span className={`rounded-full px-2 py-0.5 ${open ? "bg-fun-2" : "bg-muted"}`}>🖐 palm</span>
        <span className={`rounded-full px-2 py-0.5 ${pinch ? "bg-fun text-white" : "bg-muted"}`}>🤏 pinch</span>
      </div>
      <p className="mt-1 leading-tight text-muted-foreground">{message}</p>
    </div>
  );
}
