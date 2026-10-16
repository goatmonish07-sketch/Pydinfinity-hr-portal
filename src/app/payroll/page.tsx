"use client";

import { useMemo, useState } from "react";
import { Wallet, Printer, Download, Landmark, Receipt, Users } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import { cn, downloadFile, fmtINR, fullName, maskPan, salaryBreakup, toCSV } from "@/lib/utils";
import { Avatar, Button, Card, CardHeader, Empty, PageHeader, SearchInput, StatCard, TableWrap } from "@/components/ui";

export default function PayrollPage() {
  const { role, me } = useMe();
  const people = useHR((s) => s.people);
  const company = useHR((s) => s.settings.companyName);
  const log = useHR((s) => s.log);
  const admin = can(role, "payroll");
  const employees = useMemo(() => people.filter((p) => p.type === "employee" && p.ctc && (p.status === "Active" || p.status === "Notice Period")), [people]);
  const [sel, setSel] = useState(admin ? employees[0]?.id : me.id);
  const [q, setQ] = useState("");
  const month = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const person = people.find((p) => p.id === sel);
  const totals = useMemo(() => employees.reduce((a, p) => { const b = salaryBreakup(p.ctc!); return { gross: a.gross + b.gross, net: a.net + b.net, pf: a.pf + b.pf, tds: a.tds + b.tds }; }, { gross: 0, net: 0, pf: 0, tds: 0 }), [employees]);

  if (!person?.ctc) return <div><PageHeader eyebrow="Module 13 · Payroll" title="Payroll" /><Card><Empty icon={Wallet} title="No salary structure on file" hint="Payslips are available for employees with a CTC set." /></Card></div>;
  const b = salaryBreakup(person.ctc);

  const exportTally = () => {
    downloadFile(`payroll-${month.replace(" ", "-")}.csv`, toCSV(employees.map((p) => { const x = salaryBreakup(p.ctc!); return { EmpID: p.code, Name: fullName(p), Basic: x.basic, HRA: x.hra, Special: x.special, LTA: x.lta, Gross: x.gross, PF: x.pf, ESI: x.esi, PT: x.pt, TDS: x.tds, Net: x.net }; })));
    log("export", `Payroll register ${month}`);
  };

  return (
    <div>
      <PageHeader eyebrow="Module 13 · Payroll basics" title={admin ? "Payroll" : "My payslips"} subtitle={admin ? "Salary structures, payslips and statutory fields (PF, ESI, PT, TDS). Export to Tally / Zoho Payroll." : `Payslip for ${month}`} actions={admin && <Button variant="secondary" icon={Download} onClick={exportTally}>Export for Tally</Button>} />
      {admin && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard label="Employees on payroll" value={employees.length} icon={Users} />
          <StatCard label="Monthly gross" value={fmtINR(totals.gross, true)} icon={Wallet} tone="info" />
          <StatCard label="Net payout" value={fmtINR(totals.net, true)} icon={Landmark} tone="success" />
          <StatCard label="PF + TDS" value={fmtINR(totals.pf + totals.tds, true)} icon={Receipt} tone="warning" />
        </div>
      )}
      <div className={cn("grid gap-5", admin && "lg:grid-cols-[360px_1fr]")}>
        {admin && (
          <Card className="h-fit">
            <CardHeader title="Salary register" subtitle={month} icon={Users} />
            <div className="p-3"><SearchInput value={q} onChange={setQ} placeholder="Search employee" /></div>
            <ul className="scroll-thin max-h-[520px] divide-y divide-line overflow-y-auto">
              {employees.filter((p) => !q || fullName(p).toLowerCase().includes(q.toLowerCase())).map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSel(p.id)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2", sel === p.id && "bg-primary-soft")}>
                    <Avatar person={p} size={34} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{fullName(p)}</span><span className="block text-xs text-muted">{p.code}</span></span>
                    <span className="text-sm font-semibold tabular">{fmtINR(salaryBreakup(p.ctc!).net, true)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
        <div>
          <div className="mb-3 flex justify-end"><Button icon={Printer} onClick={() => { log("download", `Payslip of ${fullName(person)}`); window.print(); }}>Download payslip</Button></div>
          <Card className="print-area overflow-hidden">
            <div className="gradient-brand flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-white sm:px-6" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
              <div><p className="font-[family-name:var(--font-display)] text-lg font-bold">{company}</p><p className="text-xs opacity-90">Payslip · {month}</p></div>
              <p className="text-right text-xs opacity-90">Confidential</p>
            </div>
            <div className="grid gap-x-6 gap-y-2 border-b border-line p-5 text-sm sm:grid-cols-2 sm:p-6">
              {[["Employee", fullName(person)], ["Employee ID", person.code], ["Designation", person.designation], ["Department", person.department], ["PAN", maskPan(person.pan)], ["Bank", person.bank.name ? `${person.bank.name} ••${person.bank.accountLast4}` : "—"], ["Annual CTC", fmtINR(person.ctc)], ["Pay days", "30 / 30"]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><span className="text-muted">{k}</span><span className="text-right font-medium">{v}</span></div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2">
              <div className="border-b border-line p-5 sm:border-b-0 sm:border-r sm:p-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-success">Earnings</p>
                <TableWrap><table className="w-full text-sm"><tbody>
                  {[["Basic", b.basic], ["House Rent Allowance", b.hra], ["Special Allowance", b.special], ["Leave Travel Allowance", b.lta]].map(([k, v]) => <tr key={k as string}><td className="py-1.5 text-fg-2">{k}</td><td className="py-1.5 text-right tabular">{fmtINR(v as number)}</td></tr>)}
                  <tr className="border-t border-line font-semibold"><td className="pt-2">Gross earnings</td><td className="pt-2 text-right tabular">{fmtINR(b.gross)}</td></tr>
                </tbody></table></TableWrap>
              </div>
              <div className="p-5 sm:p-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-danger">Deductions</p>
                <table className="w-full text-sm"><tbody>
                  {[["Provident Fund (12%)", b.pf], ["ESI (0.75%)", b.esi], ["Professional Tax", b.pt], ["TDS", b.tds]].map(([k, v]) => <tr key={k as string}><td className="py-1.5 text-fg-2">{k}</td><td className="py-1.5 text-right tabular">{fmtINR(v as number)}</td></tr>)}
                  <tr className="border-t border-line font-semibold"><td className="pt-2">Total deductions</td><td className="pt-2 text-right tabular">{fmtINR(b.deductions)}</td></tr>
                </tbody></table>
              </div>
            </div>
            <div className="flex items-center justify-between bg-primary-soft px-5 py-4 sm:px-6">
              <span className="font-semibold">Net pay</span>
              <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-primary tabular">{fmtINR(b.net)}</span>
            </div>
            <p className="px-5 py-3 text-[11px] text-muted sm:px-6">This is a system-generated payslip and does not require a signature.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
