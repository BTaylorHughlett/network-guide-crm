import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const apiKey = process.env.OPENAI_API_KEY || "";

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = path.normalize(path.join(root, decoded));
  if (!candidate.startsWith(root)) return null;
  return candidate;
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function handlePlan(req, res) {
  if (!apiKey) {
    send(
      res,
      503,
      JSON.stringify({ error: "OPENAI_API_KEY is not set in the environment for this server." }),
      { "Content-Type": "application/json; charset=utf-8" }
    );
    return;
  }

  const body = await readJsonBody(req);
  if (!body || typeof body !== "object") {
    send(res, 400, JSON.stringify({ error: "Invalid JSON body" }), {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  const role = String(body.role || "");
  const skills = String(body.skills || "");
  const goal = String(body.goal || "");

  const system = `You are an expert career coach focused on ethical, practical networking.
Return ONLY valid JSON with this shape:
{"steps":[{"title":"string","detail":"string"},{"title":"string","detail":"string"},{"title":"string","detail":"string"}]}
Rules:
- Exactly 3 steps.
- Each title is <= 90 characters.
- Each detail is 3-6 sentences, concrete, and time-bound within ~4 weeks.
- Each detail must include one specific sentence the user can actually send, labeled "Conversation starter:".
- Each detail must include one concrete thing to share (template, checklist, recap, or artifact), labeled "Value hook:".
- No buzzword soup; include specific cadences (e.g., weekly rhythm) and measurable micro-goals.
- Avoid claiming you know private facts; stay general and professional.`;

  const user = `Role/background:\n${role}\n\nSkills/strengths/experience (comma-separated):\n${skills}\n\n4-week goal / improvement area:\n${goal}`;

  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!openaiRes.ok) {
    const errText = await openaiRes.text();
    send(res, 502, JSON.stringify({ error: "OpenAI request failed", detail: errText }), {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  const completion = await openaiRes.json();
  const content = completion?.choices?.[0]?.message?.content;
  let parsed = null;
  try {
    parsed = content ? JSON.parse(content) : null;
  } catch {
    parsed = null;
  }

  if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length < 3) {
    send(res, 502, JSON.stringify({ error: "Model did not return usable JSON.", raw: content || "" }), {
      "Content-Type": "application/json; charset=utf-8",
    });
    return;
  }

  send(res, 200, JSON.stringify({ steps: parsed.steps.slice(0, 3) }), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/api/plan") {
    try {
      await handlePlan(req, res);
    } catch (e) {
      send(res, 500, JSON.stringify({ error: String(e && e.message ? e.message : e) }), {
        "Content-Type": "application/json; charset=utf-8",
      });
    }
    return;
  }

  if (req.method !== "GET") {
    send(res, 405, "Method Not Allowed");
    return;
  }

  let filePath = safeJoin(__dirname, url.pathname === "/" ? "/index.html" : url.pathname);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(filePath);
  const type = mime[ext] || "application/octet-stream";
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  stream.pipe(res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Network Guide server: http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(apiKey ? "OpenAI: enabled (OPENAI_API_KEY detected)" : "OpenAI: disabled (set OPENAI_API_KEY to enable /api/plan)");
});
