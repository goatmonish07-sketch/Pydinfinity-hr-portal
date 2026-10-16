"use client";

import { X, Search, Inbox, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn, initials } from "@/lib/utils";
import type { Person } from "@/lib/types";

/* ------------------------------- Button ------------------------------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft" | "success";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary text-primary-fg shadow-sm shadow-primary/30 hover:brightness-110 active:brightness-95",
  secondary: "bg-surface border border-line-strong text-fg hover:bg-surface-2",
  ghost: "text-fg-2 hover:bg-surface-2 hover:text-fg",
  danger: "bg-danger text-white hover:brightness-110",
  soft: "bg-primary-soft text-primary hover:bg-primary/20",
  success: "bg-success-soft text-success hover:bg-success/20",
};
export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "icon"; icon?: LucideIcon }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,filter,transform,color] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
        size === "sm" && "h-9 rounded-[calc(var(--radius)*0.6)] px-3 text-[13px]",
        size === "md" && "h-11 rounded-[calc(var(--radius)*0.7)] px-4 text-sm sm:h-10",
        size === "icon" && "h-11 w-11 rounded-[calc(var(--radius)*0.7)] sm:h-10 sm:w-10",
        VARIANTS[variant],
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

/* -------------------------------- Card -------------------------------- */
export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...rest} className={cn("card", className)}>
      {children}
    </div>
  );
}
export function CardHeader({ title, subtitle, action, icon: Icon }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius)*0.6)] bg-primary-soft text-primary">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold">{title}</h3>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* -------------------------------- Badge ------------------------------- */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-surface-3 text-fg-2",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};
export function Badge({ tone = "neutral", children, dot, className }: { tone?: Tone; children: ReactNode; dot?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>
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
export function Avatar({ person, size = 36, ring }: { person: Pick<Person, "firstName" | "lastName" | "hue">; size?: number; ring?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold text-white", ring && "ring-2 ring-surface")}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundImage: `linear-gradient(135deg, hsl(${person.hue} 70% 58%), hsl(${(person.hue + 40) % 360} 65% 45%))`,
      }}
    >
      {initials(person)}
    </span>
  );
}

/* ------------------------------ Progress ------------------------------ */
export function Progress({ value, tone = "primary", className, label }: { value: number; tone?: "primary" | "success" | "warning" | "danger"; className?: string; label?: string }) {
  const color = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", danger: "bg-danger" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
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
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" aria-label={placeholder} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input pl-9" />
    </div>
  );
}

/** Horizontal scrolling chip filter row (boutique style) */
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
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-4 text-[13px] font-medium transition-colors",
              active ? "border-primary bg-primary text-primary-fg shadow-sm shadow-primary/25" : "border-line-strong bg-surface text-fg-2 hover:border-primary/50 hover:text-fg"
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-[11px] tabular", active ? "bg-white/25" : "bg-surface-3")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
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
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        className={cn(
          "animate-slide-up sm:animate-scale-in relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[calc(var(--radius)*1.4)] border border-line bg-surface shadow-2xl sm:rounded-[var(--radius)]",
          wide ? "sm:max-w-3xl" : "sm:max-w-lg"
        )}
      >
        <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 pb-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

/* ----------------------------- Page header ---------------------------- */
export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-fg-2">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ------------------------------ Stat card ----------------------------- */
export function StatCard({ label, value, icon: Icon, hint, tone = "primary", onClick }: { label: string; value: ReactNode; icon: LucideIcon; hint?: ReactNode; tone?: Tone; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cn("card group relative overflow-hidden p-4 text-left transition-shadow sm:p-5", onClick && "hover:shadow-lg")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className={cn("grid h-9 w-9 place-items-center rounded-[calc(var(--radius)*0.6)]", TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tabular sm:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-fg-2">{hint}</p>}
    </Comp>
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
          className={cn("leading-none disabled:cursor-default", n <= value ? "text-warning" : "text-line-strong")}
          style={{ fontSize: size }}
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
