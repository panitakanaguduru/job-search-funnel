import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Applied: { bg: "bg-blue-50/70", text: "text-blue-700", dot: "bg-blue-500", hex: "#3b82f6" },
  "Reached Out": { bg: "bg-sky-50/70", text: "text-sky-700", dot: "bg-sky-500", hex: "#0ea5e9" },
  Responded: { bg: "bg-indigo-50/70", text: "text-indigo-700", dot: "bg-indigo-500", hex: "#6366f1" },
  Screening: { bg: "bg-violet-50/70", text: "text-violet-700", dot: "bg-violet-500", hex: "#8b5cf6" },
  Interviewing: { bg: "bg-purple-50/70", text: "text-purple-700", dot: "bg-purple-500", hex: "#a855f7" },
  Offer: { bg: "bg-emerald-50/70", text: "text-emerald-700", dot: "bg-emerald-500", hex: "#10b981" },
  Rejected: { bg: "bg-rose-50/70", text: "text-rose-700", dot: "bg-rose-500", hex: "#f43f5e" },
  Ghosted: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400", hex: "#64748b" },
  Withdrawn: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", hex: "#9ca3af" },
};

const PRIORITY_COLORS = {
  High: "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50",
  Medium: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/50",
  Low: "bg-slate-50 text-slate-600 ring-1 ring-slate-200/50",
};

const DOMAIN_SWATCH = {
  "Data Analyst": "#0ea5e9",
  "Business Analyst": "#8b5cf6",
  "Business Intelligence Analyst": "#6366f1",
  "Product Analyst": "#10b981",
  "Data Scientist / ML Analyst": "#ec4899",
  "Analytics Engineer": "#4f46e5",
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
  const base = "inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-sm",
  };
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 border-none shadow-sm focus:ring-indigo-500",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:ring-indigo-500",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-indigo-500",
    danger: "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
    accent: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:ring-indigo-500 border border-indigo-200/20",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border border-slate-100 shadow-sm rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function Pill({ children, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${className}`}>
      {children}
    </span>
  );
}

function StagePill({ stage }) {
  const c = STAGE_COLORS[stage] || STAGE_COLORS.Applied;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {stage}
    </span>
  );
}

function PriorityPill({ priority }) {
  const c = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c}`}>
      {priority}
    </span>
  );
}

function Label({ children }) {
  return <label className="block text-xs font-semibold text-slate-700 mb-1.5">{children}</label>;
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400/80 transition-colors ${className}`}
      {...props}
    />
  );
}

function TextArea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400/80 transition-colors ${className}`}
      {...props}
    />
  );
}

function Select({ options, value, onChange, allowEmpty, emptyLabel = "—", className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-700 transition-colors cursor-pointer ${className}`}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="relative w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      {label && <span className="text-xs font-semibold text-slate-700">{label}</span>}
    </label>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
      <div>
        {eyebrow && <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-0.5">{eyebrow}</span>}
        <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon = Inbox, title, subtitle, action }) {
  return (
    <div className="text-center py-10 px-4 max-w-sm mx-auto">
      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-3">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 mb-4">{subtitle}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[3px] transition-opacity" 
        onClick={onClose}
      />
      {/* Modal Card */}
      <div 
        className={`relative bg-white rounded-2xl shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto w-full transition-all transform scale-100 flex flex-col ${
          wide ? "max-w-2xl" : "max-w-md"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   KPI STAT CARD
   ============================================================ */

function StatCard({ label, value, sub, tone = "indigo" }) {
  const tones = {
    indigo: "border-indigo-500 bg-indigo-50/10",
    sky: "border-sky-500 bg-sky-50/10",
    amber: "border-purple-500 bg-purple-50/10", // upgraded to purple accent
    emerald: "border-emerald-500 bg-emerald-50/10",
  };
  return (
    <Card className={`flex flex-col p-4 border-l-4 ${tones[tone] || tones.indigo}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-black text-slate-800 leading-none mb-1">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 font-medium">{sub}</div>}
    </Card>
  );
}

/* ============================================================
   JOURNEY FUNNEL BAR TRACK
   ============================================================ */

function FunnelTrack({ counts }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {counts.map((c) => (
        <div key={c.key} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-center transition-all hover:bg-slate-50">
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 truncate">{c.label}</div>
          <div className="text-xl font-black text-indigo-600">{c.value}</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   WIZARD COMPONENT FOR ADD/EDIT APPLICATION
   ============================================================ */

function ApplicationWizardForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setForm((f) => ({ ...f, autoRoleDomain: classifyDomain(f.jobTitle) }));
  }, [form.jobTitle]);

  const validateStep = (step) => {
    const err = {};
    if (step === 1) {
      if (!form.companyName?.trim()) err.companyName = "Company Name is required";
      if (!form.jobTitle?.trim()) err.jobTitle = "Job Title is required";
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep((s) => s - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }
    const withDomain = { ...form, autoRoleDomain: classifyDomain(form.jobTitle) };
    onSave(withDomain);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Wizard Progress Indicator */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        {[
          { num: 1, label: "Basics" },
          { num: 2, label: "Outreach" },
          { num: 3, label: "Details" }
        ].map((s, idx, arr) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                currentStep === s.num 
                  ? "bg-indigo-600 text-white ring-4 ring-indigo-50" 
                  : currentStep > s.num
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-500"
              }`}>
                {currentStep > s.num ? "✓" : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:inline ${
                currentStep === s.num ? "text-indigo-600 font-bold" : "text-slate-500"
              }`}>
                {s.label}
              </span>
            </div>
            {idx < arr.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-all duration-300 ${
                currentStep > s.num ? "bg-emerald-500" : "bg-slate-100"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Contents */}
      <div className="min-h-[260px] flex flex-col justify-between">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Company Name *</Label>
              <Input 
                value={form.companyName} 
                onChange={(e) => set("companyName")(e.target.value)} 
                placeholder="e.g. Stripe, Google"
                className={errors.companyName ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""}
              />
              {errors.companyName && <p className="text-xs text-rose-500 mt-1">{errors.companyName}</p>}
            </div>
            <div>
              <Label>Job Title *</Label>
              <Input 
                value={form.jobTitle} 
                onChange={(e) => set("jobTitle")(e.target.value)} 
                placeholder="e.g. Product Analyst"
                className={errors.jobTitle ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500" : ""}
              />
              {errors.jobTitle && <p className="text-xs text-rose-500 mt-1">{errors.jobTitle}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Applied Date</Label>
                <Input type="date" value={form.appliedDate} onChange={(e) => set("appliedDate")(e.target.value)} />
              </div>
              <div>
                <Label>Source</Label>
                <Input list="source-suggestions" value={form.source} onChange={(e) => set("source")(e.target.value)} placeholder="LinkedIn, Referral..." />
                <datalist id="source-suggestions">
                  {SOURCE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
            <div>
              <Label>Job Link</Label>
              <Input value={form.jobLink} onChange={(e) => set("jobLink")(e.target.value)} placeholder="https://..." />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Recruiter Name</Label>
                <Input value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} placeholder="e.g. Jamie Chen" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail")(e.target.value)} placeholder="recruiter@company.com" />
              </div>
            </div>
            <div>
              <Label>Contact LinkedIn</Label>
              <Input value={form.contactLinkedIn} onChange={(e) => set("contactLinkedIn")(e.target.value)} placeholder="linkedin.com/in/..." />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-slate-700">Outreach Initiated</div>
                <div className="text-[10px] text-slate-400">Toggle if you've already contacted a recruiter/employee.</div>
              </div>
              <Toggle checked={form.reachedOut} onChange={set("reachedOut")} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Outreach Date</Label>
                <Input 
                  type="date" 
                  value={form.outreachDate} 
                  onChange={(e) => set("outreachDate")(e.target.value)} 
                  disabled={!form.reachedOut} 
                  className="disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
              <div>
                <Label>Outreach Channel</Label>
                <Select 
                  options={OUTREACH_CHANNELS} 
                  value={form.outreachChannel} 
                  onChange={set("outreachChannel")} 
                  allowEmpty 
                  emptyLabel="Select channel"
                  className={!form.reachedOut ? "opacity-60 pointer-events-none bg-slate-50" : ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Contact Response</Label>
                <Select 
                  options={CONTACT_RESPONSE_OPTIONS} 
                  value={form.contactResponse} 
                  onChange={set("contactResponse")}
                  className={!form.reachedOut ? "opacity-60 pointer-events-none bg-slate-50" : ""}
                />
              </div>
              <div>
                <Label>Referral Status</Label>
                <Select options={REFERRAL_STATUS_OPTIONS} value={form.referralStatus} onChange={set("referralStatus")} />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Application Status</Label>
                <Select options={APPLICATION_STATUS_OPTIONS} value={form.applicationStatus} onChange={set("applicationStatus")} />
              </div>
              <div>
                <Label>Current Stage</Label>
                <Select options={CURRENT_STAGE_OPTIONS} value={form.currentStage} onChange={set("currentStage")} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Rejection Reason</Label>
                <Select options={REJECTION_REASON_OPTIONS} value={form.rejectionReason} onChange={set("rejectionReason")} allowEmpty emptyLabel="Not applicable" />
              </div>
              <div>
                <Label>Follow-up Date</Label>
                <Input type="date" value={form.followUpDate} onChange={(e) => set("followUpDate")(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Resume Version</Label>
                <Input value={form.resumeVersion} onChange={(e) => set("resumeVersion")(e.target.value)} placeholder="e.g. Analytics_v2" />
              </div>
              <div>
                <Label>Priority</Label>
                <Select options={PRIORITY_OPTIONS} value={form.priority} onChange={set("priority")} />
              </div>
            </div>
            <div>
              <Label>Manual Override Domain (from auto-classification)</Label>
              <Select options={DOMAIN_OPTIONS} value={form.manualRoleDomainOverride} onChange={set("manualRoleDomainOverride")} allowEmpty emptyLabel={`No override — auto: ${classifyDomain(form.jobTitle)}`} />
            </div>
            <div>
              <Label>Notes</Label>
              <TextArea rows={2} value={form.notes} onChange={(e) => set("notes")(e.target.value)} placeholder="Add comments, notes, or highlights..." />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6 bg-white sticky bottom-0">
        <div>
          <Btn type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Btn>
        </div>
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Btn type="button" variant="secondary" onClick={handleBack}>
              Back
            </Btn>
          )}
          {currentStep < 3 ? (
            <Btn type="button" variant="primary" onClick={handleNext}>
              Next
            </Btn>
          ) : (
            <Btn type="submit" variant="primary">
              <Save className="h-4 w-4" /> Save Application
            </Btn>
          )}
        </div>
      </div>
    </form>
  );
}

/* ============================================================
   APPLICATIONS CRM SPREADSHEET PAGE
   ============================================================ */

function ApplicationsPage({ apps, onAdd, onUpdate, onDelete }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  
  // Custom Filter State
  const [domainFilter, setDomainFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [reachedOutFilter, setReachedOutFilter] = useState("");
  const [responseFilter, setResponseFilter] = useState("");
  const [referralFilter, setReferralFilter] = useState("");
  
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return apps
      .filter((a) => {
        const q = search.toLowerCase();
        const matchesSearch = !q || [a.companyName, a.jobTitle, a.contactName].some((v) => (v || "").toLowerCase().includes(q));
        const matchesDomain = !domainFilter || effectiveDomain(a) === domainFilter;
        const matchesStage = !stageFilter || computeFunnelStage(a) === stageFilter;
        const matchesReachedOut = !reachedOutFilter || (reachedOutFilter === "Yes" ? a.reachedOut === true : a.reachedOut === false);
        const matchesResponse = !responseFilter || a.contactResponse === responseFilter;
        const matchesReferral = !referralFilter || a.referralStatus === referralFilter;
        return matchesSearch && matchesDomain && matchesStage && matchesReachedOut && matchesResponse && matchesReferral;
      })
      .sort((a, b) => (b.appliedDate || "").localeCompare(a.appliedDate || ""));
  }, [apps, search, domainFilter, stageFilter, reachedOutFilter, responseFilter, referralFilter]);

  function openAdd() { setEditing(blankApp()); setModalOpen(true); }
  function openEdit(app) { setEditing(app); setModalOpen(true); }
  function handleSave(form) {
    const withDomain = { ...form, autoRoleDomain: classifyDomain(form.jobTitle) };
    if (apps.some((a) => a.id === form.id)) onUpdate(withDomain);
    else onAdd(withDomain);
    setModalOpen(false);
  }

  const hasActiveFilters = search || domainFilter || stageFilter || reachedOutFilter || responseFilter || referralFilter;
  
  const clearFilters = () => {
    setSearch("");
    setDomainFilter("");
    setStageFilter("");
    setReachedOutFilter("");
    setResponseFilter("");
    setReferralFilter("");
  };

  return (
    <div>
      <SectionTitle
        eyebrow="Pipeline"
        title="Applications CRM"
        action={<Btn variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Application</Btn>}
      />

      {/* Modern SaaS Filter Control Center */}
      <Card className="p-4 mb-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input className="pl-9" placeholder="Search company, title, recruiter..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {hasActiveFilters && (
            <Btn variant="ghost" size="sm" onClick={clearFilters} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-semibold">
              <X className="h-3.5 w-3.5" /> Clear Filters
            </Btn>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <Label>Domain</Label>
            <Select options={DOMAIN_OPTIONS} value={domainFilter} onChange={setDomainFilter} allowEmpty emptyLabel="All Domains" />
          </div>
          <div>
            <Label>Stage</Label>
            <Select 
              options={["Applied", "Reached Out", "Responded", "Screening", "Interviewing", "Offer", "Rejected", "Ghosted", "Withdrawn"]} 
              value={stageFilter} 
              onChange={setStageFilter} 
              allowEmpty 
              emptyLabel="All Stages" 
            />
          </div>
          <div>
            <Label>Reached Out</Label>
            <Select options={["Yes", "No"]} value={reachedOutFilter} onChange={setReachedOutFilter} allowEmpty emptyLabel="All Statuses" />
          </div>
          <div>
            <Label>Response</Label>
            <Select options={CONTACT_RESPONSE_OPTIONS} value={responseFilter} onChange={setResponseFilter} allowEmpty emptyLabel="All Responses" />
          </div>
          <div>
            <Label>Referral</Label>
            <Select options={REFERRAL_STATUS_OPTIONS} value={referralFilter} onChange={setReferralFilter} allowEmpty emptyLabel="All Referrals" />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={apps.length === 0 ? "No applications yet" : "No matches found"}
            subtitle={apps.length === 0 ? "Add your first job application using the Wizard." : "Try adjusting your filters or search query."}
            action={apps.length === 0 && <Btn variant="primary" onClick={openAdd}><Plus className="h-4 w-4" /> Add Application</Btn>}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Job Title</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Applied Date</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Recruiter</th>
                  <th className="px-4 py-3 font-semibold">Reached Out</th>
                  <th className="px-4 py-3 font-semibold">Response</th>
                  <th className="px-4 py-3 font-semibold">Referral</th>
                  <th className="px-4 py-3 font-semibold">Priority</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const stage = computeFunnelStage(a);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900 whitespace-nowrap">{a.companyName || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap">{a.jobTitle || "—"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className="h-2 w-2 rounded-full" style={{ background: DOMAIN_SWATCH[effectiveDomain(a)] }} />
                          {effectiveDomain(a)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{formatDate(a.appliedDate)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><StagePill stage={stage} /></td>
                      <td className="px-4 py-3.5 text-slate-600 truncate max-w-[110px]" title={a.contactName}>{a.contactName || "—"}</td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{a.reachedOut ? "Yes" : "No"}</td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{a.contactResponse || "No Response"}</td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{a.referralStatus || "No Referral"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap"><PriorityPill priority={a.priority} /></td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(a)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setConfirmDelete(a)} className="p-1 rounded-lg hover:bg-rose-50 text-rose-500 hover:text-rose-700 transition-colors cursor-pointer">
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Centered wizard modal */}
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editing && apps.some((a) => a.id === editing.id) ? "Edit Application" : "Add Application"} 
        wide
      >
        {editing && <ApplicationWizardForm initial={editing} onSave={handleSave} onCancel={() => setModalOpen(false)} />}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Application?">
        {confirmDelete && (
          <div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will permanently delete your application for <span className="font-bold text-slate-950">{confirmDelete.jobTitle}</span> at <span className="font-bold text-slate-950">{confirmDelete.companyName}</span>. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 mt-6 border-t border-slate-100 pt-4">
              <Btn variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
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
    apps.forEach((a) => {
      const s = computeFunnelStage(a);
      stageCounts[s] = (stageCounts[s] || 0) + 1;
    });
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
          title="Your Pipeline Funnel is Empty"
          subtitle="Once you add job records, this dashboard will visualize your applications, outreach responses, interviews, and offer rates."
          action={<Btn variant="primary" onClick={() => setPage("applications")}><Plus className="h-4 w-4" /> Add your first application</Btn>}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Applications" value={stats.total} tone="indigo" />
        <StatCard label="Response Rate" value={stats.total ? `${Math.round((stats.responded / stats.total) * 100)}%` : "0%"} sub={`${stats.responded} of ${stats.total} responded`} tone="sky" />
        <StatCard label="Interview Rate" value={stats.total ? `${Math.round((stats.interviewing / stats.total) * 100)}%` : "0%"} sub={`${stats.interviewing} interviewing`} tone="amber" />
        <StatCard label="Offer Conversion" value={stats.total ? `${Math.round((stats.offers / stats.total) * 100)}%` : "0%"} sub={`${stats.offers} offers secured`} tone="emerald" />
      </div>

      {/* Funnel Progress Panel */}
      <Card className="p-5">
        <SectionTitle eyebrow="Funnel Track" title="Pipeline Stages" />
        <FunnelTrack counts={funnelSteps} />
        <div className="mt-4 flex flex-wrap items-center gap-4 pl-1 border-t border-slate-50 pt-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Ended without offer</div>
          <div className="flex gap-2">
            {exitSteps.map(step => (
              <span key={step.key} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
                {step.label}: <span className="text-slate-900 font-bold">{step.value}</span>
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Grid: Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <Card className="p-5">
          <SectionTitle title="Applications by Domain" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={domainData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {domainData.map((d, i) => <Cell key={i} fill={DOMAIN_SWATCH[d.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "11px" }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11, paddingLeft: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Upcomming Follow-ups */}
        <Card className="p-5">
          <SectionTitle title="Upcoming Follow-ups" />
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="All follow-ups complete" subtitle="Active deadlines and follow-up alerts will show here." />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{a.companyName}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{a.jobTitle}</div>
                  </div>
                  <Pill className={a._days < 0 ? "bg-rose-50 text-rose-700 ring-rose-200/50" : a._days === 0 ? "bg-indigo-50 text-indigo-700 ring-indigo-200/50" : "bg-slate-100 text-slate-600 ring-slate-200/50"}>
                    <Clock className="h-3 w-3" />
                    {a._days < 0 ? "Overdue" : a._days === 0 ? "Today" : `In ${a._days}d`}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recently Added Table Preview */}
      <Card className="p-5">
        <SectionTitle title="Recently Tracked" />
        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-50 pb-2">
                <th className="pb-2 font-semibold">Company & Position</th>
                <th className="pb-2 font-semibold">Domain</th>
                <th className="pb-2 font-semibold">Date Applied</th>
                <th className="pb-2 font-semibold text-right">Pipeline Stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recent.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/20 transition-colors">
                  <td className="py-2.5">
                    <span className="font-bold text-slate-800">{a.companyName}</span>
                    <span className="text-slate-400 font-medium mx-1.5">·</span>
                    <span className="text-slate-500">{a.jobTitle}</span>
                  </td>
                  <td className="py-2.5 text-slate-500">{effectiveDomain(a)}</td>
                  <td className="py-2.5 text-slate-400">{formatDate(a.appliedDate)}</td>
                  <td className="py-2.5 text-right"><StagePill stage={computeFunnelStage(a)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   CONTACTS NETWORKING LIST PAGE
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
      <SectionTitle eyebrow="Networking" title="Contacts & Recruiters CRM" />
      {contacts.length === 0 ? (
        <Card><EmptyState icon={Users} title="No outreach contacts logged" subtitle="Add contact name or email inside the Application form to track networking." /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((c, i) => (
            <Card key={i} className="p-4 flex flex-col justify-between min-h-[160px] hover:border-indigo-100 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm leading-tight">{c.name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{c.company}</div>
                  </div>
                  <StagePill stage={computeFunnelStage(c.apps[0])} />
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 mt-2">
                  {c.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <a href={`mailto:${c.email}`} className="hover:text-indigo-600 transition-colors">{c.email}</a>
                    </div>
                  )}
                  {c.linkedin && (
                    <div className="flex items-center gap-1.5">
                      <Linkedin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate max-w-[180px]">{c.linkedin}</span>
                    </div>
                  )}
                  {c.channel && (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Link2 className="h-3.5 w-3.5 text-slate-400/75" />
                      <span>Via {c.channel}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{c.apps.length} Role{c.apps.length > 1 ? "s" : ""} Linked</span>
                <Pill className="bg-indigo-50 text-indigo-700 ring-indigo-200/50">{c.response || "No Response"}</Pill>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ACTIVE INTERVIEWS LIST PAGE
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
      <SectionTitle eyebrow="Active Rounds" title="Upcoming Interviews" />
      {interviews.length === 0 ? (
        <Card><EmptyState icon={CalendarClock} title="No interviews scheduled" subtitle="Active screening and interview stages will show here automatically." /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.map((a) => (
            <Card key={a.id} className="p-4 flex flex-col justify-between hover:border-indigo-100 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{a.companyName}</h3>
                    <p className="text-xs text-slate-500 font-semibold">{a.jobTitle}</p>
                  </div>
                  <StagePill stage={computeFunnelStage(a)} />
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Domain:</span>
                    <span>{effectiveDomain(a)}</span>
                  </div>
                  {a.contactName && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[9px]">Contact:</span>
                      <span>{a.contactName}</span>
                    </div>
                  )}
                  {a.notes && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 text-[11px] text-slate-500 leading-normal">
                      {a.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">{a.currentStage}</span>
                {a.followUpDate && (
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    {formatDate(a.followUpDate)}
                  </span>
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
    <div className="space-y-6">
      <SectionTitle eyebrow="Analytics" title="Rejection Analysis" />
      {rejected.length === 0 ? (
        <Card><EmptyState icon={XCircle} title="No rejections logged" subtitle="All clear! Rejected job roles will populate analytics data here." /></Card>
      ) : (
        <>
          <Card className="p-5">
            <SectionTitle title="Rejection Reasons Breakdown" />
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reasonData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f8fafc" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "11px" }} />
                  <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-4 py-3 font-semibold">Company / Position</th>
                    <th className="px-4 py-3 font-semibold">Domain</th>
                    <th className="px-4 py-3 font-semibold">Applied Date</th>
                    <th className="px-4 py-3 font-semibold">Reason</th>
                    <th className="px-4 py-3 text-right">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejected.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-4 py-3.5 border-l-4 border-rose-500 font-bold text-slate-900 whitespace-nowrap">
                        {a.companyName || "—"}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{a.jobTitle || "—"}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: DOMAIN_SWATCH[effectiveDomain(a)] }} />
                          {effectiveDomain(a)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{formatDate(a.appliedDate)}</td>
                      <td className="px-4 py-3.5">
                        <Pill className="bg-rose-50 text-rose-700 ring-rose-200/50">
                          {a.rejectionReason || "Not Specified"}
                        </Pill>
                      </td>
                      <td className="px-4 py-3.5 text-right max-w-xs truncate text-slate-500" title={a.notes}>
                        {a.notes || "—"}
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
   FUNNEL PERFORMANCE ANALYTICS PAGE
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
          title="No analytics generated"
          subtitle="Generate reports by adding applications to your active pipeline."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Performance" title="Pipeline Analytics" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline Chart */}
        <Card className="p-5">
          <SectionTitle title="Application Timeline" />
          <div style={{ height: 260 }}>
            {historyData.length === 0 ? (
              <EmptyState title="No chronological data" subtitle="Timelines will fill out as you record applications." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                  <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "11px" }} />
                  <Line type="monotone" dataKey="Applications" stroke="#4f46e5" strokeWidth={2.5} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Funnel Conversions */}
        <Card className="p-5">
          <SectionTitle title="Funnel Conversion Stages" />
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#64748b" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "11px" }} />
                <Bar dataKey="Count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Lead Source Double Chart */}
        <Card className="p-5 lg:col-span-2">
          <SectionTitle title="Response Rate & Application Volume by Source" />
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} label={{ value: 'Applications', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#64748b' } }} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 11, fill: "#64748b" }} label={{ value: 'Response Rate', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#64748b' } }} />
                <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", fontSize: "11px" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="Total Applications" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="Response Rate (%)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
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
      <SectionTitle eyebrow="Portability" title="Import & Export CSV" />

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Export Job Data</h3>
          <p className="text-xs text-slate-500 mb-4 leading-normal">
            Download your current funnel applications records as a standard CSV format backup file or open it in a spreadsheet tool.
          </p>
          <Btn variant="primary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV ({apps.length} records)
          </Btn>
        </div>

        <hr className="border-slate-100" />

        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Import Job Data</h3>
          <p className="text-xs text-slate-500 mb-4 leading-normal">
            Upload your saved CSV file to restore records or sync data from another client setup.
          </p>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? "border-indigo-500 bg-indigo-50/20" 
                : "border-slate-200 hover:border-slate-300 bg-slate-50/30 hover:bg-slate-50/60"
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
            <p className="text-xs font-bold text-slate-700">Click to upload or drag & drop</p>
            <p className="text-[10px] text-slate-400 mt-1">Accepts CSV file formats only</p>
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
   SIDEBAR COMPONENT
   ============================================================ */

function Sidebar({ page, setPage, mobileOpen, setMobileOpen, totalApps }) {
  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "applications", label: "Applications", icon: Table2, badge: totalApps },
    { key: "contacts", label: "Contacts", icon: Users },
    { key: "interviews", label: "Interviews", icon: CalendarClock },
    { key: "rejections", label: "Rejections", icon: XCircle },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "importexport", label: "Import/Export", icon: ArrowLeftRight },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setMobileOpen(false)} 
        />
      )}
      <aside
        className={`fixed z-50 md:z-auto md:static top-0 left-0 h-screen w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="h-16 px-6 border-b border-slate-100 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-200">
            J
          </div>
          <span className="font-bold text-slate-800 tracking-tight text-base">
            Job<span className="text-indigo-600">Funnel</span>
          </span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setPage(item.key); setMobileOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  active 
                    ? "bg-indigo-50/60 text-indigo-600 border border-indigo-100/20" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium leading-relaxed">
          Stored securely in LocalStorage.
        </div>
      </aside>
    </>
  );
}

/* ============================================================
   MAIN APPLICATION CONTAINER & SIDEBAR WRAPPER
   ============================================================ */

export default function App() {
  const [apps, setApps] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.map(normalizeApp);
      }
    } catch (e) {
      console.error("Local storage read error:", e);
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
      const prevMap = new Map(prev.map((a) => [a.id, a]));
      newApps.forEach((a) => prevMap.set(a.id, a));
      return Array.from(prevMap.values());
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        page={page}
        setPage={setPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        totalApps={apps.length}
      />
      
      {/* Page Content Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Mobile Nav Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30 md:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>
            <h1 className="text-sm font-black text-slate-800 uppercase tracking-wider">Job Funnel</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Active Sync
            </span>
          </div>
        </header>

        {/* Main View Area */}
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
