"use client";

import { useRef, useState } from "react";
import { Briefcase, GraduationCap, Award, Languages, FileText, Upload, Download, Eye, Trash2, Pencil, Plus, Sparkles, Link2 } from "lucide-react";
import { useHR } from "@/lib/store";
import type { Person, Resume } from "@/lib/types";
import { fmtBytes, readAsDataUrl, RESUME_INLINE_LIMIT } from "@/lib/files";
import { fmtDate, fullName, todayISO, uid } from "@/lib/utils";
import { Badge, Button, Card, CardHeader, Empty, Field, Modal } from "./ui";

const EMPTY: Resume = { skills: [], languages: [], education: [], experience: [], certifications: [] };

const monthYear = (d?: string) => (d ? fmtDate(d, { month: "short", year: "numeric" }) : "");
function duration(from: string, to?: string) {
  const months = Math.max(1, Math.round((new Date(to ?? todayISO()).getTime() - new Date(from).getTime()) / (30.44 * 86_400_000)));
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, m && `${m} mo`].filter(Boolean).join(" ");
}

export function ResumePanel({ person, editable }: { person: Person; editable: boolean }) {
  const update = useHR((s) => s.updatePerson);
  const toast = useHR((s) => s.toast);
  const log = useHR((s) => s.log);
  const [editing, setEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const r = person.resume ?? EMPTY;
  const save = (resume: Resume, note?: string) => update(person.id, { resume }, note);

  const upload = async (f?: File) => {
    if (!f) return;
    const ok = /pdf|word|officedocument|msword/.test(f.type) || /\.(pdf|docx?)$/i.test(f.name);
    if (!ok) return toast("Upload a PDF or Word resume", "error");
    const inline = f.size <= RESUME_INLINE_LIMIT;
    const dataUrl = inline ? await readAsDataUrl(f) : undefined;
    save({ ...r, file: { name: f.name, size: f.size, type: f.type, dataUrl, uploadedAt: todayISO() } }, "Resume uploaded");
    toast(inline ? "Resume uploaded" : "Resume details saved — file is over 900 KB, so only its name is kept in this demo", inline ? "success" : "info");
    if (fileRef.current) fileRef.current.value = "";
  };
  const open = () => {
    if (!r.file?.dataUrl) return;
    log("view", `Resume of ${fullName(person)}`);
    const w = window.open();
    if (w) w.document.write(`<title>${r.file.name}</title><iframe src="${r.file.dataUrl}" style="border:0;position:fixed;inset:0;width:100%;height:100%"></iframe>`);
  };
  const download = () => {
    if (!r.file?.dataUrl) return;
    log("download", `Resume of ${fullName(person)}`);
    const a = document.createElement("a");
    a.href = r.file.dataUrl;
    a.download = r.file.name;
    a.click();
  };

  const nothing = !r.summary && !r.skills.length && !r.education.length && !r.experience.length && !r.file;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader title="Profile summary" icon={Sparkles} action={editable && <Button size="sm" variant="outline" icon={Pencil} onClick={() => setEditing(true)}>Edit resume</Button>} />
          <div className="px-4 pb-5 sm:px-[22px]">
            {nothing ? (
              <Empty icon={FileText} title="No resume details yet" hint="Add education, experience and skills, or upload a resume file." action={editable && <Button icon={Plus} onClick={() => setEditing(true)}>Add resume details</Button>} />
            ) : (
              <>
                <p className="text-[15px] leading-relaxed text-fg-2">{r.summary || "—"}</p>
                {r.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {r.skills.map((s) => <span key={s} className="inline-flex min-h-7 items-center rounded-full border border-line bg-surface-2 px-3 text-xs font-semibold text-fg-2">{s}</span>)}
                  </div>
                )}
                {(person.linkedIn || person.portfolio) && (
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {[person.linkedIn, person.portfolio].filter(Boolean).map((u) => (
                      <a key={u} href={u!.startsWith("http") ? u : `https://${u}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
                        <Link2 className="h-4 w-4" /> {u!.replace(/^https?:\/\//, "")}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Work experience" subtitle={r.experience.length ? `${r.experience.length} previous role${r.experience.length > 1 ? "s" : ""}` : "No previous roles"} icon={Briefcase} />
          <ol className="relative mx-4 mb-5 space-y-5 border-l-2 border-line pl-6 sm:mx-[22px]">
            <li className="relative">
              <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-[3px] border-surface bg-primary" />
              <p className="font-bold">{person.designation} <Badge tone="primary" className="ml-1">Current</Badge></p>
              <p className="text-sm text-muted">Pydinfinity Solutions LLP · {monthYear(person.joiningDate)} – Present · {duration(person.joiningDate)}</p>
            </li>
            {r.experience.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-[3px] border-surface bg-line-strong" />
                <p className="font-bold">{e.role}</p>
                <p className="text-sm text-muted">{e.company} · {monthYear(e.from)} – {e.current ? "Present" : monthYear(e.to)} · {duration(e.from, e.current ? undefined : e.to)}</p>
                {e.description && <p className="mt-1 text-sm text-fg-2">{e.description}</p>}
              </li>
            ))}
          </ol>
        </Card>

        <Card>
          <CardHeader title="Education" icon={GraduationCap} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {r.education.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No education added.</li>}
            {r.education.map((e) => (
              <li key={e.id} className="flex items-start gap-3 border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-3 last:border-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-primary-soft text-primary"><GraduationCap className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.degree}</span>
                  <span className="block text-sm text-muted">{e.institution} · {e.year}</span>
                </span>
                {e.score && <Badge tone="success">{e.score}</Badge>}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader title="Resume file" icon={FileText} />
          <div className="px-4 pb-5 sm:px-[22px]">
            {r.file ? (
              <div className="rounded-[16px] border border-line bg-surface-2 p-3">
                <p className="truncate font-semibold">{r.file.name}</p>
                <p className="text-xs text-muted">{fmtBytes(r.file.size)} · uploaded {fmtDate(r.file.uploadedAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.file.dataUrl && <Button size="sm" variant="outline" icon={Eye} onClick={open}>View</Button>}
                  {r.file.dataUrl && <Button size="sm" variant="ghost" icon={Download} onClick={download}>Download</Button>}
                  {editable && <Button size="sm" variant="ghost" icon={Trash2} className="text-danger" onClick={() => save({ ...r, file: undefined }, "Resume file removed")}>Remove</Button>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No resume file uploaded.</p>
            )}
            {editable && (
              <>
                <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
                <button onClick={() => fileRef.current?.click()} className="mt-3 flex w-full flex-col items-center gap-1 rounded-[18px] border-2 border-dashed border-line-strong px-4 py-5 text-center text-sm transition-colors hover:border-primary hover:bg-primary-soft">
                  <Upload className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{r.file ? "Replace resume" : "Upload resume"}</span>
                  <span className="text-xs text-muted">PDF or Word</span>
                </button>
              </>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Certifications" icon={Award} />
          <ul className="px-2 pb-3 sm:px-3.5">
            {r.certifications.length === 0 && <li className="px-3 py-5 text-center text-sm text-muted">None added.</li>}
            {r.certifications.map((c) => (
              <li key={c.id} className="border-b border-[color-mix(in_srgb,var(--border)_70%,transparent)] px-2 py-2.5 last:border-0">
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-muted">{c.issuer} · {c.year}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Languages" icon={Languages} />
          <div className="flex flex-wrap gap-1.5 px-4 pb-5 sm:px-[22px]">
            {r.languages.length ? r.languages.map((l) => <Badge key={l}>{l}</Badge>) : <span className="text-sm text-muted">None added.</span>}
          </div>
        </Card>
      </div>

      {editing && <ResumeEditor person={person} onClose={() => setEditing(false)} onSave={(res, links) => { update(person.id, { resume: res, ...links }, "Resume updated"); toast("Resume saved"); setEditing(false); }} />}
    </div>
  );
}

function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">{title}</p>
        <Button size="sm" variant="ghost" icon={Plus} onClick={onAdd}>Add</Button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Remove({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Remove" className="grid h-11 w-11 shrink-0 place-items-center self-end rounded-full text-danger hover:bg-danger-soft">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function ResumeEditor({ person, onClose, onSave }: { person: Person; onClose: () => void; onSave: (r: Resume, links: { linkedIn?: string; portfolio?: string }) => void }) {
  const [r, setR] = useState<Resume>(() => structuredClone(person.resume ?? EMPTY));
  const [skills, setSkills] = useState(r.skills.join(", "));
  const [langs, setLangs] = useState(r.languages.join(", "));
  const [linkedIn, setLinkedIn] = useState(person.linkedIn ?? "");
  const [portfolio, setPortfolio] = useState(person.portfolio ?? "");
  const list = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);


  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={`Resume · ${fullName(person)}`}
      subtitle="Education, experience, skills and certifications"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSave({ ...r, skills: list(skills), languages: list(langs) }, { linkedIn: linkedIn.trim() || undefined, portfolio: portfolio.trim() || undefined })}>Save resume</Button></>}
    >
      <div className="space-y-6">
        <Field label="Profile summary">{(id) => <textarea id={id} rows={3} className="input" value={r.summary ?? ""} onChange={(e) => setR({ ...r, summary: e.target.value })} />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Skills" hint="Comma separated">{(id) => <input id={id} className="input" value={skills} onChange={(e) => setSkills(e.target.value)} />}</Field>
          <Field label="Languages" hint="Comma separated">{(id) => <input id={id} className="input" value={langs} onChange={(e) => setLangs(e.target.value)} />}</Field>
          <Field label="LinkedIn profile">{(id) => <input id={id} className="input" placeholder="linkedin.com/in/…" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} />}</Field>
          <Field label="Portfolio / website">{(id) => <input id={id} className="input" placeholder="behance.net/…" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />}</Field>
        </div>

        <Section title="Work experience (previous employers)" onAdd={() => setR({ ...r, experience: [...r.experience, { id: uid("ex"), company: "", role: "", from: todayISO(), to: todayISO() }] })}>
          {r.experience.map((e, i) => {
            const set = (patch: Partial<typeof e>) => setR({ ...r, experience: r.experience.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
            return (
              <div key={e.id} className="rounded-[18px] border border-line p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_150px_150px_auto]">
                  <Field label="Company">{(id) => <input id={id} className="input" value={e.company} onChange={(ev) => set({ company: ev.target.value })} />}</Field>
                  <Field label="Role">{(id) => <input id={id} className="input" value={e.role} onChange={(ev) => set({ role: ev.target.value })} />}</Field>
                  <Field label="From">{(id) => <input id={id} type="date" className="input" value={e.from} onChange={(ev) => set({ from: ev.target.value })} />}</Field>
                  <Field label="To">{(id) => <input id={id} type="date" className="input" value={e.to ?? ""} onChange={(ev) => set({ to: ev.target.value })} />}</Field>
                  <Remove onClick={() => setR({ ...r, experience: r.experience.filter((_, k) => k !== i) })} />
                </div>
                <Field label="What did they do?" className="mt-3">{(id) => <input id={id} className="input" value={e.description ?? ""} onChange={(ev) => set({ description: ev.target.value })} />}</Field>
              </div>
            );
          })}
        </Section>

        <Section title="Education" onAdd={() => setR({ ...r, education: [...r.education, { id: uid("ed"), degree: "", institution: "", year: String(new Date().getFullYear()) }] })}>
          {r.education.map((e, i) => {
            const set = (patch: Partial<typeof e>) => setR({ ...r, education: r.education.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
            return (
              <div key={e.id} className="grid gap-3 rounded-[18px] border border-line p-3 sm:grid-cols-[1fr_1fr_100px_100px_auto]">
                <Field label="Degree / course">{(id) => <input id={id} className="input" value={e.degree} onChange={(ev) => set({ degree: ev.target.value })} />}</Field>
                <Field label="Institution">{(id) => <input id={id} className="input" value={e.institution} onChange={(ev) => set({ institution: ev.target.value })} />}</Field>
                <Field label="Year">{(id) => <input id={id} inputMode="numeric" className="input" value={e.year} onChange={(ev) => set({ year: ev.target.value })} />}</Field>
                <Field label="Score">{(id) => <input id={id} className="input" placeholder="8.2 CGPA" value={e.score ?? ""} onChange={(ev) => set({ score: ev.target.value })} />}</Field>
                <Remove onClick={() => setR({ ...r, education: r.education.filter((_, k) => k !== i) })} />
              </div>
            );
          })}
        </Section>

        <Section title="Certifications" onAdd={() => setR({ ...r, certifications: [...r.certifications, { id: uid("ce"), name: "", issuer: "", year: String(new Date().getFullYear()) }] })}>
          {r.certifications.map((c, i) => {
            const set = (patch: Partial<typeof c>) => setR({ ...r, certifications: r.certifications.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
            return (
              <div key={c.id} className="grid gap-3 rounded-[18px] border border-line p-3 sm:grid-cols-[1fr_1fr_100px_auto]">
                <Field label="Certification">{(id) => <input id={id} className="input" value={c.name} onChange={(ev) => set({ name: ev.target.value })} />}</Field>
                <Field label="Issued by">{(id) => <input id={id} className="input" value={c.issuer} onChange={(ev) => set({ issuer: ev.target.value })} />}</Field>
                <Field label="Year">{(id) => <input id={id} inputMode="numeric" className="input" value={c.year} onChange={(ev) => set({ year: ev.target.value })} />}</Field>
                <Remove onClick={() => setR({ ...r, certifications: r.certifications.filter((_, k) => k !== i) })} />
              </div>
            );
          })}
        </Section>
      </div>
    </Modal>
  );
}
