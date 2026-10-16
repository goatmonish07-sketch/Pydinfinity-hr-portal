"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Printer, Hash, Lock, IdCard as IdIcon, CheckSquare, Square } from "lucide-react";
import { useHR } from "@/lib/store";
import type { PersonType } from "@/lib/types";
import { cn, fmtDate, formatPersonCode, fullName, TYPE_LABEL } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, ChipTabs, Empty, PageHeader, SearchInput } from "@/components/ui";
import { IdCard } from "@/components/id-card";

export default function IdsPage() {
  const people = useHR((s) => s.people);
  const sequences = useHR((s) => s.sequences);
  const code = useHR((s) => s.settings.companyCode);
  const approve = useHR((s) => s.approvePerson);
  const log = useHR((s) => s.log);
  const [type, setType] = useState<"all" | PersonType>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());

  const year = new Date().getFullYear();
  const pending = people.filter((p) => p.status === "Pending Approval");
  const issued = useMemo(
    () =>
      people
        .filter((p) => p.code && p.status !== "Exited")
        .filter((p) => type === "all" || p.type === type)
        .filter((p) => !q || `${fullName(p)} ${p.code}`.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => (b.code ?? "").localeCompare(a.code ?? "")),
    [people, type, q]
  );
  const selected = issued.filter((p) => sel.has(p.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div>
      <PageHeader eyebrow="Module 2 · ID Generator" title="Employee IDs & ID cards" subtitle="Auto-generated on approval · atomic counter per type and year · locked once issued, never reused." />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {(["employee", "intern", "freelancer"] as PersonType[]).map((t) => {
          const n = sequences[`${t}-${year}`] ?? 0;
          return (
            <Card key={t} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{TYPE_LABEL[t]} counter · {year}</p>
                <Hash className="h-4 w-4 text-primary" />
              </div>
              <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tabular">{n}</p>
              <p className="mt-1 text-xs text-fg-2">Next ID <span className="rounded bg-primary-soft px-1.5 py-0.5 font-mono font-semibold text-primary">{formatPersonCode(code, t, year, n + 1)}</span></p>
            </Card>
          );
        })}
      </div>

      <Card className="mb-5">
        <CardHeader title="Awaiting approval" subtitle="IDs are issued the moment you approve" icon={BadgeCheck} action={pending.length > 1 && <Button size="sm" onClick={() => pending.forEach((p) => approve(p.id))}>Approve all ({pending.length})</Button>} />
        {pending.length === 0 ? (
          <p className="p-5 text-sm text-muted">No pending approvals.</p>
        ) : (
          <ul className="divide-y divide-line">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Avatar person={p} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{fullName(p)}</p>
                  <p className="truncate text-xs text-muted">{TYPE_LABEL[p.type]} · {p.designation} · joins {fmtDate(p.joiningDate)}</p>
                </div>
                <Button size="sm" icon={BadgeCheck} onClick={() => approve(p.id)}>Approve</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ChipTabs value={type} onChange={setType} options={[{ value: "all", label: "All" }, { value: "employee", label: "Employees" }, { value: "intern", label: "Interns" }, { value: "freelancer", label: "Freelancers" }]} />
        <div className="flex gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search ID or name" className="flex-1 sm:w-64" />
          <Button variant="secondary" onClick={() => setSel(sel.size === issued.length ? new Set() : new Set(issued.map((p) => p.id)))}>{sel.size === issued.length && issued.length ? "Clear" : "Select all"}</Button>
          <Button icon={Printer} disabled={!selected.length} onClick={() => { log("download", `${selected.length} ID cards (bulk print)`); window.print(); }}>
            Print {selected.length || ""}
          </Button>
        </div>
      </div>

      {issued.length === 0 ? (
        <Card><Empty icon={IdIcon} title="No IDs match" /></Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {issued.map((p) => {
            const on = sel.has(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)} aria-pressed={on} className={cn("card flex items-center gap-3 p-3 text-left transition-colors", on && "border-primary bg-primary-soft")}>
                {on ? <CheckSquare className="h-5 w-5 shrink-0 text-primary" /> : <Square className="h-5 w-5 shrink-0 text-muted" />}
                <Avatar person={p} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="flex items-center gap-1 font-mono text-xs text-muted"><Lock className="h-3 w-3" aria-hidden />{p.code}</span>
                </span>
                {p.previousCodes.length > 0 && <Badge tone="info">Converted</Badge>}
              </button>
            );
          })}
        </div>
      )}

      {selected.length > 0 && (
        <Card className="mt-6 p-5">
          <p className="mb-4 text-sm font-semibold">Print preview · {selected.length} card{selected.length > 1 ? "s" : ""}</p>
          <div className="print-area no-scrollbar flex gap-4 overflow-x-auto pb-2 print:flex-wrap">
            {selected.map((p) => <IdCard key={p.id} person={p} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
