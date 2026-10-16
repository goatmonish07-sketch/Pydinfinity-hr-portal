"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Megaphone,
  CalendarClock,
  FileWarning,
  ChevronRight,
  Cake,
  LogIn,
  LogOut,
  Wallet,
  Activity,
  Palmtree,
} from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { leaveBalance, LEAVE_NAMES } from "@/lib/hr";
import { addDays, cn, daysBetween, fmtDate, fmtINR, fmtTime, fullName, kycPercent, todayISO } from "@/lib/utils";
import type { Person } from "@/lib/types";
import { Avatar, Badge, Button, Card, CardHeader, Seg, StatCard, StatusBadge } from "@/components/ui";
import { Columns, Donut, Gauge, HBar, TrendBars } from "@/components/charts";

const hello = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/* ------------------------------ Live clock ----------------------------- */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function ClockCard({ person, present, expected, delay = 0 }: { person: Person; present?: number; expected?: number; delay?: number }) {
  const now = useClock();
  const attendance = useHR((s) => s.attendance);
  const checkIn = useHR((s) => s.checkIn);
  const checkOut = useHR((s) => s.checkOut);
  const rec = attendance.find((a) => a.personId === person.id && a.date === todayISO());
  return (
    <section className="rise lift relative flex flex-col justify-between gap-4 overflow-hidden rounded-[var(--radius-card)] p-5 text-white shadow-[var(--shadow)] sm:p-[22px]" style={{ animationDelay: `${delay}ms`, background: "radial-gradient(circle at 105% 115%, color-mix(in srgb, var(--primary) 70%, transparent), transparent 55%), repeating-radial-gradient(circle at 100% 100%, rgba(255,255,255,0.06) 0 1px, transparent 1px 18px), linear-gradient(135deg, var(--primary-strong), color-mix(in srgb, var(--primary-strong) 80%, #000))" }}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="live-dot" aria-hidden /> Attendance · live
        </span>
        <span className="text-xs opacity-80">{fmtDate(todayISO(), { weekday: "long", day: "numeric", month: "short" })}</span>
      </div>
      <p className="font-mono text-[clamp(40px,6vw,60px)] font-semibold leading-none tracking-[-0.02em] tabular">{now.toLocaleTimeString("en-IN", { hour12: false })}</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm opacity-85">
          {rec?.checkIn ? `In ${fmtTime(rec.checkIn)}${rec.checkOut ? ` · out ${fmtTime(rec.checkOut)}` : ""}` : "You haven't checked in yet"}
          {present !== undefined && (
            <>
              <br />
              <span className="tabular">{present}</span> of <span className="tabular">{expected}</span> people in today
            </>
          )}
        </p>
        {!rec?.checkIn ? (
          <button onClick={() => checkIn(person.id, person.branch === "Remote" ? "Remote" : "Office")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-5 text-sm font-bold text-primary-strong transition-transform active:scale-[0.97]">
            <LogIn className="h-4 w-4" /> Check in
          </button>
        ) : !rec.checkOut ? (
          <button onClick={() => checkOut(person.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-white/60 px-5 text-sm font-bold transition-transform active:scale-[0.97]">
            <LogOut className="h-4 w-4" /> Check out
          </button>
        ) : (
          <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold">Day complete</span>
        )}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { role } = useMe();
  if (role === "Self-service") return <SelfDashboard />;
  return <AdminDashboard key={role} />;
}

type Range = "week" | "month" | "quarter";
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, quarter: 90 };

/* ---------------------------- Admin / HR ------------------------------ */
function AdminDashboard() {
  const router = useRouter();
  const { role, me } = useMe();
  const manager = role === "Manager";
  const allPeople = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const invoices = useHR((s) => s.invoices);
  const attendance = useHR((s) => s.attendance);
  const leaves = useHR((s) => s.leaves);
  const announcements = useHR((s) => s.announcements);
  const branch = useHR((s) => s.branch);
  const company = useHR((s) => s.settings.companyName);
  const [range, setRange] = useState<Range>("week");
  const today = todayISO();

  const people = useMemo(() => allPeople.filter((p) => (!manager || p.managerId === me.id) && (branch === "All branches" || p.branch === branch)), [allPeople, manager, me.id, branch]);
  const ids = useMemo(() => new Set(people.map((p) => p.id)), [people]);
  const active = people.filter((p) => p.status !== "Exited" && p.status !== "Pending Approval");
  const byType = (t: string) => active.filter((p) => p.type === t).length;
  const since90 = addDays(today, -90);
  const joinedRecently = (t?: string) => people.filter((p) => p.joiningDate >= since90 && p.joiningDate <= today && (!t || p.type === t)).length;
  const docs = documents.filter((d) => ids.has(d.personId));
  const pendingKyc = docs.filter((d) => d.status === "Uploaded").length;
  const kycAvg = Math.round(active.reduce((a, p) => a + kycPercent(docs.filter((d) => d.personId === p.id)), 0) / Math.max(active.length, 1));
  const presentToday = attendance.filter((a) => a.date === today && ids.has(a.personId)).length;
  const expected = active.filter((p) => p.type !== "freelancer").length;

  // headcount at the end of each of the last 12 months
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, k) => {
      const end = new Date(now.getFullYear(), now.getMonth() - (11 - k) + 1, 0);
      const endISO = end.toISOString().slice(0, 10);
      const count = people.filter((p) => p.status !== "Pending Approval" && p.joiningDate <= endISO && !p.timeline.some((t) => t.kind === "exit" && t.date.slice(0, 10) <= endISO)).length;
      const join = people.filter((p) => p.joiningDate.slice(0, 7) === endISO.slice(0, 7)).length;
      const exit = people.filter((p) => p.timeline.some((t) => t.kind === "exit" && t.date.slice(0, 7) === endISO.slice(0, 7))).length;
      return { label: end.toLocaleDateString("en-IN", { month: "short" }), title: end.toLocaleDateString("en-IN", { month: "long", year: "numeric" }), value: count, join, exit };
    });
  }, [people]);

  const depts = useMemo(() => {
    const m = new Map<string, number>();
    active.forEach((p) => m.set(p.department, (m.get(p.department) ?? 0) + 1));
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [active]);

  // things due in the selected range
  const due = useMemo(() => {
    const end = addDays(today, RANGE_DAYS[range]);
    const out: { id: string; icon: typeof Users; title: string; sub: string; date: string; href: string; tone: "warning" | "danger" | "info" | "primary" }[] = [];
    for (const p of people) {
      if (p.status === "Exited") continue;
      if (p.status === "Pending Approval") out.push({ id: `ap${p.id}`, icon: IdCard, title: `${fullName(p)} joins`, sub: `${p.designation} · approve to issue ID`, date: p.joiningDate, href: `/people/view?id=${p.id}`, tone: "primary" });
      if (p.intern && p.intern.endDate >= today && p.intern.endDate <= end) out.push({ id: `in${p.id}`, icon: GraduationCap, title: `Internship ends · ${fullName(p)}`, sub: "Certificate or convert", date: p.intern.endDate, href: "/interns", tone: "info" });
      if (p.freelancer && p.freelancer.contractEnd >= today && p.freelancer.contractEnd <= end) out.push({ id: `fr${p.id}`, icon: Briefcase, title: `Contract renewal · ${fullName(p)}`, sub: "Freelance contract ends", date: p.freelancer.contractEnd, href: "/freelancers", tone: "warning" });
    }
    for (const d of docs) if (d.expiry && d.status === "Verified" && d.expiry <= end) {
      const p = people.find((x) => x.id === d.personId)!;
      out.push({ id: `ex${d.id}`, icon: FileWarning, title: `${d.kind} ${d.expiry < today ? "expired" : "expires"}`, sub: fullName(p), date: d.expiry, href: "/documents?status=Expiring", tone: d.expiry < today ? "danger" : "warning" });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }, [people, docs, range, today]);

  const pendingLeaves = leaves.filter((l) => l.status === "Pending" && ids.has(l.personId));
  const outToday = leaves.filter((l) => l.status === "Approved" && l.from <= today && l.to >= today && ids.has(l.personId));
  const d30 = addDays(today, -60);
  const d60 = addDays(today, -120);
  const freelancerSpend = invoices.filter((i) => i.status === "Paid" && i.date > d30).reduce((a, i) => a + i.amount, 0);
  const prevSpend = invoices.filter((i) => i.status === "Paid" && i.date > d60 && i.date <= d30).reduce((a, i) => a + i.amount, 0);
  const birthdays = active
    .map((p) => {
      const d = new Date(p.dob);
      const next = new Date(new Date().getFullYear(), d.getMonth(), d.getDate());
      if (daysBetween(today, next) < 0) next.setFullYear(next.getFullYear() + 1);
      return { p, days: daysBetween(today, next) };
    })
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome + KPIs */}
      <Card className="p-4 sm:p-[22px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted">
              {fmtDate(today, { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · {company}, {branch}
            </p>
            <h1 className="mt-1.5 text-[clamp(28px,4vw,40px)] font-extrabold leading-tight tracking-[-0.03em]">
              {hello()}, {me.firstName}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {can(role, "people.manage") && (
              <Button size="lg" icon={UserPlus} onClick={() => router.push("/people?new=1")}>
                Add person
              </Button>
            )}
            <Button size="lg" variant="outline" icon={CalendarPlus} onClick={() => router.push(manager ? "/attendance" : "/attendance?apply=1")}>
              {manager ? "Team leave" : "Apply leave"}
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          <StatCard hero label={manager ? "My team" : "Active people"} value={active.length} icon={Activity} hint={`${presentToday} checked in right now`} onClick={() => router.push("/people")} delay={80} />
          <StatCard label="Employees" value={byType("employee")} icon={Users} hint={<Delta n={joinedRecently("employee")} label="joined · 90 days" />} onClick={() => router.push("/people?type=employee")} delay={150} />
          <StatCard label="Interns" value={byType("intern")} icon={GraduationCap} tone="info" hint={<Delta n={joinedRecently("intern")} label="joined · 90 days" />} onClick={() => router.push("/interns")} delay={220} />
          {manager ? (
            <StatCard label="Leave requests" value={pendingLeaves.length} icon={CalendarClock} tone="warning" hint="waiting for you" onClick={() => router.push("/attendance")} delay={290} />
          ) : (
            <StatCard label="Freelancer spend · 60d" value={fmtINR(freelancerSpend, true)} icon={Wallet} tone="warning" hint={<Delta n={freelancerSpend - prevSpend} label="vs prior 60 days" money />} onClick={() => router.push("/freelancers")} delay={290} />
          )}
        </div>
      </Card>

      {/* Trend + gauge */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card lift delay={200}>
          <CardHeader title="Headcount · last 12 months" subtitle={`${months[11]?.value ?? 0} people today · ${months.reduce((a, m) => a + m.join, 0)} joined this year`} />
          <div className="px-4 pb-4 sm:px-[22px] sm:pb-5">
            <TrendBars data={months} label="Headcount at the end of each month, latest highlighted" />
            <p className="mt-1.5 text-xs text-muted">Bars: headcount at month end · Line: trend · This month in full colour</p>
          </div>
        </Card>
        <Card lift delay={260} className="flex flex-col">
          <CardHeader title="KYC completion" subtitle="Average across active people" action={<Badge tone="primary">{pendingKyc} to verify</Badge>} />
          <div className="flex flex-1 flex-col justify-center px-4 pb-5 sm:px-[22px]">
            <Gauge pct={kycAvg} label="KYC completion" caption={`${docs.filter((d) => d.status === "Verified").length} of ${docs.length} documents verified`} />
            <Button variant="ghost" size="sm" className="mx-auto mt-3" onClick={() => router.push("/documents?status=Uploaded")}>
              Open verification queue <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Due / leave / departments */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card lift delay={320}>
          <CardHeader
            title={
              <>
                Coming up <span className="ml-1 inline-flex h-6 min-w-[26px] items-center justify-center rounded-full bg-primary-soft px-2 align-middle text-[13px] font-bold text-primary tabular">{due.length}</span>
              </>
            }
            action={<Link href="/onboarding" className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-muted hover:bg-surface-2 hover:text-fg">All</Link>}
          />
          <div className="px-4 sm:px-[22px]">
            <Seg label="Due within" value={range} onChange={setRange} options={[{ value: "week", label: "This week" }, { value: "month", label: "Month" }, { value: "quarter", label: "Quarter" }]} />
          </div>
          <ul className="px-2 pb-3 pt-2 sm:px-3.5">
            {due.length === 0 && <li className="px-3 py-9 text-center text-sm text-muted">Nothing due. All caught up.</li>}
            {due.slice(0, 6).map((d) => (
              <li key={d.id} className="border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] last:border-0">
                <Link href={d.href} className="flex items-center gap-3 rounded-[14px] px-2 py-2.5 transition-colors hover:bg-surface-2">
                  <d.icon className="h-5 w-5 shrink-0 text-muted" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{d.title}</span>
                    <span className={cn("block text-xs font-bold", d.date < today ? "text-danger" : "text-muted")}>
                      {d.date < today ? "Overdue · " : ""}
                      {fmtDate(d.date, { weekday: "short", day: "numeric", month: "short" })} · <span className="font-medium">{d.sub}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>

        <Card lift delay={380}>
          <CardHeader title="Leave & absence" subtitle={`${outToday.length} out today · ${pendingLeaves.length} to approve`} action={<Link href="/attendance" className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-muted hover:bg-surface-2 hover:text-fg">Open</Link>} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {[...outToday.map((l) => ({ l, out: true })), ...pendingLeaves.map((l) => ({ l, out: false }))].slice(0, 6).map(({ l, out }) => {
              const p = allPeople.find((x) => x.id === l.personId)!;
              return (
                <li key={l.id + String(out)} className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-2.5 last:border-0">
                  <Avatar person={p} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{fullName(p)}</span>
                    <span className="block text-xs text-muted">
                      {LEAVE_NAMES[l.type]} · {l.days}d · {fmtDate(l.from, { day: "numeric", month: "short" })}
                    </span>
                  </span>
                  {out ? <Badge tone="info"><Palmtree className="h-3 w-3" /> Out</Badge> : <Badge tone="warning">Pending</Badge>}
                </li>
              );
            })}
            {outToday.length + pendingLeaves.length === 0 && <li className="px-3 py-9 text-center text-sm text-muted">Everyone&apos;s in. No pending requests.</li>}
          </ul>
        </Card>

        <Card lift delay={440}>
          <CardHeader title="By department" subtitle={`${active.length} active people`} />
          <div className="px-4 pb-5 sm:px-[22px]">
            <HBar data={depts} />
          </div>
        </Card>
      </div>

      {/* Clock / mix / joiners */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ClockCard person={me} present={presentToday} expected={expected} delay={480} />
        <Card lift delay={520}>
          <CardHeader title="Workforce mix" subtitle="Employees · interns · freelancers" />
          <div className="px-4 pb-5 sm:px-[22px]">
            <Donut center={active.length} sub="active" data={[{ label: "Employees", value: byType("employee") }, { label: "Interns", value: byType("intern") }, { label: "Freelancers", value: byType("freelancer") }]} />
          </div>
        </Card>
        <Card lift delay={560}>
          <CardHeader title="Joiners vs exits" subtitle="Last 6 months" />
          <div className="px-4 pb-5 sm:px-[22px]">
            <Columns labels={months.slice(6).map((m) => m.label)} series={[{ name: "Joiners", values: months.slice(6).map((m) => m.join) }, { name: "Exits", values: months.slice(6).map((m) => m.exit) }]} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card lift delay={600}>
          <CardHeader title="Celebrations" subtitle="Upcoming birthdays" icon={Cake} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {birthdays.map(({ p, days }) => (
              <li key={p.id} className="flex items-center gap-3 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-2.5 last:border-0">
                <Avatar person={p} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{fullName(p)}</span>
                  <span className="block text-xs text-muted">{fmtDate(p.dob, { day: "numeric", month: "long" })}</span>
                </span>
                <Badge tone={days === 0 ? "primary" : "neutral"}>{days === 0 ? "Today" : `in ${days}d`}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card lift delay={640}>
          <CardHeader title="Notice board" subtitle="Latest announcements" icon={Megaphone} action={<Link href="/announcements" className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-semibold text-muted hover:bg-surface-2 hover:text-fg">Open</Link>} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {announcements.slice(0, 3).map((a) => (
              <li key={a.id} className="border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-3 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge tone={a.category === "Policy" ? "info" : a.category === "Event" ? "primary" : "neutral"}>{a.category}</Badge>
                  <span className="text-xs text-muted">{fmtDate(a.date, { day: "numeric", month: "short" })}</span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm font-semibold">{a.title}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Delta({ n, label, money }: { n: number; label: string; money?: boolean }) {
  const up = n >= 0;
  return (
    <>
      <b className={cn("inline-flex items-center gap-0.5 rounded-[7px] border border-current px-[7px] py-px font-bold", up ? "text-success" : "text-danger")}>
        {up ? "▲" : "▼"} {money ? fmtINR(Math.abs(n), true) : Math.abs(n)}
      </b>
      <span>{label}</span>
    </>
  );
}

/* ---------------------------- Self-service ---------------------------- */
function SelfDashboard() {
  const router = useRouter();
  const { me } = useMe();
  const documents = useHR((s) => s.documents);
  const leaves = useHR((s) => s.leaves);
  const quota = useHR((s) => s.settings.leaveQuota);
  const announcements = useHR((s) => s.announcements);
  const company = useHR((s) => s.settings.companyName);
  const mine = documents.filter((d) => d.personId === me.id);
  const kyc = kycPercent(mine);
  const bal = leaveBalance(me.id, leaves, quota).filter((b) => b.type !== "LOP");

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4 sm:p-[22px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted">
              {fmtDate(todayISO(), { weekday: "long", day: "numeric", month: "long" })} · {company}
            </p>
            <h1 className="mt-1.5 text-[clamp(28px,4vw,40px)] font-extrabold leading-tight tracking-[-0.03em]">
              {hello()}, {me.firstName}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">{me.code} · {me.designation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" icon={CalendarPlus} onClick={() => router.push("/attendance?apply=1")}>Apply leave</Button>
            <Button size="lg" variant="outline" icon={FileSignature} onClick={() => router.push("/letters")}>My letters</Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
          {bal.map((b, i) => (
            <StatCard key={b.type} hero={i === 0} label={`${LEAVE_NAMES[b.type]} leave`} value={b.left} icon={Palmtree} tone="info" hint={`of ${b.quota} days left`} delay={80 + i * 70} />
          ))}
          <StatCard label="Payslip" value={me.ctc ? fmtINR(Math.round(me.ctc / 12), true) : "—"} icon={Wallet} tone="warning" hint="gross per month" onClick={() => router.push("/payroll")} delay={290} />
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <ClockCard person={me} delay={200} />
        <Card lift delay={260} className="flex flex-col">
          <CardHeader title="My KYC" subtitle={`${mine.filter((d) => d.status === "Verified").length} of ${mine.length} verified`} icon={ShieldCheck} />
          <div className="flex flex-1 flex-col justify-center px-4 pb-5 sm:px-[22px]">
            <Gauge pct={kyc} label="KYC" caption={kyc === 100 ? "All documents verified" : "Upload pending documents"} />
            <Button variant="ghost" size="sm" className="mx-auto mt-3" onClick={() => router.push("/documents")}>
              Upload documents <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        <Card lift delay={320}>
          <CardHeader title="My leave" icon={CalendarClock} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {leaves.filter((l) => l.personId === me.id).slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-2 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-2.5 text-sm last:border-0">
                <span>{LEAVE_NAMES[l.type]} · {fmtDate(l.from, { day: "numeric", month: "short" })} · {l.days}d</span>
                <StatusBadge status={l.status} />
              </li>
            ))}
            {!leaves.some((l) => l.personId === me.id) && <li className="px-3 py-9 text-center text-sm text-muted">No leave taken this year.</li>}
          </ul>
        </Card>
      </div>
      <Card lift delay={380}>
        <CardHeader title="Notice board" icon={Megaphone} />
        <ul className="px-2 pb-3 sm:px-3.5">
          {announcements.slice(0, 4).map((a) => (
            <li key={a.id} className="border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-3 last:border-0">
              <div className="flex items-center gap-2">
                <Badge tone="primary">{a.category}</Badge>
                <span className="text-xs text-muted">{fmtDate(a.date)}</span>
              </div>
              <p className="mt-1.5 font-semibold">{a.title}</p>
              <p className="mt-0.5 text-sm text-muted">{a.body}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
