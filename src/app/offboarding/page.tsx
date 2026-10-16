"use client";

import Link from "next/link";
import { useState } from "react";
import { DoorOpen, CheckCircle2, Circle, Plus, FileSignature, Laptop } from "lucide-react";
import { useHR } from "@/lib/store";
import { addDays, cn, daysBetween, fmtDate, fullName, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, Empty, Field, Modal, PageHeader, Progress, StatusBadge } from "@/components/ui";

export default function OffboardingPage() {
  const people = useHR((s) => s.people);
  const offboardings = useHR((s) => s.offboardings);
  const assets = useHR((s) => s.assets);
  const toggle = useHR((s) => s.toggleOffboardingItem);
  const setInterview = useHR((s) => s.setExitInterview);
  const complete = useHR((s) => s.completeOffboarding);
  const [starting, setStarting] = useState(false);
  const today = todayISO();

  return (
    <div>
      <PageHeader eyebrow="Module 11 · Offboarding" title="Offboarding" subtitle="Resignation → notice period → exit interview → asset return → access removal → F&F → relieving letter." actions={<Button icon={Plus} onClick={() => setStarting(true)}>Start offboarding</Button>} />
      {offboardings.length === 0 ? <Card><Empty icon={DoorOpen} title="No exits in progress" /></Card> : (
        <div className="grid gap-5 xl:grid-cols-2">
          {offboardings.map((o) => {
            const p = people.find((x) => x.id === o.personId)!;
            const done = o.checklist.filter((c) => c.done).length;
            const pct = Math.round((done / o.checklist.length) * 100);
            const held = assets.filter((a) => a.assignedTo === p.id);
            const left = daysBetween(today, o.lastDay);
            return (
              <Card key={o.id} className="overflow-hidden">
                <div className="flex items-center gap-3 border-b border-line p-4 sm:p-5">
                  <Avatar person={p} size={48} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/people/view?id=${p.id}`} className="block truncate font-semibold hover:text-primary">{fullName(p)}</Link>
                    <p className="truncate text-xs text-muted">{p.designation} · {p.code}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 p-4 text-center sm:p-5">
                  <div className="rounded-[calc(var(--radius)*0.6)] bg-surface-2 p-2.5"><p className="text-[11px] text-muted">Resigned</p><p className="text-sm font-semibold">{fmtDate(o.resignedOn, { day: "2-digit", month: "short" })}</p></div>
                  <div className="rounded-[calc(var(--radius)*0.6)] bg-surface-2 p-2.5"><p className="text-[11px] text-muted">Last day</p><p className="text-sm font-semibold">{fmtDate(o.lastDay, { day: "2-digit", month: "short" })}</p></div>
                  <div className="rounded-[calc(var(--radius)*0.6)] bg-surface-2 p-2.5"><p className="text-[11px] text-muted">Notice left</p><p className="text-sm font-semibold">{left < 0 ? "Served" : `${left} days`}</p></div>
                </div>
                <div className="flex items-center gap-3 px-4 sm:px-5"><Progress value={pct} tone={pct === 100 ? "success" : "primary"} label="Checklist" /><span className="text-xs font-semibold tabular">{done}/{o.checklist.length}</span></div>
                <p className="px-4 pt-3 text-xs text-muted sm:px-5">Reason: {o.reason}</p>
                <ul className="p-2 sm:p-3">
                  {o.checklist.map((c, i) => (
                    <li key={c.label}>
                      <button disabled={o.status === "Completed"} onClick={() => toggle(o.id, i)} className="flex min-h-11 w-full items-center gap-3 rounded-[calc(var(--radius)*0.6)] px-2 text-left hover:bg-surface-2 disabled:hover:bg-transparent">
                        {c.done ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-line-strong" />}
                        <span className={cn("flex-1 text-sm", c.done && "text-muted line-through")}>{c.label}</span>
                        {c.label === "Asset return" && held.length > 0 && <Badge tone="warning"><Laptop className="h-3 w-3" /> {held.length} held</Badge>}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="space-y-3 border-t border-line p-4 sm:p-5">
                  <Field label="Exit interview notes">{(id) => <textarea id={id} rows={2} className="input" defaultValue={o.exitInterview} onBlur={(e) => setInterview(o.id, e.target.value)} placeholder="Reasons, feedback, would rehire?" />}</Field>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/letters?person=${p.id}&template=relieving`}><Button size="sm" variant="secondary" icon={FileSignature}>Relieving letter</Button></Link>
                    {o.status !== "Completed" && <Button size="sm" onClick={() => complete(o.id)}>Complete exit</Button>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {starting && <StartModal onClose={() => setStarting(false)} />}
    </div>
  );
}

function StartModal({ onClose }: { onClose: () => void }) {
  const people = useHR((s) => s.people);
  const offboardings = useHR((s) => s.offboardings);
  const start = useHR((s) => s.startOffboarding);
  const eligible = people.filter((p) => p.status === "Active" && !offboardings.some((o) => o.personId === p.id));
  const [pid, setPid] = useState("");
  const [lastDay, setLastDay] = useState(addDays(todayISO(), 60));
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} title="Start offboarding" subtitle="Status changes to Notice Period." footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!pid || !reason.trim()} onClick={() => { start(pid, lastDay, reason.trim()); onClose(); }}>Start</Button></>}>
      <div className="grid gap-4">
        <Field label="Person" required>{(id) => <select id={id} className="input" value={pid} onChange={(e) => setPid(e.target.value)}><option value="">Select…</option>{eligible.map((p) => <option key={p.id} value={p.id}>{fullName(p)} · {p.designation}</option>)}</select>}</Field>
        <Field label="Last working day" required>{(id) => <input id={id} type="date" className="input" value={lastDay} onChange={(e) => setLastDay(e.target.value)} />}</Field>
        <Field label="Reason" required>{(id) => <input id={id} className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Better opportunity" />}</Field>
      </div>
    </Modal>
  );
}
