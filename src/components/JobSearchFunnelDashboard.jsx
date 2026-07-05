import { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutDashboard, Table2, Users, CalendarClock, XCircle, BarChart3,
  ArrowLeftRight, Plus, Pencil, Trash2, Search, X, Menu, Download,
  Upload, AlertTriangle, CheckCircle2, Clock, Link2, Mail,
  Filter, ChevronDown, Flame, Minus, Loader2, Inbox, Save, Trash,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

// Custom LinkedIn Icon component since it is not exported in this version of lucide-react
const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

/* ============================================================
   CONSTANTS
   ============================================================ */

const DOMAIN_RULES = [
  { domain: "Analytics Engineer", keywords: ["analytics engineer", "dbt", "snowflake", "data modeling", "semantic layer"] },
  { domain: "Data Scientist / ML Analyst", keywords: ["data scientist", "machine learning", "ml analyst", "ai analyst", "statistical modeling"] },
  { domain: "Business Intelligence Analyst", keywords: ["bi analyst", "business intelligence", "power bi", "tableau", "dashboard analyst", "reporting bi"] },
  { domain: "Product Analyst", keywords: ["product analyst", "product data analyst", "growth analyst", "experimentation analyst", "user analytics"] },
  { domain: "Business Analyst", keywords: ["business analyst", "business systems analyst", "requirements analyst", "process analyst"] },
  { domain: "Data Analyst", keywords: ["data analyst", "reporting analyst", "analytics analyst", "data reporting", "insights analyst"] },
];

const DOMAIN_OPTIONS = [
  "Data Analyst", "Business Analyst", "Business Intelligence Analyst",
  "Product Analyst", "Data Scientist / ML Analyst", "Analytics Engineer", "Unclassified",
];

const APPLICATION_STATUS_OPTIONS = [
  "Applied", "In Review", "Screening", "Interview Scheduled", "Interviewing",
  "Final Round", "Offer Extended", "Offer Accepted", "Offer Declined",
  "Rejected", "Ghosted", "Withdrawn",
];

const CURRENT_STAGE_OPTIONS = [
  "New", "Outreach Sent", "Awaiting Response", "Screening", "Interview Round 1",
  "Interview Round 2+", "Final Round", "Reference Check", "Offer", "Rejected",
  "Ghosted", "Closed",
];

const OUTREACH_CHANNELS = ["LinkedIn", "Email", "Referral", "Other"];
const CONTACT_RESPONSE_OPTIONS = ["No Response", "Replied", "Screen Scheduled", "Rejected", "Asked to Apply", "Future Role"];
const REFERRAL_STATUS_OPTIONS = ["No Referral", "Requested", "Received Before Applying", "Received After Applying", "Confirmed", "Rejected"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const REJECTION_REASON_OPTIONS = ["Not Specified", "Position Filled", "More Experienced Candidate", "Skills Mismatch", "Salary Mismatch", "Location / Visa", "Role Cancelled", "Poor Interview Performance", "Culture Fit", "Other"];
const SOURCE_SUGGESTIONS = ["LinkedIn", "Company Website", "Indeed", "Referral", "Glassdoor", "Wellfound", "Recruiter Outreach", "Career Fair", "Other"];

const FIELD_KEYS = [
  "companyName", "emailUsed", "jobTitle", "autoRoleDomain", "manualRoleDomainOverride",
  "appliedDate", "applicationStatus", "jobLink", "source", "resumeVersion",
  "contactName", "contactLinkedIn", "contactEmail", "reachedOut", "outreachDate",
  "outreachChannel", "contactResponse", "referralStatus", "currentStage",
  "rejectionReason", "notes", "followUpDate", "priority",
];

const STORAGE_KEY = "jsfd_applications_v1";

/* ============================================================
   UTILITIES
   ============================================================ */

function uid() {
  return "a_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
}

function classifyDomain(title) {
  if (!title) return "Unclassified";
  const t = title.toLowerCase();
  for (const rule of DOMAIN_RULES) {
    if (rule.keywords.some((k) => t.includes(k))) return rule.domain;
  }
  return "Unclassified";
}

function effectiveDomain(app) {
  return app.manualRoleDomainOverride && app.manualRoleDomainOverride !== ""
    ? app.manualRoleDomainOverride
    : app.autoRoleDomain || "Unclassified";
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function computeFunnelStage(app) {
  const status = (app.applicationStatus || "").toLowerCase();
  if (status.includes("offer")) return "Offer";
  if (status.includes("reject") || app.contactResponse === "Rejected") return "Rejected";
  if (status.includes("withdraw")) return "Withdrawn";
  if (status.includes("interview") || status.includes("final")) return "Interviewing";
  if (status.includes("screen") || app.contactResponse === "Screen Scheduled") return "Screening";
  if (["Replied", "Asked to Apply", "Future Role"].includes(app.contactResponse)) return "Responded";
  if (app.reachedOut) {
    if (!app.contactResponse || app.contactResponse === "No Response") {
      const d = daysSince(app.outreachDate);
      if (d !== null && d > 21) return "Ghosted";
    }
    return "Reached Out";
  }
  return "Applied";
}

const STAGE_COLORS = {
  Applied: { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-300", dot: "bg-slate-400", hex: "#94a3b8" },
  "Reached Out": { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300", dot: "bg-sky-500", hex: "#0ea5e9" },
  Responded: { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-300", dot: "bg-indigo-500", hex: "#6366f1" },
  Screening: { bg: "bg-violet-100", text: "text-violet-700", ring: "ring-violet-300", dot: "bg-violet-500", hex: "#8b5cf6" },
  Interviewing: { bg: "bg-amber-100", text: "text-amber-800", ring: "ring-amber-300", dot: "bg-amber-500", hex: "#f59e0b" },
  Offer: { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300", dot: "bg-emerald-500", hex: "#10b981" },
  Rejected: { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300", dot: "bg-rose-500", hex: "#f43f5e" },
  Ghosted: { bg: "bg-zinc-200", text: "text-zinc-700", ring: "ring-zinc-300", dot: "bg-zinc-500", hex: "#71717a" },
  Withdrawn: { bg: "bg-gray-200", text: "text-gray-600", ring: "ring-gray-300", dot: "bg-gray-400", hex: "#9ca3af" },
};

const PRIORITY_COLORS = {
  High: "bg-rose-100 text-rose-700 ring-rose-300",
  Medium: "bg-amber-100 text-amber-800 ring-amber-300",
  Low: "bg-slate-100 text-slate-600 ring-slate-300",
};

const DOMAIN_SWATCH = {
  "Data Analyst": "#0ea5e9",
  "Business Analyst": "#8b5cf6",
  "Business Intelligence Analyst": "#f59e0b",
  "Product Analyst": "#10b981",
  "Data Scientist / ML Analyst": "#ec4899",
  "Analytics Engineer": "#6366f1",
  Unclassified: "#94a3b8",
};

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toCSVField(v) {
  const s = v === undefined || v === null ? "" : String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function appsToCSV(apps) {
  const header = FIELD_KEYS.join(",");
  const rows = apps.map((a) => FIELD_KEYS.map((k) => toCSVField(a[k])).join(","));
  return [header, ...rows].join("\n");
}

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else if (c === "\r") { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.length && r.some((c) => c !== ""));
}

function csvToApps(text) {
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim());
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const obj = {};
    header.forEach((h, idx) => { obj[h] = r[idx] !== undefined ? r[idx] : ""; });
    out.push(normalizeApp(obj));
  }
  return out;
}

function blankApp() {
  return {
    id: uid(),
    companyName: "", emailUsed: "", jobTitle: "", autoRoleDomain: "Unclassified",
    manualRoleDomainOverride: "", appliedDate: new Date().toISOString().slice(0, 10),
    applicationStatus: "Applied", jobLink: "", source: "", resumeVersion: "",
    contactName: "", contactLinkedIn: "", contactEmail: "", reachedOut: false,
    outreachDate: "", outreachChannel: "", contactResponse: "No Response",
    referralStatus: "No Referral", currentStage: "New", rejectionReason: "",
    notes: "", followUpDate: "", priority: "Medium", createdAt: Date.now(),
  };
}

function normalizeApp(raw) {
  const b = blankApp();
  const merged = { ...b, ...raw, id: raw.id || uid() };
  merged.reachedOut = merged.reachedOut === true || merged.reachedOut === "true" || merged.reachedOut === "Yes" || merged.reachedOut === "yes";
  merged.autoRoleDomain = classifyDomain(merged.jobTitle);
  return merged;
}

/* ============================================================
   SMALL UI PRIMITIVES
   ============================================================ */

function Btn({ children, variant = "primary", size = "md", className = "", ...props }) {
  const base = "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800",
    accent: "bg-amber-500 text-slate-900 hover:bg-amber-400",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-500",
    subtle: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>{children}</div>;
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function StagePill({ stage }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Applied;
  return (
    <Pill className={`${c.bg} ${c.text} ${c.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {stage}
    </Pill>
  );
}

function PriorityPill({ priority }) {
  return (
    <Pill className={PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium}>
      {priority === "High" && <Flame className="h-3 w-3" />}
      {priority}
    </Pill>
  );
}

// Label Primitive to replace text labels
function Label({ children }) {
  return <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1">{children}</label>;
}

function Input(props) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${props.className || ""}`}
    />
  );
}

function Select({ options, value, onChange, allowEmpty, emptyLabel = "—", className = "" }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 ${className}`}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
    >
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-slate-300"}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between mb-4 flex-wrap gap-2">
      <div>
        {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-0.5">{eyebrow}</div>}
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <div className="text-sm font-medium text-slate-700">{title}</div>
      {subtitle && <div className="text-sm text-slate-500 mt-1 max-w-sm">{subtitle}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 overflow-y-auto">
      <div className={`bg-white w-full ${wide ? "max-w-3xl" : "max-w-lg"} sm:rounded-2xl shadow-xl my-0 sm:my-8`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 sticky top-0 bg-white sm:rounded-t-2xl z-10">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   STAT CARD (departure-board style number)
   ============================================================ */

function StatCard({ label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900 border-slate-300",
    amber: "text-amber-600 border-amber-300",
    emerald: "text-emerald-600 border-emerald-300",
    rose: "text-rose-600 border-rose-300",
    sky: "text-sky-600 border-sky-300",
  };
  return (
    <Card className="px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1.5 border-b border-dashed border-slate-200 pb-1.5">
        {label}
      </div>
      <div className={`font-mono text-3xl font-bold tabular-nums leading-none ${tones[tone].split(" ")[0]}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
    </Card>
  );
}

/* ============================================================
   FUNNEL TRACK (signature visual)
   ============================================================ */

function FunnelTrack({ counts }) {
  // counts: ordered list of {label, value, key}
  const stages = counts;
  const n = stages.length;
  const width = 900, height = 150;
  const padX = 70;
  const trackY = 60;
  const step = n > 1 ? (width - padX * 2) / (n - 1) : 0;
  const maxVal = Math.max(1, ...stages.map((s) => s.value));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px]" style={{ height: 170 }}>
        <line x1={padX} y1={trackY} x2={width - padX} y2={trackY} stroke="#e2e8f0" strokeWidth="3" />
        {stages.map((s, i) => {
          const x = padX + step * i;
          const c = STAGE_COLORS[s.key] || STAGE_COLORS.Applied;
          const r = 8 + (s.value / maxVal) * 14;
          return (
            <g key={s.key}>
              <circle cx={x} cy={trackY} r={r} fill={c.hex} opacity={s.value === 0 ? 0.25 : 0.92} />
              <circle cx={x} cy={trackY} r={r} fill="none" stroke="white" strokeWidth="2" />
              <text x={x} y={trackY - r - 10} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 15, fontWeight: 700, fontFamily: "ui-monospace, monospace" }}>
                {s.value}
              </text>
              <text x={x} y={trackY + r + 20} textAnchor="middle" className="fill-slate-500" style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================
   NAVIGATION
   ============================================================ */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "applications", label: "Applications", icon: Table2 },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "interviews", label: "Interviews", icon: CalendarClock },
  { key: "rejections", label: "Rejections", icon: XCircle },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "importexport", label: "Import / Export", icon: ArrowLeftRight },
];

function Sidebar({ page, setPage, mobileOpen, setMobileOpen, totalApps }) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`fixed z-50 md:z-auto md:static top-0 left-0 h-full w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="px-5 py-5 border-b border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 mb-1">Control Board</div>
          <div className="text-white font-semibold leading-tight">Job Search Funnel</div>
          <div className="text-xs text-slate-500 mt-0.5 font-mono">{totalApps} tracked</div>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setPage(item.key); setMobileOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-amber-400" : "text-slate-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-slate-800 text-[11px] text-slate-500">
          Data stored securely for your account only.
        </div>
      </aside>
    </>
  );
}

/* ============================================================
   APPLICATION FORM (Add / Edit)
   ============================================================ */

function ApplicationForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm((f) => ({ ...f, autoRoleDomain: classifyDomain(f.jobTitle) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.jobTitle]);

  const domainPreview = effectiveDomain(form);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.companyName.trim() || !form.jobTitle.trim()) return;
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Basics</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Company Name *</Label>
            <Input required value={form.companyName} onChange={(e) => set("companyName")(e.target.value)} placeholder="e.g. Northwind Labs" />
          </div>
          <div>
            <Label>Job Title *</Label>
            <Input required value={form.jobTitle} onChange={(e) => set("jobTitle")(e.target.value)} placeholder="e.g. Senior Data Analyst" />
          </div>
          <div>
            <Label>Email Used</Label>
            <Input type="email" value={form.emailUsed} onChange={(e) => set("emailUsed")(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <Label>Applied Date</Label>
            <Input type="date" value={form.appliedDate} onChange={(e) => set("appliedDate")(e.target.value)} />
          </div>
          <div>
            <Label>Job Link</Label>
            <Input value={form.jobLink} onChange={(e) => set("jobLink")(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Source</Label>
            <Input list="source-suggestions" value={form.source} onChange={(e) => set("source")(e.target.value)} placeholder="LinkedIn, Referral..." />
            <datalist id="source-suggestions">
              {SOURCE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <Label>Resume Version</Label>
            <Input value={form.resumeVersion} onChange={(e) => set("resumeVersion")(e.target.value)} placeholder="e.g. DA_Resume_v3" />
          </div>
          <div>
            <Label>Priority</Label>
            <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={set("priority")} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Domain Classification</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div>
            <Label>Auto Role Domain (from title)</Label>
            <div className="flex items-center h-[38px] px-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-600">
              <span className="h-2 w-2 rounded-full mr-2" style={{ background: DOMAIN_SWATCH[form.autoRoleDomain] }} />
              {classifyDomain(form.jobTitle)}
            </div>
          </div>
          <div>
            <Label>Manual Override (optional)</Label>
            <Select options={DOMAIN_OPTIONS} value={form.manualRoleDomainOverride} onChange={set("manualRoleDomainOverride")} allowEmpty emptyLabel="No override — use auto" />
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Effective domain used across dashboards: <span className="font-semibold" style={{ color: DOMAIN_SWATCH[domainPreview] }}>{domainPreview}</span>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Status & Stage</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Application Status</Label>
            <Select options={APPLICATION_STATUS_OPTIONS} value={form.applicationStatus} onChange={set("applicationStatus")} />
          </div>
          <div>
            <Label>Current Stage</Label>
            <Select options={CURRENT_STAGE_OPTIONS} value={form.currentStage} onChange={set("currentStage")} />
          </div>
          <div>
            <Label>Rejection Reason</Label>
            <Select options={REJECTION_REASON_OPTIONS} value={form.rejectionReason} onChange={set("rejectionReason")} allowEmpty emptyLabel="Not applicable" />
          </div>
          <div>
            <Label>Follow-up Date</Label>
            <Input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate")(e.target.value)} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Contact & Outreach</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Contact / Recruiter Name</Label>
            <Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} placeholder="e.g. Jamie Chen" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail")(e.target.value)} />
          </div>
          <div>
            <Label>Contact LinkedIn</Label>
            <Input value={form.contactLinkedIn} onChange={(e) => set("contactLinkedIn")(e.target.value)} placeholder="linkedin.com/in/..." />
          </div>
          <div className="flex items-center pt-5">
            <Toggle checked={form.reachedOut} onChange={set("reachedOut")} label="I reached out to this contact" />
          </div>
          <div>
            <Label>Outreach Date</Label>
            <Input type="date" value={form.outreachDate} onChange={(e) => set("outreachDate")(e.target.value)} disabled={!form.reachedOut} />
          </div>
          <div>
            <Label>Outreach Channel</Label>
            <Select options={OUTREACH_CHANNELS} value={form.outreachChannel} onChange={set("outreachChannel")} allowEmpty emptyLabel="Select channel" />
          </div>
          <div>
            <Label>Contact Response</Label>
            <Select options={CONTACT_RESPONSE_OPTIONS} value={form.contactResponse} onChange={set("contactResponse")} />
          </div>
          <div>
            <Label>Referral Status</Label>
            <Select options={REFERRAL_STATUS_OPTIONS} value={form.referralStatus} onChange={set("referralStatus")} />
          </div>
        </div>
      </div>

      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Notes</div>
        <TextArea rows={3} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Anything worth remembering about this application..." />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
        <Btn type="button" variant="ghost" onClick={onCancel}>Cancel</Btn>
        <Btn type="submit" variant="accent"><Save className="h-4 w-4" /> Save Application</Btn>
      </div>
    </form>
  );
}

/* ============================================================
   APPLICATIONS PAGE
   ============================================================ */

function ApplicationsPage({ apps, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return apps
      .filter((a) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || [a.companyName, a.jobTitle, a.contactName].some((v) => (v || "").toLowerCase().includes(q));
        const matchesDomain = !domainFilter || effectiveDomain(a) === domainFilter;
        const matchesPriority = !priorityFilter || a.priority === priorityFilter;
        return matchesSearch && matchesDomain && matchesPriority;
      })
      .sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));
  }, [apps, search, domainFilter, priorityFilter]);

  function openAdd() { setEditing(blankApp()); setModalOpen(true); }
  function openEdit(app) { setEditing(app); setModalOpen(true); }
  function handleSave(form) {
    const withDomain = { ...form, autoRoleDomain: classifyDomain(form.jobTitle) };
    if (apps.some((a) => a.id === form.id)) onUpdate(withDomain);
    else onAdd(withDomain);
    setModalOpen(false);
  }

  return (
    <div>
      <SectionTitle
        eyebrow="Pipeline"
        title="Applications"
        action={<Btn variant="accent" onClick={openAdd}><Plus className="h-4 w-4" /> Add Application</Btn>}
      />

      <Card className="p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input className="pl-9" placeholder="Search company, title, contact..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-44">
          <Select options={DOMAIN_OPTIONS} value={domainFilter} onChange={setDomainFilter} allowEmpty emptyLabel="All domains" />
        </div>
        <div className="w-36">
          <Select options={PRIORITY_OPTIONS} value={priorityFilter} onChange={setPriorityFilter} allowEmpty emptyLabel="All priorities" />
        </div>
        {(search || domainFilter || priorityFilter) && (
          <Btn variant="ghost" size="sm" onClick={() => { setSearch(""); setDomainFilter(""); setPriorityFilter(""); }}>
            <X className="h-3.5 w-3.5" /> Clear
          </Btn>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={apps.length === 0 ? "No applications yet" : "No matches"}
            subtitle={apps.length === 0 ? "Add your first job application to start tracking your funnel." : "Try adjusting your search or filters."}
            action={apps.length === 0 && <Btn variant="accent" onClick={openAdd}><Plus className="h-4 w-4" /> Add Application</Btn>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Company / Title</th>
                  <th className="px-4 py-2.5 font-semibold">Domain</th>
                  <th className="px-4 py-2.5 font-semibold">Applied</th>
                  <th className="px-4 py-2.5 font-semibold">Stage</th>
                  <th className="px-4 py-2.5 font-semibold">Priority</th>
                  <th className="px-4 py-2.5 font-semibold">Reached / Response</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const stage = computeFunnelStage(a);
                  const c = STAGE_COLORS[stage] || STAGE_COLORS.Applied;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className={`px-4 py-3 border-l-4`} style={{ borderLeftColor: c.hex }}>
                        <div className="font-medium text-slate-900">{a.companyName || "—"}</div>
                        <div className="text-xs text-slate-500">{a.jobTitle || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="h-2 w-2 rounded-full" style={{ background: DOMAIN_SWATCH[effectiveDomain(a)] }} />
                          {effectiveDomain(a)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(a.appliedDate)}</td>
                      <td className="px-4 py-3"><StagePill stage={stage} /></td>
                      <td className="px-4 py-3"><PriorityPill priority={a.priority} /></td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {a.reachedOut ? <span className="text-emerald-600 font-medium">Reached out</span> : <span className="text-slate-400">Not yet</span>}
                        <div className="text-slate-400">{a.contactResponse || "No Response"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                          </button>
                          <button onClick={() => setConfirmDelete(a)} className="p-1.5 rounded-lg hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">
                            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing && apps.some((a) => a.id === editing.id) ? "Edit Application" : "Add Application"} wide>
        {editing && <ApplicationForm initial={editing} onSave={handleSave} onCancel={() => setModalOpen(false)} />}
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete application?">
        {confirmDelete && (
          <div>
            <p className="text-sm text-slate-600">
              This will permanently remove <span className="font-semibold text-slate-900">{confirmDelete.jobTitle}</span> at{" "}
              <span className="font-semibold text-slate-900">{confirmDelete.companyName}</span>. This can't be undone.
            </p>
            <div className="flex justify-end gap-2 mt-5">
              <Btn variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
              <Btn variant="danger" onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}>
                <Trash className="h-4 w-4" /> Delete
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============================================================
   DASHBOARD PAGE
   ============================================================ */

function DashboardPage({ apps, setPage }) {
  const stats = useMemo(() => {
    const total = apps.length;
    const reachedOut = apps.filter((a) => a.reachedOut).length;
    const responded = apps.filter((a) => a.contactResponse && a.contactResponse !== "No Response").length;
    const stageCounts = {};
    apps.forEach((a) => { const s = computeFunnelStage(a); stageCounts[s] = (stageCounts[s] || 0) + 1; });
    const offers = stageCounts.Offer || 0;
    const interviewing = stageCounts.Interviewing || 0;
    const rejected = stageCounts.Rejected || 0;
    const ghosted = stageCounts.Ghosted || 0;
    const withdrawn = stageCounts.Withdrawn || 0;
    const active = total - offers - rejected - ghosted - withdrawn;
    return { total, reachedOut, responded, stageCounts, offers, interviewing, rejected, ghosted, active };
  }, [apps]);

  const funnelSteps = [
    { key: "Applied", label: "Applied", value: stats.total },
    { key: "Reached Out", label: "Reached Out", value: stats.reachedOut },
    { key: "Responded", label: "Responded", value: stats.responded },
    { key: "Screening", label: "Screening", value: stats.stageCounts.Screening || 0 },
    { key: "Interviewing", label: "Interviewing", value: stats.interviewing },
    { key: "Offer", label: "Offer", value: stats.offers },
  ];

  const exitSteps = [
    { key: "Rejected", label: "Rejected", value: stats.rejected },
    { key: "Ghosted", label: "Ghosted", value: stats.ghosted },
  ];

  const domainData = useMemo(() => {
    const counts = {};
    apps.forEach((a) => { const d = effectiveDomain(a); counts[d] = (counts[d] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [apps]);

  const upcoming = useMemo(() => {
    return apps
      .filter((a) => a.followUpDate)
      .map((a) => ({ ...a, _days: daysUntil(a.followUpDate) }))
      .filter((a) => a._days !== null && a._days >= -1 && a._days <= 7)
      .sort((a, b) => a._days - b._days)
      .slice(0, 6);
  }, [apps]);

  const recent = useMemo(() => [...apps].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5), [apps]);

  if (apps.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Your funnel is empty"
          subtitle="Once you add applications, this dashboard will show your outreach, response, interview and offer rates at a glance."
          action={<Btn variant="accent" onClick={() => setPage("applications")}><Plus className="h-4 w-4" /> Add your first application</Btn>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={stats.total} tone="slate" />
        <StatCard label="Response Rate" value={stats.total ? `${Math.round((stats.responded / stats.total) * 100)}%` : "0%"} sub={`${stats.responded} of ${stats.total}`} tone="sky" />
        <StatCard label="Interview Rate" value={stats.total ? `${Math.round((stats.interviewing / stats.total) * 100)}%` : "0%"} sub={`${stats.interviewing} interviewing`} tone="amber" />
        <StatCard label="Offer Rate" value={stats.total ? `${Math.round((stats.offers / stats.total) * 100)}%` : "0%"} sub={`${stats.offers} offers`} tone="emerald" />
      </div>

      <Card className="p-5">
        <SectionTitle eyebrow="The Funnel" title="Application Journey" />
        <FunnelTrack counts={funnelSteps} />
        <div className="mt-2 flex items-center gap-6 pl-2">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Exited without offer</div>
          <FunnelTrack counts={exitSteps} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle title="Applications by Domain" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={domainData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {domainData.map((d, i) => <Cell key={i} fill={DOMAIN_SWATCH[d.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Upcoming Follow-ups" />
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing due soon" subtitle="Follow-up dates within the next week will show here." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{a.companyName}</div>
                    <div className="text-xs text-slate-500">{a.jobTitle}</div>
                  </div>
                  <Pill className={a._days < 0 ? "bg-rose-100 text-rose-700 ring-rose-300" : a._days === 0 ? "bg-amber-100 text-amber-800 ring-amber-300" : "bg-slate-100 text-slate-600 ring-slate-300"}>
                    <Clock className="h-3 w-3" />
                    {a._days < 0 ? "Overdue" : a._days === 0 ? "Today" : `In ${a._days}d`}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <SectionTitle title="Recently Added" />
        <ul className="divide-y divide-slate-100">
          {recent.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-2.5">
              <div>
                <div className="text-sm font-medium text-slate-800">{a.companyName} — {a.jobTitle}</div>
                <div className="text-xs text-slate-500">{effectiveDomain(a)} · Applied {formatDate(a.appliedDate)}</div>
              </div>
              <StagePill stage={computeFunnelStage(a)} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

/* ============================================================
   CONTACTS PAGE
   ============================================================ */

function ContactsPage({ apps }) {
  const contacts = useMemo(() => {
    const map = {};
    apps.forEach((a) => {
      if (!a.contactName && !a.contactEmail) return;
      const key = (a.contactEmail || a.contactName || "").toLowerCase() + "|" + (a.companyName || "").toLowerCase();
      if (!map[key]) {
        map[key] = {
          name: a.contactName || "Unnamed contact",
          email: a.contactEmail,
          linkedin: a.contactLinkedIn,
          company: a.companyName,
          channel: a.outreachChannel,
          response: a.contactResponse,
          apps: [],
        };
      }
      map[key].apps.push(a);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [apps]);

  return (
    <div>
      <SectionTitle eyebrow="Network" title="Contacts & Recruiters" />
      {contacts.length === 0 ? (
        <Card><EmptyState icon={Users} title="No contacts yet" subtitle="Add a recruiter or contact name to an application to see them here." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.company}</div>
                </div>
                <StagePill stage={computeFunnelStage(c.apps[0])} />
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email}</div>}
                {c.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="h-3.5 w-3.5 text-slate-400" /> {c.linkedin}</div>}
                {c.channel && <div className="flex items-center gap-1.5"><Link2 className="h-3.5 w-3.5 text-slate-400" /> Via {c.channel}</div>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">{c.apps.length} role{c.apps.length > 1 ? "s" : ""}</span>
                <Pill className="bg-slate-100 text-slate-600 ring-slate-300">{c.response || "No Response"}</Pill>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   INTERVIEWS PAGE
   ============================================================ */

function InterviewsPage({ apps }) {
  const interviews = useMemo(() => {
    return apps
      .filter((a) => {
        const stage = computeFunnelStage(a);
        return stage === "Interviewing" || stage === "Screening" || a.contactResponse === "Screen Scheduled";
      })
      .sort((a, b) => (a.followUpDate || "9999").localeCompare(b.followUpDate || "9999"));
  }, [apps]);

  return (
    <div>
      <SectionTitle eyebrow="Active Rounds" title="Interviews" />
      {interviews.length === 0 ? (
        <Card><EmptyState icon={CalendarClock} title="No active interviews" subtitle="Applications in screening or interview stages will appear here." /></Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((a) => (
            <Card key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-900 text-sm">{a.jobTitle} · {a.companyName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{effectiveDomain(a)} · Contact: {a.contactName || "—"}</div>
                {a.notes && <div className="text-xs text-slate-400 mt-1 max-w-md truncate">{a.notes}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Pill className="bg-slate-100 text-slate-600 ring-slate-300">{a.currentStage}</Pill>
                <StagePill stage={computeFunnelStage(a)} />
                {a.followUpDate && (
                  <Pill className="bg-amber-100 text-amber-800 ring-amber-300"><Clock className="h-3 w-3" /> {formatDate(a.followUpDate)}</Pill>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   REJECTIONS PAGE
   ============================================================ */

function RejectionsPage({ apps }) {
  const rejected = useMemo(() => apps.filter((a) => computeFunnelStage(a) === "Rejected"), [apps]);
  const reasonData = useMemo(() => {
    const counts = {};
    rejected.forEach((a) => {
      const r = a.rejectionReason || "Not Specified";
      counts[r] = (counts[r] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [rejected]);

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Learn & Adjust" title="Rejections" />
      {rejected.length === 0 ? (
        <Card><EmptyState icon={XCircle} title="No rejections logged" subtitle="Hopefully it stays that way — rejected applications will appear here." /></Card>
      ) : (
        <>
          <Card className="p-5">
            <SectionTitle title="Rejection Reasons" />
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Company / Title</th>
                    <th className="px-4 py-2.5 font-semibold">Domain</th>
                    <th className="px-4 py-2.5 font-semibold">Applied Date</th>
                    <th className="px-4 py-2.5 font-semibold">Reason</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejected.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 border-l-4 border-rose-500">
                        <div className="font-medium text-slate-900">{a.companyName || "—"}</div>
                        <div className="text-xs text-slate-500">{a.jobTitle || "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="h-2 w-2 rounded-full" style={{ background: DOMAIN_SWATCH[effectiveDomain(a)] }} />
                          {effectiveDomain(a)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(a.appliedDate)}</td>
                      <td className="px-4 py-3">
                        <Pill className="bg-rose-100 text-rose-700 ring-rose-300">
                          {a.rejectionReason || "Not Specified"}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-xs text-slate-400 truncate max-w-[150px] inline-block align-middle" title={a.notes}>
                          {a.notes || "No notes"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ============================================================
   ANALYTICS PAGE
   ============================================================ */

function AnalyticsPage({ apps }) {
  const stageData = useMemo(() => {
    const stages = ["Applied", "Reached Out", "Responded", "Screening", "Interviewing", "Offer", "Rejected", "Ghosted", "Withdrawn"];
    const counts = {};
    stages.forEach((s) => (counts[s] = 0));
    apps.forEach((a) => {
      const s = computeFunnelStage(a);
      if (counts[s] !== undefined) {
        counts[s] += 1;
      }
    });
    return stages.map((s) => ({
      name: s,
      Count: counts[s],
      color: STAGE_COLORS[s]?.hex || "#94a3b8",
    }));
  }, [apps]);

  const sourceData = useMemo(() => {
    const stats = {};
    apps.forEach((a) => {
      const src = a.source || "Unknown";
      if (!stats[src]) {
        stats[src] = { name: src, Total: 0, Responded: 0 };
      }
      stats[src].Total += 1;
      if (a.contactResponse && a.contactResponse !== "No Response") {
        stats[src].Responded += 1;
      }
    });
    return Object.values(stats)
      .map((s) => ({
        name: s.name,
        "Total Applications": s.Total,
        "Response Rate (%)": Math.round((s.Responded / s.Total) * 100) || 0,
      }))
      .sort((a, b) => b["Total Applications"] - a["Total Applications"]);
  }, [apps]);

  const historyData = useMemo(() => {
    const monthly = {};
    apps.forEach((a) => {
      if (!a.appliedDate) return;
      const d = new Date(a.appliedDate + "T00:00:00");
      if (isNaN(d.getTime())) return;
      const key = d.toLocaleString("default", { month: "short", year: "numeric" });
      const order = d.getFullYear() * 12 + d.getMonth();
      if (!monthly[key]) {
        monthly[key] = { name: key, Applications: 0, order };
      }
      monthly[key].Applications += 1;
    });
    return Object.values(monthly).sort((a, b) => a.order - b.order);
  }, [apps]);

  if (apps.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={BarChart3}
          title="No analytics data"
          subtitle="Add some applications first to see funnel conversions and channel statistics."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Performance" title="Funnel Analytics" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <SectionTitle title="Application Timeline" />
          <div style={{ height: 260 }}>
            {historyData.length === 0 ? (
              <EmptyState title="No timeline data" subtitle="Check that applied dates are set correctly." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Applications" stroke="#8b5cf6" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="Conversion Stages" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Response Rate & Volume by Source" />
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} label={{ value: 'Applications', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 11 }} label={{ value: 'Response Rate', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#64748b' } }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Total Applications" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Response Rate (%)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================================================
   IMPORT / EXPORT PAGE
   ============================================================ */

function ImportExportPage({ apps, onImport }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  function handleExport() {
    const csvContent = appsToCSV(apps);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadBlob(csvContent, `job_applications_${dateStr}.csv`, "text/csv;charset=utf-8;");
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }

  function processFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const imported = csvToApps(text);
        if (imported.length === 0) {
          setError("No applications found in the CSV.");
          setSuccess(null);
          return;
        }
        onImport(imported);
        setSuccess(`Successfully imported ${imported.length} applications!`);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to parse CSV file. Please make sure the format is correct.");
        setSuccess(null);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <SectionTitle eyebrow="Data Portability" title="Import / Export Data" />

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Export Data</h3>
          <p className="text-xs text-slate-500 mb-3">
            Download all your job applications as a CSV file to save as a backup or open in a spreadsheet application.
          </p>
          <Btn variant="primary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV ({apps.length} records)
          </Btn>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-1">Import Data</h3>
          <p className="text-xs text-slate-500 mb-4">
            Upload your exported CSV file to restore your applications or migrate them from another dashboard.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive ? "border-amber-500 bg-amber-50" : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400 mt-1">CSV file type only</p>
          </div>

          {error && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-lg flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{success}</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   MAIN WRAPPER COMPONENT
   ============================================================ */

export default function JobSearchFunnelDashboard() {
  const [apps, setApps] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(normalizeApp);
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
    return [];
  });

  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch (e) {
      console.error("Local storage save error:", e);
    }
  }, [apps]);

  function handleAdd(newApp) {
    setApps((prev) => [newApp, ...prev]);
  }

  function handleUpdate(updatedApp) {
    setApps((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
  }

  function handleDelete(id) {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  function handleImport(newApps) {
    setApps((prev) => {
      // De-duplicate: replace existing by id if they match, otherwise append
      const prevMap = new Map(prev.map((a) => [a.id, a]));
      newApps.forEach((a) => prevMap.set(a.id, a));
      return Array.from(prevMap.values());
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      <Sidebar
        page={page}
        setPage={setPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        totalApps={apps.length}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (Top Nav) */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-base font-bold text-slate-800 capitalize md:hidden">Job Funnel</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              LocalStorage Active
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto">
          {page === "dashboard" && <DashboardPage apps={apps} setPage={setPage} />}
          {page === "applications" && (
            <ApplicationsPage
              apps={apps}
              onAdd={handleAdd}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
          {page === "contacts" && <ContactsPage apps={apps} />}
          {page === "interviews" && <InterviewsPage apps={apps} />}
          {page === "rejections" && <RejectionsPage apps={apps} />}
          {page === "analytics" && <AnalyticsPage apps={apps} />}
          {page === "importexport" && <ImportExportPage apps={apps} onImport={handleImport} />}
        </main>
      </div>
    </div>
  );
}
