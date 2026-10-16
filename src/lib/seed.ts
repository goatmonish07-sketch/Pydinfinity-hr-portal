import type {
  Announcement,
  Asset,
  AttendanceRecord,
  AuditEntry,
  Candidate,
  DocStatus,
  Goal,
  HRDocument,
  Invoice,
  Job,
  Leave,
  OnboardingTask,
  Offboarding,
  Person,
  PersonType,
  Settings,
} from "./types";
import { addDays, formatPersonCode, REQUIRED_DOCS, todayISO } from "./utils";

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  companyName: "Pydinfinity Solutions",
  companyCode: "PYD",
  branches: ["Bengaluru HQ", "Chennai", "Hyderabad", "Remote"],
  departments: ["Engineering", "Design", "Marketing", "Sales", "Finance", "Human Resources", "Operations"],
  leaveQuota: { CL: 12, SL: 8, EL: 15, LOP: 0 },
};

const FIRST_M = ["Arjun", "Rahul", "Karthik", "Vikram", "Aditya", "Rohan", "Siddharth", "Nikhil", "Pranav", "Harish", "Manoj", "Deepak", "Suresh", "Aravind", "Varun"];
const FIRST_F = ["Priya", "Ananya", "Divya", "Sneha", "Kavya", "Meera", "Nandini", "Lakshmi", "Pooja", "Aishwarya", "Ritika", "Shreya", "Ishita", "Swathi", "Neha"];
const LAST = ["Sharma", "Iyer", "Reddy", "Nair", "Menon", "Kumar", "Rao", "Gupta", "Krishnan", "Pillai", "Verma", "Joshi", "Subramanian", "Bhat", "Chopra", "Das"];
const BLOOD = ["A+", "B+", "O+", "AB+", "A-", "O-", "B-"];
const COLLEGES = ["IIT Madras", "NIT Trichy", "Anna University", "PSG Tech", "BITS Pilani", "VIT Vellore", "Christ University"];
const SKILLS = ["React", "Node.js", "Figma", "SEO", "Copywriting", "Flutter", "Python", "Video Editing", "Branding", "AWS"];

const DESIGNATIONS: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Software Engineer", "Tech Lead", "QA Engineer", "DevOps Engineer"],
  Design: ["UI/UX Designer", "Product Designer", "Visual Designer"],
  Marketing: ["Marketing Executive", "Content Strategist", "Performance Marketer"],
  Sales: ["Sales Executive", "Account Manager", "Business Development Lead"],
  Finance: ["Accountant", "Finance Analyst"],
  "Human Resources": ["HR Executive", "HR Business Partner"],
  Operations: ["Operations Executive", "Office Administrator"],
};

export interface SeedData {
  people: Person[];
  documents: HRDocument[];
  invoices: Invoice[];
  leaves: Leave[];
  attendance: AttendanceRecord[];
  assets: Asset[];
  tasks: OnboardingTask[];
  announcements: Announcement[];
  offboardings: Offboarding[];
  goals: Goal[];
  jobs: Job[];
  candidates: Candidate[];
  audit: AuditEntry[];
  sequences: Record<string, number>;
}

export function buildSeed(): SeedData {
  const r = rng(20261016);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const int = (a: number, b: number) => Math.floor(r() * (b - a + 1)) + a;
  const today = todayISO();
  const year = new Date().getFullYear();
  const s = DEFAULT_SETTINGS;
  const sequences: Record<string, number> = {};

  const issue = (type: PersonType, joinDate: string) => {
    const y = new Date(joinDate).getFullYear();
    const key = `${type}-${y}`;
    sequences[key] = (sequences[key] ?? 0) + 1;
    return formatPersonCode(s.companyCode, type, y, sequences[key]);
  };

  const people: Person[] = [];
  const mk = (i: number, type: PersonType, dept: string, designation: string, opts: Partial<Person> = {}): Person => {
    const female = r() > 0.5;
    const firstName = female ? pick(FIRST_F) : pick(FIRST_M);
    const lastName = pick(LAST);
    const joiningDate =
      opts.joiningDate ?? (type === "employee" ? addDays(today, -int(40, 1500)) : type === "intern" ? addDays(today, -int(20, 150)) : addDays(today, -int(30, 400)));
    const p: Person = {
      id: `p${i}`,
      previousCodes: [],
      type,
      firstName,
      lastName,
      email: `${firstName}.${lastName}${i}@pydinfinity.com`.toLowerCase(),
      phone: `+91 9${int(100000000, 999999999)}`,
      gender: female ? "Female" : "Male",
      dob: addDays(today, -int(21 * 365, 45 * 365)),
      bloodGroup: pick(BLOOD),
      department: dept,
      designation,
      branch: pick(s.branches),
      joiningDate,
      status: "Active",
      hue: int(0, 359),
      address: `${int(1, 220)}, ${pick(["MG Road", "Anna Nagar", "Indiranagar", "Banjara Hills", "T Nagar", "Koramangala"])}, ${pick(["Bengaluru", "Chennai", "Hyderabad"])}`,
      emergencyContact: { name: `${pick(FIRST_F)} ${lastName}`, phone: `+91 9${int(100000000, 999999999)}` },
      aadhaarLast4: String(int(1000, 9999)),
      pan: `${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}${String.fromCharCode(65 + int(0, 25))}P${String.fromCharCode(65 + int(0, 25))}${int(1000, 9999)}${String.fromCharCode(65 + int(0, 25))}`,
      bank: { name: pick(["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank"]), accountLast4: String(int(1000, 9999)), ifsc: `${pick(["HDFC", "ICIC", "SBIN", "UTIB", "KKBK"])}0${int(100000, 999999)}` },
      timeline: [],
      ...opts,
    };
    if (type === "employee") p.ctc = opts.ctc ?? int(4, 28) * 100000;
    p.timeline.push({ id: `t${i}a`, date: p.joiningDate, title: `Joined as ${designation}`, detail: `${dept} · ${p.branch}`, kind: "join" });
    if (p.status !== "Pending Approval") {
      p.code = issue(type, p.joiningDate);
      p.timeline.push({ id: `t${i}b`, date: p.joiningDate, title: `ID issued: ${p.code}`, kind: "id" });
    }
    people.push(p);
    return p;
  };

  // Leadership & managers
  const ceo = mk(1, "employee", "Operations", "Founder & CEO", { joiningDate: addDays(today, -2100), ctc: 4_800_000 });
  // The Super Admin demo user is the portal owner
  Object.assign(ceo, { firstName: "Monish", lastName: "Kumar", email: "monish.kumar@pydinfinity.com", gender: "Other" as const });
  const hrHead = mk(2, "employee", "Human Resources", "Head of People", { joiningDate: addDays(today, -1800), managerId: ceo.id, ctc: 2_200_000 });
  const engMgr = mk(3, "employee", "Engineering", "Engineering Manager", { joiningDate: addDays(today, -1600), managerId: ceo.id, ctc: 3_000_000 });
  const designLead = mk(4, "employee", "Design", "Design Lead", { joiningDate: addDays(today, -1300), managerId: ceo.id, ctc: 2_000_000 });
  const mktLead = mk(5, "employee", "Marketing", "Marketing Manager", { joiningDate: addDays(today, -1200), managerId: ceo.id, ctc: 1_800_000 });
  const salesLead = mk(6, "employee", "Sales", "Sales Manager", { joiningDate: addDays(today, -1000), managerId: ceo.id, ctc: 1_900_000 });
  const leads: Record<string, Person> = {
    Engineering: engMgr,
    Design: designLead,
    Marketing: mktLead,
    Sales: salesLead,
    Finance: ceo,
    "Human Resources": hrHead,
    Operations: ceo,
  };

  const deptPlan = ["Engineering", "Engineering", "Engineering", "Engineering", "Engineering", "Engineering", "Engineering", "Design", "Design", "Marketing", "Marketing", "Sales", "Sales", "Sales", "Finance", "Finance", "Human Resources", "Operations", "Operations", "Engineering"];
  let i = 7;
  for (const dept of deptPlan) {
    mk(i, "employee", dept, pick(DESIGNATIONS[dept]), { managerId: leads[dept].id });
    i++;
  }
  // statuses
  people[9].status = "Notice Period";
  people[14].status = "On Hold";
  people[21].status = "Exited";
  people[21].timeline.push({ id: "tx", date: addDays(today, -12), title: "Exited the company", kind: "exit" });
  // A new joiner awaiting approval (no ID yet)
  mk(i++, "employee", "Engineering", "Software Engineer", { status: "Pending Approval", joiningDate: addDays(today, 6), managerId: engMgr.id });
  mk(i++, "employee", "Marketing", "Content Strategist", { status: "Pending Approval", joiningDate: addDays(today, 3), managerId: mktLead.id });

  // Interns
  const internDepts = ["Engineering", "Engineering", "Design", "Marketing", "Engineering", "Sales", "Human Resources"];
  internDepts.forEach((dept, k) => {
    const start = addDays(today, -int(30, 160));
    const end = k < 2 ? addDays(today, int(3, 12)) : addDays(start, int(120, 200));
    const p = mk(i++, "intern", dept, `${dept === "Human Resources" ? "HR" : dept} Intern`, { joiningDate: start, managerId: leads[dept].id });
    p.intern = {
      college: pick(COLLEGES),
      course: pick(["B.Tech CSE", "B.Des", "MBA", "BBA", "B.Sc Visual Comm", "M.Tech"]),
      startDate: start,
      endDate: end,
      mentorId: leads[dept].id,
      project: pick(["HR Portal revamp", "Brand refresh", "Lead-gen campaign", "Mobile app QA", "Sales CRM cleanup"]),
      stipend: int(8, 25) * 1000,
      feedback: Array.from({ length: int(1, 4) }, (_, f) => ({
        id: `fb${i}${f}`,
        date: addDays(start, 30 * (f + 1)),
        rating: int(3, 5),
        note: pick(["Quick learner, takes ownership.", "Good attention to detail.", "Needs to communicate blockers earlier.", "Excellent output this month.", "Strong collaboration with the team."]),
        by: leads[dept].id,
      })),
    };
  });

  // Freelancers
  ["Design", "Engineering", "Marketing", "Marketing", "Engineering"].forEach((dept, k) => {
    const start = addDays(today, -int(60, 300));
    const p = mk(i++, "freelancer", dept, pick(["Freelance Developer", "Freelance Designer", "Content Writer", "Video Editor", "Consultant"]), { joiningDate: start, managerId: leads[dept].id });
    p.freelancer = {
      contractStart: start,
      contractEnd: k < 2 ? addDays(today, int(5, 25)) : addDays(today, int(60, 200)),
      rateType: r() > 0.5 ? "Hourly" : "Per Project",
      rate: r() > 0.5 ? int(8, 25) * 100 : int(3, 12) * 10000,
      skills: [pick(SKILLS), pick(SKILLS), pick(SKILLS)].filter((v, x, a) => a.indexOf(v) === x),
      projects: [pick(["Website redesign", "Social media Q4", "Payment gateway", "Explainer video", "Brand guidelines"])],
      gstin: r() > 0.4 ? `29${p.pan}1Z${int(1, 9)}` : undefined,
    };
  });

  // Documents
  const documents: HRDocument[] = [];
  let d = 0;
  for (const p of people) {
    const tenure = (Date.now() - new Date(p.joiningDate).getTime()) / 86_400_000;
    for (const kind of REQUIRED_DOCS[p.type]) {
      let status: DocStatus;
      const roll = r();
      if (p.status === "Pending Approval") status = roll > 0.6 ? "Uploaded" : "Pending";
      else if (tenure > 120) status = roll > 0.92 ? "Uploaded" : "Verified";
      else status = roll > 0.7 ? "Verified" : roll > 0.4 ? "Uploaded" : roll > 0.2 ? "Pending" : "Rejected";
      const doc: HRDocument = {
        id: `d${d++}`,
        personId: p.id,
        kind,
        status,
        consent: status !== "Pending",
      };
      if (status !== "Pending") {
        doc.fileName = `${kind.split(" ")[0].toLowerCase()}_${p.firstName.toLowerCase()}.pdf`;
        doc.uploadedAt = addDays(p.joiningDate, int(0, 10));
      }
      if (status === "Verified") {
        doc.verifiedBy = hrHead.id;
        doc.verifiedAt = addDays(doc.uploadedAt!, int(1, 4));
      }
      if (status === "Rejected") doc.rejectReason = pick(["Image is blurry", "Name mismatch with PAN", "Document expired", "Incomplete pages"]);
      if (kind === "Contract" && p.freelancer) doc.expiry = p.freelancer.contractEnd;
      documents.push(doc);
    }
    if (r() > 0.7 && p.type === "employee") {
      documents.push({
        id: `d${d++}`,
        personId: p.id,
        kind: "Passport",
        status: "Verified",
        fileName: `passport_${p.firstName.toLowerCase()}.pdf`,
        uploadedAt: addDays(p.joiningDate, 2),
        verifiedBy: hrHead.id,
        verifiedAt: addDays(p.joiningDate, 4),
        expiry: addDays(today, pick([12, 24, 90, 400, 900])),
        consent: true,
      });
    }
  }

  // Invoices
  const invoices: Invoice[] = [];
  people
    .filter((p) => p.type === "freelancer")
    .forEach((p, k) => {
      for (let n = 0; n < 4; n++) {
        const status = n === 0 ? (k % 2 ? "Submitted" : "Approved") : n === 1 && k % 3 === 0 ? "Approved" : "Paid";
        invoices.push({
          id: `inv${k}${n}`,
          personId: p.id,
          number: `INV-${p.firstName.slice(0, 3).toUpperCase()}-${String(40 - n).padStart(3, "0")}`,
          date: addDays(today, -n * 30 - int(0, 8)),
          description: `${p.freelancer!.projects[0]} — ${["milestone", "monthly retainer", "deliverables"][n % 3]}`,
          amount: int(15, 120) * 1000,
          gstRate: p.freelancer!.gstin ? 18 : 0,
          tdsRate: 10,
          status,
        });
      }
    });

  // Leaves
  const active = people.filter((p) => p.status === "Active" && p.type !== "freelancer");
  const leaves: Leave[] = [];
  for (let n = 0; n < 22; n++) {
    const p = pick(active);
    const from = addDays(today, int(-60, 25));
    const days = int(1, 4);
    const status = new Date(from) > new Date() && n % 3 === 0 ? "Pending" : n % 7 === 0 ? "Rejected" : "Approved";
    leaves.push({
      id: `lv${n}`,
      personId: p.id,
      type: pick(["CL", "SL", "EL", "CL", "SL"]) as Leave["type"],
      from,
      to: addDays(from, days - 1),
      days,
      reason: pick(["Family function", "Not feeling well", "Personal work", "Vacation", "Medical appointment", "Festival travel"]),
      status,
      appliedAt: addDays(from, -int(1, 10)),
    });
  }

  // Attendance: last 14 days
  const attendance: AttendanceRecord[] = [];
  for (let back = 13; back >= 0; back--) {
    const date = addDays(today, -back);
    const dow = new Date(date).getDay();
    if (dow === 0) continue;
    for (const p of active) {
      if (back === 0 && r() > 0.82) continue;
      if (r() > 0.93) continue;
      const inH = 9 + (r() > 0.75 ? 1 : 0);
      const inM = int(0, 50);
      const checkIn = new Date(`${date}T${String(inH).padStart(2, "0")}:${String(inM).padStart(2, "0")}:00`).toISOString();
      const checkOut = back === 0 ? undefined : new Date(new Date(checkIn).getTime() + (8 + r() * 1.5) * 3_600_000).toISOString();
      attendance.push({ id: `at${back}${p.id}`, personId: p.id, date, checkIn, checkOut, mode: p.branch === "Remote" ? "Remote" : r() > 0.9 ? "Field" : "Office" });
    }
  }

  // Assets
  const assets: Asset[] = [];
  let a = 1;
  for (const p of people.filter((x) => x.type === "employee" && x.status !== "Pending Approval")) {
    assets.push({ id: `as${a}`, tag: `AST-LAP-${String(a).padStart(3, "0")}`, kind: "Laptop", model: pick(["MacBook Air M3", "Dell Latitude 5440", "Lenovo ThinkPad E14", "HP EliteBook 840"]), assignedTo: p.status === "Exited" ? undefined : p.id, issuedOn: p.joiningDate, status: p.status === "Exited" ? "In Stock" : "Issued" });
    a++;
    assets.push({ id: `as${a}`, tag: `AST-IDC-${String(a).padStart(3, "0")}`, kind: "ID Card", model: "PVC ID card + lanyard", assignedTo: p.status === "Exited" ? undefined : p.id, issuedOn: p.joiningDate, status: p.status === "Exited" ? "In Stock" : "Issued" });
    a++;
    if (r() > 0.6) {
      assets.push({ id: `as${a}`, tag: `AST-SIM-${String(a).padStart(3, "0")}`, kind: "SIM", model: pick(["Jio Postpaid", "Airtel Postpaid"]), assignedTo: p.id, issuedOn: p.joiningDate, status: "Issued" });
      a++;
    }
  }
  for (let n = 0; n < 6; n++) {
    assets.push({ id: `as${a}`, tag: `AST-${["LAP", "MON", "PHN"][n % 3]}-${String(a).padStart(3, "0")}`, kind: (["Laptop", "Monitor", "Phone"] as const)[n % 3], model: pick(["MacBook Air M3", "Dell 27\" Monitor", "iPhone 15", "Samsung Galaxy A55"]), status: n === 5 ? "Lost" : "In Stock" });
    a++;
  }

  // Onboarding tasks for recent & pending joiners
  const tasks: OnboardingTask[] = [];
  const recent = people.filter((p) => p.status === "Pending Approval" || (Date.now() - new Date(p.joiningDate).getTime()) / 86_400_000 < 45);
  const TEMPLATE: [string, OnboardingTask["owner"], number][] = [
    ["Collect KYC documents", "HR", -3],
    ["Sign offer letter & NDA", "HR", -2],
    ["Create company email ID", "IT", -1],
    ["Issue laptop", "IT", 0],
    ["Grant tool access (Slack, Git, Drive)", "IT", 0],
    ["Issue ID card", "HR", 1],
    ["Induction session", "HR", 1],
    ["Team intro & 30-day plan", "Manager", 3],
  ];
  let t = 0;
  for (const p of recent) {
    const age = (Date.now() - new Date(p.joiningDate).getTime()) / 86_400_000;
    TEMPLATE.forEach(([title, owner, off], k) => {
      tasks.push({ id: `tk${t++}`, personId: p.id, title, owner, due: addDays(p.joiningDate, off), done: p.status === "Pending Approval" ? k < 2 && r() > 0.5 : age > 20 ? true : r() > 0.4 });
    });
  }

  const announcements: Announcement[] = [
    { id: "an1", title: "Diwali celebrations on the 30th", body: "Join us at Bengaluru HQ for rangoli, lunch and the annual awards. Remote folks — sweets boxes are on the way!", date: addDays(today, -1), category: "Event", pinned: true, author: hrHead.id },
    { id: "an2", title: "Updated Leave Policy FY 26-27", body: "Earned leave carry-forward is now capped at 30 days. Unused casual leave lapses at year end. Read the full policy in the HR handbook.", date: addDays(today, -5), category: "Policy", pinned: false, author: hrHead.id },
    { id: "an3", title: "We closed our Series A!", body: "Thanks to every one of you. More details in Friday's all-hands.", date: addDays(today, -9), category: "News", pinned: false, author: ceo.id },
    { id: "an4", title: "Hybrid work: Tue–Thu in office", body: "Starting next month, core in-office days are Tuesday to Thursday for Bengaluru and Chennai teams.", date: addDays(today, -15), category: "Policy", pinned: false, author: hrHead.id },
  ];

  const leaver = people[9];
  const offboardings: Offboarding[] = [
    {
      id: "ob1",
      personId: leaver.id,
      resignedOn: addDays(today, -20),
      lastDay: addDays(today, 40),
      reason: "Higher studies",
      status: "Approved",
      checklist: [
        { label: "Resignation accepted", done: true },
        { label: "Knowledge transfer plan", done: true },
        { label: "Exit interview", done: false },
        { label: "Asset return", done: false },
        { label: "Access removal (email, Git, Slack)", done: false },
        { label: "Full & final settlement", done: false },
        { label: "Relieving letter issued", done: false },
      ],
    },
  ];

  const goals: Goal[] = [];
  people
    .filter((p) => p.type === "employee" && p.status === "Active")
    .slice(0, 18)
    .forEach((p, k) => {
      goals.push({ id: `g${k}a`, personId: p.id, title: pick(["Ship Q4 roadmap items", "Improve NPS by 5 pts", "Close ₹50L new business", "Reduce bug backlog 30%", "Launch brand refresh", "Automate monthly close"]), quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${year}`, progress: int(10, 100), selfRating: r() > 0.5 ? int(3, 5) : undefined, managerRating: r() > 0.6 ? int(3, 5) : undefined });
      if (r() > 0.5) goals.push({ id: `g${k}b`, personId: p.id, title: pick(["Mentor one intern", "Complete AWS certification", "Document team playbooks", "Present at a meetup"]), quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${year}`, progress: int(0, 80) });
    });

  const jobs: Job[] = [
    { id: "j1", title: "Senior React Developer", department: "Engineering", location: "Bengaluru HQ", type: "employee", openings: 2, status: "Open" },
    { id: "j2", title: "Product Design Intern", department: "Design", location: "Remote", type: "intern", openings: 1, status: "Open" },
    { id: "j3", title: "Performance Marketer", department: "Marketing", location: "Chennai", type: "employee", openings: 1, status: "Open" },
    { id: "j4", title: "Freelance Motion Designer", department: "Design", location: "Remote", type: "freelancer", openings: 1, status: "Open" },
  ];
  const stages: Candidate["stage"][] = ["Applied", "Applied", "Screening", "Screening", "Interview", "Interview", "Offer"];
  const candidates: Candidate[] = Array.from({ length: 16 }, (_, k) => {
    const female = r() > 0.5;
    const name = `${female ? pick(FIRST_F) : pick(FIRST_M)} ${pick(LAST)}`;
    const stage = pick(stages);
    return { id: `c${k}`, jobId: jobs[k % jobs.length].id, name, email: `${name.split(" ")[0].toLowerCase()}${k}@mail.com`, stage, rating: int(2, 5), source: pick(["LinkedIn", "Referral", "Naukri", "Careers page", "AngelList"]), interviewAt: stage === "Interview" ? new Date(Date.now() + int(1, 6) * 86_400_000).toISOString() : undefined };
  });

  const audit: AuditEntry[] = [
    { id: "au1", at: new Date(Date.now() - 3_600_000).toISOString(), actor: hrHead.id, action: "verify", target: `PAN of ${people[12].firstName} ${people[12].lastName}` },
    { id: "au2", at: new Date(Date.now() - 7_200_000).toISOString(), actor: hrHead.id, action: "download", target: `Aadhaar of ${people[8].firstName} ${people[8].lastName}` },
    { id: "au3", at: new Date(Date.now() - 86_400_000).toISOString(), actor: ceo.id, action: "view", target: `Profile of ${people[3].firstName} ${people[3].lastName}` },
    { id: "au4", at: new Date(Date.now() - 2 * 86_400_000).toISOString(), actor: hrHead.id, action: "create", target: `Person ${people[people.length - 1].firstName} ${people[people.length - 1].lastName}` },
  ];

  return { people, documents, invoices, leaves, attendance, assets, tasks, announcements, offboardings, goals, jobs, candidates, audit, sequences };
}
