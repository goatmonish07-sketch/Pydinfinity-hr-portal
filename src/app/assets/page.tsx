"use client";

import { useMemo, useState } from "react";
import { Laptop, Smartphone, CreditCard, Monitor, IdCard, Plus, Undo2, Send, Package } from "lucide-react";
import { useHR } from "@/lib/store";
import type { Asset } from "@/lib/types";
import { fmtDate, fullName } from "@/lib/utils";
import { Avatar, Button, Card, ChipTabs, Empty, Field, Modal, PageHeader, SearchInput, StatCard, StatusBadge } from "@/components/ui";

const KIND_ICON = { Laptop, Phone: Smartphone, SIM: CreditCard, "ID Card": IdCard, "Access Card": CreditCard, Monitor };

export default function AssetsPage() {
  const assets = useHR((s) => s.assets);
  const people = useHR((s) => s.people);
  const assign = useHR((s) => s.assignAsset);
  const [f, setF] = useState<"all" | Asset["status"]>("all");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [issuing, setIssuing] = useState<Asset | null>(null);
  const [to, setTo] = useState("");

  const list = useMemo(
    () => assets.filter((a) => f === "all" || a.status === f).filter((a) => !q || `${a.tag} ${a.model} ${a.kind} ${fullName(people.find((p) => p.id === a.assignedTo))}`.toLowerCase().includes(q.toLowerCase())),
    [assets, f, q, people]
  );

  return (
    <div>
      <PageHeader eyebrow="Module 10 · Asset Tracking" title="Assets" subtitle="Laptops, phones, SIMs, ID and access cards — issued and returned." actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add asset</Button>} />
      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total assets" value={assets.length} icon={Package} />
        <StatCard label="Issued" value={assets.filter((a) => a.status === "Issued").length} icon={Send} tone="info" />
        <StatCard label="In stock" value={assets.filter((a) => a.status === "In Stock").length} icon={Laptop} tone="success" />
        <StatCard label="Lost" value={assets.filter((a) => a.status === "Lost").length} icon={CreditCard} tone="danger" />
      </div>
      <div className="mb-4 space-y-3">
        <ChipTabs value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "Issued", label: "Issued" }, { value: "In Stock", label: "In stock" }, { value: "Lost", label: "Lost" }]} />
        <SearchInput value={q} onChange={setQ} placeholder="Search tag, model or person" />
      </div>
      {list.length === 0 ? <Card><Empty icon={Package} title="No assets found" /></Card> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => {
            const I = KIND_ICON[a.kind];
            const p = people.find((x) => x.id === a.assignedTo);
            return (
              <Card key={a.id} className="flex flex-col p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[calc(var(--radius)*0.6)] bg-primary-soft text-primary"><I className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{a.model}</p>
                    <p className="font-mono text-xs text-muted">{a.tag} · {a.kind}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  {p ? (
                    <span className="flex min-w-0 items-center gap-2 text-sm"><Avatar person={p} size={28} /><span className="min-w-0"><span className="block truncate font-medium">{fullName(p)}</span><span className="block text-xs text-muted">since {fmtDate(a.issuedOn)}</span></span></span>
                  ) : <span className="text-sm text-muted">Unassigned</span>}
                  {a.status === "Issued" ? (
                    <Button size="sm" variant="ghost" icon={Undo2} onClick={() => assign(a.id, undefined)}>Return</Button>
                  ) : a.status === "In Stock" ? (
                    <Button size="sm" variant="soft" icon={Send} onClick={() => { setIssuing(a); setTo(""); }}>Issue</Button>
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!issuing} onClose={() => setIssuing(null)} title={`Issue ${issuing?.tag}`} subtitle={issuing?.model} footer={<><Button variant="secondary" onClick={() => setIssuing(null)}>Cancel</Button><Button disabled={!to} onClick={() => { assign(issuing!.id, to); setIssuing(null); }}>Issue asset</Button></>}>
        <Field label="Issue to" required>{(id) => <select id={id} className="input" value={to} onChange={(e) => setTo(e.target.value)}><option value="">Select person…</option>{people.filter((p) => p.status !== "Exited").map((p) => <option key={p.id} value={p.id}>{fullName(p)} · {p.code ?? "pending"}</option>)}</select>}</Field>
      </Modal>
      {adding && <AddAsset onClose={() => setAdding(false)} />}
    </div>
  );
}

function AddAsset({ onClose }: { onClose: () => void }) {
  const add = useHR((s) => s.addAsset);
  const count = useHR((s) => s.assets.length);
  const [kind, setKind] = useState<Asset["kind"]>("Laptop");
  const [model, setModel] = useState("");
  const tag = `AST-${kind.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(3, "0")}`;
  return (
    <Modal open onClose={onClose} title="Add asset" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!model.trim()} onClick={() => { add({ tag, kind, model: model.trim(), status: "In Stock" }); onClose(); }}>Add to stock</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">{(id) => <select id={id} className="input" value={kind} onChange={(e) => setKind(e.target.value as Asset["kind"])}>{(["Laptop", "Phone", "SIM", "ID Card", "Access Card", "Monitor"] as const).map((k) => <option key={k}>{k}</option>)}</select>}</Field>
        <Field label="Asset tag" hint="Auto-generated">{(id) => <input id={id} className="input font-mono" value={tag} readOnly />}</Field>
        <Field label="Model / description" required className="sm:col-span-2">{(id) => <input id={id} className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. MacBook Air M3 16GB" />}</Field>
      </div>
    </Modal>
  );
}
