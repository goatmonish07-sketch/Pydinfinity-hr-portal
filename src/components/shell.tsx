"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Bell,
  Menu,
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
  RotateCcw,
  GraduationCap,
  Briefcase,
  FileWarning,
  IdCard,
  CalendarClock,
  Cake,
  CheckCheck,
} from "lucide-react";
import { NAV, isActive, type NavItem } from "@/lib/nav";
import { can, ROLE_USER, useHR, useMe } from "@/lib/store";
import { applyTheme, PRESETS, useTheme } from "@/lib/theme";
import { useAlerts, type Alert } from "@/lib/alerts";
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
          .map((i) => (i.href === "/people" && role === "Self-service" ? { ...i, href: `/people/view?id=${ROLE_USER[role]}`, label: "My Profile", short: "Me", icon: UserCircle2 } : i)),
      })).filter((g) => g.items.length),
    [role]
  );
}

function useBadges() {
  const people = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const leaves = useHR((s) => s.leaves);
  const tasks = useHR((s) => s.tasks);
  const invoices = useHR((s) => s.invoices);
  const { role, me } = useMe();
  return useMemo(() => {
    const team = role === "Manager" ? new Set(people.filter((p) => p.managerId === me.id).map((p) => p.id)) : null;
    return {
      approvals: people.filter((p) => p.status === "Pending Approval").length,
      kyc: role === "Self-service" ? documents.filter((d) => d.personId === me.id && (d.status === "Pending" || d.status === "Rejected")).length : documents.filter((d) => d.status === "Uploaded").length,
      leave: can(role, "leave.approve") ? leaves.filter((l) => l.status === "Pending" && (!team || team.has(l.personId))).length : 0,
      onboarding: tasks.filter((t) => !t.done).length,
      invoices: invoices.filter((i) => i.status === "Submitted").length,
    };
  }, [people, documents, leaves, tasks, invoices, role, me.id]);
}

export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/pyd-logo.png" alt="" width={size} height={size} className="shrink-0 rounded-full bg-white shadow-[0_0_0_1px_var(--border)]" style={{ width: size, height: size }} />
  );
}

/* ----------------------------- Sidebar ------------------------------ */
function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const path = usePathname();
  const nav = useVisibleNav();
  const badges = useBadges();
  const settings = useHR((s) => s.settings);
  const branch = useHR((s) => s.branch);
  const setBranch = useHR((s) => s.setBranch);
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const h = () => setDesktop(mq.matches);
    h();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  return (
    <>
      {open && <div className="fixed inset-0 z-[55] bg-black/35 lg:hidden" onClick={onClose} aria-hidden />}
      <aside
        aria-label="Main navigation"
        inert={!open && !desktop}
        className={cn(
          "z-[60] flex flex-col overflow-hidden border border-line bg-surface px-3.5 pb-3.5 shadow-[var(--shadow)]",
          "fixed inset-y-0 left-0 w-[280px] rounded-r-[28px] pt-[calc(20px+env(safe-area-inset-top))] transition-transform duration-[250ms]",
          "lg:sticky lg:top-4 lg:h-[calc(100dvh-32px)] lg:w-auto lg:translate-x-0 lg:rounded-[var(--radius-card)] lg:pt-5",
          open ? "translate-x-0" : "-translate-x-[102%]"
        )}
      >
        <div className="flex items-center justify-between px-2 pb-3.5">
          <Link href="/" className="flex items-center gap-2.5 text-[21px] font-extrabold tracking-[-0.02em]" aria-label="Pydinfinity HR home">
            <BrandMark />
            <span>
              Pydinfinity<b className="text-primary">HR</b>
            </span>
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-surface-2 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>
        <label className="mx-1.5 mb-3 block">
          <span className="mb-1 block px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{settings.companyName}</span>
          <select className="input !min-h-[44px] font-semibold" value={branch} onChange={(e) => setBranch(e.target.value)}>
            <option value="All branches">All branches</option>
            {settings.branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <nav className="scroll-thin flex-1 overflow-y-auto px-0.5" aria-label="Modules">
          {nav.map((g) => (
            <div key={g.group}>
              <p className="mx-2.5 mb-1.5 mt-3.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{g.group}</p>
              {g.items.map((i) => (
                <SideLink key={i.href} item={i} active={isActive(path, i.href)} count={i.badge ? badges[i.badge] : 0} />
              ))}
            </div>
          ))}
        </nav>
        <div className="aura-hero mt-2.5 shrink-0 rounded-[22px] p-4">
          <span className="text-xs opacity-80">Pydinfinity HR · works on phone & tablet</span>
          <strong className="mt-2 block leading-snug">People, IDs, KYC, leave and payroll in one place.</strong>
        </div>
      </aside>
    </>
  );
}

function SideLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex min-h-[42px] items-center gap-3 rounded-[14px] px-3 text-[14.5px] transition-colors",
        active
          ? "bg-primary-soft font-bold text-fg before:absolute before:-left-0.5 before:bottom-[9px] before:top-[9px] before:w-1 before:rounded before:bg-primary"
          : "font-medium text-muted hover:bg-surface-2 hover:text-fg"
      )}
    >
      <Icon className={cn("h-[19px] w-[19px] shrink-0", active && "text-primary")} aria-hidden />
      <span className="truncate">{item.label}</span>
      {count > 0 && <span className="ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-primary-strong px-1.5 text-xs font-bold text-white tabular">{count}</span>}
    </Link>
  );
}

/* ------------------------------ Top bar ----------------------------- */
function TopBar({ onSearch, onMenu }: { onSearch: () => void; onMenu: () => void }) {
  const [bell, setBell] = useState(false);
  const alerts = useAlerts();
  const read = useHR((s) => s.readAlerts);
  const unread = alerts.filter((a) => !read.includes(a.id)).length;
  const { me, role } = useMe();
  const setRole = useHR((s) => s.setRole);
  const router = useRouter();
  return (
    <header className="glass sticky top-[max(8px,env(safe-area-inset-top))] z-30 flex items-center gap-1.5 rounded-[var(--radius-card)] border border-line px-2 py-2 shadow-[var(--shadow)] sm:gap-2.5 sm:px-3 sm:py-2.5">
      <button onClick={onMenu} aria-label="Open menu" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <button onClick={onSearch} className="relative hidden h-[46px] min-w-0 flex-1 items-center gap-3 rounded-full bg-surface-2 pl-11 pr-4 text-left text-sm text-muted sm:flex">
        <Search className="absolute left-[15px] h-[18px] w-[18px]" aria-hidden />
        <span className="truncate">Search people, IDs, modules…</span>
        <kbd className="ml-auto hidden items-center gap-0.5 rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[11px] lg:inline-flex">
          <Command className="h-3 w-3" aria-hidden />K
        </kbd>
      </button>
      <button onClick={onSearch} aria-label="Search" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 sm:hidden">
        <Search className="h-5 w-5" />
      </button>
      <div className="ml-auto flex min-w-0 items-center gap-2 sm:ml-0">
        <label className="hidden text-xs text-muted xl:block" htmlFor="role">
          Viewing as
        </label>
        <select
          id="role"
          aria-label="Viewing as role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role);
            router.push("/");
          }}
          className="h-[46px] min-w-0 max-w-[132px] cursor-pointer rounded-full border border-line bg-surface px-3 text-sm font-semibold sm:max-w-none sm:px-3.5"
        >
          {(["Super Admin", "HR", "Manager", "Self-service"] as Role[]).map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <ThemeQuick />
      <div className="relative">
        <button onClick={() => setBell((v) => !v)} aria-label={`Notifications (${unread} unread)`} aria-expanded={bell} className="relative grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-0.5 top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-[5px] text-[11px] font-bold text-white tabular">{unread > 99 ? "99+" : unread}</span>}
        </button>
        {bell && <NotificationPanel alerts={alerts} onClose={() => setBell(false)} />}
      </div>
      {me && (
        <Link href={`/people/view?id=${me.id}`} className="hidden rounded-full sm:block" aria-label="My profile" title={`${fullName(me)} · ${role}`}>
          <Avatar person={me} size={44} />
        </Link>
      )}
    </header>
  );
}

const ALERT_ICON: Record<Alert["kind"], typeof Bell> = { approval: IdCard, kyc: ShieldCheck, expiry: FileWarning, intern: GraduationCap, contract: Briefcase, leave: CalendarClock, celebration: Cake };

function NotificationPanel({ alerts, onClose }: { alerts: Alert[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const read = useHR((s) => s.readAlerts);
  const markRead = useHR((s) => s.markAlertsRead);
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
  return (
    <div ref={ref} className="animate-scale-in fixed inset-x-3 top-24 z-50 origin-top-right overflow-hidden rounded-[26px] border border-line bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-14 sm:w-[400px]">
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <p className="text-[17px] font-bold">Notifications</p>
        <button onClick={() => markRead(alerts.map((a) => a.id))} className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-primary hover:bg-primary-soft">
          <CheckCheck className="h-4 w-4" /> Mark all read
        </button>
      </div>
      <ul className="scroll-thin max-h-[60dvh] space-y-1 overflow-y-auto p-2">
        {alerts.length === 0 && <li className="p-8 text-center text-sm text-muted">You&apos;re all caught up.</li>}
        {alerts.map((a) => {
          const I = ALERT_ICON[a.kind];
          const unread = !read.includes(a.id);
          return (
            <li key={a.id}>
              <Link
                href={a.href}
                onClick={() => {
                  markRead([a.id]);
                  onClose();
                }}
                className={cn("flex gap-3 rounded-[14px] px-3 py-2.5 transition-colors hover:bg-surface-2", unread && "bg-[color-mix(in_srgb,var(--primary-soft)_60%,transparent)]")}
              >
                <span className={cn("grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] bg-surface-2", a.tone === "danger" ? "text-danger" : a.tone === "warning" ? "text-warning" : "text-primary")}>
                  <I className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="unread" />}
                    <span className="truncate">{a.title}</span>
                  </span>
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
      <button onClick={() => setOpen((v) => !v)} aria-label="Theme" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-fg">
        <ModeIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="animate-scale-in fixed right-3 top-24 z-50 w-[290px] origin-top-right rounded-[26px] border border-line bg-surface p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] sm:absolute sm:right-0 sm:top-14">
          <p className="pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Appearance</p>
          <div className="seg flex w-full" role="group" aria-label="Mode">
            {(
              [
                ["light", Sun, "Light"],
                ["dark", Moon, "Dark"],
                ["system", Monitor, "Auto"],
              ] as const
            ).map(([m, I, l]) => (
              <button key={m} aria-pressed={t.mode === m} onClick={() => t.setMode(m)} className="flex flex-1 items-center justify-center gap-1.5">
                <I className="h-3.5 w-3.5" aria-hidden />
                {l}
              </button>
            ))}
          </div>
          <p className="pb-2 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Skin</p>
          <div className="flex flex-wrap gap-2.5">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => t.setPreset(p.id)}
                title={p.name}
                aria-label={p.name}
                aria-pressed={t.presetId === p.id}
                className={cn("h-9 w-9 rounded-full border-2 border-surface transition-transform hover:scale-110", t.presetId === p.id ? "shadow-[0_0_0_2px_var(--text)]" : "shadow-[0_0_0_1px_var(--border)]")}
                style={{ background: `conic-gradient(${p.light[0]} 0 50%, ${p.light[1]} 50% 100%)` }}
              />
            ))}
            <Link href="/settings" onClick={() => setOpen(false)} aria-label="Custom colours" title="Custom colours" className="grid h-9 w-9 place-items-center rounded-full bg-[conic-gradient(#e74c3c,#f1c40f,#2ecc71,#3498db,#9b59b6,#e74c3c)] text-white">
              <Palette className="h-4 w-4 drop-shadow" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------- Demo banner ---------------------------- */
function DemoBanner() {
  const reset = useHR((s) => s.resetDemo);
  const company = useHR((s) => s.settings.companyName);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  return (
    <div className="rise flex flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-[18px] bg-primary-soft px-4 py-2.5 text-[13px]">
      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <b>Live demo</b>
      <span className="text-fg-2">Sample data for {company} · every change saves in this browser · switch roles from “Viewing as”.</span>
      <span className="ml-auto flex gap-1">
        <button
          onClick={() => {
            if (confirm("Reset all demo data?")) reset();
          }}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 font-semibold text-primary hover:bg-surface/60"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
        <button onClick={() => setHidden(true)} aria-label="Dismiss" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface/60">
          <X className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

/* --------------------------- Mobile tab bar ------------------------- */
function MobileTabs({ onMenu }: { onMenu: () => void }) {
  const path = usePathname();
  const { role } = useMe();
  const badges = useBadges();
  const tabs = [
    { href: "/", label: "Home", icon: LayoutDashboard, n: 0 },
    role === "Self-service" ? { href: `/people/view?id=${ROLE_USER[role]}`, label: "Me", icon: UserCircle2, n: 0 } : { href: "/people", label: "People", icon: Users, n: 0 },
    { href: "/documents", label: "KYC", icon: ShieldCheck, n: badges.kyc },
    { href: "/attendance", label: "Leave", icon: CalendarCheck, n: badges.leave },
  ];
  return (
    <nav className="glass fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-40 rounded-full border border-line shadow-[var(--shadow)] lg:hidden" aria-label="Primary">
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1">
        {tabs.map(({ href, label, icon: Icon, n }) => {
          const active = isActive(path, href);
          return (
            <li key={label}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex h-[62px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors", active ? "text-primary" : "text-muted")}>
                <span className={cn("relative grid h-8 w-12 place-items-center rounded-full transition-colors", active && "bg-primary-soft")}>
                  <Icon className="h-5 w-5" aria-hidden />
                  {n > 0 && <span className="absolute -right-0.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white tabular">{n}</span>}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <button onClick={onMenu} className="flex h-[62px] w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted">
            <span className="grid h-8 w-12 place-items-center rounded-full">
              <Menu className="h-5 w-5" aria-hidden />
            </span>
            Menu
          </button>
        </li>
      </ul>
    </nav>
  );
}

/* --------------------------- Command palette ------------------------ */
function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  const people = useHR((s) => s.people);
  const { role, me } = useMe();
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
    const pool = can(role, "people.viewAll") ? people : role === "Manager" ? people.filter((p) => p.managerId === me.id) : [];
    const ppl = s ? pool.filter((p) => `${fullName(p)} ${p.code ?? ""} ${p.email} ${p.designation}`.toLowerCase().includes(s)).slice(0, 8) : [];
    return [
      ...ppl.map((p) => ({ key: p.id, label: fullName(p), sub: `${p.code ?? "ID pending"} · ${p.designation}`, href: `/people/view?id=${p.id}`, person: p })),
      ...pages.slice(0, s ? 8 : 10).map((i) => ({ key: i.href, label: i.label, sub: "Go to module", href: i.href, icon: i.icon })),
    ];
  }, [q, people, nav, role, me.id]);

  if (!open) return null;
  const go = (href: string) => {
    router.push(href);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center px-3 pt-[10dvh]" role="dialog" aria-modal="true" aria-label="Search">
      <div className="absolute inset-0 bg-[rgba(8,12,10,0.5)] backdrop-blur-[2px]" onClick={onClose} />
      <div className="animate-scale-in relative w-full max-w-xl overflow-hidden rounded-[28px] bg-surface shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
        <div className="relative p-3">
          <Search className="absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
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
            className="input !h-[54px] !rounded-full pl-12 !text-base"
          />
        </div>
        <ul className="scroll-thin max-h-[55dvh] overflow-y-auto px-2 pb-2" role="listbox">
          {results.length === 0 && <li className="p-6 text-center text-sm text-muted">No matches for “{q}”.</li>}
          {results.map((r, idx) => {
            const Icon = "icon" in r ? r.icon : undefined;
            return (
              <li key={r.key} role="option" aria-selected={idx === sel}>
                <button onMouseEnter={() => setSel(idx)} onClick={() => go(r.href)} className={cn("flex w-full items-center gap-3 rounded-[14px] px-3 py-2.5 text-left", idx === sel && "bg-surface-2")}>
                  {"person" in r && r.person ? (
                    <Avatar person={r.person} size={34} />
                  ) : Icon ? (
                    <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-primary-soft text-primary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{r.label}</span>
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
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => {
        const I = t.tone === "error" ? AlertCircle : t.tone === "info" ? Info : CheckCircle2;
        return (
          <div key={t.id} className="animate-toast pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-full bg-fg py-3 pl-4 pr-2 text-sm font-semibold text-bg shadow-[0_14px_30px_-10px_rgba(0,0,0,0.45)]">
            <I className={cn("h-[18px] w-[18px] shrink-0", t.tone === "error" ? "text-danger" : "text-[#8ff0b6]")} aria-hidden />
            <p className="min-w-0 flex-1 truncate">{t.title}</p>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-70 hover:opacity-100">
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
  const [menu, setMenu] = useState(false);
  const theme = useTheme();
  const path = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);
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
          <span className="animate-pulse">
            <BrandMark size={52} />
          </span>
          <p className="text-sm text-muted">Loading Pydinfinity HR…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-dvh grid-cols-1 gap-4 p-3 sm:p-4 lg:grid-cols-[272px_minmax(0,1fr)]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">
        Skip to content
      </a>
      <Sidebar open={menu} onClose={() => setMenu(false)} />
      <div className="relative flex min-w-0 flex-col gap-4">
        <div className="aura-bg" aria-hidden>
          <i />
          <i />
        </div>
        <TopBar onSearch={() => setSearch(true)} onMenu={() => setMenu(true)} />
        <div className="relative z-[1] flex flex-col gap-4">
          <DemoBanner />
          <main id="main" key={path} className="min-w-0 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileTabs onMenu={() => setMenu(true)} />
      <CommandPalette open={search} onClose={() => setSearch(false)} />
      <Toaster />
    </div>
  );
}
