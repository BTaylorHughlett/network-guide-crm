import { loadContacts, loadProfile, newId, saveContacts } from "./storage.js";
import { priorityBand, scoreContact } from "./priority.js";
import {
  buildMonthlyReport,
  buildOnboardingState,
  buildOutreachMessage,
  buildProgressSnapshot,
  buildWhatsNext,
  getActivityStreaks,
  loadActivityLog,
  loadMomentumHistory,
  loadPendingFollowups,
  recordActivity,
  removePendingFollowup,
  suggestContactEnrichment,
} from "./smart-tools.js";

const tbody = document.getElementById("contactsBody");
const emptyState = document.getElementById("emptyState");
const table = document.getElementById("contactsTable");
const modal = document.getElementById("contactModal");
const form = document.getElementById("contactForm");
const profilePill = document.getElementById("profilePill");
const bannerHost = document.getElementById("bannerHost");

const addContactBtn = document.getElementById("addContactBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importCsvInput = document.getElementById("importCsvInput");
const importTypeHint = document.getElementById("importTypeHint");
const lastContactedFilter = document.getElementById("lastContactedFilter");
const contactsSearch = document.getElementById("contactsSearch");
const priorityReasonToggle = document.getElementById("priorityReasonToggle");
const priorityReasonBody = document.getElementById("priorityReasonBody");
const emptyAddContactBtn = document.getElementById("emptyAddContactBtn");
const settingsTabLink = document.getElementById("settingsTabLink");
const settingsSection = document.getElementById("settingsSection");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const statAddedMonth = document.getElementById("statAddedMonth");
const statDueWeek = document.getElementById("statDueWeek");
const statTopMomentum = document.getElementById("statTopMomentum");
const statOverdue = document.getElementById("statOverdue");
const suggestionsList = document.getElementById("suggestionsList");
const timelineHost = document.getElementById("timelineHost");
const analyticsSection = document.getElementById("analyticsSection");
const timelineSection = document.getElementById("timelineSection");
const crmPlannerValue = document.getElementById("crmPlannerValue");
const crmPlannerBar = document.getElementById("crmPlannerBar");
const crmContactsValue = document.getElementById("crmContactsValue");
const crmContactsBar = document.getElementById("crmContactsBar");
const crmMomentumValue = document.getElementById("crmMomentumValue");
const crmMomentumBar = document.getElementById("crmMomentumBar");
const crmProgressSummary = document.getElementById("crmProgressSummary");
const whoTodayBtn = document.getElementById("whoTodayBtn");
const whoTodayResult = document.getElementById("whoTodayResult");
const copilotContactSelect = document.getElementById("copilotContactSelect");
const copilotMessageMode = document.getElementById("copilotMessageMode");
const generateMessageBtn = document.getElementById("generateMessageBtn");
const copilotMessageOutput = document.getElementById("copilotMessageOutput");
const monthlyReachoutList = document.getElementById("monthlyReachoutList");
const pendingFollowupList = document.getElementById("pendingFollowupList");
const reportWins = document.getElementById("reportWins");
const reportOpportunities = document.getElementById("reportOpportunities");
const streakOutreach = document.getElementById("streakOutreach");
const streakEvents = document.getElementById("streakEvents");
const streakCrm = document.getElementById("streakCrm");
const nextPanelList = document.getElementById("nextPanelList");
const enrichContactBtn = document.getElementById("enrichContactBtn");
const enrichmentHint = document.getElementById("enrichmentHint");
const pageStatusDot = document.getElementById("pageStatusDot");

const s = {
  profileName: document.getElementById("s_profileName"),
  profileEmail: document.getElementById("s_profileEmail"),
  profilePhone: document.getElementById("s_profilePhone"),
  networkFocus: document.getElementById("s_networkFocus"),
  defaultFollowUp: document.getElementById("s_defaultFollowUp"),
  preferredComms: document.getElementById("s_preferredComms"),
  oldPassword: document.getElementById("s_oldPassword"),
  resetPassword: document.getElementById("s_resetPassword"),
  resetPasswordConfirm: document.getElementById("s_resetPasswordConfirm"),
  resetPasswordBtn: document.getElementById("s_resetPasswordBtn"),
  weightTiming: document.getElementById("s_weightTiming"),
  weightTimingVal: document.getElementById("s_weightTimingVal"),
  weightMomentum: document.getElementById("s_weightMomentum"),
  weightMomentumVal: document.getElementById("s_weightMomentumVal"),
  weightGoalFit: document.getElementById("s_weightGoalFit"),
  weightGoalFitVal: document.getElementById("s_weightGoalFitVal"),
  toggleOverdueRed: document.getElementById("s_toggleOverdueRed"),
  toggleMomentumCoding: document.getElementById("s_toggleMomentumCoding"),
  importHistory: document.getElementById("s_importHistory"),
  exportType: document.getElementById("s_exportType"),
  runExport: document.getElementById("s_runExport"),
  backupBtn: document.getElementById("s_backupBtn"),
  restoreInput: document.getElementById("s_restoreInput"),
  clearContactsBtn: document.getElementById("s_clearContactsBtn"),
  resetAnalyticsBtn: document.getElementById("s_resetAnalyticsBtn"),
  reminderToggle: document.getElementById("s_reminderToggle"),
  reminderTime: document.getElementById("s_reminderTime"),
  notifyOverdue: document.getElementById("s_notifyOverdue"),
  notifyMomentumDrop: document.getElementById("s_notifyMomentumDrop"),
  rowDensity: document.getElementById("s_rowDensity"),
  showAnalytics: document.getElementById("s_showAnalytics"),
  showTimeline: document.getElementById("s_showTimeline"),
  darkMode: document.getElementById("s_darkMode"),
  sortDefault: document.getElementById("s_sortDefault"),
  lockPinToggle: document.getElementById("s_lockPinToggle"),
  lockPin: document.getElementById("s_lockPin"),
  autoLockMins: document.getElementById("s_autoLockMins"),
  storageMode: document.getElementById("s_storageMode"),
  visibilityMode: document.getElementById("s_visibilityMode"),
  integrationLinkedIn: document.getElementById("s_integrationLinkedIn"),
  integrationEmail: document.getElementById("s_integrationEmail"),
  integrationCalendar: document.getElementById("s_integrationCalendar"),
  integrationReminders: document.getElementById("s_integrationReminders"),
  healthContacts: document.getElementById("s_healthContacts"),
  healthStorage: document.getElementById("s_healthStorage"),
  healthBackup: document.getElementById("s_healthBackup"),
  saveSettingsBtn: document.getElementById("s_saveSettingsBtn"),
};

const f = {
  id: document.getElementById("f_id"),
  name: document.getElementById("f_name"),
  company: document.getElementById("f_company"),
  title: document.getElementById("f_title"),
  email: document.getElementById("f_email"),
  phone: document.getElementById("f_phone"),
  linkedin: document.getElementById("f_linkedin"),
  tags: document.getElementById("f_tags"),
  relationship: document.getElementById("f_relationship"),
  status: document.getElementById("f_status"),
  lastContacted: document.getElementById("f_lastContacted"),
  nextFollowUp: document.getElementById("f_nextFollowUp"),
  goalsAlignment: document.getElementById("f_goalsAlignment"),
  notes: document.getElementById("f_notes"),
  lastOutcome: document.getElementById("f_lastOutcome"),
};

let contacts = loadContacts();
let sortKey = "priority";
let sortDir = "desc";
let dateFilter = "";
let searchQuery = "";
let idleLockTimer = null;

const SETTINGS_KEY = "ngc_crm_settings_v1";
const SITES_SETTINGS_KEY = "ngc_sites_settings_v1";
const IMPORT_HISTORY_KEY = "ngc_crm_import_history_v1";
const LAST_BACKUP_KEY = "ngc_crm_last_backup_v1";
const AUTH_ACCOUNTS_KEY = "ngc_accounts_v1";
const AUTH_SESSION_KEY = "ngc_auth_user_v1";

const DEFAULT_SETTINGS = {
  profile: {
    name: "",
    email: "",
    phone: "",
    networkingFocus: "job search",
    defaultFollowUpDays: 7,
    preferredComms: "email",
  },
  scoring: {
    timing: 50,
    momentum: 30,
    goalFit: 20,
    highlightOverdueRed: true,
    showMomentumCoding: true,
  },
  notifications: {
    enabled: false,
    time: "09:00",
    notifyOverdue: true,
    notifyMomentumDrop: false,
  },
  display: {
    rowDensity: "expanded",
    showAnalytics: true,
    showTimeline: true,
    darkMode: false,
    sortDefault: "priority",
  },
  privacy: {
    lockWithPin: false,
    pin: "",
    autoLockMins: 0,
    storageMode: "local",
    visibilityMode: "full",
  },
  integrations: {
    linkedin: false,
    email: false,
    calendar: false,
    reminders: false,
  },
};

const DEFAULT_SITES_SETTINGS = {
  platforms: {
    linkedin: true,
    slack: true,
    meetup: true,
    x: true,
    substack: true,
    upwork: true,
    medium: true,
    eventbrite: true,
    wellfound: true,
  },
  cadence: {
    linkedin: "3x weekly",
    slack: "Daily, 15 min",
    events: "1x monthly",
    writing: "2x monthly",
    upwork: "Weekly refresh",
  },
  persona: "job-seeker",
  momentum: {
    weightVisibility: 35,
    weightConsistency: 35,
    weightExecution: 30,
    includeEvents: true,
    includePublishing: true,
    includeCrm: true,
  },
};

const sitesUi = {
  platforms: {
    linkedin: document.getElementById("sp_linkedin"),
    slack: document.getElementById("sp_slack"),
    meetup: document.getElementById("sp_meetup"),
    x: document.getElementById("sp_x"),
    substack: document.getElementById("sp_substack"),
    upwork: document.getElementById("sp_upwork"),
    medium: document.getElementById("sp_medium"),
    eventbrite: document.getElementById("sp_eventbrite"),
    wellfound: document.getElementById("sp_wellfound"),
  },
  cadence: {
    linkedin: document.getElementById("swf_linkedin"),
    slack: document.getElementById("swf_slack"),
    events: document.getElementById("swf_events"),
    writing: document.getElementById("swf_writing"),
    upwork: document.getElementById("swf_upwork"),
  },
  persona: document.getElementById("sp_persona"),
  momentum: {
    weightVisibility: document.getElementById("sm_weightVisibility"),
    weightVisibilityVal: document.getElementById("sm_weightVisibilityVal"),
    weightConsistency: document.getElementById("sm_weightConsistency"),
    weightConsistencyVal: document.getElementById("sm_weightConsistencyVal"),
    weightExecution: document.getElementById("sm_weightExecution"),
    weightExecutionVal: document.getElementById("sm_weightExecutionVal"),
    includeEvents: document.getElementById("sm_includeEvents"),
    includePublishing: document.getElementById("sm_includePublishing"),
    includeCrm: document.getElementById("sm_includeCrm"),
  },
  saveBtn: document.getElementById("sitesSettingsSaveBtn"),
  resetBtn: document.getElementById("sitesSettingsResetBtn"),
};

function mergeSettings(saved) {
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    profile: { ...DEFAULT_SETTINGS.profile, ...(saved?.profile || {}) },
    scoring: { ...DEFAULT_SETTINGS.scoring, ...(saved?.scoring || {}) },
    notifications: { ...DEFAULT_SETTINGS.notifications, ...(saved?.notifications || {}) },
    display: { ...DEFAULT_SETTINGS.display, ...(saved?.display || {}) },
    privacy: { ...DEFAULT_SETTINGS.privacy, ...(saved?.privacy || {}) },
    integrations: { ...DEFAULT_SETTINGS.integrations, ...(saved?.integrations || {}) },
  };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return mergeSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return mergeSettings(null);
  }
}

function saveSettings(next) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

function mergeSitesSettings(saved) {
  return {
    ...DEFAULT_SITES_SETTINGS,
    ...saved,
    platforms: { ...DEFAULT_SITES_SETTINGS.platforms, ...(saved?.platforms || {}) },
    cadence: { ...DEFAULT_SITES_SETTINGS.cadence, ...(saved?.cadence || {}) },
    momentum: { ...DEFAULT_SITES_SETTINGS.momentum, ...(saved?.momentum || {}) },
  };
}

function loadSitesSettings() {
  try {
    const raw = localStorage.getItem(SITES_SETTINGS_KEY);
    return mergeSitesSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return mergeSitesSettings(null);
  }
}

function saveSitesSettings(next) {
  localStorage.setItem(SITES_SETTINGS_KEY, JSON.stringify(next));
}

function getCurrentSessionUser() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function isStrongPassword(value) {
  const text = String(value || "");
  return text.length >= 8 && /[A-Za-z]/.test(text) && /\d/.test(text) && /[^A-Za-z0-9]/.test(text);
}

function resetCurrentUserPassword() {
  const oldValue = String(s.oldPassword?.value || "");
  const next = String(s.resetPassword?.value || "");
  const confirmValue = String(s.resetPasswordConfirm?.value || "");
  if (!oldValue || !next || !confirmValue) {
    showBanner("warn", "Enter current password and confirm your new password.");
    return;
  }
  if (next !== confirmValue) {
    showBanner("warn", "Password confirmation does not match.");
    return;
  }
  if (!isStrongPassword(next)) {
    showBanner("warn", "Use at least 8 characters with letters, numbers, and symbols.");
    return;
  }

  const sessionUser = getCurrentSessionUser();
  const email = (s.profileEmail?.value || sessionUser?.email || "").trim().toLowerCase();
  if (!email) {
    showBanner("warn", "Add your profile email first so we know which account to update.");
    return;
  }

  const accounts = loadAccounts();
  const idx = accounts.findIndex((account) => String(account.email || "").toLowerCase() === email);
  if (idx === -1) {
    showBanner("warn", "No matching account found for that email.");
    return;
  }
  if (String(accounts[idx].password || "") !== oldValue) {
    showBanner("warn", "Current password is incorrect.");
    return;
  }

  accounts[idx] = { ...accounts[idx], password: next, updatedAt: new Date().toISOString() };
  saveAccounts(accounts);
  if (s.oldPassword) s.oldPassword.value = "";
  if (s.resetPassword) s.resetPassword.value = "";
  if (s.resetPasswordConfirm) s.resetPasswordConfirm.value = "";
  showBanner("info", "Password updated.");
}

let settings = loadSettings();
let sitesSettings = loadSitesSettings();

function applySitesSettingsFromUi() {
  if (!sitesUi.persona) return;
  Object.entries(sitesUi.platforms).forEach(([key, el]) => {
    if (el) sitesSettings.platforms[key] = !!el.checked;
  });
  Object.entries(sitesUi.cadence).forEach(([key, el]) => {
    if (el) sitesSettings.cadence[key] = String(el.value || "").trim() || DEFAULT_SITES_SETTINGS.cadence[key];
  });
  sitesSettings.persona = sitesUi.persona.value || DEFAULT_SITES_SETTINGS.persona;
  if (sitesUi.momentum.weightVisibility) sitesSettings.momentum.weightVisibility = Number(sitesUi.momentum.weightVisibility.value) || 35;
  if (sitesUi.momentum.weightConsistency) sitesSettings.momentum.weightConsistency = Number(sitesUi.momentum.weightConsistency.value) || 35;
  if (sitesUi.momentum.weightExecution) sitesSettings.momentum.weightExecution = Number(sitesUi.momentum.weightExecution.value) || 30;
  if (sitesUi.momentum.includeEvents) sitesSettings.momentum.includeEvents = !!sitesUi.momentum.includeEvents.checked;
  if (sitesUi.momentum.includePublishing) sitesSettings.momentum.includePublishing = !!sitesUi.momentum.includePublishing.checked;
  if (sitesUi.momentum.includeCrm) sitesSettings.momentum.includeCrm = !!sitesUi.momentum.includeCrm.checked;
  saveSitesSettings(sitesSettings);
}

function syncSitesSettingsUi() {
  if (!sitesUi.persona) return;
  Object.entries(sitesUi.platforms).forEach(([key, el]) => {
    if (el) el.checked = !!sitesSettings.platforms[key];
  });
  Object.entries(sitesUi.cadence).forEach(([key, el]) => {
    if (el) el.value = sitesSettings.cadence[key] || DEFAULT_SITES_SETTINGS.cadence[key];
  });
  sitesUi.persona.value = sitesSettings.persona || DEFAULT_SITES_SETTINGS.persona;
  if (sitesUi.momentum.weightVisibility) {
    sitesUi.momentum.weightVisibility.value = String(sitesSettings.momentum.weightVisibility);
    sitesUi.momentum.weightVisibilityVal.textContent = String(sitesSettings.momentum.weightVisibility);
  }
  if (sitesUi.momentum.weightConsistency) {
    sitesUi.momentum.weightConsistency.value = String(sitesSettings.momentum.weightConsistency);
    sitesUi.momentum.weightConsistencyVal.textContent = String(sitesSettings.momentum.weightConsistency);
  }
  if (sitesUi.momentum.weightExecution) {
    sitesUi.momentum.weightExecution.value = String(sitesSettings.momentum.weightExecution);
    sitesUi.momentum.weightExecutionVal.textContent = String(sitesSettings.momentum.weightExecution);
  }
  if (sitesUi.momentum.includeEvents) sitesUi.momentum.includeEvents.checked = !!sitesSettings.momentum.includeEvents;
  if (sitesUi.momentum.includePublishing) sitesUi.momentum.includePublishing.checked = !!sitesSettings.momentum.includePublishing;
  if (sitesUi.momentum.includeCrm) sitesUi.momentum.includeCrm.checked = !!sitesSettings.momentum.includeCrm;
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDisplayDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return parseDate(text.slice(0, 10));
  const direct = new Date(text);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function formatDisplayDate(value, fallback = "") {
  const parsed = parseDisplayDate(value);
  if (!parsed) return fallback;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${month}/${day}/${year}`;
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function startOfToday() {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return t;
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function goalFitScore(contact, goalText) {
  const goalTokens = tokenize(goalText).filter((t) => t.length > 3);
  if (!goalTokens.length) return 0;
  const hay = tokenize([contact.goalsAlignment, contact.notes, contact.tags, contact.company, contact.title].join(" "));
  return goalTokens.filter((t) => hay.includes(t)).length;
}

function signalClass(contact, score, goalText) {
  if (!settings.scoring.showMomentumCoding) return "";
  const today = startOfToday();
  const next = parseDate(contact.nextFollowUp);
  if (settings.scoring.highlightOverdueRed && next && daysBetween(next, today) < 0) return "row-signal-red";
  if (goalFitScore(contact, goalText) > 0) return "row-signal-blue";
  if (score >= 72) return "row-signal-green";
  return "row-signal-yellow";
}

function priorityReason(contact, goalText) {
  const today = startOfToday();
  const last = parseDate(contact.lastContacted);
  const lastDays = last ? daysBetween(today, last) : null;
  const timing = lastDays == null ? "No recent contact logged" : `${lastDays} day(s) since last contact`;
  const momentum = contact.status || contact.relationship || "exploring";
  const fitHits = goalFitScore(contact, goalText);
  const fit = fitHits > 0 ? `Aligned (${fitHits} goal keyword match)` : "Low alignment";
  return `Timing: ${timing} | Momentum: ${momentum} | Goal Fit: ${fit}`;
}

function filterByLastContacted(list) {
  if (!dateFilter) return list;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return list.filter((c) => {
    const lastDate = parseDate(c.lastContacted);
    
    if (dateFilter === "never") {
      return !lastDate;
    }
    
    if (!lastDate) return false;
    
    const days = daysBetween(today, lastDate);
    
    if (dateFilter === "7") return days <= 7 && days >= 0;
    if (dateFilter === "14") return days <= 14 && days >= 0;
    if (dateFilter === "30") return days <= 30 && days >= 0;
    if (dateFilter === "90") return days <= 90 && days >= 0;
    if (dateFilter === "90+") return days > 90;
    
    return true;
  });
}

function filterBySearch(list) {
  const q = String(searchQuery || "").trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => {
    const haystack = [
      c.name,
      c.company,
      c.title,
      c.relationship,
      c.status,
      c.tags,
      c.goalsAlignment,
      c.notes,
      c.lastOutcome,
      c.email,
      c.phone,
      c.linkedin,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

function userGoalText() {
  const p = loadProfile();
  return p && p.goal ? String(p.goal) : "";
}

function refreshProfilePill() {
  const p = loadProfile();
  if (p && p.goal) {
    const short = p.goal.length > 72 ? `${p.goal.slice(0, 72)}…` : p.goal;
    profilePill.textContent = `Planner goal: ${short}`;
  } else {
    profilePill.textContent = "Step 1: Set your networking goal in Planner";
  }
}

function showBanner(kind, message) {
  bannerHost.innerHTML = "";
  const el = document.createElement("div");
  el.className = `banner ${kind}`;
  el.textContent = message;
  bannerHost.appendChild(el);
}

function withScores(list) {
  const goal = userGoalText();
  return list.map((c) => ({
    ...c,
    __score: scoreContact(c, goal, {
      weights: {
        timing: settings.scoring.timing,
        momentum: settings.scoring.momentum,
        goalFit: settings.scoring.goalFit,
      },
    }),
  }));
}

function maskValue(v) {
  const s = String(v || "");
  if (!s) return "";
  if (s.length <= 4) return "*".repeat(s.length);
  return `${s.slice(0, 2)}${"*".repeat(Math.max(2, s.length - 4))}${s.slice(-2)}`;
}

function toTitleCaseWord(word) {
  const w = String(word || "").trim();
  if (!w) return "";
  if (/^[a-z]{1,3}$/i.test(w) && w.toUpperCase() === w) return w;
  return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
}

function guessNameFromLinkedInUrl(value) {
  let input = String(value || "").trim();
  if (!input) return "";
  if (!/^https?:\/\//i.test(input)) input = `https://${input}`;

  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return "";
  }

  if (!/linkedin\.com$/i.test(parsed.hostname) && !/\.linkedin\.com$/i.test(parsed.hostname)) {
    return "";
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  const idx = segments.indexOf("in");
  if (idx === -1 || !segments[idx + 1]) return "";

  const slug = decodeURIComponent(segments[idx + 1])
    .replace(/[-_]+/g, " ")
    .replace(/\d+$/g, "")
    .trim();
  if (!slug) return "";

  const stop = new Set(["official", "profile", "linkedin"]);
  const words = slug
    .split(/\s+/)
    .map((part) => part.replace(/[^a-zA-Z'.]/g, ""))
    .filter((part) => part && !stop.has(part.toLowerCase()));
  if (!words.length) return "";

  return words.map(toTitleCaseWord).join(" ").trim();
}

function autoPopulateFromLinkedInUrl() {
  const linkedInUrl = f.linkedin.value.trim();
  if (!linkedInUrl) return;

  const guessedName = guessNameFromLinkedInUrl(linkedInUrl);
  const updated = [];

  if (guessedName && !f.name.value.trim()) {
    f.name.value = guessedName;
    updated.push("name");
  }

  if (!f.tags.value.trim()) {
    f.tags.value = "linkedin";
    updated.push("tags");
  }

  if (enrichmentHint && updated.length) {
    enrichmentHint.textContent = `Auto-filled ${updated.join(" + ")} from LinkedIn URL. Add company/title or click Suggest enrichment for more.`;
  }
}

function updateSystemHealth() {
  if (s.healthContacts) s.healthContacts.textContent = String(contacts.length);
  const usage = new Blob([JSON.stringify(localStorage)]).size;
  if (s.healthStorage) s.healthStorage.textContent = `${(usage / 1024).toFixed(1)} KB`;
  if (s.healthBackup) s.healthBackup.textContent = formatDisplayDate(localStorage.getItem(LAST_BACKUP_KEY), "Never");
}

function applyDisplaySettings() {
  table.classList.toggle("compact-rows", settings.display.rowDensity === "compact");
  if (analyticsSection) analyticsSection.hidden = !settings.display.showAnalytics;
  if (timelineSection) timelineSection.hidden = !settings.display.showTimeline;
  document.body.classList.toggle("crm-force-dark", !!settings.display.darkMode);
}

function updateImportHistoryText() {
  if (!s.importHistory) return;
  try {
    const raw = localStorage.getItem(IMPORT_HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!parsed.length) {
      s.importHistory.textContent = "No imports yet.";
      return;
    }
    const last = parsed[parsed.length - 1];
    s.importHistory.textContent = `${last.count} contact(s) on ${formatDisplayDate(last.when, String(last.when || ""))}`;
  } catch {
    s.importHistory.textContent = "No imports yet.";
  }
}

function openSettingsPanel() {
  if (!settingsSection || !settingsBackdrop) return;
  settingsBackdrop.hidden = false;
  settingsSection.hidden = false;
  settingsCloseBtn?.focus();
}

function closeSettingsPanel() {
  if (!settingsSection || !settingsBackdrop) return;
  settingsBackdrop.hidden = true;
  settingsSection.hidden = true;
}

function sortContacts(list) {
  const enriched = withScores(list);
  const dir = sortDir === "asc" ? 1 : -1;
  enriched.sort((a, b) => {
    if (sortKey === "priority") return (a.__score - b.__score) * -dir;
    const av = (a[sortKey] || "").toString().toLowerCase();
    const bv = (b[sortKey] || "").toString().toLowerCase();
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });
  return enriched;
}

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  refreshProfilePill();
  tbody.innerHTML = "";

  if (!contacts.length) {
    emptyState.hidden = false;
    table.hidden = true;
    renderAnalytics([], []);
    renderSuggestions([], [], userGoalText());
    renderTimeline([]);
    return;
  }

  emptyState.hidden = true;
  table.hidden = false;

  const filtered = filterBySearch(filterByLastContacted(contacts));
  const rows = sortContacts(filtered);
  const goal = userGoalText();
  for (const c of rows) {
    const band = priorityBand(c.__score);
    const mailto = c.email ? `mailto:${encodeURIComponent(c.email)}` : "";
    const li = c.linkedin ? String(c.linkedin) : "";
    const reason = priorityReason(c, goal);
    const rowSignal = signalClass(c, c.__score, goal);

    const emailText = settings.privacy.visibilityMode === "masked" ? maskValue(c.email) : c.email;
    const phoneText = settings.privacy.visibilityMode === "masked" ? maskValue(c.phone) : c.phone;

    const tr = document.createElement("tr");
    tr.className = rowSignal;
    tr.innerHTML = `
      <td>
        <span class="badge ${band.cls}" title="Score ${c.__score}/100">${esc(band.label)} · ${c.__score}</span>
        <div class="priority-reason">${esc(reason)}</div>
      </td>
      <td><strong>${esc(c.name)}</strong></td>
      <td>${esc(c.company)}</td>
      <td>${esc(c.title)}</td>
      <td>${esc(c.relationship)}</td>
      <td>${esc(c.status)}</td>
      <td>${esc(formatDisplayDate(c.lastContacted))}</td>
      <td>${esc(formatDisplayDate(c.nextFollowUp))}</td>
      <td>${esc(c.tags)}</td>
      <td>${esc([c.goalsAlignment, c.notes].filter(Boolean).join(" — "))}</td>
      <td>${esc(c.lastOutcome)}</td>
      <td>
        ${mailto ? `<a href="${esc(mailto)}">${esc(emailText || "Email")}</a>` : `<span class="hint">—</span>`}
        ${phoneText ? `<div class="hint">${esc(phoneText)}</div>` : ""}
        ${li ? `<div><a href="${esc(li)}" target="_blank" rel="noopener">LinkedIn</a></div>` : ""}
      </td>
      <td class="cell-actions">
        <button type="button" data-action="edit" data-id="${esc(c.id)}">Edit</button>
        <button type="button" data-action="dup" data-id="${esc(c.id)}">Duplicate</button>
        <button type="button" data-action="del" data-id="${esc(c.id)}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  }

  const scoredAll = sortContacts(contacts.slice());
  renderAnalytics(scoredAll, filtered);
  renderSuggestions(scoredAll, filtered, goal);
  renderTimeline(scoredAll);
  renderCopilot(scoredAll);
  renderMonthlyReport();
  renderProgressAndNext();
  applyDisplaySettings();
  updateSystemHealth();
}

function renderAnalytics(scoredAll, filtered) {
  const today = startOfToday();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const addedMonth = contacts.filter((c) => {
    const d = parseDate(c.createdAt ? String(c.createdAt).slice(0, 10) : "");
    return d && d >= monthStart;
  }).length;

  const dueWeek = contacts.filter((c) => {
    const d = parseDate(c.nextFollowUp);
    return d && d >= today && d <= weekEnd;
  }).length;

  const overdue = contacts.filter((c) => {
    const d = parseDate(c.nextFollowUp);
    return d && d < today;
  }).length;

  const top3 = scoredAll.slice(0, 3).map((c) => c.name).filter(Boolean);

  statAddedMonth.textContent = String(addedMonth);
  statDueWeek.textContent = String(dueWeek);
  statOverdue.textContent = String(overdue);
  statTopMomentum.textContent = top3.length ? top3.join(", ") : "-";
}

function renderSuggestions(scoredAll, filtered, goal) {
  const today = startOfToday();
  const items = [];

  const goalAligned = scoredAll.filter((c) => goalFitScore(c, goal) > 0).slice(0, 2);
  if (goalAligned.length) {
    items.push(`Reach out to ${goalAligned.length} contact(s) aligned with your current goal.`);
  }

  let staled = null;
  for (const c of scoredAll) {
    const last = parseDate(c.lastContacted);
    if (!last) continue;
    const d = daysBetween(today, last);
    if (!staled || d > staled.days) staled = { name: c.name, days: d };
  }
  if (staled) {
    items.push(`You have not followed up with ${staled.name} in ${staled.days} day(s).`);
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const addedMonth = contacts.filter((c) => {
    const d = parseDate(c.createdAt ? String(c.createdAt).slice(0, 10) : "");
    return d && d >= monthStart;
  }).length;
  if (addedMonth > 0) {
    items.push(`You added ${addedMonth} new contact(s) this month. Consider tagging them.`);
  }

  suggestionsList.innerHTML = "";
  const out = items.length ? items : ["Add contacts to unlock personalized suggestions."];
  for (const text of out) {
    const li = document.createElement("li");
    li.textContent = text;
    suggestionsList.appendChild(li);
  }
}

function renderTimeline(scoredAll) {
  timelineHost.innerHTML = "";
  if (!scoredAll.length) {
    timelineHost.innerHTML = '<p class="hint" style="margin: 0">Add contacts to view timeline milestones.</p>';
    return;
  }

  const top = scoredAll.slice(0, 8);
  for (const c of top) {
    const card = document.createElement("article");
    card.className = "timeline-card";
    const firstInteraction = c.createdAt
      ? formatDisplayDate(String(c.createdAt).slice(0, 10), "Not captured")
      : formatDisplayDate(c.lastContacted, "Not captured");
    const notesAdded = c.notes ? "Yes" : "No";
    const followups = c.lastContacted ? "At least one" : "None yet";
    const milestone = c.lastOutcome || "No milestone recorded yet";
    card.innerHTML = `
      <h3>${esc(c.name)}</h3>
      <ul>
        <li><strong>First interaction:</strong> ${esc(firstInteraction)}</li>
        <li><strong>Notes added:</strong> ${esc(notesAdded)}</li>
        <li><strong>Follow-ups completed:</strong> ${esc(followups)}</li>
        <li><strong>Milestone:</strong> ${esc(milestone)}</li>
      </ul>
    `;
    timelineHost.appendChild(card);
  }
}

function openModal(contact) {
  const isNew = !contact;
  f.id.value = contact?.id || "";
  f.name.value = contact?.name || "";
  f.company.value = contact?.company || "";
  f.title.value = contact?.title || "";
  f.email.value = contact?.email || "";
  f.phone.value = contact?.phone || "";
  f.linkedin.value = contact?.linkedin || "";
  f.tags.value = contact?.tags || "";
  f.relationship.value = contact?.relationship || "warm";
  f.status.value = contact?.status || "exploring";
  f.lastContacted.value = contact?.lastContacted || "";
  f.nextFollowUp.value = contact?.nextFollowUp || "";
  f.goalsAlignment.value = contact?.goalsAlignment || "";
  f.notes.value = contact?.notes || "";
  f.lastOutcome.value = contact?.lastOutcome || "";

  if (isNew) {
    f.name.placeholder = "Jordan Lee - Hiring Manager at Acme Corp";
    f.notes.placeholder = "Met at Tech Meetup. Interested in data roles.";
    f.nextFollowUp.placeholder = "In 7 days - send portfolio link";
    if (!f.nextFollowUp.value) {
        const d = new Date();
        d.setDate(d.getDate() + Number(settings.profile.defaultFollowUpDays || 7));
      f.nextFollowUp.value = d.toISOString().slice(0, 10);
    }
  }

  document.getElementById("modalTitle").textContent = contact?.id ? "Edit contact" : "Add contact";
  modal.showModal();
}

function readFormContact() {
  const existing = contacts.find((c) => c.id === f.id.value);
  return {
    id: f.id.value || newId(),
    name: f.name.value.trim(),
    company: f.company.value.trim(),
    title: f.title.value.trim(),
    email: f.email.value.trim(),
    phone: f.phone.value.trim(),
    linkedin: f.linkedin.value.trim(),
    tags: f.tags.value.trim(),
    relationship: f.relationship.value,
    status: f.status.value,
    lastContacted: f.lastContacted.value,
    nextFollowUp: f.nextFollowUp.value,
    goalsAlignment: f.goalsAlignment.value.trim(),
    notes: f.notes.value.trim(),
    lastOutcome: f.lastOutcome.value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
}

function upsertContact(next) {
  const idx = contacts.findIndex((c) => c.id === next.id);
  if (idx === -1) contacts = [next, ...contacts];
  else contacts[idx] = next;
  saveContacts(contacts);
  recordActivity("contact-saved", { name: next.name, status: next.status });
  render();
}

function deleteContact(id) {
  contacts = contacts.filter((c) => c.id !== id);
  saveContacts(contacts);
  recordActivity("contact-deleted", { id });
  render();
}

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.getAttribute("data-id");
  const c = contacts.find((x) => x.id === id);
  if (!c) return;

  if (btn.dataset.action === "edit") openModal(c);
  if (btn.dataset.action === "dup") {
    openModal({ ...c, id: "", name: `${c.name} (copy)` });
  }
  if (btn.dataset.action === "del") {
    if (confirm(`Delete ${c.name}?`)) deleteContact(id);
  }
});

table.querySelectorAll("th[data-sort]").forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.getAttribute("data-sort");
    if (key === sortKey) sortDir = sortDir === "asc" ? "desc" : "asc";
    else {
      sortKey = key;
      sortDir = key === "priority" ? "desc" : "asc";
    }
    render();
  });
});

lastContactedFilter.addEventListener("change", (e) => {
  dateFilter = e.target.value;
  render();
});

if (contactsSearch) {
  contactsSearch.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    render();
  });
}

addContactBtn.addEventListener("click", () => openModal(null));
if (emptyAddContactBtn) {
  emptyAddContactBtn.addEventListener("click", () => openModal(null));
}

if (priorityReasonToggle && priorityReasonBody) {
  priorityReasonToggle.addEventListener("click", () => {
    const expanded = priorityReasonToggle.getAttribute("aria-expanded") === "true";
    priorityReasonToggle.setAttribute("aria-expanded", String(!expanded));
    priorityReasonToggle.textContent = expanded ? "Expand" : "Collapse";
    priorityReasonBody.hidden = expanded;
  });
}

if (settingsTabLink) {
  settingsTabLink.addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel();
  });
}

if (settingsCloseBtn) {
  settingsCloseBtn.addEventListener("click", () => {
    closeSettingsPanel();
  });
}

if (settingsBackdrop) {
  settingsBackdrop.addEventListener("click", () => {
    closeSettingsPanel();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && settingsSection && !settingsSection.hidden) {
    closeSettingsPanel();
  }
});

form.addEventListener("submit", (e) => {
  const action = e.submitter && "value" in e.submitter ? e.submitter.value : "save";
  if (action === "cancel") return;
  e.preventDefault();
  if (!form.reportValidity()) return;
  upsertContact(readFormContact());
  modal.close();
});

function exportContactsCsv() {
  const header = [
    "id",
    "createdAt",
    "name",
    "company",
    "title",
    "email",
    "phone",
    "linkedin",
    "tags",
    "relationship",
    "status",
    "lastContacted",
    "nextFollowUp",
    "goalsAlignment",
    "notes",
    "lastOutcome",
  ];
  const lines = [header.join(",")];
  for (const c of contacts) {
    const row = header.map((key) => `"${String(c[key] ?? "").replaceAll('"', '""')}"`);
    lines.push(row.join(","));
  }
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "network-guide-contacts.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function exportContactsJson(fileName = "network-guide-contacts-backup.json") {
  const payload = {
    exportedAt: new Date().toISOString(),
    contacts,
    settings,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeHeaderName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectCsvSource(header) {
  const has = (name) => header.includes(name);
  const linkedInSignals = ["first name", "last name", "email address", "position", "connected on"];
  const linkedInHits = linkedInSignals.filter((name) => has(name)).length;
  return linkedInHits >= 3 ? "linkedin" : "generic";
}

function buildContactFromCsvRow(line, header, source) {
  const idx = (name) => header.indexOf(name);
  const get = (name) => {
    const i = idx(name);
    return i > -1 ? String(line[i] ?? "").trim() : "";
  };

  if (source === "linkedin") {
    const first = get("first name");
    const last = get("last name");
    const fullName = [first, last].filter(Boolean).join(" ").trim();
    const linkedInUrl = get("profile url") || get("linkedin profile") || "";
    return {
      id: newId(),
      name: fullName,
      company: get("company"),
      title: get("position"),
      email: get("email address"),
      phone: "",
      linkedin: linkedInUrl,
      tags: "linkedin import",
      relationship: "new",
      status: "exploring",
      lastContacted: "",
      nextFollowUp: "",
      goalsAlignment: "",
      notes: "Imported from LinkedIn CSV",
      lastOutcome: "",
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: get("id") || newId(),
    name: get("name"),
    company: get("company"),
    title: get("title"),
    email: get("email"),
    phone: get("phone"),
    linkedin: get("linkedin"),
    tags: get("tags"),
    relationship: get("relationship") || "new",
    status: get("status") || "exploring",
    lastContacted: get("lastcontacted") || get("last contacted") || "",
    nextFollowUp: get("nextfollowup") || get("next follow up") || get("next follow-up") || "",
    goalsAlignment: get("goalsalignment") || get("goals alignment") || "",
    notes: get("notes"),
    lastOutcome: get("lastoutcome") || get("last outcome") || "",
    createdAt: get("createdat") || new Date().toISOString(),
  };
}

function resetAnalytics() {
  contacts = contacts.map((c) => ({ ...c, createdAt: new Date().toISOString() }));
  saveContacts(contacts);
  localStorage.removeItem(IMPORT_HISTORY_KEY);
  updateImportHistoryText();
  render();
}

function applySettingsFromUi() {
  settings.profile.name = s.profileName.value.trim();
  settings.profile.email = s.profileEmail.value.trim();
  settings.profile.phone = s.profilePhone.value.trim();
  settings.profile.networkingFocus = s.networkFocus.value;
  settings.profile.defaultFollowUpDays = Number(s.defaultFollowUp.value) || 7;
  settings.profile.preferredComms = s.preferredComms.value;

  settings.scoring.timing = Number(s.weightTiming.value) || 50;
  settings.scoring.momentum = Number(s.weightMomentum.value) || 30;
  settings.scoring.goalFit = Number(s.weightGoalFit.value) || 20;
  settings.scoring.highlightOverdueRed = s.toggleOverdueRed.checked;
  settings.scoring.showMomentumCoding = s.toggleMomentumCoding.checked;

  settings.notifications.enabled = s.reminderToggle.checked;
  settings.notifications.time = s.reminderTime.value || "09:00";
  settings.notifications.notifyOverdue = s.notifyOverdue.checked;
  settings.notifications.notifyMomentumDrop = s.notifyMomentumDrop.checked;

  settings.display.rowDensity = s.rowDensity.value;
  settings.display.showAnalytics = s.showAnalytics.checked;
  settings.display.showTimeline = s.showTimeline.checked;
  settings.display.darkMode = s.darkMode.checked;
  settings.display.sortDefault = s.sortDefault.value;

  settings.privacy.lockWithPin = s.lockPinToggle.checked;
  settings.privacy.pin = s.lockPin.value.trim();
  settings.privacy.autoLockMins = Number(s.autoLockMins.value) || 0;
  settings.privacy.storageMode = s.storageMode.value;
  settings.privacy.visibilityMode = s.visibilityMode.value;

  settings.integrations.linkedin = s.integrationLinkedIn.checked;
  settings.integrations.email = s.integrationEmail.checked;
  settings.integrations.calendar = s.integrationCalendar.checked;
  settings.integrations.reminders = s.integrationReminders.checked;

  saveSettings(settings);
}

function syncUiFromSettings() {
  s.profileName.value = settings.profile.name || "";
  s.profileEmail.value = settings.profile.email || "";
  s.profilePhone.value = settings.profile.phone || "";
  s.networkFocus.value = settings.profile.networkingFocus;
  s.defaultFollowUp.value = String(settings.profile.defaultFollowUpDays);
  s.preferredComms.value = settings.profile.preferredComms;

  if (!s.profileEmail.value) {
    const sessionUser = getCurrentSessionUser();
    if (sessionUser?.email) s.profileEmail.value = String(sessionUser.email);
  }

  s.weightTiming.value = String(settings.scoring.timing);
  s.weightMomentum.value = String(settings.scoring.momentum);
  s.weightGoalFit.value = String(settings.scoring.goalFit);
  s.weightTimingVal.textContent = String(settings.scoring.timing);
  s.weightMomentumVal.textContent = String(settings.scoring.momentum);
  s.weightGoalFitVal.textContent = String(settings.scoring.goalFit);
  s.toggleOverdueRed.checked = settings.scoring.highlightOverdueRed;
  s.toggleMomentumCoding.checked = settings.scoring.showMomentumCoding;

  s.reminderToggle.checked = settings.notifications.enabled;
  s.reminderTime.value = settings.notifications.time;
  s.notifyOverdue.checked = settings.notifications.notifyOverdue;
  s.notifyMomentumDrop.checked = settings.notifications.notifyMomentumDrop;

  s.rowDensity.value = settings.display.rowDensity;
  s.showAnalytics.checked = settings.display.showAnalytics;
  s.showTimeline.checked = settings.display.showTimeline;
  s.darkMode.checked = settings.display.darkMode;
  s.sortDefault.value = settings.display.sortDefault;

  s.lockPinToggle.checked = settings.privacy.lockWithPin;
  s.lockPin.value = settings.privacy.pin || "";
  s.autoLockMins.value = String(settings.privacy.autoLockMins || 0);
  s.storageMode.value = settings.privacy.storageMode;
  s.visibilityMode.value = settings.privacy.visibilityMode;

  s.integrationLinkedIn.checked = settings.integrations.linkedin;
  s.integrationEmail.checked = settings.integrations.email;
  s.integrationCalendar.checked = settings.integrations.calendar;
  s.integrationReminders.checked = settings.integrations.reminders;

  updateImportHistoryText();
  updateSystemHealth();
}

function setupIdleLock() {
  if (idleLockTimer) {
    clearTimeout(idleLockTimer);
    idleLockTimer = null;
  }
  const mins = Number(settings.privacy.autoLockMins || 0);
  if (!settings.privacy.lockWithPin || !settings.privacy.pin || mins <= 0) return;

  const restart = () => {
    if (idleLockTimer) clearTimeout(idleLockTimer);
    idleLockTimer = setTimeout(() => {
      const entered = window.prompt("App locked. Enter your PIN to continue:", "");
      if (entered !== settings.privacy.pin) {
        alert("Incorrect PIN. Refresh and try again.");
        return;
      }
      setupIdleLock();
    }, mins * 60 * 1000);
  };

  ["click", "keydown", "mousemove", "touchstart"].forEach((ev) => {
    window.addEventListener(ev, restart, { passive: true });
  });
  restart();
}

function renderProgressAndNext() {
  const profile = loadProfile();
  const momentumHistory = loadMomentumHistory();
  const pendingFollowups = loadPendingFollowups();
  const snapshot = buildProgressSnapshot(profile, contacts, momentumHistory);
  const onboarding = buildOnboardingState(profile, contacts, momentumHistory);
  const next = buildWhatsNext("crm", {
    profile,
    contacts,
    momentumHistory,
    pendingFollowups,
  });
  const firstIncomplete = onboarding.find((step) => !step.done);

  if (pageStatusDot) {
    pageStatusDot.classList.remove("is-not-started", "is-in-progress", "is-complete");
    if (snapshot.contactsCount >= 3) pageStatusDot.classList.add("is-complete");
    else if (snapshot.contactsCount > 0) pageStatusDot.classList.add("is-in-progress");
    else pageStatusDot.classList.add("is-not-started");
  }

  if (crmPlannerValue) crmPlannerValue.textContent = `${snapshot.plannerPercent}%`;
  if (crmPlannerBar) crmPlannerBar.style.width = `${snapshot.plannerPercent}%`;
  if (crmContactsValue) crmContactsValue.textContent = `${snapshot.contactsCount} contact${snapshot.contactsCount === 1 ? "" : "s"}`;
  if (crmContactsBar) crmContactsBar.style.width = `${Math.min(100, Math.round((snapshot.contactsCount / 3) * 100))}%`;
  if (crmMomentumValue) crmMomentumValue.textContent = snapshot.momentumCount ? `${snapshot.momentumCount} score entr${snapshot.momentumCount === 1 ? "y" : "ies"}` : "No scores yet";
  if (crmMomentumBar) crmMomentumBar.style.width = `${Math.min(100, Math.round((snapshot.momentumCount / 6) * 100))}%`;
  if (crmProgressSummary) {
    crmProgressSummary.textContent = firstIncomplete
      ? `${firstIncomplete.label} — ${firstIncomplete.detail}`
      : "Core workflow completed. Use the copilot daily and keep your report moving forward.";
  }
  if (nextPanelList) nextPanelList.innerHTML = next.items.map((item) => `<li>${item}</li>`).join("");
}

function renderCopilot(scoredAll) {
  if (copilotContactSelect) {
    const prev = copilotContactSelect.value;
    copilotContactSelect.innerHTML = '<option value="">Select a contact</option>';
    scoredAll.forEach((contact) => {
      const opt = document.createElement("option");
      opt.value = contact.id;
      opt.textContent = `${contact.name} — ${contact.company || contact.title || "No company yet"}`;
      copilotContactSelect.appendChild(opt);
    });
    copilotContactSelect.value = prev && contacts.some((contact) => contact.id === prev) ? prev : "";
  }

  if (monthlyReachoutList) {
    monthlyReachoutList.innerHTML = "";
    const top = scoredAll.slice(0, 3);
    const goal = userGoalText() || "your current goal";
    const items = top.length ? top : [];
    if (!items.length) {
      monthlyReachoutList.innerHTML = "<li>Add contacts to build your shortlist.</li>";
    } else {
      items.forEach((contact, index) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${index + 1}. ${esc(contact.name)}</strong> — ${esc(contact.company || contact.title || "Priority contact")} · ${esc(goalFitScore(contact, goal) ? "strong goal fit" : "timing / momentum priority")}`;
        monthlyReachoutList.appendChild(li);
      });
    }
  }

  if (pendingFollowupList) {
    const drafts = loadPendingFollowups();
    pendingFollowupList.innerHTML = "";
    if (!drafts.length) {
      pendingFollowupList.innerHTML = "<li>No pending drafts yet. Save one from the Playbook event generator.</li>";
    } else {
      drafts.forEach((draft) => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${esc(draft.title)}</strong><br>${esc(draft.note)}`;
        const row = document.createElement("div");
        row.className = "row-actions";
        row.style.marginTop = "0.4rem";
        const dismiss = document.createElement("button");
        dismiss.type = "button";
        dismiss.textContent = "Dismiss";
        dismiss.addEventListener("click", () => {
          removePendingFollowup(draft.id);
          render();
        });
        row.appendChild(dismiss);
        li.appendChild(row);
        pendingFollowupList.appendChild(li);
      });
    }
  }
}

function renderMonthlyReport() {
  const report = buildMonthlyReport({
    contacts,
    momentumHistory: loadMomentumHistory(),
    activityLog: loadActivityLog(),
  });
  const streaks = getActivityStreaks(loadActivityLog());

  if (streakOutreach) streakOutreach.textContent = String(streaks.outreachDays);
  if (streakEvents) streakEvents.textContent = String(streaks.eventWeeks);
  if (streakCrm) streakCrm.textContent = String(streaks.crmUpdateDays);
  if (reportWins) reportWins.innerHTML = report.wins.map((item) => `<li>${item}</li>`).join("");
  if (reportOpportunities) reportOpportunities.innerHTML = report.opportunities.map((item) => `<li>${item}</li>`).join("");
}

function contactById(id) {
  return contacts.find((contact) => contact.id === id) || null;
}

function renderTodayRecommendation() {
  if (!whoTodayResult) return;
  const scored = sortContacts(contacts.slice());
  const contact = scored[0];
  if (!contact) {
    whoTodayResult.textContent = "Add contacts to generate a recommendation.";
    return;
  }
  const profile = loadProfile();
  const draft = buildOutreachMessage({ profile, contact, mode: "follow-up" });
  whoTodayResult.innerHTML = `
    <p><strong>${esc(contact.name)}</strong> — ${esc(contact.company || contact.title || "Priority contact")}</p>
    <p>${esc(priorityReason(contact, userGoalText()))}</p>
    <p><strong>Suggested next action:</strong> Send the follow-up below and set ${esc(formatDisplayDate(contact.nextFollowUp, "a next follow-up date"))} before you close the loop.</p>
    <pre class="generated-copy">${esc(draft)}</pre>
    <div class="row-actions" style="margin-top: 0.75rem">
      <button type="button" id="logOutreachBtn">Log outreach done</button>
    </div>
  `;
  const logBtn = document.getElementById("logOutreachBtn");
  if (logBtn) {
    logBtn.addEventListener("click", () => {
      recordActivity("outreach-logged", { contactId: contact.id, name: contact.name });
      showBanner("info", `Logged outreach for ${contact.name}.`);
      renderMonthlyReport();
    });
  }
}

function generateSelectedMessage() {
  const contact = contactById(copilotContactSelect?.value);
  if (!contact || !copilotMessageOutput) {
    if (copilotMessageOutput) copilotMessageOutput.textContent = "Choose a contact to generate a personalized outreach draft.";
    return;
  }
  const draft = buildOutreachMessage({
    profile: loadProfile(),
    contact,
    mode: copilotMessageMode?.value || "intro",
  });
  copilotMessageOutput.textContent = draft;
}

if (whoTodayBtn) {
  whoTodayBtn.addEventListener("click", () => {
    renderTodayRecommendation();
  });
}

if (generateMessageBtn) {
  generateMessageBtn.addEventListener("click", generateSelectedMessage);
}

if (enrichContactBtn) {
  enrichContactBtn.addEventListener("click", () => {
    const suggestion = suggestContactEnrichment({
      name: f.name.value,
      company: f.company.value,
      title: f.title.value,
    });
    if (!f.linkedin.value && suggestion.linkedin) f.linkedin.value = suggestion.linkedin;
    if (!f.title.value && suggestion.titleSuggestion) f.title.value = suggestion.titleSuggestion;
    if (!f.tags.value && suggestion.tags) f.tags.value = suggestion.tags;
    if (enrichmentHint) {
      enrichmentHint.textContent = suggestion.tags
        ? `Suggested tags: ${suggestion.tags}. LinkedIn search link added if it was blank.`
        : "LinkedIn search link added if it was blank. Add more context for better tag suggestions.";
    }
  });
}

if (f.linkedin) {
  f.linkedin.addEventListener("change", autoPopulateFromLinkedInUrl);
  f.linkedin.addEventListener("blur", autoPopulateFromLinkedInUrl);
}

exportCsvBtn.addEventListener("click", () => {
  exportContactsCsv();
});

importCsvInput.addEventListener("change", async () => {
  const file = importCsvInput.files && importCsvInput.files[0];
  importCsvInput.value = "";
  if (!file) {
    if (importTypeHint) importTypeHint.textContent = "Import type detected: --";
    return;
  }
  const text = await file.text();
  const tableCsv = parseCsv(text);
  if (tableCsv.length < 2) {
    if (importTypeHint) importTypeHint.textContent = "Import type detected: --";
    showBanner("warn", "That CSV file looks empty.");
    return;
  }
  const header = tableCsv[0].map(normalizeHeaderName);
  const source = detectCsvSource(header);
  if (importTypeHint) {
    importTypeHint.textContent = `Import type detected: ${source === "linkedin" ? "LinkedIn" : "Generic"}`;
  }
  const hasName = header.includes("name") || (header.includes("first name") && header.includes("last name"));
  if (!hasName) {
    showBanner("warn", 'CSV must include "name" or LinkedIn columns "First Name" + "Last Name".');
    return;
  }

  const imported = [];
  for (let r = 1; r < tableCsv.length; r += 1) {
    const line = tableCsv[r];
    const contact = buildContactFromCsvRow(line, header, source);
    if (!contact.name) continue;
    imported.push(contact);
  }
  contacts = [...imported, ...contacts];
  try {
    const raw = localStorage.getItem(IMPORT_HISTORY_KEY);
    const prev = raw ? JSON.parse(raw) : [];
    prev.push({ when: new Date().toISOString(), count: imported.length });
    localStorage.setItem(IMPORT_HISTORY_KEY, JSON.stringify(prev.slice(-12)));
  } catch {
    // ignore
  }
  saveContacts(contacts);
  recordActivity("contact-imported", { count: imported.length });
  render();
  updateImportHistoryText();
  const sourceLabel = source === "linkedin" ? " from LinkedIn CSV" : "";
  showBanner("info", `Imported ${imported.length} contacts${sourceLabel}.`);
});

s.weightTiming.addEventListener("input", () => {
  s.weightTimingVal.textContent = s.weightTiming.value;
});
s.weightMomentum.addEventListener("input", () => {
  s.weightMomentumVal.textContent = s.weightMomentum.value;
});
s.weightGoalFit.addEventListener("input", () => {
  s.weightGoalFitVal.textContent = s.weightGoalFit.value;
});

if (sitesUi.momentum.weightVisibility) {
  sitesUi.momentum.weightVisibility.addEventListener("input", () => {
    sitesUi.momentum.weightVisibilityVal.textContent = sitesUi.momentum.weightVisibility.value;
  });
}
if (sitesUi.momentum.weightConsistency) {
  sitesUi.momentum.weightConsistency.addEventListener("input", () => {
    sitesUi.momentum.weightConsistencyVal.textContent = sitesUi.momentum.weightConsistency.value;
  });
}
if (sitesUi.momentum.weightExecution) {
  sitesUi.momentum.weightExecution.addEventListener("input", () => {
    sitesUi.momentum.weightExecutionVal.textContent = sitesUi.momentum.weightExecution.value;
  });
}

s.saveSettingsBtn.addEventListener("click", () => {
  applySettingsFromUi();
  applySitesSettingsFromUi();
  sortKey = settings.display.sortDefault;
  sortDir = sortKey === "priority" ? "desc" : "asc";
  applyDisplaySettings();
  setupIdleLock();
  render();
  showBanner("info", "Settings saved.");
});

if (sitesUi.saveBtn) {
  sitesUi.saveBtn.addEventListener("click", () => {
    applySitesSettingsFromUi();
    showBanner("info", "Networking sites settings saved.");
  });
}

if (sitesUi.resetBtn) {
  sitesUi.resetBtn.addEventListener("click", () => {
    sitesSettings = mergeSitesSettings(DEFAULT_SITES_SETTINGS);
    saveSitesSettings(sitesSettings);
    syncSitesSettingsUi();
    showBanner("info", "Networking sites settings reset to defaults.");
  });
}

if (s.resetPasswordBtn) {
  s.resetPasswordBtn.addEventListener("click", () => {
    resetCurrentUserPassword();
  });
}

s.runExport.addEventListener("click", () => {
  if (s.exportType.value === "json") exportContactsJson("network-guide-contacts.json");
  else exportContactsCsv();
  showBanner("info", `Exported as ${s.exportType.value.toUpperCase()}.`);
});

s.backupBtn.addEventListener("click", () => {
  exportContactsJson();
  updateSystemHealth();
  showBanner("info", "Backup created.");
});

s.restoreInput.addEventListener("change", async () => {
  const file = s.restoreInput.files && s.restoreInput.files[0];
  s.restoreInput.value = "";
  if (!file) return;
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed.contacts)) {
      contacts = parsed.contacts;
      saveContacts(contacts);
    }
    if (parsed.settings) {
      settings = mergeSettings(parsed.settings);
      saveSettings(settings);
      syncUiFromSettings();
    }
    render();
    showBanner("info", "Backup restored.");
  } catch {
    showBanner("warn", "Could not restore backup file.");
  }
});

s.clearContactsBtn.addEventListener("click", () => {
  if (!confirm("Clear all contacts? This cannot be undone.")) return;
  contacts = [];
  saveContacts(contacts);
  render();
  showBanner("info", "All contacts cleared.");
});

s.resetAnalyticsBtn.addEventListener("click", () => {
  resetAnalytics();
  showBanner("info", "Analytics reset.");
});

sortKey = settings.display.sortDefault;
sortDir = sortKey === "priority" ? "desc" : "asc";
syncUiFromSettings();
syncSitesSettingsUi();
applyDisplaySettings();
setupIdleLock();
render();

// ---- Active CRM sidebar link via IntersectionObserver ----
(function () {
  const sidebarLinks = document.querySelectorAll(".crm-sidebar__nav a[href^='#'], .crm-toolkit-bar__inner a[href^='#']");
  if (!sidebarLinks.length) return;

  const sectionMap = new Map();
  sidebarLinks.forEach((link) => {
    const id = link.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) sectionMap.set(el, link);
  });

  let current = null;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = sectionMap.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          if (current) current.classList.remove("is-active");
          link.classList.add("is-active");
          current = link;
        }
      });
    },
    { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
  );

  sectionMap.forEach((_, section) => observer.observe(section));
})();

if (sessionStorage.getItem("ngc_open_settings") === "1") {
  sessionStorage.removeItem("ngc_open_settings");
  openSettingsPanel();
}
