import {
  LayoutDashboard,
  Users,
  IdCard,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Network,
  ClipboardCheck,
  CalendarCheck,
  FileSignature,
  Laptop,
  DoorOpen,
  Megaphone,
  Wallet,
  Target,
  UserPlus,
  FileSpreadsheet,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "./store";

export interface NavItem {
  href: string;
  label: string;
  short?: string;
  icon: LucideIcon;
  perm?: Permission;
  phase?: 1 | 2 | 3;
}

export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Overview", items: [{ href: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard }] },
  {
    group: "People",
    items: [
      { href: "/people", label: "People Directory", short: "People", icon: Users },
      { href: "/ids", label: "Employee IDs", short: "IDs", icon: IdCard, perm: "ids.issue" },
      { href: "/documents", label: "Documents & KYC", short: "KYC", icon: ShieldCheck },
      { href: "/interns", label: "Interns", icon: GraduationCap, perm: "intern.feedback" },
      { href: "/freelancers", label: "Freelancers", icon: Briefcase, perm: "people.viewAll" },
      { href: "/org-chart", label: "Org Chart", short: "Org", icon: Network },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/onboarding", label: "Onboarding", icon: ClipboardCheck, perm: "people.manage" },
      { href: "/attendance", label: "Attendance & Leave", short: "Leave", icon: CalendarCheck },
      { href: "/letters", label: "Letters", icon: FileSignature },
      { href: "/assets", label: "Assets", icon: Laptop, perm: "people.manage" },
      { href: "/offboarding", label: "Offboarding", icon: DoorOpen, perm: "people.manage" },
      { href: "/announcements", label: "Announcements", short: "News", icon: Megaphone },
    ],
  },
  {
    group: "Growth",
    items: [
      { href: "/payroll", label: "Payroll", icon: Wallet },
      { href: "/performance", label: "Performance", icon: Target },
      { href: "/recruitment", label: "Recruitment", icon: UserPlus, perm: "recruit" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/import-export", label: "Import / Export", short: "Import", icon: FileSpreadsheet, perm: "people.manage" },
      { href: "/audit", label: "Audit Log", short: "Audit", icon: ScrollText, perm: "audit" },
      { href: "/settings", label: "Settings & Themes", short: "Settings", icon: Settings },
    ],
  },
];

export const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
