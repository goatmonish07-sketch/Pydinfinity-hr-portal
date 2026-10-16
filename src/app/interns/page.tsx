"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GraduationCap, Award, Repeat, Clock, Star, UserPlus } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { daysBetween, fmtDate, fmtINR, fullName, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, ChipTabs, Empty, PageHeader, Progress, Stars, StatCard } from "@/components/ui";
import { InternPanel } from "@/components/intern-panel";

export default function InternsPage() {
  const { role, me } = useMe();
  const people = useHR((s) => s.people);
  const [f, setF] = useState<"active" | "ending" | "completed">("active");
  const [open, setOpen] = useState<string | null>(null);
  const today = todayISO();

  const interns = useMemo(
    () => people.filter((p) => p.type === "intern" && p.intern && (can(role, "people.viewAll") || p.intern.mentorId === me.id || p.managerId === me.id)),
    [people, role, me.id]
  );
  const left = (end: string) => daysBetween(today, end);
  const list = interns.filter((p) => {
    const l = left(p.intern!.endDate);
    if (f === "completed") return l < 0 || p.status === "Exited";
    if (f === "ending") return l >= 0 && l <= 14 && p.status !== "Exited";
    return l >= 0 && p.status !== "Exited";
  });
  const converted = people.filter((p) => p.previousCodes.some((c) => c.includes("-INT-")));
  const avgRating = (() => {
    const all = interns.flatMap((p) => p.intern!.feedback.map((f) => f.rating));
    return all.length ? (all.reduce((a, b) => a + b, 0) / all.length).toFixed(1) : "—";
  })();

  return (
    <div>
      <PageHeader
        eyebrow="Module 4 · Intern Management"
        title="Interns"
        subtitle="Internship lifecycle, mentor feedback, certificates and one-click conversion."
        actions={can(role, "people.manage") && <Link href="/people?new=1"><Button icon={UserPlus}>Add intern</Button></Link>}
      />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active interns" value={interns.filter((p) => left(p.intern!.endDate) >= 0 && p.status !== "Exited").length} icon={GraduationCap} />
        <StatCard label="Ending in 14 days" value={interns.filter((p) => { const l = left(p.intern!.endDate); return l >= 0 && l <= 14; }).length} icon={Clock} tone="warning" />
        <StatCard label="Converted" value={converted.length} icon={Repeat} tone="success" hint="Intern → employee" />
        <StatCard label="Avg mentor rating" value={avgRating} icon={Star} tone="info" />
      </div>

      <ChipTabs value={f} onChange={setF} className="mb-4" options={[{ value: "active", label: "Active" }, { value: "ending", label: "Ending soon" }, { value: "completed", label: "Completed" }]} />

      {list.length === 0 ? (
        <Card><Empty icon={GraduationCap} title="No interns here" /></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const it = p.intern!;
            const total = Math.max(daysBetween(it.startDate, it.endDate), 1);
            const done = Math.min(Math.max(daysBetween(it.startDate, today), 0), total);
            const l = left(it.endDate);
            const avg = it.feedback.length ? it.feedback.reduce((a, b) => a + b.rating, 0) / it.feedback.length : 0;
            return (
              <Card key={p.id} className="flex flex-col p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Avatar person={p} size={48} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/people/view?id=${p.id}`} className="block truncate font-semibold hover:text-primary">{fullName(p)}</Link>
                    <p className="truncate text-sm text-fg-2">{it.college} · {it.course}</p>
                    <p className="font-mono text-xs text-muted">{p.code}</p>
                  </div>
                  {l >= 0 && l <= 14 && <Badge tone="warning">{l === 0 ? "Ends today" : `${l}d left`}</Badge>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-[calc(var(--radius)*0.6)] bg-surface-2 p-2.5"><p className="text-xs text-muted">Project</p><p className="truncate font-medium">{it.project}</p></div>
                  <div className="rounded-[calc(var(--radius)*0.6)] bg-surface-2 p-2.5"><p className="text-xs text-muted">Stipend</p><p className="font-medium">{fmtINR(it.stipend)}</p></div>
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-muted"><span>{fmtDate(it.startDate, { day: "2-digit", month: "short" })}</span><span>{fmtDate(it.endDate, { day: "2-digit", month: "short" })}</span></div>
                  <Progress value={(done / total) * 100} label="Internship progress" />
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted"><Stars value={Math.round(avg)} size={14} /> {it.feedback.length} reviews</div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button size="sm" variant="secondary" onClick={() => setOpen(open === p.id ? null : p.id)}>{open === p.id ? "Hide" : "Feedback"}</Button>
                  {can(role, "letters.generate") && <Link href={`/letters?person=${p.id}&template=certificate`}><Button size="sm" variant="soft" icon={Award}>Certificate</Button></Link>}
                  {can(role, "people.manage") && <Link href={`/people/view?id=${p.id}`}><Button size="sm" variant="ghost" icon={Repeat}>Convert</Button></Link>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {open && (
        <div className="mt-6">
          <p className="mb-3 font-semibold">Feedback · {fullName(people.find((p) => p.id === open))}</p>
          <InternPanel personId={open} />
        </div>
      )}
    </div>
  );
}
