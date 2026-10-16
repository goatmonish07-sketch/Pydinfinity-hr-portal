"use client";

import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, Upload, Download, CheckCircle2, AlertTriangle, FileDown, Printer } from "lucide-react";
import { useHR } from "@/lib/store";
import type { PersonType } from "@/lib/types";
import { addDays, cn, downloadFile, fullName, parseCSV, toCSV, todayISO, TYPE_LABEL } from "@/lib/utils";
import { blankPerson } from "@/components/person-form";
import { Badge, Button, Card, CardHeader, PageHeader, TableWrap } from "@/components/ui";

const FIELDS = [
  { key: "type", label: "Type (Employee/Intern/Freelancer)", required: true },
  { key: "firstName", label: "First name", required: true },
  { key: "lastName", label: "Last name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation", required: true },
  { key: "branch", label: "Branch" },
  { key: "joiningDate", label: "Joining date (YYYY-MM-DD)" },
  { key: "pan", label: "PAN" },
  { key: "ctc", label: "Annual CTC" },
] as const;
type Key = (typeof FIELDS)[number]["key"];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
const ALIASES: Record<Key, string[]> = {
  type: ["type", "persontype", "category"],
  firstName: ["firstname", "first", "givenname"],
  lastName: ["lastname", "last", "surname"],
  email: ["email", "emailid", "mail"],
  phone: ["phone", "mobile", "contact"],
  department: ["department", "dept"],
  designation: ["designation", "title", "role", "position"],
  branch: ["branch", "location", "office"],
  joiningDate: ["joiningdate", "doj", "dateofjoining", "joined"],
  pan: ["pan", "pannumber"],
  ctc: ["ctc", "salary", "annualctc"],
};

export default function ImportExportPage() {
  const people = useHR((s) => s.people);
  const documents = useHR((s) => s.documents);
  const invoices = useHR((s) => s.invoices);
  const leaves = useHR((s) => s.leaves);
  const settings = useHR((s) => s.settings);
  const importPeople = useHR((s) => s.importPeople);
  const log = useHR((s) => s.log);
  const toast = useHR((s) => s.toast);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [map, setMap] = useState<Record<Key, number>>({} as Record<Key, number>);
  const headers = rows[0] ?? [];
  const body = rows.slice(1);

  const onFile = async (f: File) => {
    const text = await f.text();
    const parsed = parseCSV(text);
    setFileName(f.name);
    setRows(parsed);
    const m = {} as Record<Key, number>;
    FIELDS.forEach((fl) => { const idx = (parsed[0] ?? []).findIndex((h) => ALIASES[fl.key].includes(norm(h))); m[fl.key] = idx; });
    setMap(m);
  };

  const validated = useMemo(() => {
    const emails = new Set(people.map((p) => p.email.toLowerCase()));
    return body.map((r, i) => {
      const get = (k: Key) => (map[k] >= 0 ? (r[map[k]] ?? "").trim() : "");
      const errors: string[] = [];
      const t = get("type").toLowerCase();
      const type: PersonType | undefined = t.startsWith("emp") ? "employee" : t.startsWith("int") ? "intern" : t.startsWith("fre") ? "freelancer" : undefined;
      if (!type) errors.push("Unknown type");
      FIELDS.filter((f) => "required" in f && f.required && f.key !== "type").forEach((f) => !get(f.key) && errors.push(`${f.label} missing`));
      const email = get("email");
      if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push("Invalid email");
      if (emails.has(email.toLowerCase())) errors.push("Email already exists");
      const pan = get("pan").toUpperCase();
      if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) errors.push("Invalid PAN");
      const jd = get("joiningDate");
      if (jd && isNaN(Date.parse(jd))) errors.push("Bad date");
      return { i, type, get, errors };
    });
  }, [body, map, people]);
  const valid = validated.filter((v) => !v.errors.length);

  const doImport = () => {
    const recs = valid.map(({ type, get }) => {
      const b = blankPerson(type!);
      return {
        ...b,
        firstName: get("firstName"),
        lastName: get("lastName"),
        email: get("email"),
        phone: get("phone"),
        department: settings.departments.includes(get("department")) ? get("department") : b.department,
        designation: get("designation"),
        branch: settings.branches.includes(get("branch")) ? get("branch") : b.branch,
        joiningDate: get("joiningDate") || todayISO(),
        pan: get("pan").toUpperCase(),
        ctc: type === "employee" ? Number(get("ctc")) || b.ctc : undefined,
      };
    });
    const n = importPeople(recs);
    toast(`${n} people imported and IDs issued`);
    setRows([]);
    setFileName("");
  };

  const template = () => downloadFile("people-import-template.csv", toCSV([{ Type: "Employee", "First name": "Asha", "Last name": "Rao", Email: "asha.rao@example.com", Phone: "+91 9876543210", Department: "Engineering", Designation: "Software Engineer", Branch: "Bengaluru HQ", "Joining date": addDays(todayISO(), 7), PAN: "ABCPR1234K", CTC: 900000 }]));
  const exp = (name: string, data: Record<string, unknown>[]) => { downloadFile(`${name}-${todayISO()}.csv`, toCSV(data)); log("export", `${name} (${data.length} rows)`); toast(`${name} exported`); };
  const byId = new Map(people.map((p) => [p.id, p]));

  return (
    <div>
      <PageHeader eyebrow="Module 6 · Bulk Import / Export" title="Import & export" subtitle="Bring existing staff in from Excel (save as CSV) with column mapping and error checking." />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Import people" subtitle="CSV exported from Excel or Google Sheets" icon={Upload} action={<Button size="sm" variant="ghost" icon={FileDown} onClick={template}>Template</Button>} />
          <div className="p-4 sm:p-5">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border-2 border-dashed border-line-strong bg-surface-2 px-4 py-10 text-center transition-colors hover:border-primary hover:bg-primary-soft"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary"><FileSpreadsheet className="h-7 w-7" /></span>
              <span className="font-semibold">{fileName || "Drop a CSV here or tap to browse"}</span>
              <span className="text-xs text-muted">{fileName ? `${body.length} rows detected` : "Columns are matched automatically — adjust below"}</span>
            </button>

            {rows.length > 0 && (
              <>
                <p className="mb-3 mt-6 text-sm font-semibold">Column mapping</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-fg-2">{f.label}{"required" in f && f.required && <span className="text-danger"> *</span>}</span>
                      <select className={cn("input", "required" in f && f.required && map[f.key] < 0 && "border-danger")} value={map[f.key]} onChange={(e) => setMap({ ...map, [f.key]: Number(e.target.value) })}>
                        <option value={-1}>— Skip —</option>
                        {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                <div className="mb-3 mt-6 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">Preview</p>
                  <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> {valid.length} ready</Badge>
                  {validated.length - valid.length > 0 && <Badge tone="danger"><AlertTriangle className="h-3 w-3" /> {validated.length - valid.length} with errors</Badge>}
                </div>
                <div className="overflow-hidden rounded-[calc(var(--radius)*0.7)] border border-line">
                  <TableWrap>
                    <table className="table">
                      <thead><tr><th>#</th><th>Name</th><th>Type</th><th>Email</th><th>Result</th></tr></thead>
                      <tbody>
                        {validated.slice(0, 50).map((v) => (
                          <tr key={v.i}>
                            <td className="text-muted">{v.i + 2}</td>
                            <td>{v.get("firstName")} {v.get("lastName")}</td>
                            <td>{v.type ? TYPE_LABEL[v.type] : "—"}</td>
                            <td className="text-fg-2">{v.get("email")}</td>
                            <td>{v.errors.length ? <span className="text-xs font-medium text-danger">{v.errors.join(", ")}</span> : <Badge tone="success">OK</Badge>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrap>
                </div>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button variant="secondary" onClick={() => { setRows([]); setFileName(""); }}>Cancel</Button>
                  <Button icon={Upload} disabled={!valid.length} onClick={doImport}>Import {valid.length} & issue IDs</Button>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Export" subtitle="CSV opens directly in Excel" icon={Download} />
          <ul className="divide-y divide-line">
            {[
              ["People directory", () => exp("people", people.map((p) => ({ ID: p.code ?? "", Name: fullName(p), Type: TYPE_LABEL[p.type], Email: p.email, Phone: p.phone, Department: p.department, Designation: p.designation, Branch: p.branch, Status: p.status, Joined: p.joiningDate, Gender: p.gender, DOB: p.dob, Location: p.location ?? "", "Personal email": p.personalEmail ?? "", LinkedIn: p.linkedIn ?? "", Skills: p.resume?.skills.join("; ") ?? "", "Highest education": p.resume?.education[0] ? `${p.resume.education[0].degree}, ${p.resume.education[0].institution} (${p.resume.education[0].year})` : "", "Previous employers": p.resume?.experience.map((e) => e.company).join("; ") ?? "", "Engagement type": p.freelancer?.engagementType ?? "", "Work mode": p.freelancer?.workMode ?? "", "Freelancer form ID": p.freelancer?.formId ?? "" })))],
              ["KYC status", () => exp("kyc-status", documents.map((d) => ({ Person: fullName(byId.get(d.personId)), ID: byId.get(d.personId)?.code ?? "", Document: d.kind, Status: d.status, Uploaded: d.uploadedAt ?? "", Expiry: d.expiry ?? "" })))],
              ["Freelancer invoices", () => exp("invoices", invoices.map((i) => ({ Invoice: i.number, Freelancer: fullName(byId.get(i.personId)), Date: i.date, Amount: i.amount, GST: i.gstRate, TDS: i.tdsRate, Status: i.status })))],
              ["Leave register", () => exp("leaves", leaves.map((l) => ({ Person: fullName(byId.get(l.personId)), Type: l.type, From: l.from, To: l.to, Days: l.days, Status: l.status })))],
            ].map(([label, fn]) => (
              <li key={label as string}>
                <button onClick={fn as () => void} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-success-soft text-success"><FileSpreadsheet className="h-4 w-4" /></span>
                  <span className="flex-1 text-sm font-medium">{label as string}</span>
                  <Download className="h-4 w-4 text-muted" />
                </button>
              </li>
            ))}
            <li>
              <button onClick={() => window.print()} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left hover:bg-surface-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-danger-soft text-danger"><Printer className="h-4 w-4" /></span>
                <span className="flex-1 text-sm font-medium">Any page → PDF</span>
                <span className="text-xs text-muted">Print</span>
              </button>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
