"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  UserPlus,
  IdCard,
  CalendarPlus,
  FileSignature,
  FileSpreadsheet,
  Megaphone,
  Network,
  Clock,
  CalendarClock,
  FileWarning,
  ArrowRight,
  Cake,
  LogIn,
  LogOut,
  TrendingUp,
  Wallet,
  Sparkles,
} from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { useAlerts } from "@/lib/alerts";
import { leaveBalance, LEAVE_NAMES } from "@/lib/hr";
import { daysBetween, fmtDate, fmtINR, fmtTime, fullName, kycPercent, todayISO, cn } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, Progress, StatCard, StatusBadge } from "@/components/ui";
import { Columns, Donut, HBar } from "@/components/charts";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

/* ----------------------------- Hero banner ---------------------------- */
function Hero({ slides }: { slides: { tag: string; title: string; sub: string; cta: string; href: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);
  const s = slides[i];
  return (
    <section className="gradient-brand relative overflow-hidden rounded-[calc(var(--radius)*1.2)] text-primary-fg shadow-lg shadow-primary/25">
      <div className="bg-grid absolute inset-0 opacity-30" aria-hidden />
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" aria-hidden />
      <div className="absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-black/10 blur-2xl" aria-hidden />
      <div className="relative flex min-h-[168px] flex-col justify-center px-5 py-6 sm:min-h-[200px] sm:px-8">
        <div key={i} className="animate-fade-up max-w-xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-85 sm:text-xs">{s.tag}</span>
          <h2 className="mt-1.5 text-xl font-bold leading-tight sm:text-3xl">{s.title}</h2>
          <p className="mt-1 text-sm opacity-90">{s.sub}</p>
          <Link href={s.href} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#1f2430] shadow-md transition-transform hover:scale-[1.02]">
            {s.cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="absolute bottom-4 right-5 flex gap-2 sm:right-8">
          {slides.map((_, k) => (
            <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-6 bg-white" : "w-2 bg-white/50")} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- Quick circles --------------------------- */
function QuickActions({ items }: { items: { href: string; label: string; icon: typeof Users }[] }) {
  return (
    <section aria-label="Quick actions" className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 py-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 md:grid-cols-8">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={label} href={href} className="group flex w-[72px] shrink-0 flex-col items-center gap-2 text-center sm:w-auto">
          <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-primary/20 bg-surface text-primary shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md group-hover:shadow-primary/20">
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <span className="line-clamp-2 text-[11.5px] font-medium leading-tight text-fg-2 group-hover:text-fg">{label}</span>
        </Link>
      ))}
    </section>
  );
}

export default function Dashboard() {
  const { role, me } = useMe();
  if (role === "Self-service") return <SelfDashboard />;
  return <AdminDashboard key={role} manager={role === "Manager"} meId={me.id} />;
}

/* ---------------------------- Admin / HR ------------------------------ */
function AdminDashboard({ manager, meId }: { manager: boolean; meId: string }) {
  const { role, me } = useMe();
  const allPeople = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const invoices = useHR((s) => s.invoices);
  const attendance = useHR((s) => s.attendance);
  const leaves = useHR((s) => s.leaves);
  const announcements = useHR((s) => s.announcements);
  const alerts = useAlerts();
  const today = todayISO();

  const people = useMemo(() => (manager ? allPeople.filter((p) => p.managerId === meId) : allPeople), [allPeople, manager, meId]);
  const active = people.filter((p) => p.status !== "Exited" && p.status !== "Pending Approval");
  const byType = (t: string) => active.filter((p) => p.type === t).length;
  const ids = new Set(people.map((p) => p.id));
  const docs = documents.filter((d) => ids.has(d.personId));
  const pendingKyc = docs.filter((d) => d.status === "Uploaded").length;
  const kycAvg = Math.round(active.reduce((a, p) => a + kycPercent(docs.filter((d) => d.personId === p.id)), 0) / Math.max(active.length, 1));
  const presentToday = attendance.filter((a) => a.date === today && ids.has(a.personId)).length;

  const depts = useMemo(() => {
    const m = new Map<string, number>();
    active.forEach((p) => m.set(p.department, (m.get(p.department) ?? 0) + 1));
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [active]);

  const months = useMemo(() => {
    const out: { label: string; join: number; exit: number }[] = [];
    const now = new Date();
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const same = (iso: string) => {
        const x = new Date(iso);
        return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth();
      };
      out.push({
        label,
        join: people.filter((p) => same(p.joiningDate)).length,
        exit: people.filter((p) => p.timeline.some((t) => t.kind === "exit" && same(t.date))).length,
      });
    }
    return out;
  }, [people]);

  const freelancerSpend = invoices.filter((i) => i.status === "Paid" && daysBetween(i.date, today) <= 90).reduce((a, i) => a + i.amount, 0);
  const interns = allPeople.filter((p) => p.previousCodes.length || p.type === "intern");
  const converted = allPeople.filter((p) => p.previousCodes.some((c) => c.includes("-INT-"))).length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending" && ids.has(l.personId));
  const birthdays = active
    .map((p) => {
      const d = new Date(p.dob);
      const next = new Date(new Date().getFullYear(), d.getMonth(), d.getDate());
      if (daysBetween(today, next) < 0) next.setFullYear(next.getFullYear() + 1);
      return { p, days: daysBetween(today, next) };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const slides = [
    { tag: `${greeting()}, ${me.firstName}`, title: manager ? `Your team of ${active.length} at a glance` : `${active.length} people across ${depts.length} departments`, sub: `${presentToday} checked in today · ${alerts.length} items need attention`, cta: "Open people directory", href: "/people" },
    { tag: "KYC VAULT", title: `${pendingKyc} documents waiting for you`, sub: `Average KYC completion is ${kycAvg}%. Verify uploads in one place.`, cta: "Verify documents", href: "/documents?status=Uploaded" },
    { tag: "ID GENERATOR", title: "Print QR ID cards in bulk", sub: "Auto IDs, locked once issued — never edited, never reused.", cta: "Open ID cards", href: "/ids" },
  ];

  const actions = [
    { href: "/people?new=1", label: "Add person", icon: UserPlus },
    { href: "/ids", label: "ID cards", icon: IdCard },
    { href: "/documents?status=Uploaded", label: "Verify KYC", icon: ShieldCheck },
    { href: "/attendance?apply=1", label: "Apply leave", icon: CalendarPlus },
    { href: "/letters", label: "Letters", icon: FileSignature },
    { href: "/import-export", label: "Import", icon: FileSpreadsheet },
    { href: "/announcements?new=1", label: "Announce", icon: Megaphone },
    { href: "/org-chart", label: "Org chart", icon: Network },
  ].filter((a) => can(role, "people.manage") || ["/attendance?apply=1", "/letters", "/org-chart", "/documents?status=Uploaded"].includes(a.href));

  const actionAlerts = alerts.filter((a) => a.kind !== "celebration").slice(0, 6);

  return (
    <div className="space-y-5 sm:space-y-6">
      <Hero slides={slides} />
      <QuickActions items={actions} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Employees" value={byType("employee")} icon={Users} hint={`${active.filter((p) => p.status === "Notice Period").length} on notice period`} />
        <StatCard label="Interns" value={byType("intern")} icon={GraduationCap} tone="info" hint={`${converted} converted to employee`} />
        <StatCard label="Freelancers" value={byType("freelancer")} icon={Briefcase} tone="warning" hint={`${fmtINR(freelancerSpend, true)} paid · 90 days`} />
        <StatCard label="KYC complete" value={`${kycAvg}%`} icon={ShieldCheck} tone="success" hint={`${pendingKyc} awaiting verification`} />
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Needs your attention" subtitle="Approvals, verification, expiries & renewals" icon={Sparkles} action={<Badge tone="primary">{alerts.length}</Badge>} />
          <ul className="divide-y divide-line">
            {actionAlerts.length === 0 && <li className="p-6 text-center text-sm text-muted">Nothing pending. Nice work!</li>}
            {actionAlerts.map((a) => {
              const Icon = a.kind === "expiry" ? FileWarning : a.kind === "intern" ? GraduationCap : a.kind === "contract" ? Briefcase : a.kind === "approval" ? IdCard : a.kind === "leave" ? CalendarClock : ShieldCheck;
              return (
                <li key={a.id}>
                  <Link href={a.href} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2 sm:px-5">
                    <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full", a.tone === "danger" ? "bg-danger-soft text-danger" : a.tone === "warning" ? "bg-warning-soft text-warning" : "bg-info-soft text-info")}>
                      <Icon className="h-[18px] w-[18px]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.title}</span>
                      <span className="block truncate text-xs text-muted">{a.detail}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Headcount by type" subtitle="Active people" icon={Users} />
          <div className="p-5">
            <Donut
              center={String(active.length)}
              sub="active"
              data={[
                { label: "Employees", value: byType("employee") },
                { label: "Interns", value: byType("intern") },
                { label: "Freelancers", value: byType("freelancer") },
              ]}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Joiners vs exits" subtitle="Last 6 months" icon={TrendingUp} />
          <div className="p-5">
            <Columns labels={months.map((m) => m.label)} series={[{ name: "Joiners", values: months.map((m) => m.join) }, { name: "Exits", values: months.map((m) => m.exit) }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="By department" subtitle={`${depts.length} departments`} icon={Network} />
          <div className="p-5">
            <HBar data={depts} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Leave requests" subtitle={`${pendingLeaves.length} pending`} icon={CalendarClock} action={<Link href="/attendance" className="text-xs font-semibold text-primary hover:underline">View all</Link>} />
          <ul className="divide-y divide-line">
            {pendingLeaves.slice(0, 4).map((l) => {
              const p = allPeople.find((x) => x.id === l.personId)!;
              return (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  <Avatar person={p} size={34} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{fullName(p)}</p>
                    <p className="text-xs text-muted">{LEAVE_NAMES[l.type]} · {l.days}d · {fmtDate(l.from, { day: "2-digit", month: "short" })}</p>
                  </div>
                  <Badge tone="warning">Pending</Badge>
                </li>
              );
            })}
            {pendingLeaves.length === 0 && <li className="p-6 text-center text-sm text-muted">No pending requests</li>}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Upcoming birthdays" subtitle="Celebrate your people" icon={Cake} />
          <ul className="divide-y divide-line">
            {birthdays.map(({ p, days }) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Avatar person={p} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fullName(p)}</p>
                  <p className="text-xs text-muted">{fmtDate(p.dob, { day: "2-digit", month: "long" })}</p>
                </div>
                <Badge tone={days === 0 ? "primary" : "neutral"}>{days === 0 ? "Today" : `in ${days}d`}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Notice board" subtitle="Latest announcements" icon={Megaphone} action={<Link href="/announcements" className="text-xs font-semibold text-primary hover:underline">Open</Link>} />
          <ul className="divide-y divide-line">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <Badge tone={a.category === "Policy" ? "info" : a.category === "Event" ? "primary" : "neutral"}>{a.category}</Badge>
                  <span className="text-xs text-muted">{fmtDate(a.date, { day: "2-digit", month: "short" })}</span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm font-medium">{a.title}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {!manager && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Present today" value={presentToday} icon={Clock} tone="success" hint={`of ${active.filter((p) => p.type !== "freelancer").length} expected`} />
          <StatCard label="Intern → Employee" value={`${Math.round((converted / Math.max(interns.length, 1)) * 100)}%`} icon={GraduationCap} tone="info" hint="conversion rate" />
          <StatCard label="Pending invoices" value={invoices.filter((i) => i.status !== "Paid").length} icon={Wallet} tone="warning" hint={fmtINR(invoices.filter((i) => i.status !== "Paid").reduce((a, i) => a + i.amount, 0), true)} />
          <StatCard label="Awaiting approval" value={allPeople.filter((p) => p.status === "Pending Approval").length} icon={IdCard} hint="new joiners without IDs" />
        </div>
      )}
    </div>
  );
}

/* ---------------------------- Self-service ---------------------------- */
function SelfDashboard() {
  const { me } = useMe();
  const documents = useHR((s) => s.documents);
  const leaves = useHR((s) => s.leaves);
  const quota = useHR((s) => s.settings.leaveQuota);
  const attendance = useHR((s) => s.attendance);
  const announcements = useHR((s) => s.announcements);
  const checkIn = useHR((s) => s.checkIn);
  const checkOut = useHR((s) => s.checkOut);
  const today = todayISO();
  const mine = documents.filter((d) => d.personId === me.id);
  const kyc = kycPercent(mine);
  const rec = attendance.find((a) => a.personId === me.id && a.date === today);
  const bal = leaveBalance(me.id, leaves, quota).filter((b) => b.type !== "LOP");

  return (
    <div className="space-y-5 sm:space-y-6">
      <Hero
        slides={[
          { tag: `${greeting()}, ${me.firstName}`, title: rec?.checkIn ? `Checked in at ${fmtTime(rec.checkIn)}` : "Ready to start your day?", sub: `${me.code} · ${me.designation}`, cta: "View my profile", href: `/people/${me.id}` },
          { tag: "MY KYC", title: `Your KYC is ${kyc}% complete`, sub: "Upload pending documents — HR will verify them.", cta: "Upload documents", href: "/documents" },
        ]}
      />
      <QuickActions
        items={[
          { href: "/attendance?apply=1", label: "Apply leave", icon: CalendarPlus },
          { href: "/documents", label: "My KYC", icon: ShieldCheck },
          { href: "/letters", label: "My letters", icon: FileSignature },
          { href: "/payroll", label: "Payslips", icon: Wallet },
        ]}
      />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Today</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tabular">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
          <p className="text-sm text-fg-2">{fmtDate(today, { weekday: "long", day: "numeric", month: "long" })}</p>
          <div className="mt-4 flex gap-2">
            {!rec?.checkIn ? (
              <Button icon={LogIn} className="flex-1" onClick={() => checkIn(me.id, me.branch === "Remote" ? "Remote" : "Office")}>Check in</Button>
            ) : !rec.checkOut ? (
              <Button icon={LogOut} variant="secondary" className="flex-1" onClick={() => checkOut(me.id)}>Check out</Button>
            ) : (
              <Badge tone="success">Day complete · {fmtTime(rec.checkIn)} – {fmtTime(rec.checkOut)}</Badge>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">KYC progress</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tabular">{kyc}%</p>
          <Progress value={kyc} tone={kyc === 100 ? "success" : "primary"} className="mt-3" label="KYC progress" />
          <p className="mt-2 text-xs text-muted">{mine.filter((d) => d.status === "Verified").length} of {mine.length} verified</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Leave balance</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {bal.map((b) => (
              <div key={b.type} className="rounded-[calc(var(--radius)*0.7)] bg-surface-2 p-3 text-center">
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold tabular">{b.left}</p>
                <p className="text-[11px] text-muted">{LEAVE_NAMES[b.type]}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <CardHeader title="Notice board" icon={Megaphone} />
        <ul className="divide-y divide-line">
          {announcements.slice(0, 4).map((a) => (
            <li key={a.id} className="px-5 py-4">
              <div className="flex items-center gap-2">
                <Badge tone="primary">{a.category}</Badge>
                <span className="text-xs text-muted">{fmtDate(a.date)}</span>
              </div>
              <p className="mt-1.5 font-medium">{a.title}</p>
              <p className="mt-0.5 text-sm text-fg-2">{a.body}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="My leave history" icon={CalendarClock} />
        <ul className="divide-y divide-line">
          {leaves.filter((l) => l.personId === me.id).slice(0, 5).map((l) => (
            <li key={l.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <span>{LEAVE_NAMES[l.type]} · {fmtDate(l.from)} ({l.days}d)</span>
              <StatusBadge status={l.status} />
            </li>
          ))}
          {!leaves.some((l) => l.personId === me.id) && <li className="p-5 text-sm text-muted">No leave taken yet this year.</li>}
        </ul>
      </Card>
    </div>
  );
}
