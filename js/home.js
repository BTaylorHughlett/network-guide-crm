import { loadContacts, loadProfile, saveProfile } from "./storage.js";
import { generatePlans } from "./planner.js";
import {
  buildOnboardingState,
  buildProgressSnapshot,
  buildWhatsNext,
  loadMomentumHistory,
  loadPendingFollowups,
  recordActivity,
} from "./smart-tools.js";

const form = document.getElementById("plannerForm");
const role = document.getElementById("role");
const skills = document.getElementById("skills");
const goal = document.getElementById("goal");
const roleCount = document.getElementById("roleCount");
const skillsCount = document.getElementById("skillsCount");
const goalCount = document.getElementById("goalCount");
const timelineLabels = Array.from(document.querySelectorAll(".rhythm-timeline__step span"));
const generateBtn = document.getElementById("generateBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const exportPlanBtn = document.getElementById("exportPlanBtn");
const clearBtn = document.getElementById("clearBtn");
const results = document.getElementById("results");
const planGrid = document.getElementById("planGrid");
const resultsMeta = document.getElementById("resultsMeta");
const bannerHost = document.getElementById("bannerHost");
const authDialog = document.getElementById("authDialog");
const authForm = document.getElementById("authForm");
const authCloseBtn = document.getElementById("authCloseBtn");
const authCancelBtn = document.getElementById("authCancelBtn");
const authModeLogin = document.getElementById("authModeLogin");
const authModeCreate = document.getElementById("authModeCreate");
const authNameField = document.getElementById("authNameField");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authPasswordHint = document.getElementById("authPasswordHint");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const plannerProgressSummary = document.getElementById("plannerProgressSummary");
const plannerProgressValue = document.getElementById("plannerProgressValue");
const plannerProgressBar = document.getElementById("plannerProgressBar");
const plannerContactsValue = document.getElementById("plannerContactsValue");
const plannerContactsBar = document.getElementById("plannerContactsBar");
const plannerPlaybookValue = document.getElementById("plannerPlaybookValue");
const plannerPlaybookBar = document.getElementById("plannerPlaybookBar");
const plannerProgressRing = document.getElementById("plannerProgressRing");
const plannerContactsRing = document.getElementById("plannerContactsRing");
const plannerPlaybookRing = document.getElementById("plannerPlaybookRing");
const onboardingList = document.getElementById("onboardingList");
const nextPanelList = document.getElementById("nextPanelList");
const pageStatusDot = document.getElementById("pageStatusDot");

const LIMITS = {
  role: 180,
  skills: 350,
  goal: 350,
};

const AUTH_ACCOUNTS_KEY = "ngc_accounts_v1";
const AUTH_SESSION_KEY = "ngc_auth_user_v1";

let latestPlan = null;
let authMode = "login";

function showBanner(kind, message) {
  bannerHost.innerHTML = "";
  const el = document.createElement("div");
  el.className = `banner ${kind}`;
  el.textContent = message;
  bannerHost.appendChild(el);
  window.setTimeout(() => el.remove(), 9000);
}

function countSkills(skillsCsv) {
  return String(skillsCsv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function updateCounter(el, value, max) {
  if (!el) return;
  const n = String(value || "").trim().length;
  el.textContent = `${n}/${max}`;
  el.classList.toggle("count-warn", n > max * 0.9);
}

function pickGoalTheme(goalText) {
  const g = String(goalText || "").toLowerCase();
  if (g.includes("job") || g.includes("interview") || g.includes("career")) {
    return [
      "Sharpen your pitch for target roles",
      "Reach out to 5 role-relevant contacts",
      "Follow up and ask for role-specific insights",
      "Review wins and refine next outreach cycle",
    ];
  }
  if (g.includes("client") || g.includes("sales") || g.includes("business") || g.includes("freelance")) {
    return [
      "Define your offer and ideal buyer",
      "Send targeted outreach to warm prospects",
      "Share proof and case-story follow-ups",
      "Review pipeline and schedule next steps",
    ];
  }
  return [
    "Sharpen profile + outreach message",
    "Start conversations with priority contacts",
    "Follow up and share value consistently",
    "Review momentum and plan next cycle",
  ];
}

function updateTimeline(goalText) {
  if (!timelineLabels.length) return;
  const steps = pickGoalTheme(goalText);
  timelineLabels.forEach((el, i) => {
    el.textContent = steps[i] || "";
  });
}

function buildPayloadFromInputs() {
  return {
    role: role.value.trim(),
    skills: skills.value.trim(),
    goal: goal.value.trim(),
  };
}

function refreshDerivedUi() {
  updateCounter(roleCount, role.value, LIMITS.role);
  updateCounter(skillsCount, skills.value, LIMITS.skills);
  updateCounter(goalCount, goal.value, LIMITS.goal);
  const payload = buildPayloadFromInputs();
  updateTimeline(payload.goal);
  renderSmartLayer(payload);
}

function renderSmartLayer(payload = buildPayloadFromInputs()) {
  const contacts = loadContacts();
  const momentumHistory = loadMomentumHistory();
  const pendingFollowups = loadPendingFollowups();
  const snapshot = buildProgressSnapshot(payload, contacts, momentumHistory);
  const onboarding = buildOnboardingState(payload, contacts, momentumHistory).map((step) => {
    if (step.id === "actions" && latestPlan?.steps?.length) {
      return { ...step, done: true, detail: "Your first 3 actions are ready." };
    }
    return step;
  });
  const next = buildWhatsNext("planner", {
    profile: payload,
    contacts,
    momentumHistory,
    pendingFollowups,
  });

  if (pageStatusDot) {
    pageStatusDot.classList.remove("is-not-started", "is-in-progress", "is-complete");
    if (snapshot.plannerPercent >= 100) pageStatusDot.classList.add("is-complete");
    else if (snapshot.plannerPercent > 0) pageStatusDot.classList.add("is-in-progress");
    else pageStatusDot.classList.add("is-not-started");
  }

  if (plannerProgressSummary) {
    plannerProgressSummary.textContent = snapshot.playbookUnlocked
      ? "Planner complete. Next: use CRM and the Playbook to compound momentum."
      : "Complete Planner to unlock personalized Playbook recommendations and smarter CRM guidance.";
  }
  if (plannerProgressValue) plannerProgressValue.textContent = `${snapshot.plannerPercent}%`;
  if (plannerProgressBar) plannerProgressBar.style.width = `${snapshot.plannerPercent}%`;
  if (plannerContactsValue) plannerContactsValue.textContent = `${snapshot.contactsCount} contact${snapshot.contactsCount === 1 ? "" : "s"}`;
  if (plannerContactsBar) plannerContactsBar.style.width = `${Math.min(100, Math.round((snapshot.contactsCount / 3) * 100))}%`;
  if (plannerPlaybookValue) plannerPlaybookValue.textContent = snapshot.playbookUnlocked ? "Unlocked" : "Locked";
  if (plannerPlaybookBar) plannerPlaybookBar.style.width = snapshot.playbookUnlocked ? "100%" : "35%";
  if (plannerProgressRing) plannerProgressRing.style.setProperty("--pct", snapshot.plannerPercent);
  if (plannerContactsRing) plannerContactsRing.style.setProperty("--pct", Math.min(100, Math.round((snapshot.contactsCount / 3) * 100)));
  if (plannerPlaybookRing) plannerPlaybookRing.style.setProperty("--pct", snapshot.playbookUnlocked ? 100 : 35);

  if (onboardingList) {
    onboardingList.innerHTML = onboarding
      .map(
        (step) => `
          <li class="onboarding-list__item ${step.done ? "is-done" : ""}">
            <span class="onboarding-list__dot"></span>
            <div>
              <strong>${step.label}</strong>
              <p>${step.detail}</p>
            </div>
          </li>
        `
      )
      .join("");
  }

  if (nextPanelList) {
    nextPanelList.innerHTML = next.items.map((item) => `<li>${item}</li>`).join("");
  }
}

function exportPlan() {
  const payload = buildPayloadFromInputs();
  const exportObj = {
    exportedAt: new Date().toISOString(),
    profile: payload,
    plan: latestPlan,
  };

  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `network-plan-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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

function getAuthedUser() {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setAuthedUser(user) {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ name: user.name || "", email: user.email, loggedInAt: new Date().toISOString() })
  );
}

function setAuthMode(mode) {
  authMode = mode;
  const isCreate = mode === "create";
  authNameField.hidden = !isCreate;
  authName.required = isCreate;
  authPassword.minLength = isCreate ? 8 : 1;
  authPassword.autocomplete = isCreate ? "new-password" : "current-password";
  if (authPasswordHint) authPasswordHint.hidden = !isCreate;
  authModeLogin.classList.toggle("is-active", !isCreate);
  authModeCreate.classList.toggle("is-active", isCreate);
  authSubmitBtn.textContent = isCreate ? "Create account & save" : "Log in & save";
}

function validateCreatePassword(password) {
  const value = String(password || "");
  const hasMinLength = value.length >= 8;
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);
  return hasMinLength && hasLetter && hasNumber && hasSymbol;
}

function openAuthDialog() {
  setAuthMode("login");
  authForm.reset();
  authDialog.showModal();
}

function persistDraft() {
  const payload = buildPayloadFromInputs();
  saveProfile(payload);
}

function handleAuthAndSave() {
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const name = authName.value.trim();
  if (!email || !password) {
    showBanner("warn", "Email and password are required.");
    return;
  }

  const accounts = loadAccounts();
  const existing = accounts.find((a) => a.email === email);

  if (authMode === "create") {
    if (existing) {
      showBanner("warn", "An account with this email already exists. Try logging in.");
      return;
    }
    if (!validateCreatePassword(password)) {
      showBanner("warn", "Use at least 8 characters with a mix of letters, numbers, and symbols.");
      return;
    }
    const newAccount = {
      name,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    accounts.push(newAccount);
    saveAccounts(accounts);
    setAuthedUser(newAccount);
    authDialog.close();
    persistDraft();
    showBanner("info", "Account created and progress saved. You can continue later.");
    return;
  }

  if (!existing || existing.password !== password) {
    showBanner("warn", "Invalid email or password.");
    return;
  }

  setAuthedUser(existing);
  authDialog.close();
  persistDraft();
  showBanner("info", "Logged in and progress saved. You can continue later.");
}

function renderSteps(steps, source, localCombinationCount) {
  planGrid.innerHTML = "";
  steps.forEach((step, idx) => {
    const card = document.createElement("article");
    card.className = "plan-step";
    card.setAttribute("role", "listitem");
    card.innerHTML = `
      <div class="plan-step__num">${idx + 1}</div>
      <h3></h3>
      <p></p>
    `;
    card.querySelector("h3").textContent = step.title;
    card.querySelector("p").textContent = step.detail;
    planGrid.appendChild(card);
  });

  results.hidden = false;
  if (source === "openai") {
    resultsMeta.textContent = "Generated with OpenAI via the local server.";
  } else if (localCombinationCount) {
    resultsMeta.textContent = `Generated on-device: randomized from ${localCombinationCount.toLocaleString()} possible 3-step plan combinations, personalized from your inputs.`;
  } else {
    resultsMeta.textContent = "Generated on-device from your inputs (local guided template).";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!form.reportValidity()) return;

  generateBtn.disabled = true;
  results.hidden = true;

  const payload = {
    role: role.value.trim(),
    skills: skills.value.trim(),
    goal: goal.value.trim(),
  };

  saveProfile(payload);

  try {
    const { source, steps, localCombinationCount } = await generatePlans(payload);
    latestPlan = { source, steps };
    renderSteps(steps, source, localCombinationCount);
    recordActivity("planner-plan-generated", { goal: payload.goal, source });
    if (source === "local") {
      showBanner(
        "info",
        "Tip: run `node server.mjs` with OPENAI_API_KEY set to use model-generated plans (this file:// page uses the local template)."
      );
    }
  } catch (err) {
    showBanner("warn", `Could not build a plan: ${err && err.message ? err.message : String(err)}`);
  } finally {
    generateBtn.disabled = false;
  }
});

clearBtn.addEventListener("click", () => {
  role.value = "";
  skills.value = "";
  goal.value = "";
  latestPlan = null;
  results.hidden = true;
  refreshDerivedUi();
});

saveDraftBtn.addEventListener("click", () => {
  const user = getAuthedUser();
  if (user) {
    persistDraft();
    recordActivity("planner-draft-saved", { email: user.email });
    showBanner("info", `Saved for ${user.email}. You can continue later.`);
    return;
  }
  openAuthDialog();
});

exportPlanBtn.addEventListener("click", () => {
  exportPlan();
  showBanner("info", "Plan export downloaded.");
});

[role, skills, goal].forEach((el) => {
  el.addEventListener("input", refreshDerivedUi);
});

authModeLogin.addEventListener("click", () => setAuthMode("login"));
authModeCreate.addEventListener("click", () => setAuthMode("create"));
authCloseBtn.addEventListener("click", () => authDialog.close());
authCancelBtn.addEventListener("click", () => authDialog.close());
authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!authForm.reportValidity()) return;
  handleAuthAndSave();
});

const existing = loadProfile();
if (existing) {
  role.value = existing.role || "";
  skills.value = existing.skills || "";
  goal.value = existing.goal || "";
}

refreshDerivedUi();
renderSmartLayer(buildPayloadFromInputs());
