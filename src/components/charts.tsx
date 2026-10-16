"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** Categorical slots 1–3 (validated palette, stepped per mode via CSS vars). */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

/* ------------------------------ Bars ------------------------------- */
/** Horizontal bars — single series in the theme primary. Value labels on each row. */
export function HBar({ data, format = (n) => String(n) }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3" role="list">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[minmax(84px,120px)_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-fg-2">{d.label}</span>
          <span className="h-2.5 overflow-hidden rounded-full bg-surface-3" title={`${d.label}: ${format(d.value)}`}>
            <span className="block h-full rounded-full bg-primary transition-[width] duration-700" style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
          <span className="w-12 text-right font-semibold tabular">{format(d.value)}</span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Donut ------------------------------ */
export function Donut({ data, center, sub }: { data: { label: string; value: number }[]; center: string; sub: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const gap = 2.5;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6 lg:flex-col 2xl:flex-row">
      <div className="relative h-40 w-40 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(", ")}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="14" />
          {data.map((d, i) => {
            const len = (d.value / total) * C;
            const el = (
              <circle
                key={d.label}
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke={SERIES[i % SERIES.length]}
                strokeWidth={hover === i ? 17 : 14}
                strokeDasharray={`${Math.max(len - gap, 0)} ${C}`}
                strokeDashoffset={-acc}
                className="cursor-pointer transition-[stroke-width] duration-150"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-[family-name:var(--font-display)] text-3xl font-bold tabular">{hover === null ? center : data[hover].value}</span>
          <span className="text-xs text-muted">{hover === null ? sub : data[hover].label}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-2.5">
        {data.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn("flex items-center gap-3 rounded-lg px-2 py-1 text-sm transition-colors", hover === i && "bg-surface-2")}>
            <span className="h-3 w-3 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
            <span className="flex-1 text-fg-2">{d.label}</span>
            <span className="font-semibold tabular">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted tabular">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------- Grouped columns ----------------------- */
/** Joiners vs exits per month: two series side-by-side, one axis, hover tooltip. */
export function Columns({ labels, series }: { labels: string[]; series: { name: string; values: number[] }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-fg-2">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i] }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
      <div className="relative flex h-48 gap-1">
        <div className="flex w-6 flex-col justify-between pb-6 text-right text-[10px] text-muted tabular">
          {[...ticks].reverse().map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        <div className="relative flex flex-1 items-end gap-1 border-l border-line pl-1 sm:gap-2">
          <div className="pointer-events-none absolute inset-x-0 bottom-6 top-0" aria-hidden>
            {[0, 50, 100].map((f) => (
              <span key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: `${f}%` }} />
            ))}
          </div>
          {labels.map((l, i) => (
            <div key={l} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
              <div className={cn("flex flex-1 items-end justify-center gap-[2px] rounded-t-md transition-colors", hover === i && "bg-surface-2")}>
                {series.map((s, k) => (
                  <span key={s.name} className="w-full max-w-[14px] rounded-t-[4px] transition-[height] duration-700" style={{ height: `${(s.values[i] / max) * 100}%`, minHeight: s.values[i] ? 3 : 0, background: SERIES[k] }} />
                ))}
              </div>
              <span className="mt-1.5 h-[18px] text-center text-[10px] text-muted">{l}</span>
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-xl">
                  <p className="mb-1 font-semibold">{l}</p>
                  {series.map((s, k) => (
                    <p key={s.name} className="flex items-center gap-2 text-fg-2">
                      <span className="h-2 w-2 rounded-sm" style={{ background: SERIES[k] }} />
                      {s.name}: <b className="text-fg tabular">{s.values[i]}</b>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Sparkline -------------------------- */
export function Spark({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const w = 100;
  const h = 32;
  const pts = values.map((v, i) => [(i / Math.max(values.length - 1, 1)) * w, h - ((v - min) / Math.max(max - min, 1)) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.25" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#sparkfill)" />
      <path d={d} fill="none" stroke="var(--primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
