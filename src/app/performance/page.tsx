"use client";

import { useMemo, useState } from "react";
import { Target, Plus, TrendingUp, Star } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { fullName } from "@/lib/utils";
import { Avatar, Button, Card, Empty, Field, Modal, PageHeader, SearchInput, StatCard, Stars } from "@/components/ui";

export default function PerformancePage() {
  const { role, me } = useMe();
  const goals = useHR((s) => s.goals);
  const people = useHR((s) => s.people);
  const update = useHR((s) => s.updateGoal);
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const scope = useMemo(() => {
    if (can(role, "people.viewAll")) return new Set(people.map((p) => p.id));
    if (role === "Manager") return new Set(people.filter((p) => p.managerId === me.id || p.id === me.id).map((p) => p.id));
    return new Set([me.id]);
  }, [people, role, me.id]);
  const isManagerOf = (pid: string) => can(role, "people.viewAll") || people.find((p) => p.id === pid)?.managerId === me.id;

  const byPerson = useMemo(() => {
    const m = new Map<string, typeof goals>();
    goals.filter((g) => scope.has(g.personId)).forEach((g) => m.set(g.personId, [...(m.get(g.personId) ?? []), g]));
    return [...m.entries()].map(([pid, gs]) => ({ p: people.find((x) => x.id === pid)!, gs })).filter(({ p }) => p && (!q || fullName(p).toLowerCase().includes(q.toLowerCase())));
  }, [goals, scope, people, q]);
  const mine = goals.filter((g) => scope.has(g.personId));
  const avgProgress = Math.round(mine.reduce((a, g) => a + g.progress, 0) / Math.max(mine.length, 1));
  const rated = mine.filter((g) => g.managerRating);

  return (
    <div>
      <PageHeader eyebrow="Module 14 · Performance" title="Goals & reviews" subtitle="Quarterly goals with self and manager ratings." actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add goal</Button>} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Goals" value={mine.length} icon={Target} />
        <StatCard label="Avg progress" value={`${avgProgress}%`} icon={TrendingUp} tone="info" />
        <StatCard label="Completed" value={mine.filter((g) => g.progress >= 100).length} icon={Target} tone="success" />
        <StatCard label="Avg manager rating" value={rated.length ? (rated.reduce((a, g) => a + g.managerRating!, 0) / rated.length).toFixed(1) : "—"} icon={Star} tone="warning" />
      </div>
      {byPerson.length > 1 && <SearchInput value={q} onChange={setQ} placeholder="Search person" className="mb-4 max-w-md" />}
      {byPerson.length === 0 ? <Card><Empty icon={Target} title="No goals yet" action={<Button onClick={() => setAdding(true)}>Add a goal</Button>} /></Card> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {byPerson.map(({ p, gs }) => (
            <Card key={p.id} className="p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><Avatar person={p} size={40} /><div className="min-w-0"><p className="truncate font-semibold">{fullName(p)}</p><p className="truncate text-xs text-muted">{p.designation}</p></div></div>
              <ul className="space-y-4">
                {gs.map((g) => (
                  <li key={g.id} className="rounded-[calc(var(--radius)*0.7)] border border-line p-3">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{g.title}</p><span className="shrink-0 text-xs text-muted">{g.quarter}</span></div>
                    <div className="mt-2 flex items-center gap-3">
                      <input type="range" min={0} max={100} step={5} value={g.progress} aria-label="Progress" disabled={!(p.id === me.id || isManagerOf(p.id))} onChange={(e) => update(g.id, { progress: Number(e.target.value) })} className="h-2 flex-1 cursor-pointer accent-[var(--primary)]" />
                      <span className="w-10 text-right text-xs font-semibold tabular">{g.progress}%</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1.5">Self <Stars value={g.selfRating ?? 0} size={14} onChange={p.id === me.id ? (v) => update(g.id, { selfRating: v }) : undefined} /></span>
                      <span className="flex items-center gap-1.5">Manager <Stars value={g.managerRating ?? 0} size={14} onChange={isManagerOf(p.id) && p.id !== me.id ? (v) => update(g.id, { managerRating: v }) : undefined} /></span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {adding && <AddGoal onClose={() => setAdding(false)} scope={scope} />}
    </div>
  );
}

function AddGoal({ onClose, scope }: { onClose: () => void; scope: Set<string> }) {
  const { me } = useMe();
  const people = useHR((s) => s.people);
  const add = useHR((s) => s.addGoal);
  const [pid, setPid] = useState(me.id);
  const [title, setTitle] = useState("");
  const quarter = `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`;
  return (
    <Modal open onClose={onClose} title="Add goal" subtitle={quarter} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!title.trim()} onClick={() => { add({ personId: pid, title: title.trim(), quarter, progress: 0 }); onClose(); }}>Add goal</Button></>}>
      <div className="grid gap-4">
        {scope.size > 1 && <Field label="For">{(id) => <select id={id} className="input" value={pid} onChange={(e) => setPid(e.target.value)}>{people.filter((p) => scope.has(p.id) && p.status === "Active").map((p) => <option key={p.id} value={p.id}>{fullName(p)}</option>)}</select>}</Field>}
        <Field label="Goal" required>{(id) => <input id={id} className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Launch the client portal" />}</Field>
      </div>
    </Modal>
  );
}
