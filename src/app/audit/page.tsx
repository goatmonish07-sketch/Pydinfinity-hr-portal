"use client";

import { useMemo, useState } from "react";
import { ScrollText, Eye, Pencil, Download, ShieldCheck, Plus, BadgeCheck, Trash2, Upload, FileDown } from "lucide-react";
import { useHR } from "@/lib/store";
import type { AuditEntry } from "@/lib/types";
import { downloadFile, fullName, toCSV } from "@/lib/utils";
import { Avatar, Badge, Button, Card, ChipTabs, Empty, PageHeader, SearchInput } from "@/components/ui";

const ICON = { view: Eye, edit: Pencil, download: Download, verify: ShieldCheck, create: Plus, approve: BadgeCheck, delete: Trash2, import: Upload, export: FileDown };

export default function AuditPage() {
  const audit = useHR((s) => s.audit);
  const people = useHR((s) => s.people);
  const [f, setF] = useState<"all" | AuditEntry["action"]>("all");
  const [q, setQ] = useState("");
  const list = useMemo(() => audit.filter((a) => f === "all" || a.action === f).filter((a) => !q || `${a.target} ${fullName(people.find((p) => p.id === a.actor))}`.toLowerCase().includes(q.toLowerCase())), [audit, f, q, people]);

  return (
    <div>
      <PageHeader
        eyebrow="Security & Compliance"
        title="Audit log"
        subtitle="Every view, edit and download of personal data — DPDP Act ready."
        actions={<Button variant="secondary" icon={Download} onClick={() => downloadFile("audit-log.csv", toCSV(list.map((a) => ({ Time: a.at, Actor: fullName(people.find((p) => p.id === a.actor)), Action: a.action, Target: a.target }))))}>Export</Button>}
      />
      <div className="mb-4 space-y-3">
        <ChipTabs value={f} onChange={setF} options={[{ value: "all", label: "All" }, ...(["view", "edit", "download", "verify", "create", "approve", "export", "import"] as const).map((a) => ({ value: a, label: a[0].toUpperCase() + a.slice(1) }))]} />
        <SearchInput value={q} onChange={setQ} placeholder="Search by person or record" />
      </div>
      <Card>
        {list.length === 0 ? <Empty icon={ScrollText} title="No audit entries" /> : (
          <ul className="divide-y divide-line">
            {list.slice(0, 200).map((a) => {
              const actor = people.find((p) => p.id === a.actor);
              const I = ICON[a.action];
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                  {actor && <Avatar person={actor} size={34} />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm"><span className="font-semibold">{fullName(actor)}</span> <span className="text-muted">{a.action}</span> {a.target}</p>
                    <p className="text-xs text-muted">{new Date(a.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <Badge tone={a.action === "download" || a.action === "export" ? "warning" : a.action === "view" ? "neutral" : "info"}><I className="h-3 w-3" /> {a.action}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
