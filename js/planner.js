import { LOCAL_PLAN_VARIATION_COUNT, pickLocalPlanVariation } from "./plan-variations.js";

function parsePlanFromModelText(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const steps = [];
  for (const line of lines) {
    const m = line.match(/^(\d+)[.)]\s*(.+)$/);
    if (m) {
      const rest = m[2];
      const dash = rest.indexOf(" - ");
      if (dash > -1) {
        steps.push({
          title: rest.slice(0, dash).trim(),
          detail: rest.slice(dash + 3).trim(),
        });
      } else {
        steps.push({ title: rest, detail: "" });
      }
    }
  }
  if (steps.length >= 3) return steps.slice(0, 3);
  return null;
}

function clip(text, max = 90) {
  const value = String(text || "").trim();
  if (!value) return "your 4-week networking goal";
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function toGerund(verb) {
  const v = String(verb || "").toLowerCase();
  const irregular = {
    be: "being",
    run: "running",
    begin: "beginning",
    get: "getting",
  };
  if (irregular[v]) return irregular[v];
  if (v.endsWith("ie")) return `${v.slice(0, -2)}ying`;
  if (v.endsWith("e") && !v.endsWith("ee")) return `${v.slice(0, -1)}ing`;
  return `${v}ing`;
}

function polishGoalForSentence(goalText) {
  const raw = clip(goalText, 86)
    .replace(/\bfollow up\b/gi, "follow-up")
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "your 4-week networking goal";

  let phrase = raw
    .replace(/^my goal is to\s+/i, "")
    .replace(/^my goal is\s+/i, "")
    .replace(/^i want to\s+/i, "")
    .replace(/^i need to\s+/i, "")
    .replace(/^i am trying to\s+/i, "")
    .replace(/^trying to\s+/i, "")
    .replace(/^to\s+/i, "")
    .replace(/[.?!;,:\s]+$/g, "");
  const parts = phrase.split(" ");
  const first = parts[0] ? parts[0].toLowerCase() : "";
  const alreadyGerund = /ing$/.test(first);

  const baseVerbs = new Set([
    "improve",
    "build",
    "create",
    "develop",
    "increase",
    "reduce",
    "strengthen",
    "grow",
    "land",
    "transition",
    "expand",
    "start",
    "launch",
    "get",
    "learn",
    "find",
    "reach",
  ]);

  if (!alreadyGerund && baseVerbs.has(first)) {
    parts[0] = toGerund(first);
    phrase = parts.join(" ");
  }

  const cleaned = phrase.replace(/\s+/g, " ").trim();
  return cleaned || "your 4-week networking goal";
}

function contextFromInputs({ role, skills, goal }) {
  const roleShort = clip(role, 70);
  const goalShort = clip(goal, 86);
  const goalFocus = polishGoalForSentence(goal);
  const skillList = String(skills || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const primarySkill = skillList[0] || "workflow optimization";
  return { roleShort, goalShort, goalFocus, primarySkill };
}

function roleWithBackground(c) {
  const rawRole = c.roleShort || "professional";
  const role = rawRole.replace(/^\s*(a|an|the)\s+/i, "").trim();
  const sentenceRole = /^[A-Z][a-z]/.test(role) ? role.charAt(0).toLowerCase() + role.slice(1) : role;
  const skill = c.primarySkill || "workflow optimization";
  return `a ${sentenceRole} with a background in ${skill}`;
}

function conversationStarterFor(index, c) {
  if (index === 0) {
    return `Conversation starter: "Hi [Name], I'm ${roleWithBackground(c)}. I came across your work on [their priority] and it really stood out. I'm focused on ${c.goalFocus} right now. Would you be open to a quick 15-minute perspective swap this week?"`;
  }
  if (index === 1) {
    return `Conversation starter: "Hi [Name], quick follow-up on ${c.goalFocus}. I drafted a short approach from my ${c.primarySkill} background and would really value your take on what to tighten first."`;
  }
  return `Conversation starter: "Hi [Name], thanks again for the advice. I put it into practice around ${c.goalFocus} and captured a short recap. Want me to share what changed?"`;
}

function valueHookFor(index, c) {
  if (index === 0) {
    return "Value hook: Share a one-sentence positioning draft and ask for one targeted edit.";
  }
  if (index === 1) {
    return `Value hook: Offer a one-page ${c.primarySkill} checklist or template they can use right away.`;
  }
  return "Value hook: Share a short before/after recap with one measurable result plus your next step.";
}

function softenGeneratedText(text) {
  return String(text || "")
    .replace(/\butilize\b/gi, "use")
    .replace(/\bleverage\b/gi, "use")
    .replace(/\bWould you be open to\b/g, "Would you be up for")
    .replace(/\bI am\b/g, "I'm")
    .replace(/\bdo not\b/g, "don't")
    .replace(/\bcannot\b/g, "can't")
    .replace(/\s+/g, " ")
    .trim();
}

function addActionableSufficiency(steps, inputs) {
  const c = contextFromInputs(inputs);
  return steps.map((step, index) => {
    const detail = String(step?.detail || "").trim();
    const additions = [];

    if (!/conversation starter\s*:/i.test(detail)) {
      additions.push(conversationStarterFor(index, c));
    }
    if (!/value hook\s*:/i.test(detail)) {
      additions.push(valueHookFor(index, c));
    }

    return {
      ...step,
      title: softenGeneratedText(step?.title),
      detail: softenGeneratedText([detail, ...additions].filter(Boolean).join(" ")),
    };
  });
}

export async function fetchOpenAiPlan({ role, skills, goal }) {
  const res = await fetch("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, skills, goal }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Plan request failed (${res.status})`);
  }

  const data = await res.json();
  if (data && Array.isArray(data.steps) && data.steps.length >= 3) {
    return data.steps.slice(0, 3).map((s) => ({
      title: String(s.title || "").trim(),
      detail: String(s.detail || "").trim(),
    }));
  }
  if (data && typeof data.raw === "string") {
    const parsed = parsePlanFromModelText(data.raw);
    if (parsed) return parsed;
  }
  throw new Error("Unexpected response from /api/plan");
}

export async function generatePlans({ role, skills, goal }) {
  try {
    const remote = await fetchOpenAiPlan({ role, skills, goal });
    const ok = remote.every((s) => s.title);
    if (ok) {
      return {
        source: "openai",
        steps: addActionableSufficiency(remote, { role, skills, goal }),
      };
    }
  } catch {
    // fall through
  }

  const { steps, variationIndex } = pickLocalPlanVariation({ role, skills, goal });
  return {
    source: "local",
    steps: addActionableSufficiency(steps, { role, skills, goal }),
    localCombinationCount: LOCAL_PLAN_VARIATION_COUNT,
    localVariationIndex: variationIndex,
  };
}
