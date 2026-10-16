"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { buildSeed, DEFAULT_SETTINGS, type SeedData } from "./seed";
import type {
  Announcement,
  Asset,
  AuditEntry,
  Candidate,
  DocStatus,
  Goal,
  HRDocument,
  Invoice,
  Leave,
  Person,
  PersonType,
  Role,
  Settings,
  TimelineEntry,
} from "./types";
import { addDays, formatPersonCode, fullName, REQUIRED_DOCS, todayISO, uid } from "./utils";

export const ROLE_USER: Record<Role, string> = {
  "Super Admin": "p1",
  HR: "p2",
  Manager: "p3",
  "Self-service": "p8",
};

export type Permission =
  | "people.manage"
  | "people.viewAll"
  | "kyc.verify"
  | "ids.issue"
  | "letters.generate"
  | "leave.approve"
  | "intern.feedback"
  | "settings"
  | "audit"
  | "payroll"
  | "recruit";

const PERMS: Record<Role, Permission[]> = {
  "Super Admin": ["people.manage", "people.viewAll", "kyc.verify", "ids.issue", "letters.generate", "leave.approve", "intern.feedback", "settings", "audit", "payroll", "recruit"],
  HR: ["people.manage", "people.viewAll", "kyc.verify", "ids.issue", "letters.generate", "leave.approve", "intern.feedback", "payroll", "recruit"],
  Manager: ["leave.approve", "intern.feedback", "recruit"],
  "Self-service": [],
};
export const can = (role: Role, p: Permission) => PERMS[role].includes(p);

export interface Toast {
  id: string;
  title: string;
  tone?: "success" | "error" | "info";
}

interface HRState extends SeedData {
  settings: Settings;
  role: Role;
  branch: string; // "All branches" or a branch name — sidebar switcher
  readAlerts: string[];
  letters: { id: string; personId: string; template: string; date: string; signed: boolean }[];
  toasts: Toast[];

  setRole: (r: Role) => void;
  setBranch: (b: string) => void;
  markAlertsRead: (ids: string[]) => void;
  toast: (title: string, tone?: Toast["tone"]) => void;
  dismissToast: (id: string) => void;
  log: (action: AuditEntry["action"], target: string) => void;
  resetDemo: () => void;

  addPerson: (p: Omit<Person, "id" | "timeline" | "previousCodes" | "status" | "hue" | "code">, autoApprove?: boolean) => string;
  updatePerson: (id: string, patch: Partial<Person>, note?: string) => void;
  approvePerson: (id: string) => void;
  convertIntern: (id: string, designation: string, ctc: number) => void;
  importPeople: (rows: Omit<Person, "id" | "timeline" | "previousCodes" | "status" | "hue" | "code">[]) => number;

  setDocStatus: (id: string, status: DocStatus, reason?: string) => void;
  uploadDoc: (id: string, fileName: string, expiry?: string) => void;

  addInternFeedback: (personId: string, rating: number, note: string) => void;

  addInvoice: (inv: Omit<Invoice, "id" | "status">) => void;
  setInvoiceStatus: (id: string, status: Invoice["status"]) => void;

  applyLeave: (l: Omit<Leave, "id" | "status" | "appliedAt">) => void;
  setLeaveStatus: (id: string, status: Leave["status"]) => void;
  checkIn: (personId: string, mode: "Office" | "Remote" | "Field") => void;
  checkOut: (personId: string) => void;

  toggleTask: (id: string) => void;

  addAsset: (a: Omit<Asset, "id">) => void;
  assignAsset: (id: string, personId?: string) => void;

  addAnnouncement: (a: Omit<Announcement, "id" | "date" | "author">) => void;
  togglePin: (id: string) => void;

  addLetter: (personId: string, template: string, signed: boolean) => void;

  startOffboarding: (personId: string, lastDay: string, reason: string) => void;
  toggleOffboardingItem: (id: string, idx: number) => void;
  setExitInterview: (id: string, text: string) => void;
  completeOffboarding: (id: string) => void;

  updateGoal: (id: string, patch: Partial<Goal>) => void;
  addGoal: (g: Omit<Goal, "id">) => void;

  moveCandidate: (id: string, stage: Candidate["stage"]) => void;
  addCandidate: (c: Omit<Candidate, "id">) => void;
  hireCandidate: (id: string) => string | undefined;

  updateSettings: (s: Partial<Settings>) => void;
}

const fresh = () => ({
  ...buildSeed(),
  settings: DEFAULT_SETTINGS,
  role: "Super Admin" as Role,
  branch: "All branches",
  readAlerts: [] as string[],
  letters: [],
  toasts: [],
});

export const useHR = create<HRState>()(
  persist(
    (set, get) => {
      const tl = (title: string, kind: TimelineEntry["kind"], detail?: string): TimelineEntry => ({ id: uid("t"), date: new Date().toISOString(), title, kind, detail });
      const actor = () => ROLE_USER[get().role];
      const nameOf = (id: string) => fullName(get().people.find((p) => p.id === id));

      /** Atomic per-type-per-year counter; IDs are never reused. */
      const nextCode = (type: PersonType) => {
        const y = new Date().getFullYear();
        const key = `${type}-${y}`;
        const seq = (get().sequences[key] ?? 0) + 1;
        set((s) => ({ sequences: { ...s.sequences, [key]: seq } }));
        return formatPersonCode(get().settings.companyCode, type, y, seq);
      };

      const createDocs = (personId: string, type: PersonType): HRDocument[] =>
        REQUIRED_DOCS[type].map((kind) => ({ id: uid("d"), personId, kind, status: "Pending" as DocStatus }));

      return {
        ...fresh(),

        setRole: (role) => set({ role }),
        setBranch: (branch) => set({ branch }),
        markAlertsRead: (ids) => set((s) => ({ readAlerts: [...new Set([...s.readAlerts, ...ids])].slice(-400) })),
        toast: (title, tone = "success") => {
          const id = uid("toast");
          set((s) => ({ toasts: [...s.toasts, { id, title, tone }] }));
          setTimeout(() => get().dismissToast(id), 3800);
        },
        dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
        log: (action, target) => set((s) => ({ audit: [{ id: uid("au"), at: new Date().toISOString(), actor: actor(), action, target }, ...s.audit].slice(0, 500) })),
        resetDemo: () => set({ ...fresh(), role: get().role }),

        addPerson: (data, autoApprove = false) => {
          const id = uid("p");
          const person: Person = {
            ...data,
            id,
            previousCodes: [],
            status: "Pending Approval",
            hue: Math.floor(Math.random() * 360),
            timeline: [tl(`Profile created as ${data.designation}`, "join", `${data.department} · ${data.branch}`)],
          };
          set((s) => ({ people: [...s.people, person], documents: [...s.documents, ...createDocs(id, data.type)] }));
          get().log("create", `Person ${fullName(person)}`);
          if (autoApprove) get().approvePerson(id);
          return id;
        },

        updatePerson: (id, patch, note) => {
          set((s) => ({
            people: s.people.map((p) => {
              if (p.id !== id) return p;
              // ID is locked once issued
              const { code: _c, previousCodes: _pc, ...safe } = patch;
              const changes: TimelineEntry[] = [];
              if (patch.designation && patch.designation !== p.designation) changes.push(tl(`Role changed to ${patch.designation}`, "role", `was ${p.designation}`));
              if (patch.status && patch.status !== p.status) changes.push(tl(`Status: ${patch.status}`, "status"));
              if (note) changes.push(tl(note, "note"));
              return { ...p, ...safe, timeline: [...p.timeline, ...changes] };
            }),
          }));
          get().log("edit", `Profile of ${nameOf(id)}`);
        },

        approvePerson: (id) => {
          const p = get().people.find((x) => x.id === id);
          if (!p || p.code) return;
          const code = nextCode(p.type);
          set((s) => ({
            people: s.people.map((x) => (x.id === id ? { ...x, code, status: "Active", timeline: [...x.timeline, tl(`Approved · ID issued ${code}`, "id")] } : x)),
          }));
          get().log("approve", `${fullName(p)} → ${code}`);
          get().toast(`ID ${code} issued to ${p.firstName}`);
        },

        convertIntern: (id, designation, ctc) => {
          const p = get().people.find((x) => x.id === id);
          if (!p || p.type !== "intern") return;
          const code = nextCode("employee");
          set((s) => ({
            people: s.people.map((x) =>
              x.id === id
                ? {
                    ...x,
                    type: "employee",
                    designation,
                    ctc,
                    code,
                    previousCodes: x.code ? [...x.previousCodes, x.code] : x.previousCodes,
                    timeline: [...x.timeline, tl(`Converted to Employee · ${code}`, "convert", `Previous intern ID ${x.code ?? "—"} kept in history`)],
                  }
                : x
            ),
          }));
          // add employee-only documents
          const have = new Set(get().documents.filter((d) => d.personId === id).map((d) => d.kind));
          const extra = REQUIRED_DOCS.employee.filter((k) => !have.has(k)).map((kind) => ({ id: uid("d"), personId: id, kind, status: "Pending" as DocStatus }));
          set((s) => ({ documents: [...s.documents, ...extra] }));
          get().log("edit", `Converted ${fullName(p)} to employee`);
          get().toast(`${p.firstName} is now an employee · ${code}`);
        },

        importPeople: (rows) => {
          rows.forEach((r) => get().addPerson(r, true));
          get().log("import", `${rows.length} people from spreadsheet`);
          return rows.length;
        },

        setDocStatus: (id, status, reason) => {
          const doc = get().documents.find((d) => d.id === id);
          set((s) => ({
            documents: s.documents.map((d) =>
              d.id === id ? { ...d, status, rejectReason: status === "Rejected" ? reason : undefined, verifiedBy: status === "Verified" ? actor() : d.verifiedBy, verifiedAt: status === "Verified" ? todayISO() : d.verifiedAt } : d
            ),
            people: doc
              ? s.people.map((p) => (p.id === doc.personId ? { ...p, timeline: [...p.timeline, tl(`${doc.kind} ${status.toLowerCase()}`, "doc", reason)] } : p))
              : s.people,
          }));
          if (doc) get().log("verify", `${doc.kind} of ${nameOf(doc.personId)} → ${status}`);
        },

        uploadDoc: (id, fileName, expiry) => {
          const doc = get().documents.find((d) => d.id === id);
          set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, status: "Uploaded", fileName, uploadedAt: todayISO(), expiry: expiry || d.expiry, consent: true, rejectReason: undefined } : d)) }));
          if (doc) get().log("create", `Uploaded ${doc.kind} for ${nameOf(doc.personId)}`);
        },

        addInternFeedback: (personId, rating, note) => {
          set((s) => ({
            people: s.people.map((p) =>
              p.id === personId && p.intern ? { ...p, intern: { ...p.intern, feedback: [...p.intern.feedback, { id: uid("fb"), date: todayISO(), rating, note, by: actor() }] } } : p
            ),
          }));
          get().toast("Feedback added");
        },

        addInvoice: (inv) => {
          set((s) => ({ invoices: [{ ...inv, id: uid("inv"), status: "Submitted" }, ...s.invoices] }));
          get().toast("Invoice submitted");
        },
        setInvoiceStatus: (id, status) => {
          set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, status } : i)) }));
          get().toast(`Invoice marked ${status}`);
        },

        applyLeave: (l) => {
          set((s) => ({ leaves: [{ ...l, id: uid("lv"), status: "Pending", appliedAt: todayISO() }, ...s.leaves] }));
          get().toast("Leave request submitted");
        },
        setLeaveStatus: (id, status) => {
          set((s) => ({ leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)) }));
          get().toast(`Leave ${status.toLowerCase()}`);
        },
        checkIn: (personId, mode) => {
          const date = todayISO();
          set((s) => ({ attendance: [...s.attendance.filter((a) => !(a.personId === personId && a.date === date)), { id: uid("at"), personId, date, checkIn: new Date().toISOString(), mode }] }));
          get().toast("Checked in — have a great day!");
        },
        checkOut: (personId) => {
          const date = todayISO();
          set((s) => ({ attendance: s.attendance.map((a) => (a.personId === personId && a.date === date ? { ...a, checkOut: new Date().toISOString() } : a)) }));
          get().toast("Checked out. See you tomorrow!");
        },

        toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),

        addAsset: (a) => {
          set((s) => ({ assets: [{ ...a, id: uid("as") }, ...s.assets] }));
          get().toast(`Asset ${a.tag} added`);
        },
        assignAsset: (id, personId) => {
          set((s) => ({ assets: s.assets.map((a) => (a.id === id ? { ...a, assignedTo: personId, issuedOn: personId ? todayISO() : undefined, status: personId ? "Issued" : "In Stock" } : a)) }));
          get().toast(personId ? `Asset issued to ${nameOf(personId)}` : "Asset returned to stock");
        },

        addAnnouncement: (a) => {
          set((s) => ({ announcements: [{ ...a, id: uid("an"), date: todayISO(), author: actor() }, ...s.announcements] }));
          get().toast("Announcement published");
        },
        togglePin: (id) => set((s) => ({ announcements: s.announcements.map((a) => (a.id === id ? { ...a, pinned: !a.pinned } : a)) })),

        addLetter: (personId, template, signed) => {
          set((s) => ({ letters: [{ id: uid("lt"), personId, template, date: todayISO(), signed }, ...s.letters] }));
          get().log("download", `${template} for ${nameOf(personId)}`);
        },

        startOffboarding: (personId, lastDay, reason) => {
          set((s) => ({
            offboardings: [
              {
                id: uid("ob"),
                personId,
                resignedOn: todayISO(),
                lastDay,
                reason,
                status: "Requested",
                checklist: ["Resignation accepted", "Knowledge transfer plan", "Exit interview", "Asset return", "Access removal (email, Git, Slack)", "Full & final settlement", "Relieving letter issued"].map((label) => ({ label, done: false })),
              },
              ...s.offboardings,
            ],
          }));
          get().updatePerson(personId, { status: "Notice Period" }, `Resignation submitted · last day ${lastDay}`);
          get().toast("Offboarding started");
        },
        toggleOffboardingItem: (id, idx) =>
          set((s) => ({
            offboardings: s.offboardings.map((o) =>
              o.id === id ? { ...o, status: o.status === "Requested" && idx === 0 ? "Approved" : o.status, checklist: o.checklist.map((c, k) => (k === idx ? { ...c, done: !c.done } : c)) } : o
            ),
          })),
        setExitInterview: (id, text) => set((s) => ({ offboardings: s.offboardings.map((o) => (o.id === id ? { ...o, exitInterview: text } : o)) })),
        completeOffboarding: (id) => {
          const o = get().offboardings.find((x) => x.id === id);
          if (!o) return;
          set((s) => ({
            offboardings: s.offboardings.map((x) => (x.id === id ? { ...x, status: "Completed", checklist: x.checklist.map((c) => ({ ...c, done: true })) } : x)),
            assets: s.assets.map((a) => (a.assignedTo === o.personId ? { ...a, assignedTo: undefined, status: "In Stock" } : a)),
          }));
          get().updatePerson(o.personId, { status: "Exited" });
          get().toast("Offboarding completed · assets returned to stock");
        },

        updateGoal: (id, patch) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
        addGoal: (g) => {
          set((s) => ({ goals: [...s.goals, { ...g, id: uid("g") }] }));
          get().toast("Goal added");
        },

        moveCandidate: (id, stage) => set((s) => ({ candidates: s.candidates.map((c) => (c.id === id ? { ...c, stage } : c)) })),
        addCandidate: (c) => {
          set((s) => ({ candidates: [...s.candidates, { ...c, id: uid("c") }] }));
          get().toast("Candidate added");
        },
        hireCandidate: (id) => {
          const c = get().candidates.find((x) => x.id === id);
          const job = c && get().jobs.find((j) => j.id === c.jobId);
          if (!c || !job) return;
          const [firstName, ...rest] = c.name.split(" ");
          const pid = get().addPerson({
            type: job.type,
            firstName,
            lastName: rest.join(" ") || "-",
            email: c.email,
            phone: "",
            gender: "Other",
            dob: addDays(todayISO(), -25 * 365),
            bloodGroup: "",
            department: job.department,
            designation: job.title,
            branch: job.location,
            joiningDate: addDays(todayISO(), 14),
            address: "",
            emergencyContact: { name: "", phone: "" },
            aadhaarLast4: "",
            pan: "",
            bank: { name: "", accountLast4: "", ifsc: "" },
            ctc: job.type === "employee" ? 1_200_000 : undefined,
            intern: job.type === "intern" ? { college: "", course: "", startDate: addDays(todayISO(), 14), endDate: addDays(todayISO(), 194), project: "", stipend: 15000, feedback: [] } : undefined,
            freelancer: job.type === "freelancer" ? { contractStart: addDays(todayISO(), 14), contractEnd: addDays(todayISO(), 194), rateType: "Per Project", rate: 50000, skills: [], projects: [] } : undefined,
          });
          set((s) => ({ candidates: s.candidates.map((x) => (x.id === id ? { ...x, stage: "Hired" } : x)) }));
          get().toast(`${c.name} hired — profile created, awaiting approval`);
          return pid;
        },

        updateSettings: (patch) => {
          set((s) => ({ settings: { ...s.settings, ...patch } }));
          get().toast("Settings saved");
        },
      };
    },
    {
      name: "pyd-hr-data",
      // localStorage holds ~5 MB; photos and resume files can fill it, so never let a failed write crash the app
      storage: createJSONStorage(() => ({
        getItem: (k) => localStorage.getItem(k),
        removeItem: (k) => localStorage.removeItem(k),
        setItem: (k, v) => {
          try {
            localStorage.setItem(k, v);
          } catch {
            setTimeout(() => useHR.getState().toast("Browser storage is full — remove a resume file or photo to save new changes", "error"));
          }
        },
      })),
      version: 4,
      migrate: () => fresh() as never,
      partialize: ({ toasts: _t, ...rest }) => rest,
    }
  )
);

/** Hook: the person record for the signed-in demo role */
export function useMe() {
  const role = useHR((s) => s.role);
  const me = useHR((s) => s.people.find((p) => p.id === ROLE_USER[role]));
  return { role, me: me! };
}
