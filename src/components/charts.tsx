"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CountUp } from "./ui";

/** Categorical slots 1–3 (validated palette, stepped per mode via CSS vars). */
export const SERIES = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

function useMounted(delay = 80) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setM(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return m;
}

/* --------------------------- Horizontal bars --------------------------- */
/** Single series — label + value row, gradient bar that grows in (staggered). */
export function HBar({ data, format = (n) => String(n), delay = 300 }: { data: { label: string; value: number }[]; format?: (n: number) => string; delay?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="flex flex-col gap-3" role="list">
      {data.map((d, i) => (
        <li key={d.label} title={`${d.label}: ${format(d.value)}`}>
          <div className="flex items-center justify-between gap-3 text-[13px]">
            <span className="truncate font-semibold">{d.label}</span>
            <span className="text-muted tabular">{format(d.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="hbar h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent))]" style={{ width: `${(d.value / max) * 100}%`, animationDelay: `${delay + i * 80}ms` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- Donut -------------------------------- */
export function Donut({ data, center, sub }: { data: { label: string; value: number }[]; center: number; sub: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const mounted = useMounted(150);
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  const R = 52;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const gap = 3;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6 lg:flex-col 2xl:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label={data.map((d) => `${d.label} ${d.value}`).join(", ")}>
          <circle cx="64" cy="64" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
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
                strokeWidth={hover === i ? 18 : 14}
                strokeLinecap="round"
                strokeDasharray={`${mounted ? Math.max(len - gap, 0) : 0} ${C}`}
                strokeDashoffset={-acc}
                className="cursor-pointer transition-[stroke-dasharray,stroke-width] duration-[1100ms] ease-[cubic-bezier(.2,.8,.2,1)]"
                style={{ transitionDelay: `${i * 120}ms, 0ms` }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            acc += len;
            return el;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[34px] font-extrabold leading-none tracking-[-0.03em] tabular">{hover === null ? <CountUp value={center} /> : data[hover].value}</span>
          <span className="mt-1 text-xs text-muted">{hover === null ? sub : data[hover].label}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5">
        {data.map((d, i) => (
          <li key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={cn("flex items-center gap-3 rounded-[12px] px-2.5 py-1.5 text-sm transition-colors", hover === i && "bg-surface-2")}>
            <span className="h-3 w-3 rounded-full" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
            <span className="flex-1 font-medium">{d.label}</span>
            <span className="font-bold tabular">{d.value}</span>
            <span className="w-10 text-right text-xs text-muted tabular">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------ Trend bars (AuraPOS) ------------------------ */
/** One measure: bars grow in (last one full colour), a trend line draws itself across the tops. */
export function TrendBars({ data, format = (n) => String(n), label }: { data: { label: string; title: string; value: number }[]; format?: (n: number) => string; label: string }) {
  const W = 640, H = 220, padL = 40, padB = 26;
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.15;
  const bw = (W - padL) / data.length;
  const y = (v: number) => H - padB - ((H - padB - 10) * v) / max;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => Math.round(max * k));
  const line = data.map((d, i) => `${i ? "L" : "M"}${(padL + i * bw + bw * 0.5).toFixed(1)},${(y(d.value) - 6).toFixed(1)}`).join(" ");
  return (
    <div className="scroll-thin overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="min-w-[480px]" role="img" aria-label={label}>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={padL} x2={W} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="3 5" />
            <text x={padL - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{format(v)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = H - padB - y(d.value);
          const x = padL + i * bw + bw * 0.18;
          const last = i === data.length - 1;
          return (
            <g key={d.label}>
              <title>{`${d.title}: ${format(d.value)}`}</title>
              <rect className="bar" style={{ animationDelay: `${i * 45}ms` }} x={x} y={y(d.value)} width={bw * 0.64} height={Math.max(h, 0)} rx="7" fill={last ? "var(--primary)" : "color-mix(in srgb, var(--primary) 32%, transparent)"} />
              <text x={x + bw * 0.32} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
            </g>
          );
        })}
        <path className="draw" d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ------------------------------- Gauge -------------------------------- */
/** Semicircle with hatched track and a primary→accent arc that sweeps to the value. */
export function Gauge({ pct, caption, label }: { pct: number; caption: string; label: string }) {
  const mounted = useMounted(220);
  const arc = Math.PI * 80;
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <svg viewBox="0 0 200 116" width="100%" role="img" aria-label={`${pct}% ${label}`}>
        <defs>
          <pattern id="gauge-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="7" fill="var(--surface-2)" />
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--muted)" strokeOpacity=".35" strokeWidth="3" />
          </pattern>
          <linearGradient id="gauge-grad" x1="0" x2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-hatch)" strokeWidth="24" strokeLinecap="round" />
        <path className="gauge-arc" d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#gauge-grad)" strokeWidth="24" strokeLinecap="round" strokeDasharray={`${mounted ? (pct / 100) * arc : 0} ${arc}`} />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-[42px] font-extrabold leading-none tracking-[-0.03em] tabular">
          <CountUp value={pct} />%
        </p>
        <p className="mt-1 text-[13px] text-muted">{caption}</p>
      </div>
    </div>
  );
}

/* --------------------------- Grouped columns ----------------------- */
/** Two series side-by-side on one axis, with hover tooltip. */
export function Columns({ labels, series }: { labels: string[]; series: { name: string; values: number[] }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-xs">
        {series.map((s, i) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 font-medium text-muted">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[i] }} aria-hidden />
            {s.name}
          </span>
        ))}
      </div>
      <div className="flex h-44 items-end gap-1 sm:gap-2">
        {labels.map((l, i) => (
          <div key={l} className="relative flex h-full flex-1 flex-col justify-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onClick={() => setHover(i)}>
            <div className={cn("flex flex-1 items-end justify-center gap-[3px] rounded-t-[10px] transition-colors", hover === i && "bg-surface-2")}>
              {series.map((s, k) => (
                <span key={s.name} className="bar w-full max-w-[16px] rounded-t-[6px]" style={{ height: `${(s.values[i] / max) * 100}%`, minHeight: s.values[i] ? 4 : 0, background: SERIES[k], animationDelay: `${i * 60 + k * 30}ms` }} />
              ))}
            </div>
            <span className="mt-1.5 h-[18px] text-center text-[11px] text-muted">{l}</span>
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-[12px] border border-line bg-surface px-3 py-2 text-xs shadow-[var(--shadow)]">
                <p className="mb-1 font-bold">{l}</p>
                {series.map((s, k) => (
                  <p key={s.name} className="flex items-center gap-2 text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ background: SERIES[k] }} />
                    {s.name}: <b className="text-fg tabular">{s.values[i]}</b>
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
