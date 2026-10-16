"use client";

import { useMemo, useState } from "react";
import { Megaphone, Pin, Plus, Cake, PartyPopper } from "lucide-react";
import { can, useHR, useMe } from "@/lib/store";
import type { Announcement } from "@/lib/types";
import { cn, daysBetween, fmtDate, fullName, qp, todayISO } from "@/lib/utils";
import { Avatar, Badge, Button, Card, CardHeader, ChipTabs, Field, Modal, PageHeader } from "@/components/ui";

const CAT_TONE = { News: "neutral", Policy: "info", Event: "primary", Celebration: "success" } as const;

export default function AnnouncementsPage() {
  const { role } = useMe();
  const items = useHR((s) => s.announcements);
  const people = useHR((s) => s.people);
  const togglePin = useHR((s) => s.togglePin);
  const toast = useHR((s) => s.toast);
  const [cat, setCat] = useState<"all" | Announcement["category"]>("all");
  const [adding, setAdding] = useState(qp("new") === "1" && can(role, "people.manage"));
  const today = todayISO();

  const list = items.filter((a) => cat === "all" || a.category === cat).sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date));
  const celebrations = useMemo(() => {
    const y = new Date().getFullYear();
    return people
      .filter((p) => p.status === "Active")
      .flatMap((p) => {
        const out: { p: typeof p; kind: "Birthday" | "Work anniversary"; days: number; years?: number }[] = [];
        const b = new Date(p.dob);
        const nb = new Date(y, b.getMonth(), b.getDate());
        const db = daysBetween(today, nb);
        if (db >= 0 && db <= 30) out.push({ p, kind: "Birthday", days: db });
        const j = new Date(p.joiningDate);
        const nj = new Date(y, j.getMonth(), j.getDate());
        const dj = daysBetween(today, nj);
        const years = y - j.getFullYear();
        if (years >= 1 && dj >= 0 && dj <= 30) out.push({ p, kind: "Work anniversary", days: dj, years });
        return out;
      })
      .sort((a, b) => a.days - b.days);
  }, [people, today]);

  return (
    <div>
      <PageHeader eyebrow="Module 12 · Notice Board" title="Announcements" subtitle="Company news, policies, events — plus automatic birthday & work-anniversary wishes." actions={can(role, "people.manage") && <Button icon={Plus} onClick={() => setAdding(true)}>New announcement</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div>
          <ChipTabs value={cat} onChange={setCat} className="mb-4" options={[{ value: "all", label: "All" }, { value: "News", label: "News" }, { value: "Policy", label: "Policies" }, { value: "Event", label: "Events" }, { value: "Celebration", label: "Celebrations" }]} />
          <div className="space-y-3">
            {list.map((a) => {
              const author = people.find((p) => p.id === a.author);
              return (
                <Card key={a.id} className={cn("p-4 sm:p-5", a.pinned && "border-primary/40 ring-1 ring-primary/20")}>
                  <div className="flex items-start gap-3">
                    {author && <Avatar person={author} size={40} />}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={CAT_TONE[a.category]}>{a.category}</Badge>
                        {a.pinned && <Badge tone="primary"><Pin className="h-3 w-3" /> Pinned</Badge>}
                        <span className="text-xs text-muted">{fullName(author)} · {fmtDate(a.date)}</span>
                      </div>
                      <h2 className="mt-2 text-base font-semibold sm:text-lg">{a.title}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-fg-2">{a.body}</p>
                    </div>
                    {can(role, "people.manage") && (
                      <button onClick={() => togglePin(a.id)} aria-label={a.pinned ? "Unpin" : "Pin"} className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-surface-2", a.pinned ? "text-primary" : "text-muted")}><Pin className="h-4 w-4" /></button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
        <Card className="h-fit">
          <CardHeader title="Celebrations" subtitle="Next 30 days" icon={PartyPopper} />
          <ul className="divide-y divide-line">
            {celebrations.slice(0, 10).map(({ p, kind, days, years }) => (
              <li key={p.id + kind} className="flex items-center gap-3 px-4 py-3">
                <Avatar person={p} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{fullName(p)}</p>
                  <p className="flex items-center gap-1 text-xs text-muted">{kind === "Birthday" ? <Cake className="h-3 w-3" /> : <PartyPopper className="h-3 w-3" />}{kind === "Birthday" ? "Birthday" : `${years} year${years! > 1 ? "s" : ""} at work`}</p>
                </div>
                {days === 0 ? <Button size="sm" variant="soft" onClick={() => toast(`Wishes sent to ${p.firstName}!`)}>Wish</Button> : <Badge>in {days}d</Badge>}
              </li>
            ))}
            {celebrations.length === 0 && <li className="p-5 text-sm text-muted">No celebrations this month.</li>}
          </ul>
        </Card>
      </div>
      {adding && <NewAnnouncement onClose={() => setAdding(false)} />}
    </div>
  );
}

function NewAnnouncement({ onClose }: { onClose: () => void }) {
  const add = useHR((s) => s.addAnnouncement);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("News");
  const [pinned, setPinned] = useState(false);
  return (
    <Modal open onClose={onClose} title="New announcement" footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button icon={Megaphone} disabled={!title.trim() || !body.trim()} onClick={() => { add({ title: title.trim(), body: body.trim(), category, pinned }); onClose(); }}>Publish</Button></>}>
      <div className="grid gap-4">
        <Field label="Title" required>{(id) => <input id={id} className="input" value={title} onChange={(e) => setTitle(e.target.value)} />}</Field>
        <Field label="Category">{(id) => <select id={id} className="input" value={category} onChange={(e) => setCategory(e.target.value as Announcement["category"])}>{(["News", "Policy", "Event", "Celebration"] as const).map((c) => <option key={c}>{c}</option>)}</select>}</Field>
        <Field label="Message" required>{(id) => <textarea id={id} rows={5} className="input" value={body} onChange={(e) => setBody(e.target.value)} />}</Field>
        <label className="flex h-10 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={pinned} onChange={(e) => setPinned(e.target.checked)} /> Pin to top</label>
      </div>
    </Modal>
  );
}
