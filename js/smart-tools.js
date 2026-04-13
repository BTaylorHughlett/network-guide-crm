const MOMENTUM_HISTORY_KEY = "ngc_momentum_history_v1";
const ACTIVITY_LOG_KEY = "ngc_activity_log_v1";
const PENDING_FOLLOWUPS_KEY = "ngc_pending_followups_v1";
const lastVariantIndexByKey = Object.create(null);

function loadArray(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

function firstName(name) {
  return String(name || "").trim().split(/\s+/)[0] || "there";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pickVariant(key, options) {
  const list = Array.isArray(options) ? options.filter(Boolean) : [];
  if (!list.length) return "";
  let index = Math.floor(Math.random() * list.length);
  if (list.length > 1 && index === lastVariantIndexByKey[key]) {
    index = (index + 1) % list.length;
  }
  lastVariantIndexByKey[key] = index;
  return list[index];
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return value.toISOString().slice(0, 10);
}

function isSameDay(a, b) {
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

function weekKeyFromDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const first = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date - first) / 86400000);
  const week = Math.ceil((dayOffset + first.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${week}`;
}

export function loadMomentumHistory() {
  return loadArray(MOMENTUM_HISTORY_KEY);
}

export function appendMomentumHistory(entry) {
  const next = loadMomentumHistory();
  next.push({
    date: new Date().toISOString(),
    score: Number(entry?.score) || 0,
    label: String(entry?.label || "Momentum score"),
  });
  saveArray(MOMENTUM_HISTORY_KEY, next.slice(-24));
}

export function loadActivityLog() {
  return loadArray(ACTIVITY_LOG_KEY);
}

export function recordActivity(type, meta = {}) {
  const next = loadActivityLog();
  next.push({
    type,
    meta,
    date: new Date().toISOString(),
  });
  saveArray(ACTIVITY_LOG_KEY, next.slice(-240));
}

export function loadPendingFollowups() {
  return loadArray(PENDING_FOLLOWUPS_KEY);
}

export function savePendingFollowup(draft) {
  const next = loadPendingFollowups();
  next.unshift({
    id: draft?.id || `pending_${Date.now()}`,
    createdAt: new Date().toISOString(),
    title: String(draft?.title || "Pending follow-up"),
    note: String(draft?.note || ""),
    context: String(draft?.context || ""),
  });
  saveArray(PENDING_FOLLOWUPS_KEY, next.slice(0, 12));
}

export function removePendingFollowup(id) {
  const next = loadPendingFollowups().filter((item) => item.id !== id);
  saveArray(PENDING_FOLLOWUPS_KEY, next);
}

export function buildProgressSnapshot(profile, contacts, momentumHistory) {
  const plannerFields = [profile?.role, profile?.skills, profile?.goal].filter((value) => String(value || "").trim()).length;
  const plannerPercent = Math.round((plannerFields / 3) * 100);
  const contactsCount = Array.isArray(contacts) ? contacts.length : 0;
  const momentumCount = Array.isArray(momentumHistory) ? momentumHistory.length : 0;
  const playbookUnlocked = plannerFields === 3;
  const overall = Math.round((plannerPercent + clamp((contactsCount / 3) * 100, 0, 100) + (playbookUnlocked ? 100 : 35)) / 3);

  return {
    plannerPercent,
    contactsCount,
    playbookUnlocked,
    momentumCount,
    overall,
  };
}

export function buildOnboardingState(profile, contacts, momentumHistory) {
  const snapshot = buildProgressSnapshot(profile, contacts, momentumHistory);
  const contactsCount = snapshot.contactsCount;
  return [
    {
      id: "planner",
      label: "Step 1: Fill Planner",
      detail: snapshot.plannerPercent === 100 ? "Planner complete" : `${snapshot.plannerPercent}% complete`,
      done: snapshot.plannerPercent === 100,
    },
    {
      id: "contacts",
      label: "Step 2: Add 3 contacts",
      detail: `${contactsCount}/3 added`,
      done: contactsCount >= 3,
    },
    {
      id: "actions",
      label: "Step 3: Get your first 3 actions",
      detail: snapshot.plannerPercent === 100 ? "Ready to generate and use in CRM" : "Complete Planner first",
      done: snapshot.plannerPercent === 100,
    },
    {
      id: "playbook",
      label: "Step 4: See your personalized Playbook",
      detail: snapshot.playbookUnlocked ? "Recommendations unlocked" : "Unlock by finishing Planner",
      done: snapshot.playbookUnlocked,
    },
  ];
}

export function buildWhatsNext(page, { profile, contacts, momentumHistory, pendingFollowups }) {
  const snapshot = buildProgressSnapshot(profile, contacts, momentumHistory);
  const contactsCount = Array.isArray(contacts) ? contacts.length : 0;
  const pendingCount = Array.isArray(pendingFollowups) ? pendingFollowups.length : 0;

  if (page === "planner") {
    if (snapshot.plannerPercent < 100) {
      return {
        title: "What's next?",
        items: [
          "Finish the three Planner fields so your recommendations personalize across the app.",
          "Generate your first 3-step plan.",
          contactsCount ? `You already have ${contactsCount} CRM contact(s) waiting for follow-up.` : "Then add your first 3 contacts in CRM.",
        ],
      };
    }
    return {
      title: "What's next?",
      items: [
        contactsCount >= 3 ? "Open CRM and generate your daily outreach recommendation." : `Add ${Math.max(0, 3 - contactsCount)} more contact(s) in CRM.`,
        "Open the Playbook and run the Networking Rhythm Coach.",
        snapshot.momentumCount ? "Recalculate momentum to keep your trend line up to date." : "Calculate your first momentum score.",
      ],
    };
  }

  if (page === "crm") {
    return {
      title: "What's next?",
      items: [
        contactsCount ? "Click 'Who should I contact today?' to get your highest-priority outreach." : "Add your first contact to unlock the outreach copilot.",
        pendingCount ? `You have ${pendingCount} pending follow-up draft(s) from the Playbook.` : "Use the Playbook event follow-up generator to create a draft.",
        snapshot.momentumCount ? "Review your monthly report and streaks." : "Run a momentum score from the Playbook to fill out your report.",
      ],
    };
  }

  return {
    title: "What's next?",
    items: [
      snapshot.plannerPercent === 100 ? "Run the Networking Rhythm Coach for a weekly cadence recommendation." : "Complete Planner first to unlock personalized platform recommendations.",
      "Generate an event follow-up and save it to CRM as a pending draft.",
      snapshot.momentumCount ? "Compare your latest momentum score with your previous one." : "Calculate your first momentum score to start your trend line.",
    ],
  };
}

export function computeMomentumTrend(momentumHistory) {
  const history = Array.isArray(momentumHistory) ? momentumHistory : [];
  const latest = history[history.length - 1] || null;
  const previous = history[history.length - 2] || null;
  const delta = latest && previous ? latest.score - previous.score : 0;
  return {
    latest,
    previous,
    delta,
    direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
  };
}

export function getActivityStreaks(activityLog) {
  const log = Array.isArray(activityLog) ? activityLog.slice().sort((a, b) => a.date.localeCompare(b.date)) : [];
  const outreachDays = [...new Set(log.filter((item) => item.type === "outreach-logged").map((item) => item.date.slice(0, 10)))];
  const crmDays = [...new Set(log.filter((item) => item.type === "contact-saved").map((item) => item.date.slice(0, 10)))];
  const eventWeeks = [...new Set(log.filter((item) => item.type === "event-followup-saved").map((item) => weekKeyFromDate(item.date)))].filter(Boolean);

  function dailyStreak(days) {
    if (!days.length) return 0;
    let streak = 0;
    let current = todayIso();
    const daySet = new Set(days);
    while (daySet.has(current)) {
      streak += 1;
      current = daysAgoIso(streak);
    }
    return streak;
  }

  function weeklyStreak(weeks) {
    return weeks.length;
  }

  return {
    outreachDays: dailyStreak(outreachDays),
    crmUpdateDays: dailyStreak(crmDays),
    eventWeeks: weeklyStreak(eventWeeks),
  };
}

export function buildMonthlyReport({ contacts, momentumHistory, activityLog }) {
  const list = Array.isArray(contacts) ? contacts : [];
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const addedThisMonth = list.filter((contact) => String(contact.createdAt || "").slice(0, 10) >= monthStart).length;
  const overdue = list.filter((contact) => contact.nextFollowUp && contact.nextFollowUp < todayIso()).length;
  const active = list.filter((contact) => /active|referral/i.test(String(contact.status || ""))).length;
  const trend = computeMomentumTrend(momentumHistory);
  const streaks = getActivityStreaks(activityLog);

  const wins = [];
  if (addedThisMonth) wins.push(`You added ${addedThisMonth} new contact(s) this month.`);
  if (active) wins.push(`${active} contact(s) are currently in active conversation or opportunity flow.`);
  if (trend.latest) wins.push(`Your latest momentum score is ${trend.latest.score}/100${trend.delta ? ` (${trend.delta > 0 ? "+" : ""}${trend.delta})` : ""}.`);
  if (!wins.length) wins.push("Your networking system is set up and ready for your next round of outreach.");

  const opportunities = [];
  if (overdue) opportunities.push(`${overdue} contact(s) are overdue for follow-up.`);
  if (!list.length) opportunities.push("Add at least 3 contacts so prioritization becomes useful.");
  if (!trend.latest) opportunities.push("Run your first momentum score so you can start tracking progress over time.");
  if (!opportunities.length) opportunities.push("Keep momentum up by logging one outreach action each day you actively network.");

  return {
    addedThisMonth,
    overdue,
    active,
    trend,
    streaks,
    wins: wins.slice(0, 3),
    opportunities: opportunities.slice(0, 3),
  };
}

export function suggestContactEnrichment({ name, company, title }) {
  const fullName = String(name || "").trim();
  const normalizedName = fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const normalizedCompany = String(company || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const titleTokens = tokenize(title).slice(0, 3);
  const tags = [];
  if (titleTokens.some((token) => ["engineer", "developer", "cto", "architect"].includes(token))) tags.push("engineering");
  if (titleTokens.some((token) => ["founder", "ceo", "cofounder"].includes(token))) tags.push("founder");
  if (titleTokens.some((token) => ["sales", "growth", "account", "revenue"].includes(token))) tags.push("sales");
  if (titleTokens.some((token) => ["product", "pm", "manager"].includes(token))) tags.push("product");
  if (normalizedCompany.includes("capital") || normalizedCompany.includes("ventures")) tags.push("investor");
  return {
    linkedin: normalizedName ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(fullName)}` : "",
    titleSuggestion: title || (normalizedCompany ? `Team member at ${company}` : ""),
    tags: [...new Set(tags)].join(", "),
  };
}

export function buildOutreachMessage({ profile, contact, mode = "intro" }) {
  const greeting = firstName(contact?.name);
  const goal = String(profile?.goal || "your current goal").trim();
  const role = String(profile?.role || "my current work").trim();
  const skills = String(profile?.skills || "").split(",").map((value) => value.trim()).filter(Boolean).slice(0, 2).join(" and ");
  const company = contact?.company ? ` at ${contact.company}` : "";
  const relevance = contact?.goalsAlignment || contact?.tags || contact?.notes || contact?.lastOutcome || "the overlap between what you're doing and what I'm working toward";

  const followupTemplates = [
    `Hi ${greeting} - great talking with you${company}. I've been working on ${goal}, and your perspective on ${relevance} keeps coming to mind. If you're open to it, I can share a quick update on what I've tested and where I could use your input.`,
    `Hi ${greeting} - quick follow-up after our last chat${company}. I'm still focused on ${goal}, and your input on ${relevance} would be really helpful as I choose my next step.`,
    `Hi ${greeting} - appreciated our conversation${company}. I've been making progress on ${goal}, and your take on ${relevance} would help me pressure-test what I'm doing.`,
    `Hi ${greeting} - following up from our recent conversation${company}. I'm continuing to work on ${goal}, and I'd value your perspective on ${relevance} if you have a few minutes.`,
  ];

  const reconnectTemplates = [
    `Hi ${greeting} - it has been a minute, and I'd love to reconnect. I'm focused this month on ${goal}, and your experience with ${relevance} felt especially relevant. If you're up for it, I'd really value a quick 15-minute note-swap and can share what I'm seeing from the ${role} side.`,
    `Hi ${greeting} - hope you have been well. I wanted to reconnect because I'm focused on ${goal}, and your experience with ${relevance} is still top of mind for me. Open to a short catch-up soon?`,
    `Hi ${greeting} - it has been a while, and I thought of you while working on ${goal}. Given your background in ${relevance}, I would love to compare notes briefly if your schedule allows.`,
    `Hi ${greeting} - I wanted to reach back out. I'm spending this month on ${goal}, and your perspective on ${relevance} would be genuinely useful. If you're open, I'd appreciate a short reconnect call.`,
  ];

  const introTemplates = [
    `Hi ${greeting} - reaching out because I'm focused on ${goal} over the next few weeks. I come from ${role}${skills ? `, especially ${skills},` : ""} and thought of you because of ${relevance}. If you're open, I'd really value a short conversation to compare notes and get your take.`,
    `Hi ${greeting} - I'm currently working on ${goal}, and your experience with ${relevance} stood out right away. My background is ${role}${skills ? ` with a focus on ${skills}` : ""}. If you're open, I'd appreciate a quick chat to learn from your perspective.`,
    `Hi ${greeting} - I'm reaching out with a focused ask. I'm working on ${goal}, and your work around ${relevance} feels closely aligned. I come from ${role}${skills ? `, especially ${skills}` : ""}, and I'd value a short conversation if you're open to it.`,
    `Hi ${greeting} - I wanted to introduce myself. I'm focused on ${goal} right now and thought of you because of ${relevance}. My background is in ${role}${skills ? `, especially ${skills}` : ""}. If useful, I'd love to connect for a brief note-swap.`,
  ];

  if (mode === "follow-up") {
    return pickVariant("outreach-followup", followupTemplates);
  }

  if (mode === "reconnect") {
    return pickVariant("outreach-reconnect", reconnectTemplates);
  }

  return pickVariant("outreach-intro", introTemplates);
}

export function buildEventFollowup({ profile, eventName, detail }) {
  const correctCommonTypos = (text) => {
    const dictionary = {
      regurlarly: "regularly",
      reuglarly: "regularly",
      definately: "definitely",
      seperately: "separately",
      acheive: "achieve",
      recieve: "receive",
      occassionally: "occasionally",
      thier: "their",
      teh: "the",
      begining: "beginning",
      disciplne: "discipline",
      follw: "follow",
      copilot: "Copilot",
      "co-pilot": "Copilot",
    };

    return String(text || "").replace(/\b[\w-]+\b/gi, (word) => {
      const fixed = dictionary[word.toLowerCase()];
      if (!fixed) return word;
      if (/^[A-Z]/.test(word) && /^[a-z]/.test(fixed)) return `${fixed[0].toUpperCase()}${fixed.slice(1)}`;
      return fixed;
    });
  };

  const normalizePhrase = (value, fallback) => {
    const raw = correctCommonTypos(value || fallback)
      .replace(/\s+/g, " ")
      .replace(/[.?!]+$/g, "")
      .trim();
    if (!raw) return fallback;
    return /^[A-Z][a-z]/.test(raw) ? `${raw[0].toLowerCase()}${raw.slice(1)}` : raw;
  };

  const toFocusedOnPhrase = (value) => {
    const phrase = String(value || "").trim();
    if (!phrase) return "my networking goals";

    const firstWord = phrase.split(/\s+/)[0].toLowerCase();
    const gerundMap = {
      improve: "improving",
      build: "building",
      grow: "growing",
      increase: "increasing",
      reduce: "reducing",
      strengthen: "strengthening",
      create: "creating",
      develop: "developing",
      expand: "expanding",
      launch: "launching",
      learn: "learning",
      practice: "practicing",
      refine: "refining",
      streamline: "streamlining",
    };

    const gerund = gerundMap[firstWord];
    if (!gerund) return phrase;
    return `${gerund}${phrase.slice(firstWord.length)}`;
  };

  const event = String(eventName || "the event").replace(/\s+/g, " ").trim();
  const focus = normalizePhrase(detail, "a key idea from the session");
  const goal = toFocusedOnPhrase(normalizePhrase(profile?.goal, "my networking goals"));

  const goalOpeners = [
    `Hi - great meeting you at ${event}.`,
    `Thanks again for the conversation at ${event}.`,
    `Really enjoyed connecting at ${event}.`,
    `Quick follow-up from ${event}.`,
  ];
  const goalMiddles = [
    `Your point about ${focus} stayed with me, and I'm focused on ${goal} right now.`,
    `What you shared on ${focus} was genuinely helpful as I work on ${goal}.`,
    `Your perspective on ${focus} gave me a clearer direction while I focus on ${goal}.`,
    `I've kept thinking about your advice on ${focus} as I continue with ${goal}.`,
  ];
  const goalClosers = [
    "If you are open, I would love to continue the conversation next week.",
    "Would you be up for a short follow-up chat?",
    "Happy to share a quick update on what I apply from your advice.",
    "If useful, I would value your take on one next step.",
  ];

  const noGoalOpeners = [
    `Hi - great meeting you at ${event}.`,
    `Thanks again for connecting at ${event}.`,
    `Really good talking with you at ${event}.`,
    `Quick note after ${event}.`,
  ];
  const noGoalMiddles = [
    `Your insight on ${focus} stuck with me.`,
    `I appreciated your perspective on ${focus}.`,
    `The way you framed ${focus} was clear and practical.`,
    `Your advice on ${focus} gave me a fresh angle.`,
  ];
  const noGoalClosers = [
    "If you are open, I would love to keep the conversation going.",
    "Would you be up for a short follow-up chat?",
    "Happy to send a concise recap and one takeaway I am acting on.",
    "I would love to stay in touch and compare notes.",
  ];

  const templatesWithGoal = [];
  for (const opener of goalOpeners) {
    for (const middle of goalMiddles) {
      for (const closer of goalClosers) {
        templatesWithGoal.push(`${opener} ${middle} ${closer}`);
      }
    }
  }

  const templatesNoGoal = [];
  for (const opener of noGoalOpeners) {
    for (const middle of noGoalMiddles) {
      for (const closer of noGoalClosers) {
        templatesNoGoal.push(`${opener} ${middle} ${closer}`);
      }
    }
  }

  const shouldAvoidGoalPhrase = /follow\s*-?\s*up\s+discipline/i.test(goal);
  const templates = shouldAvoidGoalPhrase
    ? templatesNoGoal
    : [...templatesWithGoal, ...templatesNoGoal];

  return pickVariant("event-followup", templates);
}

export function buildRhythmRecommendation({ profile, answers, momentumHistory }) {
  const roleTokens = tokenize([profile?.role, profile?.skills, profile?.goal].join(" "));
  const priorities = ["linkedin"];
  if (answers.goal === "startup" || roleTokens.includes("founder")) priorities.push("wellfound", "x");
  else if (answers.goal === "freelance") priorities.push("upwork", "slack");
  else if (answers.goal === "thought") priorities.push("x", "substack");
  else priorities.push("slack", answers.prefersEvents ? "meetup" : "x");

  const weekly = [];
  const timeTemplates = answers.time === "light"
    ? [
        "Keep it light: schedule two 25-minute check-ins with people you genuinely want to stay connected to.",
        "Use two short 25-minute blocks this week to maintain relationships without overloading your schedule.",
        "Protect two focused 25-minute networking windows this week and keep each one simple.",
        "Plan two short relationship touchpoints this week so your network stays warm with minimal effort.",
      ]
    : [
        "Block three focused networking sessions this week so your outreach stays intentional, not reactive.",
        "Set aside three structured networking blocks this week and treat them like real commitments.",
        "Run three dedicated outreach sessions this week to build momentum with consistency.",
        "Schedule three focused networking windows this week so your progress compounds.",
      ];
  const visibilityTemplates = answers.prefersEvents
    ? [
        "Build real-world trust by joining one live community touchpoint every two weeks.",
        "Prioritize one live event or meetup every two weeks to deepen real relationships.",
        "Add one in-person or live session every two weeks so your network feels more personal.",
        "Use one recurring live touchpoint every two weeks to strengthen trust faster.",
      ]
    : [
        "Build visible credibility by sharing one genuinely useful public post each week.",
        "Publish one practical insight each week so people can see your thinking in action.",
        "Share one concise, useful signal weekly to stay visible without creating content fatigue.",
        "Post one valuable takeaway each week to keep your public presence active and helpful.",
      ];
  const comfortTemplates = answers.comfort === "low"
    ? [
        "Start with warm bridges first so outreach feels easier and confidence builds naturally.",
        "Begin with familiar contacts to lower friction and build confidence before broader outreach.",
        "Lead with warmer relationships first, then expand once your rhythm feels comfortable.",
        "Use low-pressure warm intros first so consistency feels sustainable.",
      ]
    : [
        "Mix one warm ask with one visibility action each week to keep momentum high without burning out.",
        "Balance direct outreach with one public signal each week so your momentum stays steady.",
        "Pair one warm conversation ask with one visibility move each week to keep progress balanced.",
        "Combine one direct ask and one public action weekly for consistent forward movement.",
      ];

  weekly.push(pickVariant(`rhythm-time-${answers.time}`, timeTemplates));
  weekly.push(pickVariant(`rhythm-visibility-${answers.prefersEvents ? "events" : "async"}`, visibilityTemplates));
  weekly.push(pickVariant(`rhythm-comfort-${answers.comfort === "low" ? "low" : "high"}`, comfortTemplates));

  const trend = computeMomentumTrend(momentumHistory);
  return {
    priorities: [...new Set(priorities)].slice(0, 3),
    weekly,
    trend,
  };
}

export function evaluateNetworkingMessage({ scenario, message }) {
  const text = String(message || "").trim();
  const lower = text.toLowerCase();
  const clarity = clamp(Math.round((text.length >= 120 && text.length <= 420 ? 42 : 28) + (/[?.!]/.test(text) ? 18 : 8)), 0, 100);
  const specificity = clamp((/because|about|from|at|on/.test(lower) ? 35 : 18) + (text.includes("[") ? 5 : 15) + (text.split(" ").length > 30 ? 25 : 12), 0, 100);
  const tone = clamp((/thank|appreciat|helpful|open|value/.test(lower) ? 45 : 22) + (!/asap|urgent|immediately/.test(lower) ? 25 : 5), 0, 100);
  const overall = Math.round((clarity + specificity + tone) / 3);
  const feedback = [];
  if (clarity < 60) feedback.push("Tighten the first line so your main ask is clear right away.");
  if (specificity < 60) feedback.push("Add one concrete detail that shows why you reached out to this person specifically.");
  if (tone < 60) feedback.push("Soften the ask slightly and make it easy for them to say yes or no.");
  if (!feedback.length) feedback.push("This is a strong draft: clear, specific, and easy to respond to.");

  const improvedByScenario = {
    "warm-intro": [
      "Hi [Name] - [mutual connection] mentioned you, and I can see why. I'm working on [specific goal], and your experience with [specific context] stood out. If you're open, I'd appreciate a short conversation and can keep it easy on your calendar.",
      "Hi [Name] - I was pointed your way by [mutual connection]. I'm focused on [specific goal], and your work around [specific context] felt especially relevant. If you're open, I would value a quick chat.",
      "Hi [Name] - [mutual connection] suggested I reach out. I'm currently working on [specific goal], and your perspective on [specific context] would be really helpful. Open to a brief call?",
      "Hi [Name] - reaching out on [mutual connection]'s recommendation. I'm focused on [specific goal], and your experience with [specific context] is exactly what I hoped to learn from. If you're open, I would appreciate 15 minutes.",
    ],
    "event-followup": [
      "Hi [Name] - it was great meeting you at [event]. Your point about [detail] stuck with me. I'm focused on [goal], and there feels like a strong overlap. If you're open, I'd love to continue the conversation.",
      "Hi [Name] - really enjoyed talking at [event]. I kept thinking about what you said regarding [detail]. I'm working on [goal], and your perspective would be valuable if you're open to a quick follow-up.",
      "Hi [Name] - thanks again for the conversation at [event]. Your take on [detail] gave me a useful next step as I work on [goal]. Would you be up for a short follow-up chat?",
      "Hi [Name] - quick follow-up from [event]. I appreciated your insight on [detail], and it's directly relevant to [goal] for me right now. If you're open, I'd love to stay in touch and compare notes.",
    ],
    default: [
      "Hi [Name] - I've been following your work on [specific context] and really appreciate it. I'm focused on [goal] this month, and that overlap is why I reached out. If you're open, I'd value a short perspective call.",
      "Hi [Name] - your work on [specific context] stood out to me. I'm currently focused on [goal], and I think there is strong overlap. If you're open, I'd appreciate a short conversation.",
      "Hi [Name] - I appreciated your recent work around [specific context]. I'm spending this month on [goal], and your perspective would be genuinely useful. Open to a quick note-swap?",
      "Hi [Name] - reaching out because your experience with [specific context] aligns with what I'm working on in [goal]. If you're open, I'd value a brief call and will keep it focused.",
    ],
  };

  const improvedVersion = pickVariant(
    `sim-improved-${scenario || "default"}`,
    improvedByScenario[scenario] || improvedByScenario.default
  );

  return {
    clarity,
    specificity,
    tone,
    overall,
    feedback,
    improvedVersion,
  };
}