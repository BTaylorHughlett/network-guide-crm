function parseDate(value) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function scoreContact(contact, userGoalText) {
  let score = 30;
  let weights = { timing: 50, momentum: 30, goalFit: 20 };
  if (arguments.length > 2 && arguments[2] && arguments[2].weights) {
    const w = arguments[2].weights;
    weights = {
      timing: Number(w.timing) || 50,
      momentum: Number(w.momentum) || 30,
      goalFit: Number(w.goalFit) || 20,
    };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const next = parseDate(contact.nextFollowUp);
  const last = parseDate(contact.lastContacted);

  let timingScore = 35;
  if (next) {
    const diff = daysBetween(next, today);
    if (diff < 0) timingScore = 100;
    else if (diff <= 2) timingScore = 85;
    else if (diff <= 7) timingScore = 70;
    else if (diff <= 30) timingScore = 48;
    else timingScore = 28;
  } else {
    timingScore = 40;
  }

  if (last) {
    const stale = daysBetween(today, last);
    if (stale > 120) timingScore = Math.min(100, timingScore + 20);
    else if (stale > 60) timingScore = Math.min(100, timingScore + 10);
  } else {
    timingScore = Math.min(100, timingScore + 8);
  }

  let momentumScore = 30;
  const rel = String(contact.relationship || "").toLowerCase();
  if (rel === "warm" || rel === "champion") momentumScore += 32;
  if (rel === "new" || rel === "cold") momentumScore += 12;

  const status = String(contact.status || "").toLowerCase();
  if (status === "active opportunity" || status === "referral in flight") momentumScore += 38;
  if (status === "active conversation") momentumScore += 24;
  if (status === "stalled") momentumScore += 12;

  momentumScore = Math.max(0, Math.min(100, momentumScore));

  let goalFitScore = 20;
  const goalTokens = tokenize(userGoalText);
  const hay = tokenize(
    [contact.goalsAlignment, contact.notes, contact.company, contact.title, contact.tags].join(" ")
  );
  if (goalTokens.length && hay.length) {
    const overlap = goalTokens.filter((t) => t.length > 3 && hay.includes(t)).length;
    goalFitScore = Math.min(100, 25 + overlap * 18);
  } else if (goalTokens.length === 0) {
    goalFitScore = 10;
  }

  const totalWeight = Math.max(1, weights.timing + weights.momentum + weights.goalFit);
  score =
    (timingScore * weights.timing + momentumScore * weights.momentum + goalFitScore * weights.goalFit) /
    totalWeight;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function priorityBand(score) {
  if (score >= 72) return { label: "High", cls: "p0" };
  if (score >= 48) return { label: "Medium", cls: "p1" };
  return { label: "Lower", cls: "p2" };
}
