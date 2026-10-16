"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { LayoutGrid, List, UserPlus, Download, SlidersHorizontal, Users, X } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import type { PersonStatus, PersonType } from "@/lib/types";
import { cn, downloadFile, fmtDate, fullName, kycPercent, qp, toCSV, TYPE_LABEL } from "@/lib/utils";
import { Avatar, Badge, Button, Card, ChipTabs, Empty, PageHeader, Progress, SearchInput, StatusBadge, TableWrap } from "@/components/ui";
import { PersonFormModal, blankPerson } from "@/components/person-form";

type TypeFilter = "all" | PersonType;
const STATUSES: PersonStatus[] = ["Active", "Pending Approval", "Notice Period", "On Hold", "Exited"];

export default function PeoplePage() {
  const { role, me } = useMe();
  const allPeople = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const departments = useHR((s) => s.settings.departments);
  const branches = useHR((s) => s.settings.branches);
  const log = useHR((s) => s.log);
  const sideBranch = useHR((s) => s.branch);
  const router = useRouter();

  const [q, setQ] = useState("");
  const [type, setType] = useState<TypeFilter>((qp("type") as TypeFilter) || "all");
  const [status, setStatus] = useState<string>(qp("status") || "");
  const [dept, setDept] = useState("");
  const [branch, setBranch] = useState(sideBranch === "All branches" ? "" : sideBranch);
  const [joinedAfter, setJoinedAfter] = useState("");
  const [view, setView] = useState<"grid" | "table">("table");
  const [showFilters, setShowFilters] = useState(false);
  const [adding, setAdding] = useState(qp("new") === "1");

  const scope = useMemo(() => (can(role, "people.viewAll") ? allPeople : role === "Manager" ? allPeople.filter((p) => p.managerId === me.id || p.id === me.id) : allPeople.filter((p) => p.id === me.id)), [allPeople, role, me.id]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scope
      .filter((p) => type === "all" || p.type === type)
      .filter((p) => !status || p.status === status)
      .filter((p) => !dept || p.department === dept)
      .filter((p) => !branch || p.branch === branch)
      .filter((p) => !joinedAfter || p.joiningDate >= joinedAfter)
      .filter((p) => !s || `${fullName(p)} ${p.code ?? ""} ${p.email} ${p.designation} ${p.department}`.toLowerCase().includes(s))
      .sort((a, b) => (a.status === "Pending Approval" ? -1 : 0) - (b.status === "Pending Approval" ? -1 : 0) || a.firstName.localeCompare(b.firstName));
  }, [scope, q, type, status, dept, branch, joinedAfter]);

  const counts = (t: TypeFilter) => scope.filter((p) => t === "all" || p.type === t).length;
  const kyc = (id: string) => kycPercent(documents.filter((d) => d.personId === id));
  const activeFilters = [status, dept, branch, joinedAfter].filter(Boolean).length;

  const exportCSV = () => {
    downloadFile(
      "people.csv",
      toCSV(list.map((p) => ({ ID: p.code ?? "", Name: fullName(p), Type: TYPE_LABEL[p.type], Email: p.email, Phone: p.phone, Department: p.department, Designation: p.designation, Branch: p.branch, Status: p.status, Joined: p.joiningDate, KYC: `${kyc(p.id)}%` })))
    );
    log("export", `${list.length} people (CSV)`);
  };

  const filters = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <select aria-label="Status" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {STATUSES.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select aria-label="Department" className="input" value={dept} onChange={(e) => setDept(e.target.value)}>
        <option value="">All departments</option>
        {departments.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select aria-label="Branch" className="input" value={branch} onChange={(e) => setBranch(e.target.value)}>
        <option value="">All branches</option>
        {branches.map((s) => <option key={s}>{s}</option>)}
      </select>
      <label className="relative">
        <span className="sr-only">Joined after</span>
        <input type="date" aria-label="Joined after" className="input" value={joinedAfter} onChange={(e) => setJoinedAfter(e.target.value)} />
      </label>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Module 1 · People"
        title={role === "Manager" ? "My Team" : "People Directory"}
        subtitle="Employees, interns and freelancers in one place."
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCSV}>Export</Button>
            {can(role, "people.manage") && <Button icon={UserPlus} onClick={() => setAdding(true)}>Add person</Button>}
          </>
        }
      />

      <div className="mb-4 space-y-3">
        <ChipTabs
          value={type}
          onChange={setType}
          options={[
            { value: "all", label: "Everyone", count: counts("all") },
            { value: "employee", label: "Employees", count: counts("employee") },
            { value: "intern", label: "Interns", count: counts("intern") },
            { value: "freelancer", label: "Freelancers", count: counts("freelancer") },
          ]}
        />
        <div className="flex gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search name, ID, email, role…" className="flex-1" />
          <Button variant={activeFilters ? "soft" : "secondary"} icon={SlidersHorizontal} onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
            <span className="hidden sm:inline">Filters</span>
            {activeFilters > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-fg">{activeFilters}</span>}
          </Button>
          <div className="hidden rounded-[calc(var(--radius)*0.7)] border border-line-strong bg-surface p-1 sm:flex">
            {([["table", List], ["grid", LayoutGrid]] as const).map(([v, I]) => (
              <button key={v} onClick={() => setView(v)} aria-label={`${v} view`} aria-pressed={view === v} className={cn("grid h-8 w-9 place-items-center rounded-[calc(var(--radius)*0.5)]", view === v ? "bg-primary-soft text-primary" : "text-muted hover:text-fg")}>
                <I className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
        {showFilters && (
          <Card className="animate-fade-up p-4">
            {filters}
            {activeFilters > 0 && (
              <button onClick={() => { setStatus(""); setDept(""); setBranch(""); setJoinedAfter(""); }} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
                <X className="h-4 w-4" /> Clear filters
              </button>
            )}
          </Card>
        )}
      </div>

      <p className="mb-3 text-sm text-muted">{list.length} {list.length === 1 ? "person" : "people"}</p>

      {list.length === 0 ? (
        <Card><Empty icon={Users} title="No one matches these filters" hint="Try a different search or clear the filters." /></Card>
      ) : (
        <>
          {/* Mobile & grid view: cards */}
          <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", view === "table" && "sm:hidden")}>
            {list.map((p) => (
              <Link key={p.id} href={`/people/view?id=${p.id}`} className="card group flex flex-col p-4 transition-shadow hover:shadow-lg">
                <div className="flex items-start gap-3">
                  <Avatar person={p} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold group-hover:text-primary">{fullName(p)}</p>
                    <p className="truncate text-sm text-fg-2">{p.designation}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted">{p.code ?? "ID on approval"}</p>
                  </div>
                  <Badge tone={p.type === "employee" ? "primary" : p.type === "intern" ? "info" : "warning"}>{TYPE_LABEL[p.type]}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                  <StatusBadge status={p.status} />
                  <span className="text-muted">{p.department} · {p.branch}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                  <span className="w-16">KYC {kyc(p.id)}%</span>
                  <Progress value={kyc(p.id)} tone={kyc(p.id) === 100 ? "success" : "primary"} className="h-1.5" label="KYC" />
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          {view === "table" && (
            <Card className="hidden overflow-hidden sm:block">
              <TableWrap>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>KYC</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className="cursor-pointer" onClick={() => router.push(`/people/view?id=${p.id}`)}>
                        <td>
                          <Link href={`/people/view?id=${p.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                            <Avatar person={p} size={36} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium hover:text-primary">{fullName(p)}</span>
                              <span className="block truncate text-xs text-muted">{p.designation}</span>
                            </span>
                          </Link>
                        </td>
                        <td className="font-mono text-xs tabular">{p.code ?? <span className="text-muted">—</span>}</td>
                        <td><Badge tone={p.type === "employee" ? "primary" : p.type === "intern" ? "info" : "warning"}>{TYPE_LABEL[p.type]}</Badge></td>
                        <td className="text-fg-2">{p.department}<span className="block text-xs text-muted">{p.branch}</span></td>
                        <td><StatusBadge status={p.status} /></td>
                        <td className="w-36">
                          <div className="flex items-center gap-2">
                            <Progress value={kyc(p.id)} tone={kyc(p.id) === 100 ? "success" : "primary"} className="h-1.5" label="KYC" />
                            <span className="w-9 text-right text-xs tabular">{kyc(p.id)}%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-fg-2">{fmtDate(p.joiningDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            </Card>
          )}
        </>
      )}

      {adding && <PersonFormModal open initial={blankPerson(type === "all" ? "employee" : type)} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/view?id=${id}`)} />}
    </div>
  );
}
