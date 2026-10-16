"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Network, Minimize2, Maximize2 } from "lucide-react";
import { useHR } from "@/lib/store";
import type { Person } from "@/lib/types";
import { cn, fullName, TYPE_LABEL } from "@/lib/utils";
import { Avatar, Badge, Button, Card, PageHeader, SearchInput } from "@/components/ui";

export default function OrgChartPage() {
  const people = useHR((s) => s.people);
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const active = useMemo(() => people.filter((p) => p.status !== "Exited"), [people]);
  const children = useMemo(() => {
    const m = new Map<string, Person[]>();
    active.forEach((p) => p.managerId && m.set(p.managerId, [...(m.get(p.managerId) ?? []), p]));
    m.forEach((v) => v.sort((a, b) => (m.get(b.id)?.length ?? 0) - (m.get(a.id)?.length ?? 0) || a.firstName.localeCompare(b.firstName)));
    return m;
  }, [active]);
  const roots = active.filter((p) => !p.managerId || !active.some((x) => x.id === p.managerId));
  const match = (p: Person) => !q || `${fullName(p)} ${p.designation} ${p.department}`.toLowerCase().includes(q.toLowerCase());
  const subtreeMatches = (p: Person): boolean => match(p) || (children.get(p.id) ?? []).some(subtreeMatches);

  const toggle = (id: string) => setCollapsed((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const Node = ({ p, depth }: { p: Person; depth: number }) => {
    const kids = (children.get(p.id) ?? []).filter(subtreeMatches);
    const open = !collapsed.has(p.id) || !!q;
    return (
      <li>
        <div className={cn("relative flex items-center gap-2", depth > 0 && "before:absolute before:-left-5 before:top-1/2 before:h-px before:w-4 before:bg-line-strong")}>
          {kids.length > 0 ? (
            <button onClick={() => toggle(p.id)} aria-label={open ? "Collapse" : "Expand"} aria-expanded={open} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <span className="w-8 shrink-0" />
          )}
          <Link href={`/people/view?id=${p.id}`} className={cn("card flex min-w-0 flex-1 items-center gap-3 p-3 transition-shadow hover:shadow-lg sm:max-w-md", q && match(p) && "border-primary ring-2 ring-primary/20")}>
            <Avatar person={p} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{fullName(p)}</span>
              <span className="block truncate text-xs text-muted">{p.designation} · {p.department}</span>
            </span>
            {p.type !== "employee" && <Badge tone={p.type === "intern" ? "info" : "warning"}>{TYPE_LABEL[p.type]}</Badge>}
            {kids.length > 0 && <Badge tone="primary">{kids.length}</Badge>}
          </Link>
        </div>
        {kids.length > 0 && open && (
          <ul className="ml-4 mt-2 space-y-2 border-l border-line-strong pl-5">
            {kids.map((k) => <Node key={k.id} p={k} depth={depth + 1} />)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module 16 · Org Chart"
        title="Organisation chart"
        subtitle="Generated automatically from reporting-manager links."
        actions={
          <>
            <Button variant="secondary" icon={Minimize2} onClick={() => setCollapsed(new Set(active.filter((p) => children.has(p.id) && p.managerId).map((p) => p.id)))}>Collapse</Button>
            <Button variant="secondary" icon={Maximize2} onClick={() => setCollapsed(new Set())}>Expand</Button>
          </>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Find someone in the org…" className="mb-5 max-w-md" />
      <Card className="bg-grid overflow-x-auto p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted"><Network className="h-4 w-4" /> {active.length} people · {children.size} managers</div>
        <ul className="min-w-[300px] space-y-2">{roots.filter(subtreeMatches).map((r) => <Node key={r.id} p={r} depth={0} />)}</ul>
      </Card>
    </div>
  );
}
