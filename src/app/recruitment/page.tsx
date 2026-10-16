"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserPlus, Briefcase, MapPin, ChevronRight, ChevronLeft, CalendarClock, Plus } from "lucide-react";
import { useHR } from "@/lib/store";
import type { CandidateStage } from "@/lib/types";
import { cn, fmtDate, fmtTime, TYPE_LABEL } from "@/lib/utils";
import { Badge, Button, Card, ChipTabs, Field, Modal, PageHeader, Stars } from "@/components/ui";

const STAGES: CandidateStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired"];

export default function RecruitmentPage() {
  const jobs = useHR((s) => s.jobs);
  const candidates = useHR((s) => s.candidates);
  const move = useHR((s) => s.moveCandidate);
  const hire = useHR((s) => s.hireCandidate);
  const router = useRouter();
  const [job, setJob] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const list = candidates.filter((c) => job === "all" || c.jobId === job);

  return (
    <div>
      <PageHeader eyebrow="Module 15 · Recruitment (ATS)" title="Recruitment" subtitle="Job posts → candidate pipeline → interviews → one-click hire." actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add candidate</Button>} />
      <div className="no-scrollbar -mx-4 mb-5 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-4">
        {jobs.map((j) => (
          <button key={j.id} onClick={() => setJob(job === j.id ? "all" : j.id)} className={cn("card w-64 shrink-0 p-4 text-left transition-shadow hover:shadow-lg sm:w-auto", job === j.id && "border-primary ring-2 ring-primary/20")}>
            <div className="flex items-start justify-between gap-2"><p className="font-semibold">{j.title}</p><Badge tone="success">{j.openings} open</Badge></div>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted"><Briefcase className="h-3 w-3" />{j.department} · {TYPE_LABEL[j.type]}</p>
            <p className="flex items-center gap-1 text-xs text-muted"><MapPin className="h-3 w-3" />{j.location}</p>
            <p className="mt-3 text-xs font-semibold text-primary">{candidates.filter((c) => c.jobId === j.id && c.stage !== "Hired").length} in pipeline</p>
          </button>
        ))}
      </div>

      {/* Mobile: stage tabs; desktop: kanban */}
      <MobilePipeline list={list} move={move} hire={(id) => { const pid = hire(id); if (pid) router.push(`/people/${pid}`); }} />
      <div className="hidden gap-3 md:grid md:grid-cols-5">
        {STAGES.map((s) => {
          const items = list.filter((c) => c.stage === s);
          return (
            <div key={s} className="rounded-[var(--radius)] bg-surface-2 p-2">
              <div className="flex items-center justify-between px-2 py-2"><p className="text-sm font-semibold">{s}</p><span className="rounded-full bg-surface px-2 text-xs font-semibold tabular">{items.length}</span></div>
              <div className="space-y-2">
                {items.map((c) => <CandidateCard key={c.id} id={c.id} move={move} hire={(id) => { const pid = hire(id); if (pid) router.push(`/people/${pid}`); }} />)}
              </div>
            </div>
          );
        })}
      </div>
      {adding && <AddCandidate onClose={() => setAdding(false)} />}
    </div>
  );
}

function MobilePipeline({ list, move, hire }: { list: ReturnType<typeof useHR.getState>["candidates"]; move: (id: string, s: CandidateStage) => void; hire: (id: string) => void }) {
  const [stage, setStage] = useState<CandidateStage>("Applied");
  return (
    <div className="md:hidden">
      <ChipTabs value={stage} onChange={setStage} className="mb-3" options={STAGES.map((s) => ({ value: s, label: s, count: list.filter((c) => c.stage === s).length }))} />
      <div className="space-y-2">{list.filter((c) => c.stage === stage).map((c) => <CandidateCard key={c.id} id={c.id} move={move} hire={hire} />)}</div>
    </div>
  );
}

function CandidateCard({ id, move, hire }: { id: string; move: (id: string, s: CandidateStage) => void; hire: (id: string) => void }) {
  const c = useHR((s) => s.candidates.find((x) => x.id === id))!;
  const job = useHR((s) => s.jobs.find((j) => j.id === c.jobId));
  const i = STAGES.indexOf(c.stage);
  return (
    <Card className="p-3">
      <p className="text-sm font-semibold">{c.name}</p>
      <p className="truncate text-xs text-muted">{job?.title}</p>
      <div className="mt-2 flex items-center justify-between"><Stars value={c.rating} size={12} /><Badge>{c.source}</Badge></div>
      {c.interviewAt && c.stage === "Interview" && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-info"><CalendarClock className="h-3 w-3" /> {fmtDate(c.interviewAt, { day: "2-digit", month: "short" })} · {fmtTime(c.interviewAt)}</p>}
      {c.stage !== "Hired" && (
        <div className="mt-3 flex items-center gap-1">
          <button disabled={i === 0} onClick={() => move(c.id, STAGES[i - 1])} aria-label="Move back" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-muted hover:bg-surface-2 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
          {c.stage === "Offer" ? (
            <Button size="sm" icon={UserPlus} className="flex-1" onClick={() => hire(c.id)}>Hire</Button>
          ) : (
            <button onClick={() => move(c.id, STAGES[i + 1])} className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg bg-primary-soft text-xs font-semibold text-primary">{STAGES[i + 1]} <ChevronRight className="h-4 w-4" /></button>
          )}
        </div>
      )}
    </Card>
  );
}

function AddCandidate({ onClose }: { onClose: () => void }) {
  const jobs = useHR((s) => s.jobs);
  const add = useHR((s) => s.addCandidate);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobId, setJobId] = useState(jobs[0].id);
  const [source, setSource] = useState("LinkedIn");
  return (
    <Modal open onClose={onClose} title="Add candidate" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!name.trim() || !email.includes("@")} onClick={() => { add({ name: name.trim(), email, jobId, source, stage: "Applied", rating: 3 }); onClose(); }}>Add</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" required>{(id) => <input id={id} className="input" value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Email" required>{(id) => <input id={id} type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        <Field label="Job">{(id) => <select id={id} className="input" value={jobId} onChange={(e) => setJobId(e.target.value)}>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>}</Field>
        <Field label="Source">{(id) => <select id={id} className="input" value={source} onChange={(e) => setSource(e.target.value)}>{["LinkedIn", "Referral", "Naukri", "Careers page", "AngelList"].map((s) => <option key={s}>{s}</option>)}</select>}</Field>
      </div>
    </Modal>
  );
}
