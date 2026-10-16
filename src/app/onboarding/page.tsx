"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardCheck, Mail, CheckCircle2, Circle } from "lucide-react";
import { useHR } from "@/lib/store";
import type { OnboardingTask } from "@/lib/types";
import { cn, daysBetween, fmtDate, fullName, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, ChipTabs, Empty, PageHeader, Progress, StatusBadge } from "@/components/ui";

export default function OnboardingPage() {
  const people = useHR((s) => s.people);
  const tasks = useHR((s) => s.tasks);
  const toggle = useHR((s) => s.toggleTask);
  const toast = useHR((s) => s.toast);
  const [owner, setOwner] = useState<"all" | OnboardingTask["owner"]>("all");
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();

  const groups = useMemo(() => {
    const m = new Map<string, OnboardingTask[]>();
    tasks.forEach((t) => m.set(t.personId, [...(m.get(t.personId) ?? []), t]));
    return [...m.entries()]
      .map(([pid, ts]) => ({ p: people.find((x) => x.id === pid)!, ts, pct: Math.round((ts.filter((t) => t.done).length / ts.length) * 100) }))
      .filter((g) => g.p && (showDone || g.pct < 100))
      .sort((a, b) => a.pct - b.pct);
  }, [tasks, people, showDone]);

  return (
    <div>
      <PageHeader eyebrow="Module 7 · Onboarding" title="Onboarding checklists" subtitle="Auto-created for every new joiner — documents, laptop, email, access, induction." />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ChipTabs value={owner} onChange={setOwner} options={[{ value: "all", label: "All owners" }, { value: "HR", label: "HR" }, { value: "IT", label: "IT" }, { value: "Manager", label: "Manager" }]} />
        <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-fg-2"><input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed</label>
      </div>
      {groups.length === 0 ? (
        <Card><Empty icon={ClipboardCheck} title="Everyone is fully onboarded" /></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map(({ p, ts, pct }) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="flex items-center gap-3 border-b border-line p-4">
                <Avatar person={p} size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/people/${p.id}`} className="block truncate font-semibold hover:text-primary">{fullName(p)}</Link>
                  <p className="truncate text-xs text-muted">{p.designation} · joins {fmtDate(p.joiningDate)}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-3 px-4 pt-3">
                <Progress value={pct} tone={pct === 100 ? "success" : "primary"} label="Onboarding progress" />
                <span className="w-10 text-right text-xs font-semibold tabular">{pct}%</span>
              </div>
              <ul className="p-2">
                {ts.filter((t) => owner === "all" || t.owner === owner).map((t) => {
                  const overdue = !t.done && daysBetween(today, t.due) < 0;
                  return (
                    <li key={t.id}>
                      <button onClick={() => toggle(t.id)} className="flex min-h-11 w-full items-center gap-3 rounded-[calc(var(--radius)*0.6)] px-2 py-2 text-left hover:bg-surface-2">
                        {t.done ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <Circle className="h-5 w-5 shrink-0 text-line-strong" />}
                        <span className={cn("flex-1 text-sm", t.done && "text-muted line-through")}>{t.title}</span>
                        <Badge tone={t.owner === "IT" ? "info" : t.owner === "Manager" ? "warning" : "primary"}>{t.owner}</Badge>
                        <span className={cn("hidden w-16 text-right text-xs sm:block", overdue ? "font-semibold text-danger" : "text-muted")}>{fmtDate(t.due, { day: "2-digit", month: "short" })}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="border-t border-line p-3">
                <Button size="sm" variant="ghost" icon={Mail} onClick={() => toast(`Welcome email with KYC link sent to ${p.email}`, "info")}>Send welcome email + KYC link</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
