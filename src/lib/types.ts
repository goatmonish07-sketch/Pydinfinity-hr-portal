export type PersonType = "employee" | "intern" | "freelancer";
export type PersonStatus = "Pending Approval" | "Active" | "Notice Period" | "On Hold" | "Exited";
export type Role = "Super Admin" | "HR" | "Manager" | "Self-service";

export interface TimelineEntry {
  id: string;
  date: string; // ISO
  title: string;
  detail?: string;
  kind: "join" | "id" | "role" | "doc" | "convert" | "status" | "note" | "exit";
}

export interface InternDetails {
  college: string;
  course: string;
  startDate: string;
  endDate: string;
  mentorId?: string;
  project: string;
  stipend: number;
  feedback: { id: string; date: string; rating: number; note: string; by: string }[];
}

export interface FreelancerDetails {
  contractStart: string;
  contractEnd: string;
  rateType: "Hourly" | "Per Project";
  rate: number;
  skills: string[];
  projects: string[];
  gstin?: string;
}

export interface Person {
  id: string;
  code?: string; // issued ID, e.g. BHV-EMP-26-0001 — locked once set
  previousCodes: string[];
  type: PersonType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  dob: string;
  bloodGroup: string;
  department: string;
  designation: string;
  managerId?: string;
  branch: string;
  joiningDate: string;
  status: PersonStatus;
  hue: number; // avatar gradient hue
  address: string;
  emergencyContact: { name: string; phone: string };
  aadhaarLast4: string;
  pan: string;
  bank: { name: string; accountLast4: string; ifsc: string };
  ctc?: number; // annual, employees
  intern?: InternDetails;
  freelancer?: FreelancerDetails;
  timeline: TimelineEntry[];
}

export type DocKind =
  | "Aadhaar"
  | "PAN"
  | "Bank / Cancelled Cheque"
  | "Address Proof"
  | "Photo"
  | "Education Certificate"
  | "Previous Relieving Letter"
  | "Signed Offer Letter"
  | "NDA"
  | "Passport"
  | "Contract"
  | "College ID";

export type DocStatus = "Pending" | "Uploaded" | "Verified" | "Rejected";

export interface HRDocument {
  id: string;
  personId: string;
  kind: DocKind;
  status: DocStatus;
  fileName?: string;
  uploadedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectReason?: string;
  expiry?: string;
  consent?: boolean;
}

export interface Invoice {
  id: string;
  personId: string;
  number: string;
  date: string;
  description: string;
  amount: number;
  gstRate: number; // %
  tdsRate: number; // %
  status: "Submitted" | "Approved" | "Paid";
}

export type LeaveType = "CL" | "SL" | "EL" | "LOP";
export interface Leave {
  id: string;
  personId: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: string;
}

export interface AttendanceRecord {
  id: string;
  personId: string;
  date: string; // yyyy-mm-dd
  checkIn?: string; // ISO
  checkOut?: string;
  mode: "Office" | "Remote" | "Field";
}

export interface Asset {
  id: string;
  tag: string;
  kind: "Laptop" | "Phone" | "SIM" | "ID Card" | "Access Card" | "Monitor";
  model: string;
  assignedTo?: string;
  issuedOn?: string;
  status: "In Stock" | "Issued" | "Lost";
}

export interface OnboardingTask {
  id: string;
  personId: string;
  title: string;
  owner: "HR" | "IT" | "Manager";
  due: string;
  done: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  category: "News" | "Policy" | "Event" | "Celebration";
  pinned: boolean;
  author: string;
}

export interface GeneratedLetter {
  id: string;
  personId: string;
  template: string;
  date: string;
  signed: boolean;
}

export interface Offboarding {
  id: string;
  personId: string;
  resignedOn: string;
  lastDay: string;
  reason: string;
  status: "Requested" | "Approved" | "Completed";
  checklist: { label: string; done: boolean }[];
  exitInterview?: string;
}

export interface Goal {
  id: string;
  personId: string;
  title: string;
  quarter: string;
  progress: number;
  selfRating?: number;
  managerRating?: number;
}

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: PersonType;
  openings: number;
  status: "Open" | "Closed";
}

export type CandidateStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired";
export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  stage: CandidateStage;
  rating: number;
  source: string;
  interviewAt?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: "view" | "create" | "edit" | "download" | "verify" | "approve" | "delete" | "import" | "export";
  target: string;
}

export interface Settings {
  companyName: string;
  companyCode: string;
  branches: string[];
  departments: string[];
  leaveQuota: Record<LeaveType, number>;
}
