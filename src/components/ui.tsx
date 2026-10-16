"use client";

import { X, Search, Inbox, ArrowUpRight, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from "react";
import { cn, initials } from "@/lib/utils";
import type { Person } from "@/lib/types";

/* ------------------------------- Button ------------------------------- */
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "soft" | "success";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-primary-fg shadow-[0_10px_24px_-12px_var(--primary)] hover:brightness-110",
  secondary: "border-2 border-line bg-surface text-fg hover:bg-surface-2",
  outline: "border-2 border-[color-mix(in_srgb,var(--primary-strong)_70%,var(--text))] text-fg hover:bg-primary-soft",
  ghost: "text-muted hover:bg-surface-2 hover:text-fg",
  danger: "border-2 border-[color-mix(in_srgb,var(--danger)_60%,transparent)] text-danger hover:bg-danger-soft",
  soft: "bg-primary-soft text-primary hover:brightness-95",
  success: "border-2 border-[color-mix(in_srgb,var(--success)_55%,transparent)] text-success hover:bg-success-soft",
};
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" | "icon"; icon?: LucideIcon }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[transform,background,filter,color] duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "min-h-9 px-3 text-[13px]",
        size === "md" && "min-h-11 px-[18px] text-sm",
        size === "lg" && "min-h-[54px] px-6 text-base",
        size === "icon" && "h-11 w-11",
        VARIANTS[variant],
        className
      )}
    >
      {Icon && <Icon className={cn("shrink-0", size === "lg" ? "h-5 w-5" : "h-[17px] w-[17px]")} aria-hidden />}
      {children}
    </button>
  );
}

/* -------------------------------- Card -------------------------------- */
export function Card({ className, children, lift, delay, ...rest }: React.HTMLAttributes<HTMLDivElement> & { lift?: boolean; delay?: number }) {
  return (
    <div {...rest} className={cn("card rise", lift && "lift", className)} style={{ animationDelay: delay ? `${delay}ms` : undefined, ...rest.style }}>
      {children}
    </div>
  );
}
export function CardHeader({ title, subtitle, action, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-[22px] sm:pt-5">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary-soft text-primary">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-[17px] font-bold sm:text-[19px]">{title}</h2>
          {subtitle && <p className="truncate text-[13px] text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- Badge ------------------------------- */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
const TONES: Record<Tone, string> = {
  neutral: "text-muted border-line bg-surface-2",
  primary: "text-primary border-[color-mix(in_srgb,var(--primary)_45%,transparent)] bg-[color-mix(in_srgb,var(--primary)_7%,transparent)]",
  success: "text-success border-[color-mix(in_srgb,var(--success)_45%,transparent)] bg-[color-mix(in_srgb,var(--success)_7%,transparent)]",
  warning: "text-warning border-[color-mix(in_srgb,var(--warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--warning)_7%,transparent)]",
  danger: "text-danger border-[color-mix(in_srgb,var(--danger)_45%,transparent)] bg-[color-mix(in_srgb,var(--danger)_7%,transparent)]",
  info: "text-info border-[color-mix(in_srgb,var(--info)_45%,transparent)] bg-[color-mix(in_srgb,var(--info)_7%,transparent)]",
};
const ICON_TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};
export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-[9px] py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

export const statusTone = (s: string): Tone =>
  (
    ({
      Active: "success",
      Verified: "success",
      Approved: "success",
      Paid: "success",
      Completed: "success",
      Issued: "info",
      Hired: "success",
      Open: "success",
      "Notice Period": "warning",
      Pending: "warning",
      "Pending Approval": "warning",
      Submitted: "warning",
      Requested: "warning",
      Uploaded: "info",
      "On Hold": "neutral",
      "In Stock": "neutral",
      Closed: "neutral",
      Exited: "danger",
      Rejected: "danger",
      Lost: "danger",
    }) as Record<string, Tone>
  )[s] ?? "neutral";

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={statusTone(status)} dot>
      {status}
    </Badge>
  );
}

/* ------------------------------- Avatar ------------------------------- */
export function Avatar({ person, size = 36, ring }: { person: Pick<Person, "firstName" | "lastName" | "hue"> & { photo?: string }; size?: number; ring?: boolean }) {
  if (person.photo)
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={person.photo} alt="" width={size} height={size} className={cn("shrink-0 rounded-full object-cover", ring && "ring-2 ring-surface")} style={{ width: size, height: size }} />
    );
  return (
    <span
      aria-hidden
      className={cn("avatar-t inline-grid shrink-0 place-items-center rounded-full font-bold", ring && "ring-2 ring-surface")}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34), ["--av-h" as string]: person.hue } as CSSProperties}
    >
      {initials(person)}
    </span>
  );
}

/* ------------------------------ Progress ------------------------------ */
export function Progress({ value, tone = "primary", className, label }: { value: number; tone?: "primary" | "success" | "warning" | "danger"; className?: string; label?: string }) {
  const color = { primary: "bg-[linear-gradient(90deg,var(--primary),var(--accent))]", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-2", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("hbar h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ------------------------------ Count up ------------------------------ */
export function CountUp({ value, format = (n) => Math.round(n).toLocaleString("en-IN"), duration = 900 }: { value: number; format?: (n: number) => string; duration?: number }) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setV(value);
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const cur = start + (value - start) * (1 - Math.pow(1 - k, 3));
      setV(cur);
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = value;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{format(v)}</>;
}

/* ------------------------------- Inputs ------------------------------- */
export function Field({ label, children, hint, required, className }: { label: string; children: (id: string) => ReactNode; hint?: string; required?: boolean; className?: string }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = "Search…", className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input !rounded-full pl-11" />
    </div>
  );
}

/** Pill chip filter row (AuraPOS chips: selected chip inverts to ink). */
export function ChipTabs<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; className?: string }) {
  return (
    <div className={cn("no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex min-h-[38px] shrink-0 items-center gap-2 rounded-full border px-[14px] text-[13px] font-semibold transition-colors",
              active ? "border-fg bg-fg text-bg" : "border-line text-muted hover:border-line-strong hover:text-fg"
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn("rounded-full px-1.5 text-[11px] tabular", active ? "bg-bg/20" : "bg-surface-2")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Segmented control (AuraPOS .seg) */
export function Seg<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="switch">
      <i />
    </button>
  );
}

/* -------------------------------- Modal ------------------------------- */
export function Modal({ open, onClose, title, subtitle, children, footer, wide }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-[rgba(8,12,10,0.5)] backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className={cn(
          "animate-slide-up sm:animate-scale-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] sm:rounded-[28px]",
          wide ? "sm:max-w-[940px]" : "sm:max-w-[640px]"
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-[22px] pb-3 pt-5">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-[22px] pb-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-[22px] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- Page header ---------------------------- */
export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="rise mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">{eyebrow}</p>}
        <h1 className="text-[clamp(28px,4vw,40px)] font-extrabold leading-tight tracking-[-0.03em]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------ KPI / stat card ----------------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  onClick,
  hero,
  delay = 0,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  tone?: Tone;
  onClick?: () => void;
  hero?: boolean;
  delay?: number;
}) {
  const numeric = typeof value === "number";
  return (
    <div
      className={cn("card group rise lift relative flex min-h-[140px] flex-col justify-between gap-3 overflow-hidden p-4 sm:min-h-[160px] sm:p-[22px]", hero && "aura-hero", onClick && "cursor-pointer")}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role={onClick ? "link" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${label}` : undefined}
      onKeyDown={onClick ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick()) : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex items-center gap-2 text-[13px] font-semibold sm:text-sm", !hero && "text-fg")}>
          <span className={cn("grid h-8 w-8 place-items-center rounded-[10px]", hero ? "bg-white/15 text-white" : ICON_TONES[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
          <span className="line-clamp-1">{label}</span>
        </span>
        {onClick && (
          <span
            aria-hidden
            className={cn("hidden h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-transform group-hover:rotate-45 sm:grid", hero ? "border-0 bg-white/90 text-primary-strong" : "border-[color-mix(in_srgb,var(--text)_75%,transparent)]")}
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        )}
      </div>
      <span className="text-[22px] font-extrabold leading-none tracking-[-0.03em] tabular [overflow-wrap:anywhere] sm:text-[clamp(26px,3vw,40px)]">
        {numeric ? <CountUp value={value as number} /> : value}
      </span>
      {hint && (
        <span className={cn("flex flex-wrap items-center gap-1.5 text-xs sm:gap-2", hero ? "text-white/85" : "text-muted")}>
          {hero && <span className="live-dot shrink-0" aria-hidden />}
          {hint}
        </span>
      )}
    </div>
  );
}

/* ------------------------------ Empty state --------------------------- */
export function Empty({ title, hint, icon: Icon = Inbox, action }: { title: string; hint?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ------------------------------- Stars -------------------------------- */
export function Stars({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          aria-label={onChange ? `Rate ${n}` : undefined}
          className={cn("leading-none transition-transform disabled:cursor-default enabled:hover:scale-110", n <= value ? "text-accent" : "text-line-strong")}
        >
          <svg viewBox="0 0 20 20" width={size} height={size} fill="currentColor" aria-hidden>
            <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

/* --------------------------- Table container -------------------------- */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="scroll-thin overflow-x-auto">{children}</div>;
}
