"use client";

import { useState } from "react";
import { BadgeCheck, GraduationCap } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { daysBetween, fmtDate, fmtINR, fullName, todayISO } from "@/lib/utils";
import { Button, Card, CardHeader, Progress, Stars } from "./ui";

export function InternPanel({ personId }: { personId: string }) {
  const { role } = useMe();
  const p = useHR((s) => s.people.find((x) => x.id === personId))!;
  const people = useHR((s) => s.people);
  const addFeedback = useHR((s) => s.addInternFeedback);
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState("");
  const it = p.intern!;
  const total = Math.max(daysBetween(it.startDate, it.endDate), 1);
  const done = Math.min(Math.max(daysBetween(it.startDate, todayISO()), 0), total);
  const mentor = people.find((x) => x.id === it.mentorId);
  const avg = it.feedback.length ? it.feedback.reduce((a, f) => a + f.rating, 0) / it.feedback.length : 0;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-5">
        <div className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /><p className="font-semibold">{it.college || "College —"}</p></div>
        <p className="text-sm text-fg-2">{it.course}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Project</dt><dd className="text-right">{it.project || "—"}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Mentor</dt><dd>{fullName(mentor)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Stipend</dt><dd>{fmtINR(it.stipend)}/mo</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Period</dt><dd>{fmtDate(it.startDate, { day: "2-digit", month: "short" })} – {fmtDate(it.endDate, { day: "2-digit", month: "short", year: "numeric" })}</dd></div>
        </dl>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-muted"><span>Progress</span><span>{Math.round((done / total) * 100)}%</span></div>
          <Progress value={(done / total) * 100} label="Internship progress" />
        </div>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader title="Mentor feedback" subtitle={it.feedback.length ? `Average ${avg.toFixed(1)} / 5` : "No feedback yet"} icon={BadgeCheck} />
        <ul className="divide-y divide-line">
          {[...it.feedback].reverse().map((f) => (
            <li key={f.id} className="px-5 py-3">
              <div className="flex items-center justify-between"><Stars value={f.rating} /><span className="text-xs text-muted">{fmtDate(f.date)} · {fullName(people.find((x) => x.id === f.by))}</span></div>
              <p className="mt-1 text-sm text-fg-2">{f.note}</p>
            </li>
          ))}
        </ul>
        {can(role, "intern.feedback") && (
          <div className="space-y-3 border-t border-line p-5">
            <div className="flex items-center gap-3"><span className="text-sm font-medium">Rating</span><Stars value={rating} onChange={setRating} size={22} /></div>
            <textarea aria-label="Feedback" rows={2} className="input" placeholder="Weekly / monthly feedback…" value={note} onChange={(e) => setNote(e.target.value)} />
            <Button disabled={!note.trim()} onClick={() => { addFeedback(personId, rating, note.trim()); setNote(""); }}>Add feedback</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
