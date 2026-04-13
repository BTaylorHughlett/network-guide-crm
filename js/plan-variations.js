/**
 * Large local plan library: billions of distinct 3-step plans from combinatorial templates,
 * plus personalization from the user's role, skills, and goal text.
 */

function pickSkills(skillsCsv) {
  return [
    ...new Set(
      String(skillsCsv || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  ];
}

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .split(/[^a-z0-9+#]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
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

function polishGoalText(goal) {
  const raw = String(goal || "")
    .replace(/\bfollow up\b/gi, "follow-up")
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return "";

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

  if (!/ing$/i.test(first) && baseVerbs.has(first)) {
    parts[0] = toGerund(first);
    phrase = parts.join(" ");
  }
  return phrase.replace(/\s+/g, " ").trim();
}

function ctxFromInput({ role, skills, goal }) {
  const skillsList = pickSkills(skills);
  const top = skillsList.slice(0, 4);
  const skillPhrase =
    top.length > 0
      ? `Highlight proof points such as ${top.join(", ")}.`
      : "Highlight concrete outcomes and measurable impact, not job titles alone.";

  const goalTokens = tokenize(goal);
  const roleTokens = tokenize(role);
  const has = (words) => words.some((w) => goalTokens.includes(w) || roleTokens.includes(w));

  let lens = "general professional growth";
  if (has(["job", "interview", "hire", "career", "offer", "promotion"])) lens = "a focused job search or career transition";
  if (has(["sales", "revenue", "client", "business", "bd"])) lens = "pipeline-building and trusted business development";
  if (has(["founder", "startup", "fund", "invest"])) lens = "founder fundraising and advisor conversations";
  if (has(["engineer", "developer", "software", "data", "devops"])) lens = "technical credibility and peer communities";

  const goalShort = polishGoalText(goal).slice(0, 220);
  const roleShort = String(role || "").trim().slice(0, 220);

  return { skillPhrase, lens, goalShort, roleShort, skillsList };
}

function fill(str, c) {
  return String(str)
    .replaceAll("{{skillPhrase}}", c.skillPhrase)
    .replaceAll("{{lens}}", c.lens)
    .replaceAll("{{goalShort}}", c.goalShort || "your stated 4-week priority")
    .replaceAll("{{roleShort}}", c.roleShort || "your current role and context");
}

const STEP1_TITLES = [
  "Write a crisp 'why you, why now' line",
  "Sharpen your introduction for busy people",
  "Define the outcome you want from conversations",
  "Pick one audience segment to own for a month",
  "Translate your background into a service posture",
  "Name the problem you help people solve",
  "Turn your résumé bullets into story beats",
  "Choose a credibility anchor people can verify",
  "Draft a 20-second spoken intro you enjoy using",
  "Clarify what you are optimizing for this month",
  "Separate identity from tactics in your pitch",
  "Pick a signature example people will remember",
  "Decide what you will politely decline this month",
  "Make your ask legible in one sentence",
  "Tighten your bio across one channel first",
  "Choose a tone: peer, mentor, buyer, or partner",
  "Identify who already trusts you enough to intro you",
  "Write a positioning line that fits DMs and email",
  "Pick a niche phrase your ideal contacts search for",
  "Turn jargon into plain language in your pitch",
  "Choose a weekly theme aligned with {{lens}}",
  "Decide what proof you will show in week one",
  "Pick one metric that proves progress for you",
  "Name the next role title you want people to use",
  "Pick a 'bridge identity' if you are pivoting",
  "Choose a generosity angle you can sustain",
  "Write a line that signals curiosity, not neediness",
  "Pick a comparison that clarifies your work fast",
  "Decide what you want to learn from strangers",
  "Pick a constraint that makes your outreach sharper",
  "Choose a single platform to master for 4 weeks",
  "Write a line that invites collaboration, not favors",
  "Pick a proof artifact you can share quickly",
  "Decide what 'success' means for one conversation",
  "Name the kind of intro you want most right now",
  "Pick a story that shows judgment, not volume",
  "Choose a boundary for your networking time budget",
  "Write a line that respects their calendar pressure",
  "Pick a keyword from your goal and own it publicly",
];

const STEP1_DETAILS = [
  "Spend 20 minutes writing one sentence that connects {{roleShort}} to {{goalShort}}. {{skillPhrase}} Read it aloud; if it feels stiff, rewrite until it sounds like you.",
  "Draft three variants of the same idea: formal email, short DM, and spoken intro. Pick the one that fits {{lens}} best and delete the rest for now.",
  "List five people types you want to meet (titles, industries, or problems). Choose one lane for the next four weeks so your outreach stays coherent with {{goalShort}}.",
  "Write a positioning line that answers: what you do, who it helps, and why it matters now. Tie it to {{lens}} and keep it under 35 words.",
  "Collect three receipts: shipped work, measurable outcomes, or strong testimonials. Pick the strongest one and turn it into a two-sentence story with {{skillPhrase}}",
  "Identify one phrase you overuse ('passionate', 'synergy') and replace it with specifics from your experience. Make your intro sound grounded for {{lens}}.",
  "Write a 'no-go' list: topics you will not center in first conversations because they confuse your positioning around {{goalShort}}.",
  "Pick one channel bio to rewrite first (LinkedIn headline, site blurb, or conference badge line). Align it with {{lens}} and your next-month objective.",
  "Ask a friend to paraphrase your pitch after you say it once. Fix the gap between what you meant and what they heard, especially around {{goalShort}}.",
  "Write a version of your intro that leads with curiosity about their work, then connects to {{roleShort}} in the second sentence.",
  "Create a 'proof stack': one metric, one artifact link, one human quote. Choose the smallest credible bundle that supports {{lens}}.",
  "Write a positioning line that would make sense on a calendar invite title. Keep it human and specific to {{goalShort}}.",
  "Pick a metaphor that clarifies your work for non-experts. Test it with someone outside your field and refine for {{lens}}.",
  "Draft an intro that includes a time box: what you want in 15 minutes, not an open-ended favor. Align the ask with {{goalShort}}.",
  "Write a line that signals reciprocity: what you can offer back in the same month. Make it realistic for your bandwidth and {{lens}}.",
  "Choose a single keyword from your goal and repeat it consistently in intros for two weeks so people associate you with that theme.",
  "Write a 'before/after' mini story: the situation you improve and the outcome you create. Keep it tight and tied to {{skillPhrase}}",
  "Pick a credibility shortcut: certification, notable client, publication, or open-source contribution. Decide how you mention it without bragging.",
  "Write an intro that names the decision you help with, not your internal job description. Optimize for clarity for {{lens}}.",
  "List three misconceptions about your role. Pick one and write a clarifying sentence you can reuse in intros tied to {{goalShort}}.",
  "Write a positioning line that fits voice memos: short clauses, easy to transcribe, still specific to {{lens}}.",
  "Pick a 'signature question' you ask in first chats that reveals fit quickly. Make it respectful and relevant to {{goalShort}}.",
  "Write a version of your intro that assumes they are busy and offers an easy out. Confidence reads as professionalism for {{lens}}.",
  "Decide what you want people to remember after 60 seconds: one idea only. Edit ruthlessly until it matches {{goalShort}}.",
  "Write a line that connects your past chapter to your next chapter without sounding defensive. Keep it forward-looking for {{lens}}.",
  "Pick a comparison: 'like X but for Y' only if it is accurate. Otherwise replace with a concrete example tied to {{skillPhrase}}",
  "Write a positioning line that could work as a talk title. If it is boring, add specificity until it reflects {{goalShort}}.",
  "Choose a 'generosity hook': a resource you share often. Decide how you mention it without making every chat a sales pitch.",
  "Write an intro that includes a constraint you respect: time zone, family schedule, or focus blocks. Boundaries build trust for {{lens}}.",
  "Pick one sentence you will not say because it undersells you. Replace it with a stronger, still honest line aligned with {{goalShort}}.",
  "Write a version of your intro that includes a next step suggestion: a 15-minute call, async questions, or a doc review—pick one.",
  "Draft a line that signals you did homework on their work without sounding creepy. Keep it relevant to {{lens}}.",
  "Pick a 'credibility without CV' tactic: a question only an insider would ask. Use it sparingly and respectfully.",
  "Write an intro that names the risk you reduce for someone else. Risk language often lands better than buzzwords for {{goalShort}}.",
  "Choose a single stat you can cite cleanly. Practice saying it without hedging, then connect it to {{skillPhrase}}",
  "Write a positioning line that would still be true in six months. Avoid hyper-specific hype that expires next week.",
  "Pick a phrase that signals seniority without arrogance. Test it with a peer who will be blunt about tone for {{lens}}.",
  "Write an intro that ends with a choice: two meeting times or two ways to help. Reduce friction for busy contacts.",
  "Decide what you want to be introduced as. Sometimes a simpler title opens more doors; pick what serves {{goalShort}}.",
  "Write a line that acknowledges tradeoffs: what you optimize for and what you intentionally do not do right now.",
  "Pick a 'human detail' that makes you memorable without oversharing. Keep it professional and optional in delivery.",
];

const STEP2_TITLES = [
  "Build a weekly outreach system you can repeat",
  "Create a shortlist and a follow-up cadence",
  "Design a warm intro request you are proud to send",
  "Pick five people to reactivate with a useful nudge",
  "Turn events into three concrete follow-ups each time",
  "Use a simple CRM habit after every conversation",
  "Batch research so outreach feels less draining",
  "Run a 'referral map' for one goal only",
  "Schedule two protected networking blocks weekly",
  "Draft three outreach templates you can personalize fast",
  "Choose one community to participate in consistently",
  "Commit to public generosity in your field weekly",
  "Pick a cadence for checking in with mentors",
  "Turn cold outreach into warm bridges via mutuals",
  "Use voice notes sparingly but intentionally",
  "Design a lightweight pipeline for active leads",
  "Pick a monthly 'intro budget' you will not exceed",
  "Run a 30-minute 'inbox sweep' for dormant threads",
  "Choose one metric: replies, meetings, or introductions",
  "Plan a post-event follow-up within 24 hours",
  "Pick a 'no ghosting' rule for pending threads",
  "Use a checklist before you hit send on big asks",
  "Design a re-engagement note for stalled contacts",
  "Pick a day for admin: CRM updates and thank-yous",
  "Commit to one coffee chat a week with intent",
  "Choose a format: short emails beat long essays",
  "Plan a 'value ping' you can send without asking",
  "Pick a partner for accountability on outreach goals",
  "Use time-boxed research to avoid perfectionism",
  "Design a sequence: touch 1 educates, touch 2 asks",
  "Pick a trigger to follow up after shared news",
  "Plan a monthly review of your top 20 relationships",
  "Choose a channel where you will show up weekly",
  "Commit to commenting with substance, not emojis only",
  "Pick a list of 10 target companies or communities",
  "Design a warm intro script for mutual connections",
  "Use calendar holds for follow-ups you mean to keep",
  "Pick a 'no' template that preserves relationships",
  "Plan a lightweight agenda for first meetings",
  "Choose one recurring meetup or live forum to attend",
];

const STEP2_DETAILS = [
  "Block two 30-minute slots weekly: one for research and shortlists, one for outreach and follow-ups. Aim for at least five meaningful touchpoints per week aligned with {{lens}}.",
  "For each target person, write one line of proof you read their work, one line connecting to {{roleShort}}, and one crisp ask tied to {{goalShort}}. Keep messages under 120 words when possible.",
  "Reactivate five warm contacts with a useful link, intro, or small favor before you ask for anything. Track outcomes in your CRM notes for {{lens}}.",
  "After any event, send three follow-ups within 24 hours: one thank-you, one specific takeaway, one proposed next step related to {{goalShort}}.",
  "Create three templates (warm follow-up, mutual intro request, post-meeting recap). Personalize the first sentence every time; keep the structure stable for speed.",
  "Pick one community (Slack, meetup series, or professional forum) and show up weekly with one thoughtful contribution for four weeks. Consistency beats intensity for {{lens}}.",
  "Build a referral map: list ten targets, then for each write the best bridge you have (alumni, past client, shared hobby). Prioritize bridges that fit {{goalShort}}.",
  "Use a pipeline mindset: for active opportunities track next step, owner, and date. Review every Friday for 15 minutes to keep momentum for {{lens}}.",
  "Batch DMs and emails in one sitting to reduce context switching. Add a ritual: hydrate, timer, then send five messages tied to {{goalShort}}.",
  "Design a re-engagement note for people you have not spoken to in 90 days: acknowledge time gap, share an update, offer help, propose a low-lift catch-up.",
  "Pick a metric to watch for four weeks: meaningful replies, meetings booked, or introductions made. Choose one so you do not dilute your focus on {{lens}}.",
  "For cold outreach, lead with generosity: a concise insight, a relevant article, or a small introduction. Only then connect the thread to {{goalShort}}.",
  "Schedule follow-ups when you send the first message: put a CRM date or calendar reminder so 'later' becomes a system, not a hope, for {{lens}}.",
  "If you fear being annoying, use the 'double opt-in intro' pattern when connecting people, and ask permission before making big asks related to {{goalShort}}.",
  "Use voice notes only when tone matters and text is ambiguous. Keep them under 60 seconds and name your ask clearly for busy recipients.",
  "Plan a monthly 'relationship review': sort contacts by next follow-up, update statuses, and pick three people to deepen intentionally for {{lens}}.",
  "Choose a weekly public action: comment insightfully, share a lesson learned, or post a short win. Keep it aligned with {{skillPhrase}}",
  "When asking for intros, make it easy: draft a forwardable blurb in third person, include why the intro helps both sides, and keep it respectful of {{goalShort}}.",
  "Run a 30-minute inbox sweep for dormant threads: send six short pings with a specific question or offer. Close loops honestly if there is no fit.",
  "Design a first meeting agenda template: goals, time check, questions, next step. Send it in advance when appropriate to signal professionalism for {{lens}}.",
  "Pick a 'no ghosting' rule: if you cannot proceed, send a two-sentence polite close. Reputation compounds from how you end threads as much as how you start them.",
  "Batch research with a checklist: recent post, company update, mutuals, and one conversation hook. Stop at 10 minutes per person to avoid perfectionism for {{goalShort}}.",
  "Use calendar holds for promised follow-ups even if the time shifts later. The habit signals reliability across {{lens}} conversations.",
  "Choose one channel to master for four weeks rather than dabbling across five. Depth creates recognition faster than scattered posts.",
  "Plan a sequence for warm leads: message 1 adds value, message 2 proposes a time-bound call, message 3 offers an alternative like async questions for {{goalShort}}.",
  "If you are time-zone stretched, default to async: a tight list of questions, a Loom-style summary (if you use video), or a doc comment thread for {{lens}}.",
  "Pick an accountability partner: exchange weekly counts of outreach attempts and one lesson learned. Keep it lightweight and honest.",
  "Design a 'value ping' you can send without asking: a relevant benchmark, template, or checklist tied to their work and your {{skillPhrase}}",
  "For mutual intro requests, include timing context ('this month') and why you believe the intro is mutually beneficial, not only for you and {{goalShort}}.",
  "Commit to one live touch monthly: meetup, office hours, community call. Live interactions often unlock faster trust than cold text for {{lens}}.",
  "Use a checklist before big asks: have you earned attention recently, is the ask specific, is the time estimate clear, and is there an easy yes path for {{goalShort}}?",
  "Pick ten organizations you respect. For each, identify one entry point: alumni group, open source, volunteer board, or niche newsletter community relevant to {{lens}}.",
  "Turn long emails into short ones: lead with the ask, then context. Busy people reward clarity, especially when your message supports {{goalShort}}.",
  "Plan a cadence for mentors: not weekly spam, but meaningful updates after milestones. Include one question you truly want answered for {{lens}}.",
  "If you stall, reduce scope: five thoughtful messages beat fifty sloppy ones. Protect energy so you can sustain four weeks toward {{goalShort}}.",
  "Design a follow-up trigger: when they post news, ship a launch, or change roles, use it as a sincere reason to reconnect without feeling random.",
  "Pick a 'no' template that preserves warmth: thank them, explain constraints briefly, offer an alternative like an intro to someone else for {{lens}}.",
  "Use time-boxed research: set a 10-minute timer, capture notes in CRM, then move to outreach. Momentum beats endless tabs for {{goalShort}}.",
  "Choose one weekly public comment goal: three substantive comments on posts in your field. Thoughtful presence attracts inbound for {{lens}}.",
  "Plan a post-meeting habit: within 24 hours send recap, deliver promised resource, and set a follow-up date in CRM. Reliability beats charisma over time for {{goalShort}}.",
  "If you dislike networking events, optimize for small dinners, pair walks, or 15-minute video chats. Pick formats you will actually do for {{lens}}.",
  "Batch thank-yous: every Friday send five short gratitude notes to people who helped you recently. Gratitude increases repeat help for {{goalShort}}.",
  "Design a warm intro script for mutuals: two sentences on you, two on why the intro fits, and a single suggested next step for {{lens}}.",
  "Pick a partner to practice outreach messages with for 15 minutes weekly. Editing out vague phrases improves reply rates for {{goalShort}}.",
  "Commit to closing loops: if someone introduced you, tell them what happened. Introductions dry up when senders never hear outcomes for {{lens}}.",
];

const STEP3_TITLES = [
  "Close loops with crisp recaps and gratitude",
  "Turn meetings into commitments you actually keep",
  "Send recap notes that make you easy to refer",
  "Track promises in your CRM the same day",
  "Ask for feedback when a conversation felt fuzzy",
  "Follow up with one promised resource within 48 hours",
  "Send a thank-you that names what you learned",
  "Make introductions that feel safe and opt-in",
  "End threads politely when there is not a fit",
  "Celebrate small wins with the people who helped",
  "Ask for a referral only after you delivered value",
  "Keep your CRM notes factual and searchable",
  "Set next steps before you leave the meeting",
  "Use a checklist for post-meeting follow-through",
  "Repair mistakes quickly with a clear apology",
  "Share outcomes with people who opened doors",
  "Ask what 'great' would look like on their side",
  "Turn vague interest into a dated next action",
  "Protect trust by not oversharing private details",
  "Offer help on a realistic timeline you can meet",
  "Re-read messages once for tone before sending",
  "Keep introductions short and forwardable",
  "Confirm understanding before you propose big asks",
  "Send calendar invites when you agree on time",
  "Document decisions so future-you stays consistent",
  "Ask permission before name-dropping shared context",
  "Prefer specific praise over generic flattery",
  "Send a six-sentence recap after deep conversations",
  "Make your CRM the source of truth for follow-ups",
  "Close the loop on introductions within a week",
];

const STEP3_DETAILS = [
  "After meaningful chats, send a short recap: what you heard, what you committed to, and one resource or intro you will make. Set a follow-up date in your CRM before you move on, especially for {{goalShort}}.",
  "If you promised something, do it within 48 hours or send an honest update with a new date. Reliability is the main currency in {{lens}} relationships.",
  "When someone helps you, close the loop: tell them what happened after the intro or advice. People repeat what rewarded them last time for {{goalShort}}.",
  "Use opt-in intros: ask both sides privately before connecting. It takes an extra message and saves reputation for {{lens}}.",
  "If there is not a fit, say so kindly in two sentences. A clean 'no' beats a slow ghost and keeps your network healthy for future {{goalShort}} work.",
  "Ask for one specific piece of feedback when a meeting felt unclear: 'What would make this more useful next time?' Then act on it lightly.",
  "Keep CRM notes searchable: company, role, priorities, family names only if appropriate, and the exact language they used about goals tied to {{lens}}.",
  "Before big asks, confirm understanding: restate their priorities in your words and check accuracy. Misalignment early is cheaper than later for {{goalShort}}.",
  "Send thank-you notes that cite one concrete insight you took from them. Specific gratitude reads sincere and reinforces {{skillPhrase}}",
  "When you introduce people, include why you think they should talk, suggested topics, and an easy out. Good intros protect everyone's time for {{lens}}.",
  "If you mess up, apologize clearly without excuses, fix what you can, and move forward. Trust repairs faster with directness for {{goalShort}}.",
  "Prefer dated next actions over 'let's stay in touch'. Propose two times or a narrow async alternative to reduce back-and-forth for busy contacts.",
  "Share wins with mentors and helpers in small updates. It is not bragging if it is framed as gratitude and learning for {{lens}}.",
  "Re-read sensitive messages once for tone. If you are tired, schedule the send for morning. Tone accidents erode trust faster than weak ideas for {{goalShort}}.",
  "Document decisions in CRM notes after calls: who owns what, dates, and risks. Future-you will thank you when momentum matters for {{lens}}.",
  "Ask what 'great' looks like on their side before you propose a big collaboration. Alignment beats enthusiasm for sustainable {{goalShort}} progress.",
  "If you need a referral, earn it: deliver a small win first, then ask with a forwardable blurb and a narrow request for {{lens}}.",
  "Send calendar invites immediately when you agree on a time. Include agenda bullets if the meeting is working-session style for {{goalShort}}.",
  "Protect confidentiality: do not repeat private details across chats. Reputation for discretion increases intros over time for {{lens}}.",
  "Offer help only on timelines you can meet. Under-promise and over-deliver beats the reverse for {{goalShort}} relationship compounding.",
  "Use a six-sentence recap template after deep conversations: context, insights, commitments, open questions, next step, gratitude. Save a copy in CRM for {{lens}}.",
  "When interest is vague, propose one narrow experiment: a 20-minute working session, a shared doc review, or three async questions tied to {{goalShort}}.",
  "Prefer specific praise: cite what they did, why it mattered, and what you learned. Generic praise feels like spam for senior contacts in {{lens}}.",
  "Before name-dropping shared context, ask permission if there is any sensitivity. Respect signals maturity for {{goalShort}} conversations.",
  "Keep introductions forwardable: third-person blurb, relevant links, and a single suggested next step. Reduce friction for the connector in {{lens}}.",
  "If you decline, offer an alternative when possible: another person, a resource, or a later date. Polite usefulness preserves bridges for {{goalShort}}.",
  "Celebrate small wins with people who helped: a short note is enough. Networks strengthen when wins are shared, not hoarded, in {{lens}}.",
  "Track promises the same day: CRM task or calendar hold. Missed small commitments silently cap your ceiling for {{goalShort}}.",
  "End meetings by confirming next steps out loud, then follow in writing. Verbal plus written alignment prevents drift for {{lens}}.",
  "Use a checklist for post-meeting follow-through: recap, deliverable, intro, CRM update, thank-you. Five minutes now saves hours later for {{goalShort}}.",
  "Repair mistakes quickly: name it, own it, fix it. People remember recovery more than perfection in {{lens}} long-term relationships.",
  "Make your CRM the source of truth for follow-ups, not your memory. Memory scales poorly when volume grows for {{goalShort}}.",
];

export const LOCAL_PLAN_VARIATION_COUNT =
  STEP1_TITLES.length *
  STEP1_DETAILS.length *
  STEP2_TITLES.length *
  STEP2_DETAILS.length *
  STEP3_TITLES.length *
  STEP3_DETAILS.length;

function packFromIndex(index) {
  const n1 = STEP1_TITLES.length;
  const d1 = STEP1_DETAILS.length;
  const n2 = STEP2_TITLES.length;
  const d2 = STEP2_DETAILS.length;
  const n3 = STEP3_TITLES.length;
  const d3 = STEP3_DETAILS.length;

  let x = index >>> 0;
  const i3d = x % d3;
  x = Math.floor(x / d3);
  const i3t = x % n3;
  x = Math.floor(x / n3);
  const i2d = x % d2;
  x = Math.floor(x / d2);
  const i2t = x % n2;
  x = Math.floor(x / n2);
  const i1d = x % d1;
  x = Math.floor(x / d1);
  const i1t = x % n1;

  return {
    s1: { title: STEP1_TITLES[i1t], detail: STEP1_DETAILS[i1d] },
    s2: { title: STEP2_TITLES[i2t], detail: STEP2_DETAILS[i2d] },
    s3: { title: STEP3_TITLES[i3t], detail: STEP3_DETAILS[i3d] },
  };
}

function randomIndexBelow(maxExclusive) {
  const max = Math.max(1, Math.floor(maxExclusive));
  if (max <= 1) return 0;
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const buf = new Uint32Array(2);
    crypto.getRandomValues(buf);
    const n = (BigInt(buf[0]) << 32n) | BigInt(buf[1]);
    return Number(n % BigInt(max));
  }
  return Math.floor(Math.random() * max);
}

/**
 * Uniform random pick across the full combinatorial template space (billions of combinations),
 * then personalize with the user's role, skills, and goal text.
 */
export function pickLocalPlanVariation({ role, skills, goal }) {
  const c = ctxFromInput({ role, skills, goal });
  const base = randomIndexBelow(LOCAL_PLAN_VARIATION_COUNT);
  const pack = packFromIndex(base);

  const steps = [pack.s1, pack.s2, pack.s3].map((s) => ({
    title: fill(s.title, c),
    detail: fill(s.detail, c),
  }));

  return { steps, variationIndex: base };
}
