"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  Moon,
  Search,
  Sun,
  Monitor,
  Palette,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  UserCircle2,
  LayoutDashboard,
  Users,
  ShieldCheck,
  CalendarCheck,
  Command,
} from "lucide-react";
import { NAV, isActive, type NavItem } from "@/lib/nav";
import { can, ROLE_USER, useHR, useMe } from "@/lib/store";
import { applyTheme, PRESETS, useTheme } from "@/lib/theme";
import { useAlerts } from "@/lib/alerts";
import { cn, fullName } from "@/lib/utils";
import { Avatar } from "./ui";
import type { Role } from "@/lib/types";

/* ---------------------------------------------------------------- */
function useVisibleNav() {
  const { role } = useMe();
  return useMemo(
    () =>
      NAV.map((g) => ({
        ...g,
        items: g.items
          .filter((i) => !i.perm || can(role, i.perm))
          .map((i) =>
            i.href === "/people" && role === "Self-service" ? { ...i, href: `/people/${ROLE_USER[role]}`, label: "My Profile", short: "Me", icon: UserCircle2 } : i
          ),
      })).filter((g) => g.items.length),
    [role]
  );
}

function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Pydinfinity HR home">
      <span className="gradient-brand grid h-9 w-9 place-items-center rounded-[calc(var(--radius)*0.7)] text-white shadow-md shadow-primary/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 19V5h6a4.5 4.5 0 0 1 0 9H9" />
        </svg>
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-[family-name:var(--font-display)] text-[17px] font-bold tracking-tight text-primary">PYDINFINITY</span>
          <span className="mt-0.5 truncate text-[9.5px] font-semibold uppercase tracking-[0.3em] text-muted">HR Portal</span>
        </span>
      )}
    </Link>
  );
}

/* ----------------------------- Sidebar ------------------------------ */
function Sidebar() {
  const path = usePathname();
  const nav = useVisibleNav();
  const { me, role } = useMe();
  return (
    <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <nav className="scroll-thin flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {nav.map((g) => (
          <div key={g.group} className="mt-4 first:mt-1">
            <p className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((i) => (
                <SideLink key={i.href} item={i} active={isActive(path, i.href)} />
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {me && (
        <div className="m-3 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
          <div className="flex items-center gap-3">
            <Avatar person={me} size={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{fullName(me)}</p>
              <p className="truncate text-xs text-muted">{role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative flex h-10 items-center gap-3 rounded-[calc(var(--radius)*0.65)] px-3 text-[13.5px] font-medium transition-colors",
          active ? "bg-primary-soft text-primary" : "text-fg-2 hover:bg-surface-2 hover:text-fg"
        )}
      >
        {active && <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-primary" aria-hidden />}
        <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
        <span className="truncate">{item.label}</span>
      </Link>
    </li>
  );
}

/* ----------------------------- Top strip ---------------------------- */
function TopStrip() {
  const alerts = useAlerts();
  const items = alerts.filter((a) => a.kind !== "celebration").slice(0, 5);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);
  const a = items[i % Math.max(items.length, 1)];
  return (
    <div className="gradient-brand text-primary-fg">
      <div className="mx-auto flex h-8 max-w-[1400px] items-center justify-between gap-4 px-4 text-xs sm:px-6">
        {a ? (
          <Link href={a.href} className="flex min-w-0 items-center gap-2 font-medium hover:underline">
            <Bell className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{a.title} — <span className="opacity-85">{a.detail}</span></span>
          </Link>
        ) : (
          <span>All caught up — no pending HR actions</span>
        )}
        <RoleSwitcher />
      </div>
    </div>
  );
}

function RoleSwitcher() {
  const role = useHR((s) => s.role);
  const setRole = useHR((s) => s.setRole);
  const router = useRouter();
  return (
    <label className="relative flex shrink-0 items-center gap-1.5 font-medium">
      <span className="hidden opacity-85 sm:inline">Viewing as</span>
      <select
        aria-label="Switch demo role"
        value={role}
        onChange={(e) => {
          setRole(e.target.value as Role);
          router.push("/");
        }}
        className="h-6 cursor-pointer appearance-none rounded-full bg-white/20 pl-2.5 pr-6 text-xs font-semibold outline-none hover:bg-white/30 [&>option]:text-black"
      >
        {(["Super Admin", "HR", "Manager", "Self-service"] as Role[]).map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3.5 w-3.5" aria-hidden />
    </label>
  );
}

/* ------------------------------ Header ------------------------------ */
function Header({ onSearch, onMore }: { onSearch: () => void; onMore: () => void }) {
  const [bell, setBell] = useState(false);
  const alerts = useAlerts();
  const { me } = useMe();
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="lg:hidden">
          <Logo />
        </div>
        <button
          onClick={onSearch}
          className="ml-2 hidden h-10 max-w-xl flex-1 items-center gap-3 rounded-[calc(var(--radius)*0.7)] border border-line bg-surface-2 px-3 text-sm text-muted transition-colors hover:border-line-strong md:flex lg:ml-0"
        >
          <Search className="h-4 w-4" aria-hidden />
          <span>Search people, IDs, modules…</span>
          <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-line-strong bg-surface px-1.5 py-0.5 text-[11px] font-semibold lg:inline-flex">
            <Command className="h-3 w-3" aria-hidden />K
          </kbd>
        </button>
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <ThemeQuick />
          <div className="relative">
            <button onClick={() => setBell((v) => !v)} aria-label={`Notifications (${alerts.length})`} aria-expanded={bell} className="relative grid h-11 w-11 place-items-center rounded-full text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg sm:h-10 sm:w-10">
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && <span className="absolute right-1.5 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-fg tabular">{alerts.length > 99 ? "99+" : alerts.length}</span>}
            </button>
            {bell && <NotificationPanel onClose={() => setBell(false)} />}
          </div>
          <button onClick={onMore} className="hidden sm:block lg:hidden" aria-label="All modules">
            <span className="grid h-10 w-10 place-items-center rounded-full text-fg-2 hover:bg-surface-2">
              <LayoutGrid className="h-5 w-5" />
            </span>
          </button>
          {me && (
            <Link href={`/people/${me.id}`} className="ml-1 hidden rounded-full sm:block" aria-label="My profile">
              <Avatar person={me} size={36} />
            </Link>
          )}
        </div>
      </div>
      {/* Mobile search bar (boutique style) */}
      <div className="px-4 pb-3 md:hidden">
        <button onClick={onSearch} className="flex h-11 w-full items-center gap-3 rounded-[calc(var(--radius)*0.7)] bg-surface-2 px-3 text-sm text-muted">
          <Search className="h-4 w-4" aria-hidden />
          Search people, IDs, modules…
        </button>
      </div>
    </header>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const alerts = useAlerts();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    setTimeout(() => document.addEventListener("click", h));
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("click", h);
      document.removeEventListener("keydown", k);
    };
  }, [onClose]);
  const toneIcon = { warning: AlertCircle, danger: AlertCircle, info: Info };
  const toneCls = { warning: "text-warning bg-warning-soft", danger: "text-danger bg-danger-soft", info: "text-info bg-info-soft" };
  return (
    <div ref={ref} className="animate-scale-in fixed inset-x-3 top-[7.5rem] z-50 origin-top-right overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-semibold">Notifications</p>
        <span className="text-xs text-muted">{alerts.length} items</span>
      </div>
      <ul className="scroll-thin max-h-[60dvh] overflow-y-auto">
        {alerts.length === 0 && <li className="p-6 text-center text-sm text-muted">You&apos;re all caught up.</li>}
        {alerts.map((a) => {
          const I = toneIcon[a.tone];
          return (
            <li key={a.id}>
              <Link href={a.href} onClick={onClose} className="flex gap-3 border-b border-line px-4 py-3 last:border-0 hover:bg-surface-2">
                <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", toneCls[a.tone])}>
                  <I className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted">{a.detail}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ThemeQuick() {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [open]);
  const ModeIcon = t.mode === "dark" ? Moon : t.mode === "light" ? Sun : Monitor;
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} aria-label="Theme" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-full text-fg-2 transition-colors hover:bg-surface-2 hover:text-fg sm:h-10 sm:w-10">
        <ModeIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="animate-scale-in absolute right-0 top-12 z-50 w-72 origin-top-right rounded-[var(--radius)] border border-line bg-surface p-3 shadow-2xl">
          <p className="px-1 pb-2 text-xs font-bold uppercase tracking-wider text-muted">Appearance</p>
          <div className="grid grid-cols-3 gap-1 rounded-[calc(var(--radius)*0.7)] bg-surface-2 p-1">
            {([
              ["light", Sun, "Light"],
              ["dark", Moon, "Dark"],
              ["system", Monitor, "Auto"],
            ] as const).map(([m, I, l]) => (
              <button key={m} onClick={() => t.setMode(m)} className={cn("flex h-9 items-center justify-center gap-1.5 rounded-[calc(var(--radius)*0.5)] text-xs font-semibold", t.mode === m ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg")}>
                <I className="h-3.5 w-3.5" aria-hidden />
                {l}
              </button>
            ))}
          </div>
          <p className="px-1 pb-2 pt-3 text-xs font-bold uppercase tracking-wider text-muted">Color theme</p>
          <div className="grid grid-cols-5 gap-2">
            {PRESETS.slice(0, 9).map((p) => (
              <button
                key={p.id}
                onClick={() => t.setPreset(p)}
                title={p.name}
                aria-label={p.name}
                className={cn("h-10 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-105", t.presetId === p.id && "ring-2 ring-fg")}
                style={{ backgroundImage: `linear-gradient(135deg, ${p.primary}, ${p.accent2})` }}
              />
            ))}
            <Link href="/settings" onClick={() => setOpen(false)} aria-label="Custom theme" className="grid h-10 place-items-center rounded-full border border-dashed border-line-strong text-muted hover:text-fg">
              <Palette className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Mobile tab bar ------------------------- */
function MobileTabs({ onMore }: { onMore: () => void }) {
  const path = usePathname();
  const { role } = useMe();
  const tabs = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    role === "Self-service" ? { href: `/people/${ROLE_USER[role]}`, label: "Me", icon: UserCircle2 } : { href: "/people", label: "People", icon: Users },
    { href: "/documents", label: "KYC", icon: ShieldCheck },
    { href: "/attendance", label: "Leave", icon: CalendarCheck },
  ];
  return (
    <nav className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden" aria-label="Primary">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors", active ? "text-primary" : "text-muted")}>
                <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-primary-soft")}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button onClick={onMore} className="flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold text-muted">
            <span className="grid h-7 w-12 place-items-center rounded-full">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

/* ------------------------- More sheet (circles) ---------------------- */
function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useVisibleNav();
  const path = usePathname();
  useEffect(() => {
    onClose();
    // close on route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="All modules">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-[calc(var(--radius)*1.6)] border-t border-line bg-surface pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 flex items-center justify-between bg-surface px-5 pb-2 pt-3">
          <div className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-line-strong" aria-hidden />
          <p className="pt-3 font-[family-name:var(--font-display)] text-lg font-semibold">All modules</p>
          <button onClick={onClose} aria-label="Close" className="mt-2 grid h-10 w-10 place-items-center rounded-full hover:bg-surface-2">
            <X className="h-5 w-5" />
          </button>
        </div>
        {nav.map((g) => (
          <div key={g.group} className="px-5 pt-3">
            <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">{g.group}</p>
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 sm:grid-cols-6">
              {g.items.map((i) => {
                const Icon = i.icon;
                const active = isActive(path, i.href);
                return (
                  <Link key={i.href} href={i.href} className="flex flex-col items-center gap-1.5 text-center">
                    <span className={cn("grid h-14 w-14 place-items-center rounded-full border-2 transition-colors", active ? "border-primary bg-primary text-primary-fg" : "border-primary/20 bg-primary-soft text-primary")}>
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-medium leading-tight">{i.short ?? i.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Command palette ------------------------ */
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const people = useHR((s) => s.people);
  const { role } = useMe();
  const nav = useVisibleNav();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    const pages = nav.flatMap((g) => g.items).filter((i) => !s || i.label.toLowerCase().includes(s));
    const ppl = can(role, "people.viewAll") || role === "Manager"
      ? people.filter((p) => s && (fullName(p).toLowerCase().includes(s) || p.code?.toLowerCase().includes(s) || p.email.includes(s) || p.designation.toLowerCase().includes(s))).slice(0, 8)
      : [];
    return [
      ...ppl.map((p) => ({ key: p.id, label: fullName(p), sub: `${p.code ?? "ID pending"} · ${p.designation}`, href: `/people/${p.id}`, person: p })),
      ...pages.slice(0, s ? 8 : 10).map((i) => ({ key: i.href, label: i.label, sub: "Go to module", href: i.href, icon: i.icon })),
    ];
  }, [q, people, nav, role]);

  if (!open) return null;
  const go = (href: string) => {
    router.push(href);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-3 pt-[10dvh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-scale-in relative w-full max-w-xl overflow-hidden rounded-[var(--radius)] border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((v) => Math.min(v + 1, results.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((v) => Math.max(v - 1, 0));
              }
              if (e.key === "Enter" && results[sel]) go(results[sel].href);
            }}
            placeholder="Search people by name, ID or role…"
            aria-label="Search"
            className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="hidden rounded-md border border-line-strong px-1.5 py-0.5 text-[11px] text-muted sm:block">ESC</kbd>
        </div>
        <ul className="scroll-thin max-h-[55dvh] overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="p-6 text-center text-sm text-muted">No matches for “{q}”.</li>}
          {results.map((r, idx) => {
            const Icon = "icon" in r ? r.icon : undefined;
            return (
              <li key={r.key} role="option" aria-selected={idx === sel}>
                <button onMouseEnter={() => setSel(idx)} onClick={() => go(r.href)} className={cn("flex w-full items-center gap-3 rounded-[calc(var(--radius)*0.6)] px-3 py-2.5 text-left", idx === sel && "bg-primary-soft")}>
                  {"person" in r && r.person ? <Avatar person={r.person} size={32} /> : Icon ? <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-fg-2"><Icon className="h-4 w-4" aria-hidden /></span> : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.label}</span>
                    <span className="block truncate text-xs text-muted">{r.sub}</span>
                  </span>
                  {idx === sel && <ArrowRight className="h-4 w-4 text-primary" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------ Toaster ----------------------------- */
function Toaster() {
  const toasts = useHR((s) => s.toasts);
  const dismiss = useHR((s) => s.dismissToast);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:pr-6">
      {toasts.map((t) => {
        const I = t.tone === "error" ? AlertCircle : t.tone === "info" ? Info : CheckCircle2;
        return (
          <div key={t.id} className="animate-fade-up pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[var(--radius)] border border-line bg-surface px-4 py-3 shadow-xl">
            <I className={cn("h-5 w-5 shrink-0", t.tone === "error" ? "text-danger" : t.tone === "info" ? "text-info" : "text-success")} aria-hidden />
            <p className="flex-1 text-sm font-medium">{t.title}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------- Shell ------------------------------ */
export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState(false);
  const [more, setMore] = useState(false);
  const theme = useTheme();
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    applyTheme(theme);
    if (theme.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const h = () => applyTheme(theme);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [theme]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((v) => !v);
      }
    };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  if (!mounted) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex flex-col items-center gap-4">
          <span className="gradient-brand h-12 w-12 animate-pulse rounded-2xl" />
          <p className="text-sm text-muted">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopStrip />
        <Header onSearch={() => setSearch(true)} onMore={() => setMore(true)} />
        <main id="main" key={path} className="animate-fade-up mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 sm:px-6 sm:pt-7 lg:pb-12">
          {children}
        </main>
      </div>
      <MobileTabs onMore={() => setMore(true)} />
      <MoreSheet open={more} onClose={() => setMore(false)} />
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <Toaster />
    </div>
  );
}
