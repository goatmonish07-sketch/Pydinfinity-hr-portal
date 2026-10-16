"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ShieldCheck, Link2, Lock, FileCheck2, Clock, FileX2, CalendarClock, Users } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { daysBetween, fullName, kycPercent, qp, todayISO } from "@/lib/utils";
import { Avatar, Button, Card, CardHeader, ChipTabs, Empty, PageHeader, Progress, SearchInput, StatCard } from "@/components/ui";
import { DocumentRow } from "@/components/doc-row";

type F = "Uploaded" | "Pending" | "Rejected" | "Verified" | "Expiring" | "people";

export default function DocumentsPage() {
  const { role, me } = useMe();
  const people = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const toast = useHR((s) => s.toast);
  const [f, setF] = useState<F>((qp("status") as F) || "Uploaded");
  const [q, setQ] = useState("");
  const today = todayISO();

  const verify = can(role, "kyc.verify");
  const self = role === "Self-service";

  const scopeIds = useMemo(() => {
    if (can(role, "people.viewAll")) return new Set(people.filter((p) => p.status !== "Exited").map((p) => p.id));
    if (role === "Manager") return new Set(people.filter((p) => p.managerId === me.id || p.id === me.id).map((p) => p.id));
    return new Set([me.id]);
  }, [people, role, me.id]);

  const docs = documents.filter((d) => scopeIds.has(d.personId));
  const expiring = docs.filter((d) => d.expiry && d.status === "Verified" && daysBetween(today, d.expiry) <= 30);
  const list = useMemo(() => {
    const base = f === "Expiring" ? expiring : f === "people" ? [] : docs.filter((d) => d.status === f);
    const s = q.toLowerCase();
    return base.filter((d) => !s || `${d.kind} ${fullName(people.find((p) => p.id === d.personId))}`.toLowerCase().includes(s));
  }, [docs, expiring, f, q, people]);

  if (self) {
    const mine = documents.filter((d) => d.personId === me.id);
    const pct = kycPercent(mine);
    return (
      <div>
        <PageHeader eyebrow="Self-service" title="My documents & KYC" subtitle="Upload your documents — HR verifies them. Files are stored encrypted and never shared publicly." />
        <Card className="mb-5 p-5">
          <div className="flex items-center justify-between"><p className="font-semibold">KYC completion</p><span className="font-[family-name:var(--font-display)] text-2xl font-bold">{pct}%</span></div>
          <Progress value={pct} tone={pct === 100 ? "success" : "primary"} className="mt-3" label="KYC" />
        </Card>
        <Card><ul className="divide-y divide-line">{mine.map((d) => <DocumentRow key={d.id} doc={d} canVerify={false} canUpload />)}</ul></Card>
      </div>
    );
  }

  const peopleKyc = people
    .filter((p) => scopeIds.has(p.id))
    .map((p) => ({ p, pct: kycPercent(documents.filter((d) => d.personId === p.id)) }))
    .filter(({ p }) => !q || fullName(p).toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.pct - b.pct);

  return (
    <div>
      <PageHeader eyebrow="Module 3 · Document & KYC Vault" title="Documents & KYC" subtitle="Pending → Uploaded → Verified / Rejected → Re-upload. Aadhaar is always masked." />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="To verify" value={docs.filter((d) => d.status === "Uploaded").length} icon={Clock} tone="info" onClick={() => setF("Uploaded")} />
        <StatCard label="Missing" value={docs.filter((d) => d.status === "Pending").length} icon={FileCheck2} tone="warning" onClick={() => setF("Pending")} />
        <StatCard label="Rejected" value={docs.filter((d) => d.status === "Rejected").length} icon={FileX2} tone="danger" onClick={() => setF("Rejected")} />
        <StatCard label="Expiring ≤ 30d" value={expiring.length} icon={CalendarClock} tone="warning" onClick={() => setF("Expiring")} />
      </div>

      <div className="mb-4 space-y-3">
        <ChipTabs
          value={f}
          onChange={setF}
          options={[
            { value: "Uploaded", label: "Awaiting verification", count: docs.filter((d) => d.status === "Uploaded").length },
            { value: "Pending", label: "Not uploaded", count: docs.filter((d) => d.status === "Pending").length },
            { value: "Rejected", label: "Rejected", count: docs.filter((d) => d.status === "Rejected").length },
            { value: "Expiring", label: "Expiring", count: expiring.length },
            { value: "Verified", label: "Verified" },
            { value: "people", label: "By person" },
          ]}
        />
        <SearchInput value={q} onChange={setQ} placeholder="Search by person or document" />
      </div>

      {f === "people" ? (
        <Card>
          <CardHeader title="KYC completion by person" subtitle="Lowest first" icon={Users} />
          <ul className="divide-y divide-line">
            {peopleKyc.map(({ p, pct }) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Avatar person={p} size={36} />
                <Link href={`/people/${p.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium hover:text-primary">{fullName(p)}</span>
                  <span className="block truncate text-xs text-muted">{p.code ?? "ID pending"}</span>
                </Link>
                <div className="hidden w-40 items-center gap-2 sm:flex"><Progress value={pct} tone={pct === 100 ? "success" : "primary"} className="h-1.5" label="KYC" /><span className="w-9 text-right text-xs tabular">{pct}%</span></div>
                <span className="text-xs font-semibold tabular sm:hidden">{pct}%</span>
                {verify && pct < 100 && (
                  <Button size="sm" variant="ghost" icon={Link2} onClick={() => { navigator.clipboard?.writeText(`${location.origin}/kyc/${p.id}`); toast(`Self-service KYC link copied for ${p.firstName}`, "info"); }}>
                    <span className="hidden md:inline">KYC link</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      ) : (
        <Card>
          {list.length === 0 ? (
            <Empty icon={ShieldCheck} title="Nothing here" hint={f === "Uploaded" ? "No documents waiting for verification." : "No documents in this state."} />
          ) : (
            <ul className="divide-y divide-line">{list.map((d) => <DocumentRow key={d.id} doc={d} showPerson canVerify={verify} canUpload={verify} />)}</ul>
          )}
        </Card>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Private encrypted storage · short-lived signed links · every view, edit and download is written to the audit log.</p>
    </div>
  );
}
