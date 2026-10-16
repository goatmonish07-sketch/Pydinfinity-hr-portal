"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, LogIn, LogOut, MapPin, Check, X, ChevronLeft, ChevronRight, Clock, Users, Palmtree, CalendarDays } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import type { LeaveType } from "@/lib/types";
import { leaveBalance, LEAVE_NAMES } from "@/lib/hr";
import { addDays, cn, daysBetween, fmtDate, fmtTime, fullName, qp, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, ChipTabs, Empty, Field, Modal, PageHeader, StatCard, StatusBadge } from "@/components/ui";

const HOLIDAYS: { date: string; name: string; branches: string[] | "all" }[] = (() => {
  const y = new Date().getFullYear();
  return [
    { date: `${y}-01-26`, name: "Republic Day", branches: "all" },
    { date: `${y}-01-15`, name: "Pongal", branches: ["Chennai"] },
    { date: `${y}-03-31`, name: "Ugadi", branches: ["Bengaluru HQ", "Hyderabad"] },
    { date: `${y}-05-01`, name: "May Day", branches: "all" },
    { date: `${y}-08-15`, name: "Independence Day", branches: "all" },
    { date: `${y}-10-02`, name: "Gandhi Jayanti", branches: "all" },
    { date: `${y}-10-20`, name: "Deepavali", branches: "all" },
    { date: `${y}-11-01`, name: "Karnataka Rajyotsava", branches: ["Bengaluru HQ"] },
    { date: `${y}-12-25`, name: "Christmas", branches: "all" },
  ];
})();

type Tab = "today" | "requests" | "calendar" | "holidays";

export default function AttendancePage() {
  const { role, me } = useMe();
  const people = useHR((s) => s.people);
  const attendance = useHR((s) => s.attendance);
  const leaves = useHR((s) => s.leaves);
  const quota = useHR((s) => s.settings.leaveQuota);
  const checkIn = useHR((s) => s.checkIn);
  const checkOut = useHR((s) => s.checkOut);
  const setLeave = useHR((s) => s.setLeaveStatus);
  const toast = useHR((s) => s.toast);
  const approver = can(role, "leave.approve");
  const [tab, setTab] = useState<Tab>(approver ? "today" : "requests");
  const [applying, setApplying] = useState(qp("apply") === "1");
  const [mode, setMode] = useState<"Office" | "Remote" | "Field">(me.branch === "Remote" ? "Remote" : "Office");
  const today = todayISO();

  const team = useMemo(() => {
    if (can(role, "people.viewAll")) return people.filter((p) => p.status !== "Exited" && p.status !== "Pending Approval" && p.type !== "freelancer");
    if (role === "Manager") return people.filter((p) => p.managerId === me.id && p.status !== "Exited");
    return [me];
  }, [people, role, me]);
  const teamIds = new Set(team.map((p) => p.id));
  const myRec = attendance.find((a) => a.personId === me.id && a.date === today);
  const todayRecs = attendance.filter((a) => a.date === today && teamIds.has(a.personId));
  const onLeaveToday = leaves.filter((l) => l.status === "Approved" && l.from <= today && l.to >= today && teamIds.has(l.personId));
  const requests = leaves.filter((l) => (approver ? teamIds.has(l.personId) : l.personId === me.id)).sort((a, b) => (a.status === "Pending" ? -1 : 1) - (b.status === "Pending" ? -1 : 1) || b.appliedAt.localeCompare(a.appliedAt));
  const bal = leaveBalance(me.id, leaves, quota);

  const doCheckIn = () => {
    if (mode === "Field" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { checkIn(me.id, mode); toast(`Location captured (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`, "info"); },
        () => { checkIn(me.id, mode); toast("Location unavailable — checked in without geo-tag", "info"); }
      );
    } else checkIn(me.id, mode);
  };

  return (
    <div>
      <PageHeader eyebrow="Module 8 · Attendance & Leave" title="Attendance & Leave" subtitle="Check-in from web or mobile, leave balances, approvals and holiday calendars." actions={<Button icon={CalendarPlus} onClick={() => setApplying(true)}>Apply leave</Button>} />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card lift className="aura-hero p-5 sm:p-[22px]">
          <div className="relative">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-85">{fmtDate(today, { weekday: "long", day: "numeric", month: "short" })}</p>
            <p className="mt-1 font-mono text-[clamp(36px,5vw,48px)] font-semibold tabular">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            <p className="mt-1 text-sm opacity-90">{myRec?.checkIn ? `In at ${fmtTime(myRec.checkIn)}${myRec.checkOut ? ` · Out at ${fmtTime(myRec.checkOut)}` : ""}` : "You haven't checked in yet"}</p>
            {!myRec?.checkIn && (
              <div className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-black/15 p-1">
                {(["Office", "Remote", "Field"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)} className={cn("h-9 rounded-full text-xs font-semibold", mode === m ? "bg-white text-primary-strong" : "text-white/90")}>{m}</button>
                ))}
              </div>
            )}
            <div className="mt-3">
              {!myRec?.checkIn ? (
                <button onClick={doCheckIn} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/95 font-bold text-primary-strong shadow-lg transition-transform active:scale-[0.98]"><LogIn className="h-5 w-5" /> Check in {mode === "Field" && <MapPin className="h-4 w-4" />}</button>
              ) : !myRec.checkOut ? (
                <button onClick={() => checkOut(me.id)} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-white/20 font-semibold text-white ring-1 ring-white/40 transition-transform active:scale-[0.98]"><LogOut className="h-5 w-5" /> Check out</button>
              ) : (
                <p className="rounded-full bg-white/20 py-3 text-center text-sm font-semibold">Day complete — {((new Date(myRec.checkOut).getTime() - new Date(myRec.checkIn).getTime()) / 3_600_000).toFixed(1)} hrs</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="text-sm font-semibold">My leave balance · {new Date().getFullYear()}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {bal.map((b) => (
              <div key={b.type} className="rounded-[calc(var(--radius)*0.7)] border border-line p-3">
                <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted">{b.type}</span><span className="text-[11px] text-muted">{LEAVE_NAMES[b.type]}</span></div>
                <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold tabular">{b.type === "LOP" ? b.used : b.left}</p>
                <p className="text-[11px] text-muted">{b.type === "LOP" ? "days used" : `of ${b.quota} left`}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Earned leave carries forward up to 30 days. Casual leave lapses at year end.</p>
        </Card>
      </div>

      <ChipTabs
        value={tab}
        onChange={setTab}
        className="mb-4"
        options={[
          ...(approver ? [{ value: "today" as Tab, label: "Today's attendance" }] : []),
          { value: "requests", label: approver ? "Leave requests" : "My requests", count: requests.filter((r) => r.status === "Pending").length },
          { value: "calendar", label: "Leave calendar" },
          { value: "holidays", label: "Holidays" },
        ]}
      />

      {tab === "today" && approver && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard label="Present" value={todayRecs.length} icon={Users} tone="success" hint={`of ${team.length}`} />
            <StatCard label="On leave" value={onLeaveToday.length} icon={Palmtree} tone="info" />
            <StatCard label="Late (after 10:00)" value={todayRecs.filter((r) => r.checkIn && new Date(r.checkIn).getHours() >= 10).length} icon={Clock} tone="warning" />
            <StatCard label="Not checked in" value={Math.max(team.length - todayRecs.length - onLeaveToday.length, 0)} icon={CalendarDays} tone="neutral" />
          </div>
          <Card>
            <ul className="divide-y divide-line">
              {team.map((p) => {
                const r = todayRecs.find((a) => a.personId === p.id);
                const lv = onLeaveToday.find((l) => l.personId === p.id);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <Avatar person={p} size={36} />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{fullName(p)}</p><p className="truncate text-xs text-muted">{p.designation}</p></div>
                    {r ? (
                      <div className="text-right text-xs">
                        <Badge tone={r.checkIn && new Date(r.checkIn).getHours() >= 10 ? "warning" : "success"} dot>{r.mode}</Badge>
                        <p className="mt-1 text-muted tabular">{fmtTime(r.checkIn)} – {r.checkOut ? fmtTime(r.checkOut) : "now"}</p>
                      </div>
                    ) : lv ? <Badge tone="info">On leave · {lv.type}</Badge> : <Badge>Absent</Badge>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}

      {tab === "requests" && (
        <Card>
          {requests.length === 0 ? <Empty icon={CalendarDays} title="No leave requests" /> : (
            <ul className="divide-y divide-line">
              {requests.map((l) => {
                const p = people.find((x) => x.id === l.personId)!;
                return (
                  <li key={l.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar person={p} size={40} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{fullName(p)} <span className="font-normal text-muted">· {LEAVE_NAMES[l.type]} leave</span></p>
                        <p className="truncate text-xs text-muted">{fmtDate(l.from, { day: "2-digit", month: "short" })}{l.days > 1 && ` – ${fmtDate(l.to, { day: "2-digit", month: "short" })}`} · {l.days} day{l.days > 1 ? "s" : ""} · “{l.reason}”</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
                      {l.status === "Pending" && approver && l.personId !== me.id ? (
                        <>
                          <Button size="sm" variant="success" icon={Check} onClick={() => setLeave(l.id, "Approved")}>Approve</Button>
                          <Button size="sm" variant="ghost" icon={X} className="text-danger" onClick={() => setLeave(l.id, "Rejected")}>Reject</Button>
                        </>
                      ) : <StatusBadge status={l.status} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === "calendar" && <LeaveCalendar leaves={leaves.filter((l) => l.status === "Approved" && teamIds.has(l.personId))} />}

      {tab === "holidays" && (
        <Card>
          <CardHeader title={`Holiday calendar ${new Date().getFullYear()}`} subtitle="Branch-wise" icon={Palmtree} />
          <ul className="divide-y divide-line">
            {HOLIDAYS.sort((a, b) => a.date.localeCompare(b.date)).map((h) => {
              const past = daysBetween(today, h.date) < 0;
              return (
                <li key={h.date + h.name} className={cn("flex items-center gap-4 px-4 py-3 sm:px-5", past && "opacity-55")}>
                  <div className="w-12 shrink-0 rounded-[calc(var(--radius)*0.6)] bg-primary-soft py-1.5 text-center text-primary">
                    <p className="text-[10px] font-bold uppercase">{fmtDate(h.date, { month: "short" })}</p>
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold leading-none">{new Date(h.date).getDate()}</p>
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold">{h.name}</p><p className="text-xs text-muted">{fmtDate(h.date, { weekday: "long" })}</p></div>
                  <div className="flex flex-wrap justify-end gap-1">{h.branches === "all" ? <Badge tone="success">All branches</Badge> : h.branches.map((b) => <Badge key={b}>{b}</Badge>)}</div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {applying && <ApplyLeave onClose={() => setApplying(false)} />}
    </div>
  );
}

function LeaveCalendar({ leaves }: { leaves: ReturnType<typeof useHR.getState>["leaves"] }) {
  const people = useHR((s) => s.people);
  const [offset, setOffset] = useState(0);
  const base = new Date(new Date().getFullYear(), new Date().getMonth() + offset, 1);
  const days = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const lead = (base.getDay() + 6) % 7;
  const iso = (d: number) => `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const today = todayISO();
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-[family-name:var(--font-display)] text-lg font-semibold">{base.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => setOffset((o) => o - 1)}><ChevronLeft className="h-5 w-5" /></Button>
          <Button size="icon" variant="ghost" aria-label="Next month" onClick={() => setOffset((o) => o + 1)}><ChevronRight className="h-5 w-5" /></Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="py-1">{d.slice(0, 1)}<span className="hidden sm:inline">{d.slice(1)}</span></span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: lead }).map((_, i) => <span key={`l${i}`} />)}
        {Array.from({ length: days }, (_, i) => i + 1).map((d) => {
          const date = iso(d);
          const on = leaves.filter((l) => l.from <= date && l.to >= date);
          return (
            <div key={d} className={cn("min-h-14 rounded-[calc(var(--radius)*0.5)] border border-line p-1 text-left sm:min-h-20 sm:p-1.5", date === today && "border-primary bg-primary-soft")}>
              <span className={cn("text-xs font-semibold", date === today && "text-primary")}>{d}</span>
              <div className="mt-0.5 flex flex-wrap gap-0.5 sm:block sm:space-y-0.5">
                {on.slice(0, 3).map((l) => {
                  const p = people.find((x) => x.id === l.personId)!;
                  return (
                    <span key={l.id} title={`${fullName(p)} · ${l.type}`} className="block h-1.5 w-1.5 rounded-full bg-primary sm:h-auto sm:w-auto sm:truncate sm:rounded sm:bg-primary-soft sm:px-1 sm:text-[10px] sm:font-medium sm:text-primary">
                      <span className="hidden sm:inline">{p.firstName}</span>
                    </span>
                  );
                })}
                {on.length > 3 && <span className="hidden text-[10px] text-muted sm:block">+{on.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function ApplyLeave({ onClose }: { onClose: () => void }) {
  const { me } = useMe();
  const apply = useHR((s) => s.applyLeave);
  const [type, setType] = useState<LeaveType>("CL");
  const [from, setFrom] = useState(addDays(todayISO(), 1));
  const [to, setTo] = useState(addDays(todayISO(), 1));
  const [reason, setReason] = useState("");
  const days = Math.max(daysBetween(from, to) + 1, 0);
  return (
    <Modal open onClose={onClose} title="Apply for leave" subtitle="Your manager will be notified." footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={days < 1 || !reason.trim()} onClick={() => { apply({ personId: me.id, type, from, to, days, reason: reason.trim() }); onClose(); }}>Submit request</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <p className="label">Leave type</p>
          <div className="grid grid-cols-4 gap-2">
            {(["CL", "SL", "EL", "LOP"] as LeaveType[]).map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={cn("h-11 rounded-[calc(var(--radius)*0.7)] border text-sm font-semibold", type === t ? "border-primary bg-primary-soft text-primary" : "border-line-strong text-fg-2")}>{t}</button>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{LEAVE_NAMES[type]} leave</p>
        </div>
        <Field label="From" required>{(id) => <input id={id} type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); if (e.target.value > to) setTo(e.target.value); }} />}</Field>
        <Field label="To" required>{(id) => <input id={id} type="date" className="input" min={from} value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        <Field label="Reason" required className="sm:col-span-2">{(id) => <textarea id={id} rows={3} className="input" value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </div>
      <p className="mt-3 text-sm font-medium">{days} day{days === 1 ? "" : "s"}</p>
    </Modal>
  );
}
