import { loadContacts, loadProfile } from "./storage.js";
import {
  appendMomentumHistory,
  buildEventFollowup,
  buildProgressSnapshot,
  buildRhythmRecommendation,
  buildWhatsNext,
  evaluateNetworkingMessage,
  getActivityStreaks,
  loadActivityLog,
  loadMomentumHistory,
  loadPendingFollowups,
  recordActivity,
  savePendingFollowup,
} from "./smart-tools.js";

const form = document.getElementById("momentumForm");
const resultEl = document.getElementById("momentumResult");
const scoreLine = document.getElementById("momentumScoreLine");
const nextEl = document.getElementById("momentumNext");
const starterPacksContent = document.getElementById("starterPacksContent");
const signalsList = document.getElementById("signalsList");
const workflowCrossNote = document.getElementById("workflowCrossNote");
const mPlatforms = document.getElementById("mPlatforms");

const settingsPanel = document.getElementById("sitesSettings");
const settingsBackdrop = document.getElementById("sitesSettingsBackdrop");
const settingsCloseBtn = document.getElementById("sitesSettingsCloseBtn");
const settingsSaveBtn = document.getElementById("sitesSettingsSaveBtn");
const settingsResetBtn = document.getElementById("sitesSettingsResetBtn");
const settingsTabLink = document.getElementById("sitesSettingsTabLink");
const sitesPlannerValue = document.getElementById("sitesPlannerValue");
const sitesPlannerBar = document.getElementById("sitesPlannerBar");
const sitesContactsValue = document.getElementById("sitesContactsValue");
const sitesContactsBar = document.getElementById("sitesContactsBar");
const sitesMomentumValue = document.getElementById("sitesMomentumValue");
const sitesMomentumBar = document.getElementById("sitesMomentumBar");
const sitesProgressSummary = document.getElementById("sitesProgressSummary");
const nextPanelList = document.getElementById("nextPanelList");
const rhythmCoachForm = document.getElementById("rhythmCoachForm");
const coachGoal = document.getElementById("coachGoal");
const coachTime = document.getElementById("coachTime");
const coachComfort = document.getElementById("coachComfort");
const coachEvents = document.getElementById("coachEvents");
const rhythmCoachResult = document.getElementById("rhythmCoachResult");
const coachPriorityPills = document.getElementById("coachPriorityPills");
const coachWeeklyList = document.getElementById("coachWeeklyList");
const coachTrendNote = document.getElementById("coachTrendNote");
const eventGeneratorForm = document.getElementById("eventGeneratorForm");
const eventNameInput = document.getElementById("eventNameInput");
const eventDetailInput = document.getElementById("eventDetailInput");
const eventGeneratorOutput = document.getElementById("eventGeneratorOutput");
const saveEventDraftBtn = document.getElementById("saveEventDraftBtn");
const simScenario = document.getElementById("simScenario");
const simPersona = document.getElementById("simPersona");
const simMessage = document.getElementById("simMessage");
const simEvaluateBtn = document.getElementById("simEvaluateBtn");
const simResult = document.getElementById("simResult");
const simClarity = document.getElementById("simClarity");
const simSpecificity = document.getElementById("simSpecificity");
const simTone = document.getElementById("simTone");
const simFeedback = document.getElementById("simFeedback");
const simImproved = document.getElementById("simImproved");
const microOutreachStreak = document.getElementById("microOutreachStreak");
const microEventWeeks = document.getElementById("microEventWeeks");
const microMomentumTrend = document.getElementById("microMomentumTrend");
const pageStatusDot = document.getElementById("pageStatusDot");
const recentWinBanner = document.getElementById("recentWinBanner");
const recentWinDismissBtn = document.getElementById("recentWinDismissBtn");
const recentWinIcon = document.getElementById("recentWinIcon");
const recentWinMessage = document.getElementById("recentWinMessage");
const recentWinXp = document.getElementById("recentWinXp");
const recentWinProgressBar = document.getElementById("recentWinProgressBar");
const recentWinEncouragement = document.getElementById("recentWinEncouragement");
const recentWinShareBtn = document.getElementById("recentWinShareBtn");
const recentWinCta = document.getElementById("recentWinCta");

let lastGeneratedEventDraft = "";
let collapsesInitialized = false;

const SETTINGS_KEY = "ngc_sites_settings_v1";
const RECENT_WIN_DISMISSED_KEY = "ngc_recent_win_dismissed_v1";

const DEFAULT_SETTINGS = {
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

const platformInputs = {
  linkedin: document.getElementById("sp_linkedin"),
  slack: document.getElementById("sp_slack"),
  meetup: document.getElementById("sp_meetup"),
  x: document.getElementById("sp_x"),
  substack: document.getElementById("sp_substack"),
  upwork: document.getElementById("sp_upwork"),
  medium: document.getElementById("sp_medium"),
  eventbrite: document.getElementById("sp_eventbrite"),
  wellfound: document.getElementById("sp_wellfound"),
};

const cadenceInputs = {
  linkedin: document.getElementById("swf_linkedin"),
  slack: document.getElementById("swf_slack"),
  events: document.getElementById("swf_events"),
  writing: document.getElementById("swf_writing"),
  upwork: document.getElementById("swf_upwork"),
};

const personaInput = document.getElementById("sp_persona");

const momentumInputs = {
  weightVisibility: document.getElementById("sm_weightVisibility"),
  weightVisibilityVal: document.getElementById("sm_weightVisibilityVal"),
  weightConsistency: document.getElementById("sm_weightConsistency"),
  weightConsistencyVal: document.getElementById("sm_weightConsistencyVal"),
  weightExecution: document.getElementById("sm_weightExecution"),
  weightExecutionVal: document.getElementById("sm_weightExecutionVal"),
  includeEvents: document.getElementById("sm_includeEvents"),
  includePublishing: document.getElementById("sm_includePublishing"),
  includeCrm: document.getElementById("sm_includeCrm"),
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const saved = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      platforms: { ...DEFAULT_SETTINGS.platforms, ...(saved.platforms || {}) },
      cadence: { ...DEFAULT_SETTINGS.cadence, ...(saved.cadence || {}) },
      momentum: { ...DEFAULT_SETTINGS.momentum, ...(saved.momentum || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

function saveSettings(next) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}

let settings = loadSettings();

// Platform recommendations based on role/goal keywords
const PLATFORM_RECOMMENDATIONS = {
  "linkedin": { name: "LinkedIn", desc: "headline matches the jobs you want; build your professional network" },
  "meetup": { name: "Meetup", desc: "find and attend niche meetups for hands-on learning" },
  "slack": { name: "Slack", desc: "join communities for questions and peer support" },
  "x": { name: "X", desc: "share updates and lessons publicly" },
  "wellfound": { name: "Wellfound", desc: "connect with startup hiring and founders" },
  "upwork": { name: "Upwork", desc: "build paid work proof and client reputation" },
  "eventbrite": { name: "Eventbrite", desc: "discover and host professional events" },
  "substack": { name: "Substack", desc: "publish longer writing and build owned audience" },
  "medium": { name: "Medium", desc: "publish articles and reach your niche" },
  "discord": { name: "Discord", desc: "join active communities for daily engagement" }
};

const SIGNAL_ITEMS = [
  { key: "linkedin", html: "<strong>LinkedIn:</strong> one post or comment thread weekly with a lesson or question." },
  { key: "events", html: "<strong>Events:</strong> at least one event monthly with a written follow-up plan." },
  { key: "slack", html: "<strong>Slack / Discord:</strong> join two active communities and contribute weekly." },
  { key: "x", html: "<strong>X:</strong> five substantive replies weekly in your niche." },
  { key: "upwork", html: "<strong>Upwork:</strong> proposals that show diagnosis + plan; refresh availability weekly." },
  { key: "substack", html: "<strong>Substack / blog:</strong> publish one thoughtful piece monthly to build owned audience." },
  { key: "medium", html: "<strong>Medium:</strong> publish one focused article monthly with clear takeaways." },
  { key: "wellfound", html: "<strong>Wellfound:</strong> refresh startup profile signals weekly and message with clear role fit." },
  { key: "eventbrite", html: "<strong>Eventbrite:</strong> shortlist one event monthly and plan follow-up before attending." },
  { key: "meetup", html: "<strong>Meetup:</strong> attend niche meetups and send 24-hour recap messages." },
];

function personaTitleFromSelection(persona) {
  const map = {
    "job-seeker": "Job Seeker",
    founder: "Founder",
    freelancer: "Freelancer",
    "career-switcher": "Career Switcher",
    "community-builder": "Community Builder",
    "thought-leader": "Thought Leader",
  };
  return map[persona] || "Networking Strategist";
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function determinePersonaTitle(role, goal) {
  const roleTokens = tokenize(role);
  const goalTokens = tokenize(goal);
  const allTokens = [...roleTokens, ...goalTokens];
  
  const has = (words) => words.some((w) => allTokens.includes(w));
  
  if (has(["founder", "startup", "launch", "build"])) return "Founder";
  if (has(["engineer", "developer", "software", "data", "devops", "analyst"])) return "Engineer/Data Professional";
  if (has(["sales", "founder", "revenue", "client", "business", "bd", "freelance"])) return "Freelancer";
  if (has(["designer", "product", "pm", "manager", "lead"])) return "Product-focused Professional";
  if (has(["seek", "transition", "career", "interview", "hire", "job", "role", "position"])) return "Career Changer";
  if (has(["consult", "advise", "coach", "mentor"])) return "Advisor/Consultant";
  if (has(["content", "write", "publish", "author", "media", "thought"])) return "Thought Leader";
  
  return "Networking Strategist";
}

function selectPlatforms(role, skills, goal) {
  const roleTokens = tokenize(role);
  const skillsTokens = tokenize(skills || "");
  const goalTokens = tokenize(goal);
  const allText = tokenize(`${role} ${skills || ""} ${goal}`);
  
  const has = (words) => words.some((w) => allText.includes(w));
  
  const platforms = [];
  
  // Always recommend LinkedIn
  platforms.push("linkedin");
  
  // Recommend based on role/skills
  if (has(["founder", "startup", "launch", "fundrais", "invest"]))
    platforms.push("wellfound");
  
  if (has(["freelance", "contract", "client", "service", "consult"]))
    platforms.push("upwork");
  
  if (has(["sql", "analytics", "analyst", "python", "data", "learn"]))
    platforms.push("meetup");
  
  if (has(["community", "niche", "discuss", "question", "peer", "help", "advice"]))
    platforms.push("slack");
  
  if (has(["public", "share", "thought", "voice", "visibility", "reach", "influence"]))
    platforms.push("x");
  
  if (has(["event", "conference", "summit", "gathering", "network", "community"]))
    platforms.push("eventbrite");
  
  if (has(["write", "publish", "article", "essay", "content", "author", "thought", "lesson"]))
    platforms.push("substack");
  
  if (has(["discord", "crypto", "gaming", "community"]))
    platforms.push("discord");
  
  // Deduplicate and limit to 4-5 platforms
  const unique = [...new Set(platforms)].slice(0, 5);
  
  return unique;
}

function selectPlatformsFromPersona(persona) {
  switch (persona) {
    case "founder":
      return ["linkedin", "wellfound", "x", "eventbrite", "slack"];
    case "freelancer":
      return ["linkedin", "upwork", "slack", "substack", "meetup"];
    case "career-switcher":
      return ["linkedin", "meetup", "slack", "medium", "eventbrite"];
    case "community-builder":
      return ["slack", "meetup", "eventbrite", "linkedin", "x"];
    case "thought-leader":
      return ["linkedin", "x", "substack", "medium", "eventbrite"];
    case "job-seeker":
    default:
      return ["linkedin", "wellfound", "meetup", "slack", "x"];
  }
}

function enabledPlatformsOnly(platforms) {
  return platforms.filter((p) => settings.platforms[p]);
}

function enabledPlatformCount() {
  return Object.values(settings.platforms).filter(Boolean).length;
}

function applyPlatformVisibility() {
  document.querySelectorAll("[data-platform]").forEach((el) => {
    const key = el.getAttribute("data-platform");
    const on = !!settings.platforms[key];
    el.hidden = !on;
  });
}

function applyWorkflowCadence() {
  document.querySelectorAll(".sites-workflow-item[data-cadence-key]").forEach((item) => {
    const k = item.getAttribute("data-cadence-key");
    const text = settings.cadence[k] || "";
    const node = item.querySelector("[data-frequency-text]");
    if (node) node.textContent = text;
  });
}

function applySignalsVisibility() {
  if (!signalsList) return;
  const includeEvents = settings.platforms.meetup || settings.platforms.eventbrite;
  const items = SIGNAL_ITEMS.filter((item) => {
    if (item.key === "events") return includeEvents;
    return !!settings.platforms[item.key];
  });

  signalsList.innerHTML = "";
  for (const item of items) {
    const li = document.createElement("li");
    li.innerHTML = item.html;
    signalsList.appendChild(li);
  }
}

function applyWorkflowNoteVisibility() {
  if (!workflowCrossNote) return;
  const hasX = !!settings.platforms.x;
  const hasWellfound = !!settings.platforms.wellfound;
  if (hasX && hasWellfound) {
    workflowCrossNote.hidden = false;
    workflowCrossNote.innerHTML =
      "<strong>X</strong> and <strong>Wellfound</strong> cut across stages: use X for public signal and Wellfound when startup intent is the game.";
    return;
  }
  if (hasX && !hasWellfound) {
    workflowCrossNote.hidden = false;
    workflowCrossNote.innerHTML = "<strong>X</strong> can cut across stages: use it for public signal and consistent niche visibility.";
    return;
  }
  if (!hasX && hasWellfound) {
    workflowCrossNote.hidden = false;
    workflowCrossNote.innerHTML =
      "<strong>Wellfound</strong> can cut across stages when startup intent is the game and role fit is explicit.";
    return;
  }
  workflowCrossNote.hidden = true;
}

function applyMomentumPlatformOptions() {
  if (!mPlatforms) return;
  const max = Math.max(0, enabledPlatformCount());
  const prev = parseInt(mPlatforms.value, 10) || 0;
  mPlatforms.innerHTML = "";
  for (let i = 0; i <= max; i += 1) {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = i === max ? `${i}+` : String(i);
    mPlatforms.appendChild(opt);
  }
  mPlatforms.value = String(Math.min(prev, max));
}

function openSettingsPanel() {
  settingsPanel.hidden = false;
  settingsBackdrop.hidden = false;
  settingsCloseBtn.focus();
}

function closeSettingsPanel() {
  settingsPanel.hidden = true;
  settingsBackdrop.hidden = true;
}

function syncSettingsUi() {
  Object.entries(platformInputs).forEach(([k, el]) => {
    if (el) el.checked = !!settings.platforms[k];
  });
  Object.entries(cadenceInputs).forEach(([k, el]) => {
    if (el) el.value = settings.cadence[k] || "";
  });
  if (personaInput) personaInput.value = settings.persona;

  momentumInputs.weightVisibility.value = String(settings.momentum.weightVisibility);
  momentumInputs.weightVisibilityVal.textContent = String(settings.momentum.weightVisibility);
  momentumInputs.weightConsistency.value = String(settings.momentum.weightConsistency);
  momentumInputs.weightConsistencyVal.textContent = String(settings.momentum.weightConsistency);
  momentumInputs.weightExecution.value = String(settings.momentum.weightExecution);
  momentumInputs.weightExecutionVal.textContent = String(settings.momentum.weightExecution);
  momentumInputs.includeEvents.checked = !!settings.momentum.includeEvents;
  momentumInputs.includePublishing.checked = !!settings.momentum.includePublishing;
  momentumInputs.includeCrm.checked = !!settings.momentum.includeCrm;
}

function readSettingsUi() {
  Object.entries(platformInputs).forEach(([k, el]) => {
    settings.platforms[k] = !!el.checked;
  });
  Object.entries(cadenceInputs).forEach(([k, el]) => {
    settings.cadence[k] = String(el.value || "").trim() || DEFAULT_SETTINGS.cadence[k];
  });
  settings.persona = personaInput.value;

  settings.momentum.weightVisibility = Number(momentumInputs.weightVisibility.value) || 35;
  settings.momentum.weightConsistency = Number(momentumInputs.weightConsistency.value) || 35;
  settings.momentum.weightExecution = Number(momentumInputs.weightExecution.value) || 30;
  settings.momentum.includeEvents = !!momentumInputs.includeEvents.checked;
  settings.momentum.includePublishing = !!momentumInputs.includePublishing.checked;
  settings.momentum.includeCrm = !!momentumInputs.includeCrm.checked;
}

function applyAllSettings() {
  applyPlatformVisibility();
  applyWorkflowCadence();
  applySignalsVisibility();
  applyWorkflowNoteVisibility();
  applyMomentumPlatformOptions();
  renderStarterPacks();
  renderSitesSmartLayer();
}

function renderSitesSmartLayer() {
  const profile = loadProfile();
  const contacts = loadContacts();
  const momentumHistory = loadMomentumHistory();
  const pendingFollowups = loadPendingFollowups();
  const snapshot = buildProgressSnapshot(profile, contacts, momentumHistory);
  const next = buildWhatsNext("sites", {
    profile,
    contacts,
    momentumHistory,
    pendingFollowups,
  });

  if (pageStatusDot) {
    pageStatusDot.classList.remove("is-not-started", "is-in-progress", "is-complete");
    if (snapshot.momentumCount >= 6) pageStatusDot.classList.add("is-complete");
    else if (snapshot.momentumCount > 0) pageStatusDot.classList.add("is-in-progress");
    else pageStatusDot.classList.add("is-not-started");
  }

  if (sitesPlannerValue) sitesPlannerValue.textContent = `${snapshot.plannerPercent}%`;
  if (sitesPlannerBar) sitesPlannerBar.style.width = `${snapshot.plannerPercent}%`;
  if (sitesContactsValue) sitesContactsValue.textContent = `${snapshot.contactsCount} contact${snapshot.contactsCount === 1 ? "" : "s"}`;
  if (sitesContactsBar) sitesContactsBar.style.width = `${Math.min(100, Math.round((snapshot.contactsCount / 3) * 100))}%`;
  if (sitesMomentumValue) sitesMomentumValue.textContent = `${snapshot.momentumCount} entr${snapshot.momentumCount === 1 ? "y" : "ies"}`;
  if (sitesMomentumBar) sitesMomentumBar.style.width = `${Math.min(100, Math.round((snapshot.momentumCount / 6) * 100))}%`;
  if (sitesProgressSummary) {
    sitesProgressSummary.textContent = snapshot.playbookUnlocked
      ? "Planner is complete, so these recommendations can stay personalized as your momentum history grows."
      : "Complete Planner to unlock better persona recommendations, coach guidance, and message context.";
  }
  if (nextPanelList) {
    nextPanelList.innerHTML = next.items.map((item) => `<li>${item}</li>`).join("");
  }

  const activity = loadActivityLog();
  renderRecentWinBanner(activity, snapshot, momentumHistory);
  const streaks = getActivityStreaks(activity);
  if (microOutreachStreak) {
    microOutreachStreak.textContent = `${streaks.outreachDays} day${streaks.outreachDays === 1 ? "" : "s"}`;
  }
  if (microEventWeeks) {
    microEventWeeks.textContent = `${streaks.eventWeeks} week${streaks.eventWeeks === 1 ? "" : "s"}`;
  }
  if (microMomentumTrend) {
    const latest = momentumHistory[momentumHistory.length - 1];
    const prev = momentumHistory[momentumHistory.length - 2];
    if (!latest) {
      microMomentumTrend.textContent = "No score yet";
    } else if (!prev) {
      microMomentumTrend.textContent = `${latest.score}/100`;
    } else {
      const delta = latest.score - prev.score;
      microMomentumTrend.textContent = `${latest.score}/100 (${delta > 0 ? "+" : ""}${delta})`;
    }
  }
}

function describeWin(activityItem) {
  const type = String(activityItem?.type || "");
  const meta = activityItem?.meta || {};
  if (type === "contact-saved") {
    return {
      icon: "🏆",
      message: "Boom! You've started a new connection.",
      xp: 15,
    };
  }
  if (type === "outreach-logged") {
    return {
      icon: "⭐",
      message: "Nice move! You followed up and kept momentum alive.",
      xp: 12,
    };
  }
  if (type === "event-followup-saved") {
    return {
      icon: "✅",
      message: "Strong execution! Your event follow-up draft is ready to send.",
      xp: 14,
    };
  }
  if (type === "momentum-scored") {
    return {
      icon: "⚡",
      message: "Momentum check complete. You're compounding consistency.",
      xp: 10,
    };
  }
  if (type === "planner-plan-generated") {
    return {
      icon: "🌟",
      message: "Plan locked in. Your next networking sprint is clear.",
      xp: 11,
    };
  }
  if (type === "contact-imported") {
    const count = Number(meta.count) || 0;
    return {
      icon: "📥",
      message: count > 0 ? `Big win! You imported ${count} contacts into your network engine.` : "Big win! Your contact list import is complete.",
      xp: 16,
    };
  }
  return {
    icon: "🎯",
    message: "Momentum is building. Keep stacking one networking action at a time.",
    xp: 8,
  };
}

function renderRecentWinBanner(activity, snapshot, momentumHistory) {
  if (!recentWinBanner) return;

  const dismissed = sessionStorage.getItem(RECENT_WIN_DISMISSED_KEY) === "1";
  if (dismissed) {
    recentWinBanner.classList.add("is-hidden");
    return;
  }

  const list = Array.isArray(activity) ? activity : [];
  const latest = list[list.length - 1];
  const hasWin = Boolean(latest);

  recentWinBanner.classList.remove("is-hidden");

  if (!hasWin) {
    recentWinBanner.classList.add("is-empty");
    if (recentWinIcon) recentWinIcon.textContent = "🏁";
    if (recentWinMessage) recentWinMessage.textContent = "Your next win is just one message away.";
    if (recentWinCta) recentWinCta.hidden = false;
    return;
  }

  recentWinBanner.classList.remove("is-empty");
  if (recentWinCta) recentWinCta.hidden = true;

  const win = describeWin(latest);
  const momentumPct = Math.min(100, Math.round((snapshot.momentumCount / 6) * 100));
  const strongWeek = snapshot.momentumCount >= 3 || (Array.isArray(momentumHistory) && momentumHistory.length >= 3);

  if (recentWinIcon) recentWinIcon.textContent = win.icon;
  if (recentWinMessage) recentWinMessage.textContent = win.message;
  if (recentWinXp) recentWinXp.textContent = `+${win.xp} Momentum`;
  if (recentWinProgressBar) recentWinProgressBar.style.width = `${momentumPct}%`;
  if (recentWinEncouragement) {
    recentWinEncouragement.textContent = strongWeek
      ? "You're in the top 10% of networkers this week!"
      : "Stay consistent this week and watch your momentum accelerate.";
  }
}

function initSectionCollapses() {
  if (collapsesInitialized) return;
  const sectionIds = ["compare-grid", "top-sites", "workflow", "starter-packs", "signals", "outreach-templates", "event-followup"];
  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    const head = section?.querySelector(".sites-section-head");
    if (!section || !head || head.querySelector(".section-collapse-toggle")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "section-collapse-toggle";
    button.setAttribute("aria-expanded", "true");
    button.textContent = "Collapse";

    const body = document.createElement("div");
    body.className = "section-collapse-body";

    while (head.nextSibling) {
      body.appendChild(head.nextSibling);
    }
    section.appendChild(body);
    head.appendChild(button);

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      button.textContent = expanded ? "Expand" : "Collapse";
      body.hidden = expanded;
    });
  });
  collapsesInitialized = true;
}

function renderCoachRecommendation() {
  if (!rhythmCoachForm || !rhythmCoachResult) return;
  const profile = loadProfile();
  const recommendation = buildRhythmRecommendation({
    profile,
    answers: {
      goal: coachGoal.value,
      time: coachTime.value,
      comfort: coachComfort.value,
      prefersEvents: !!coachEvents.checked,
    },
    momentumHistory: loadMomentumHistory(),
  });

  coachPriorityPills.innerHTML = recommendation.priorities
    .map((platform) => `<span class="coach-pill">Prioritize ${platform}</span>`)
    .join("");
  coachWeeklyList.innerHTML = recommendation.weekly.map((item) => `<li>${item}</li>`).join("");
  if (coachTrendNote) {
    if (recommendation.trend.latest) {
      const delta = recommendation.trend.delta;
      coachTrendNote.textContent = delta
        ? `Momentum trend: ${recommendation.trend.latest.score}/100 (${delta > 0 ? "+" : ""}${delta} vs previous).`
        : `Momentum trend: ${recommendation.trend.latest.score}/100. Keep the cadence steady to create movement.`;
    } else {
      coachTrendNote.textContent = "Run your first momentum score below to start a trend line over time.";
    }
  }
  rhythmCoachResult.hidden = false;
}

function generateEventDraft() {
  const profile = loadProfile();
  const eventName = String(eventNameInput?.value || "").trim();
  const detail = String(eventDetailInput?.value || "").trim();
  if (!eventName || !detail) {
    eventGeneratorOutput.textContent = "Add both an event name and one specific detail to generate a follow-up.";
    return "";
  }
  lastGeneratedEventDraft = buildEventFollowup({ profile, eventName, detail });
  eventGeneratorOutput.textContent = lastGeneratedEventDraft;
  return lastGeneratedEventDraft;
}

function renderStarterPacks() {
  const profile = loadProfile();
  const container = starterPacksContent;
  
  if (!profile || !profile.goal) {
    // No profile - show default message
    container.innerHTML = `
      <p style="margin: 1rem 0 0; color: #666;">
        No planner profile saved yet. 
        <a href="./index.html">Complete the Planner form</a> first to see personalized networking recommendations.
      </p>
    `;
    return;
  }
  
  const personaTitle = personaTitleFromSelection(settings.persona);
  let platforms = selectPlatformsFromPersona(settings.persona);
  if (settings.persona === "job-seeker" && profile && profile.goal) {
    platforms = selectPlatforms(profile.role || "", profile.skills || "", profile.goal || "");
  }
  platforms = enabledPlatformsOnly(platforms);
  
  // Build platform stack display
  const platformNames = platforms.map((p) => PLATFORM_RECOMMENDATIONS[p]?.name || p).join(" · ");
  const platformDescriptions = platforms.map((p) => {
    const platInfo = PLATFORM_RECOMMENDATIONS[p];
    return `<li><strong>${platInfo?.name || p}:</strong> ${platInfo?.desc || "build your presence"}</li>`;
  }).join("");
  
  const html = `
    <div class="sites-persona-grid">
      <article class="sites-persona">
        <h3>${personaTitle}</h3>
        <p class="sites-persona__stack"><strong>Stack:</strong> ${platformNames}</p>
        <ul>
          ${platformDescriptions}
        </ul>
      </article>
    </div>
  `;
  
  container.innerHTML = html;
}

// Render starter packs on page load
renderStarterPacks();

function engagePoints(v) {
  switch (v) {
    case "rarely":
      return 5;
    case "monthly":
      return 10;
    case "weekly":
      return 16;
    case "several":
      return 22;
    case "daily":
      return 28;
    default:
      return 10;
  }
}

function computeMomentum() {
  const hasEventsPlatform = !!(settings.platforms.meetup || settings.platforms.eventbrite);
  const hasWritingPlatform = !!(settings.platforms.substack || settings.platforms.medium);
  const hasOutreachPlatform = !!(
    settings.platforms.linkedin ||
    settings.platforms.wellfound ||
    settings.platforms.slack ||
    settings.platforms.x ||
    settings.platforms.upwork ||
    settings.platforms.meetup ||
    settings.platforms.eventbrite
  );
  const hasPortfolioPlatform = !!(
    settings.platforms.linkedin || settings.platforms.upwork || settings.platforms.substack || settings.platforms.medium
  );

  const availablePlatforms = enabledPlatformCount();
  const rawP = parseInt(document.getElementById("mPlatforms").value, 10) || 0;
  const platforms = Math.min(availablePlatforms, rawP);
  const engage = engagePoints(document.getElementById("mEngage").value);
  const portfolio = hasPortfolioPlatform && document.getElementById("mPortfolio").checked ? 14 : 0;
  const events = hasEventsPlatform && document.getElementById("mEvents").checked ? 10 : 0;
  const crm = availablePlatforms > 0 && document.getElementById("mCrm").checked ? 10 : 0;
  const publishing = hasWritingPlatform ? (engage >= 16 ? 12 : 4) : 0;

  const platformRatio = availablePlatforms > 0 ? platforms / availablePlatforms : 0;
  const visibility = Math.min(100, Math.round(platformRatio * 100));

  const engageNorm = hasOutreachPlatform ? Math.round((engage / 28) * 100) : 0;
  const consistency = Math.min(100, Math.round(visibility * 0.65 + engageNorm * 0.35));

  let executionRaw = portfolio;
  let executionMax = hasPortfolioPlatform ? 14 : 0;
  if (settings.momentum.includeEvents && hasEventsPlatform) {
    executionRaw += events;
    executionMax += 10;
  }
  if (settings.momentum.includeCrm && availablePlatforms > 0) {
    executionRaw += crm;
    executionMax += 10;
  }
  if (settings.momentum.includePublishing && hasWritingPlatform) {
    executionRaw += publishing;
    executionMax += 12;
  }
  const execution = executionMax > 0 ? Math.min(100, Math.round((executionRaw / executionMax) * 100)) : 0;

  const wv = settings.momentum.weightVisibility;
  const wc = settings.momentum.weightConsistency;
  const we = settings.momentum.weightExecution;
  const ws = Math.max(1, wv + wc + we);

  const total = Math.min(100, Math.round((visibility * wv + consistency * wc + execution * we) / ws));
  return {
    total,
    platforms,
    availablePlatforms,
    engage,
    portfolio,
    events,
    crm,
    publishing,
    visibility,
    consistency,
    execution,
    hasEventsPlatform,
    hasWritingPlatform,
    hasPortfolioPlatform,
  };
}

function buildTips({ platforms, availablePlatforms, engage, portfolio, events, crm, hasEventsPlatform, hasWritingPlatform, hasPortfolioPlatform }) {
  const tips = [];
  if (availablePlatforms === 0) {
    tips.push("Turn on at least one platform in Settings so we can score your momentum accurately.");
    return tips;
  }
  if (platforms <= 2) {
    tips.push(
      "Pick just <strong>two</strong> platforms for the next month, and build consistency there before adding more."
    );
  }
  if (engage < 20) {
    tips.push(
      "Boost your rhythm with <strong>one</strong> scheduled weekly block for comments, posts, or outreach."
    );
  }
  if (hasPortfolioPlatform && !portfolio) {
    tips.push(
      "Add one <strong>portfolio URL</strong> (site, portfolio, or case studies) anywhere your name shows up."
    );
  }
  if (hasEventsPlatform && !events) {
    tips.push(
      "Book <strong>one</strong> event in the next 30 days, and schedule your follow-up slot before you attend."
    );
  }
  if (settings.momentum.includePublishing && hasWritingPlatform && engage < 16) {
    tips.push("Post a little more consistently to strengthen your public signal and momentum score.");
  }
  if (settings.momentum.includeCrm && !crm) {
    tips.push(
      'Use your <a href="./contacts.html">Contacts CRM</a> to set next follow-up dates so opportunities do not slip through.'
    );
  }
  if (tips.length === 0) {
    tips.push(
      "Keep your cadence steady: refresh one case study monthly and <strong>close the loop</strong> on intros within a week."
    );
  }
  return tips;
}

function labelForScore(n) {
  if (n >= 80) return "Strong momentum";
  if (n >= 60) return "Solid foundation";
  if (n >= 40) return "Good start with room to build";
  return "Early stage: a few small upgrades will move the needle quickly";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const m = computeMomentum();
  const label = labelForScore(m.total);
  appendMomentumHistory({ score: m.total, label });
  recordActivity("momentum-scored", { score: m.total });

  // Animate progress bar
  const barFill = document.getElementById("momentumBarFill");
  if (barFill) {
    barFill.className = "momentum-tier-bar__fill";
    barFill.style.width = "0%";
    const tierClass =
      m.total >= 80 ? "tier-strong"
      : m.total >= 60 ? "tier-solid"
      : m.total >= 40 ? "tier-room"
      : "tier-early";
    barFill.classList.add(tierClass);
    // Trigger reflow so transition fires
    barFill.getBoundingClientRect();
    requestAnimationFrame(() => {
      barFill.style.width = m.total + "%";
    });
  }

  scoreLine.innerHTML = `<strong>${m.total}/100</strong> — ${label}.`;
  const tips = buildTips(m);
  nextEl.innerHTML = `<p class="sites-momentum__sub">Recommended next steps</p><ul>${tips
    .map((t) => `<li>${t}</li>`)
    .join("")}</ul>`;
  resultEl.hidden = false;
  renderSitesSmartLayer();
  resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

if (rhythmCoachForm) {
  rhythmCoachForm.addEventListener("submit", (e) => {
    e.preventDefault();
    renderCoachRecommendation();
    recordActivity("rhythm-coach-generated", { goal: coachGoal.value });
  });
}

if (eventGeneratorForm) {
  eventGeneratorForm.addEventListener("submit", (e) => {
    e.preventDefault();
    generateEventDraft();
  });
}

if (saveEventDraftBtn) {
  saveEventDraftBtn.addEventListener("click", () => {
    const text = lastGeneratedEventDraft || generateEventDraft();
    if (!text) return;
    savePendingFollowup({
      title: `Event follow-up: ${eventNameInput.value.trim()}`,
      note: text,
      context: eventDetailInput.value.trim(),
    });
    recordActivity("event-followup-saved", { eventName: eventNameInput.value.trim() });
    renderSitesSmartLayer();
  });
}

if (simEvaluateBtn) {
  simEvaluateBtn.addEventListener("click", () => {
    const result = evaluateNetworkingMessage({
      scenario: simScenario.value,
      persona: simPersona.value,
      message: simMessage.value,
    });
    simClarity.textContent = String(result.clarity);
    simSpecificity.textContent = String(result.specificity);
    simTone.textContent = String(result.tone);
    simFeedback.innerHTML = result.feedback.map((item) => `<li>${item}</li>`).join("");
    simImproved.textContent = result.improvedVersion;
    simResult.hidden = false;
    recordActivity("simulator-evaluated", { scenario: simScenario.value, overall: result.overall });
  });
}

// ========================================
// Path Selector for Networking Personas
// ========================================

const NETWORKING_PATHS = {
  all: {
    label: "All platforms",
    platforms: ["linkedin", "wellfound", "meetup", "slack", "x", "substack", "upwork", "eventbrite", "medium"],
  },
  introvert: {
    label: "The Introvert",
    platforms: ["slack", "substack", "medium", "wellfound"],
    description: "Async-first platforms favoring thoughtful writing, community questions, and low-pressure networking",
  },
  extrovert: {
    label: "The Extrovert",
    platforms: ["linkedin", "x", "meetup", "eventbrite"],
    description: "Public voice and in-person platforms for fast-paced, visible networking",
  },
  builder: {
    label: "The Builder",
    platforms: ["upwork", "wellfound", "medium", "substack", "linkedin"],
    description: "Platforms that showcase proof of work, expertise, and building an audience",
  },
};

const PATH_SELECTOR_KEY = "ngc_networking_path";

function initPathSelector() {
  const pathSelectorBtns = document.querySelectorAll(".path-selector__btn");
  if (!pathSelectorBtns.length) return;

  // Load saved path preference
  const savedPath = localStorage.getItem(PATH_SELECTOR_KEY) || "all";
  setActivePath(savedPath);

  // Add click handlers
  pathSelectorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const path = btn.dataset.path;
      setActivePath(path);
      localStorage.setItem(PATH_SELECTOR_KEY, path);
      recordActivity("path-selector-changed", { path });
    });
  });
}

function setActivePath(pathKey) {
  const pathConfig = NETWORKING_PATHS[pathKey];
  if (!pathConfig) return;

  // Update button states
  document.querySelectorAll(".path-selector__btn").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.path === pathKey);
  });

  // Highlight platforms in table
  document.querySelectorAll(".platform-compare tr[data-platform]").forEach((row) => {
    const platform = row.dataset.platform;
    const isHighlighted = pathConfig.platforms.includes(platform);
    if (isHighlighted) {
      row.setAttribute("data-platform-highlight", "true");
    } else {
      row.removeAttribute("data-platform-highlight");
    }
  });

  // Highlight site cards
  document.querySelectorAll(".site-card[data-platform]").forEach((card) => {
    const platform = card.dataset.platform;
    const isHighlighted = pathConfig.platforms.includes(platform);
    if (isHighlighted) {
      card.setAttribute("data-platform-highlight", "true");
    } else {
      card.removeAttribute("data-platform-highlight");
    }
  });
}

// Initialize path selector when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPathSelector);
} else {
  initPathSelector();
}

momentumInputs.weightVisibility.addEventListener("input", () => {
  momentumInputs.weightVisibilityVal.textContent = momentumInputs.weightVisibility.value;
});
momentumInputs.weightConsistency.addEventListener("input", () => {
  momentumInputs.weightConsistencyVal.textContent = momentumInputs.weightConsistency.value;
});
momentumInputs.weightExecution.addEventListener("input", () => {
  momentumInputs.weightExecutionVal.textContent = momentumInputs.weightExecution.value;
});

settingsSaveBtn.addEventListener("click", () => {
  readSettingsUi();
  saveSettings(settings);
  applyAllSettings();
  closeSettingsPanel();
});

settingsResetBtn.addEventListener("click", () => {
  settings = structuredClone(DEFAULT_SETTINGS);
  saveSettings(settings);
  syncSettingsUi();
  applyAllSettings();
});

settingsCloseBtn.addEventListener("click", closeSettingsPanel);
settingsBackdrop.addEventListener("click", closeSettingsPanel);

if (recentWinDismissBtn) {
  recentWinDismissBtn.addEventListener("click", () => {
    if (recentWinBanner) recentWinBanner.classList.add("is-hidden");
    sessionStorage.setItem(RECENT_WIN_DISMISSED_KEY, "1");
  });
}

if (recentWinShareBtn) {
  recentWinShareBtn.addEventListener("click", () => {
    const shareUrl = "https://www.linkedin.com/feed/";
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  });
}

if (settingsTabLink) {
  settingsTabLink.addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel();
  });
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !settingsPanel.hidden) closeSettingsPanel();
});

syncSettingsUi();
applyAllSettings();
renderSitesSmartLayer();
initSectionCollapses();

// ---- Active sidebar link via IntersectionObserver ----
(function () {
  const sidebarLinks = document.querySelectorAll(".sites-sidebar__nav a[href^='#']");
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
