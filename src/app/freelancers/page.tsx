"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Receipt, Wallet, CalendarClock, Plus, Check, IndianRupee } from "lucide-react";
import { useHR } from "@/lib/store";
import type { Invoice } from "@/lib/types";
import { daysBetween, fmtDate, fmtINR, fullName, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, ChipTabs, Field, Modal, PageHeader, StatCard, StatusBadge, TableWrap } from "@/components/ui";
import { HBar } from "@/components/charts";

const net = (i: Invoice) => i.amount + (i.amount * i.gstRate) / 100 - (i.amount * i.tdsRate) / 100;

export default function FreelancersPage() {
  const people = useHR((s) => s.people);
  const invoices = useHR((s) => s.invoices);
  const setStatus = useHR((s) => s.setInvoiceStatus);
  const [f, setF] = useState<"all" | Invoice["status"]>("all");
  const [adding, setAdding] = useState(false);
  const today = todayISO();

  const freelancers = people.filter((p) => p.type === "freelancer" && p.freelancer && p.status !== "Exited");
  const list = invoices.filter((i) => f === "all" || i.status === f).sort((a, b) => b.date.localeCompare(a.date));
  const spend = useMemo(
    () => freelancers.map((p) => ({ label: p.firstName, value: invoices.filter((i) => i.personId === p.id && i.status === "Paid").reduce((a, i) => a + i.amount, 0) })).sort((a, b) => b.value - a.value),
    [freelancers, invoices]
  );
  const yearSpend = invoices.filter((i) => i.status === "Paid" && new Date(i.date).getFullYear() === new Date().getFullYear()).reduce((a, i) => a + i.amount, 0);
  const tds = invoices.filter((i) => i.status === "Paid").reduce((a, i) => a + (i.amount * i.tdsRate) / 100, 0);

  return (
    <div>
      <PageHeader eyebrow="Module 5 · Freelancer Management" title="Freelancers" subtitle="Contracts, invoices (Submitted → Approved → Paid), TDS & GST." actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add invoice</Button>} />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active freelancers" value={freelancers.length} icon={Briefcase} />
        <StatCard label="Paid this year" value={fmtINR(yearSpend, true)} icon={Wallet} tone="success" />
        <StatCard label="Awaiting payment" value={fmtINR(invoices.filter((i) => i.status !== "Paid").reduce((a, i) => a + net(i), 0), true)} icon={Receipt} tone="warning" />
        <StatCard label="TDS deducted" value={fmtINR(tds, true)} icon={IndianRupee} tone="info" />
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Contracts" subtitle="Renewal alerts 30 days before end" icon={CalendarClock} />
          <ul className="divide-y divide-line">
            {freelancers.map((p) => {
              const l = daysBetween(today, p.freelancer!.contractEnd);
              return (
                <li key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:px-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar person={p} size={40} />
                    <div className="min-w-0">
                      <Link href={`/people/${p.id}`} className="block truncate text-sm font-semibold hover:text-primary">{fullName(p)}</Link>
                      <p className="truncate text-xs text-muted">{p.designation} · {p.freelancer!.skills.join(", ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-[52px] text-sm sm:pl-0">
                    <span className="text-xs text-fg-2">{fmtINR(p.freelancer!.rate)}/{p.freelancer!.rateType === "Hourly" ? "hr" : "project"}</span>
                    <Badge tone={l < 0 ? "danger" : l <= 30 ? "warning" : "success"}>{l < 0 ? "Expired" : l <= 30 ? `Renew in ${l}d` : `Till ${fmtDate(p.freelancer!.contractEnd, { day: "2-digit", month: "short" })}`}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Spend by freelancer" subtitle="Paid invoices" icon={Wallet} />
          <div className="p-5"><HBar data={spend} format={(n) => fmtINR(n, true)} /></div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoices" icon={Receipt} />
        <div className="px-4 pt-3 sm:px-5"><ChipTabs value={f} onChange={setF} options={[{ value: "all", label: "All" }, { value: "Submitted", label: "Submitted" }, { value: "Approved", label: "Approved" }, { value: "Paid", label: "Paid" }]} /></div>
        {/* Mobile cards */}
        <ul className="divide-y divide-line sm:hidden">
          {list.map((i) => {
            const p = people.find((x) => x.id === i.personId)!;
            return (
              <li key={i.id} className="space-y-2 px-4 py-3">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold">{fullName(p)}</span><StatusBadge status={i.status} /></div>
                <p className="text-xs text-muted">{i.number} · {fmtDate(i.date)} · {i.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Net <b className="tabular">{fmtINR(net(i))}</b></span>
                  <InvoiceAction i={i} onSet={setStatus} />
                </div>
              </li>
            );
          })}
        </ul>
        <div className="hidden sm:block">
          <TableWrap>
            <table className="table">
              <thead><tr><th>Invoice</th><th>Freelancer</th><th>Date</th><th className="text-right">Amount</th><th className="text-right">GST</th><th className="text-right">TDS</th><th className="text-right">Net payable</th><th>Status</th><th /></tr></thead>
              <tbody>
                {list.map((i) => {
                  const p = people.find((x) => x.id === i.personId)!;
                  return (
                    <tr key={i.id}>
                      <td><span className="font-medium">{i.number}</span><span className="block max-w-[220px] truncate text-xs text-muted">{i.description}</span></td>
                      <td>{fullName(p)}</td>
                      <td className="whitespace-nowrap text-fg-2">{fmtDate(i.date)}</td>
                      <td className="text-right tabular">{fmtINR(i.amount)}</td>
                      <td className="text-right tabular text-fg-2">{i.gstRate ? `+${fmtINR((i.amount * i.gstRate) / 100)}` : "—"}</td>
                      <td className="text-right tabular text-fg-2">−{fmtINR((i.amount * i.tdsRate) / 100)}</td>
                      <td className="text-right font-semibold tabular">{fmtINR(net(i))}</td>
                      <td><StatusBadge status={i.status} /></td>
                      <td className="text-right"><InvoiceAction i={i} onSet={setStatus} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        </div>
      </Card>

      {adding && <InvoiceModal onClose={() => setAdding(false)} />}
    </div>
  );
}

function InvoiceAction({ i, onSet }: { i: Invoice; onSet: (id: string, s: Invoice["status"]) => void }) {
  if (i.status === "Submitted") return <Button size="sm" variant="soft" icon={Check} onClick={() => onSet(i.id, "Approved")}>Approve</Button>;
  if (i.status === "Approved") return <Button size="sm" variant="success" icon={Wallet} onClick={() => onSet(i.id, "Paid")}>Mark paid</Button>;
  return null;
}

function InvoiceModal({ onClose }: { onClose: () => void }) {
  const people = useHR((s) => s.people);
  const add = useHR((s) => s.addInvoice);
  const fl = people.filter((p) => p.type === "freelancer" && p.status !== "Exited");
  const [personId, setPersonId] = useState(fl[0]?.id ?? "");
  const [number, setNumber] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(25000);
  const [tdsRate, setTds] = useState(10);
  const p = fl.find((x) => x.id === personId);
  const gstRate = p?.freelancer?.gstin ? 18 : 0;
  const total = amount + (amount * gstRate) / 100 - (amount * tdsRate) / 100;
  return (
    <Modal open onClose={onClose} title="Add invoice" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!personId || !number || amount <= 0} onClick={() => { add({ personId, number, description, amount, gstRate, tdsRate, date: todayISO() }); onClose(); }}>Submit invoice</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Freelancer" required className="sm:col-span-2">{(id) => <select id={id} className="input" value={personId} onChange={(e) => setPersonId(e.target.value)}>{fl.map((x) => <option key={x.id} value={x.id}>{fullName(x)}</option>)}</select>}</Field>
        <Field label="Invoice number" required>{(id) => <input id={id} className="input" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="INV-001" />}</Field>
        <Field label="Amount (₹)" required>{(id) => <input id={id} type="number" inputMode="numeric" className="input" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />}</Field>
        <Field label="Description" className="sm:col-span-2">{(id) => <input id={id} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
        <Field label="TDS %" hint="Section 194J: 10% for professional fees">{(id) => <input id={id} type="number" className="input" value={tdsRate} onChange={(e) => setTds(Number(e.target.value))} />}</Field>
        <Field label="GST %" hint={p?.freelancer?.gstin ? `GSTIN ${p.freelancer.gstin}` : "Not GST registered"}>{(id) => <input id={id} className="input" value={gstRate} readOnly />}</Field>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[calc(var(--radius)*0.7)] bg-primary-soft p-4">
        <span className="text-sm font-medium">Net payable</span>
        <span className="font-[family-name:var(--font-display)] text-xl font-bold text-primary tabular">{fmtINR(total)}</span>
      </div>
    </Modal>
  );
}
