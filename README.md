# Network Guide CRM

Network Guide CRM is a browser-based networking workflow app with three integrated surfaces:

- Planner: generate a personalized 3-step networking plan for the next 4 weeks.
- Contacts CRM: track contacts, prioritize outreach, and run workflow analytics.
- Networking Sites Playbook: apply platform strategy, cadence coaching, event follow-ups, and momentum scoring.

The app is mostly client-side (HTML/CSS/vanilla JS modules) with an optional local Node server for OpenAI-backed plan generation.

## Highlights

- Local-first app: profile, contacts, settings, activity, and momentum history persist in `localStorage`.
- Humanized generation layer:
	- Outreach, follow-up, rhythm-coach, and simulator outputs now use larger rotating variant pools (with non-repeating picks) for more natural results.
	- Copy is grammar-polished and concise by default.
- AI optionality:
	- With server + `OPENAI_API_KEY`: planner can call OpenAI through `POST /api/plan`.
	- Without API key/server: planner falls back to a large local combinatorial template system.
- Actionable plan output:
	- Every generated step is enriched with a sendable `Conversation starter:` and a concrete `Value hook:`.
	- Goal text is grammar-polished before insertion (for example, `improve ...` -> `improving ...`) with capitalization preserved.
- 3-page workflow:
	- Planner -> CRM -> Playbook
- Priority scoring model in CRM:
	- timing + momentum + goal fit (adjustable weights in settings)
- Fast CRM usability additions:
	- live table search (name/company/title/tags/notes/contact fields)
	- date filter + search can be combined
	- collapsible Priority Reason panel
- Smart layer utilities:
	- progress snapshot, onboarding state, "what's next" guidance, activity streaks, monthly report, message generation, event follow-up drafts, and message simulator feedback.

## Project Structure

```text
network-guide-crm/
	contacts.html                # Contacts CRM UI
	index.html                   # Planner UI
	networking-sites.html        # Playbook UI
	package.json                 # npm scripts (start, dev) and engine requirements
	server.mjs                   # Optional local HTTP server + /api/plan proxy
	start.ps1                    # Convenience script to run server.mjs
	css/
		styles.css                 # Global styles and page-specific components
	js/
		crm.js                     # CRM page controller
		home.js                    # Planner page controller
		networking-sites.js        # Playbook page controller
		plan-variations.js         # Local combinatorial planner library
		planner.js                 # Planner orchestration (OpenAI first, local fallback)
		priority.js                # CRM scoring and priority bands
		smart-tools.js             # Shared smart-layer utilities
		storage.js                 # Profile/contact persistence helpers
```

## How It Works

### 1) Planner (`index.html` + `js/home.js`)

- Captures:
	- role/background
	- skills/strengths
	- 4-week goal
- Generates exactly 3 actionable steps.
- Source selection:
	- OpenAI path: `js/planner.js -> fetchOpenAiPlan()` calls `POST /api/plan`
	- Local path: `pickLocalPlanVariation()` from `js/plan-variations.js`
- Includes:
	- onboarding checklist
	- progress cards
	- draft save flow with simple local auth modal
	- JSON plan export
	- automatic outreach-detail enrichment (conversation starter + value hook)

### 2) Contacts CRM (`contacts.html` + `js/crm.js`)

- Contact management:
	- create/edit/duplicate/delete
	- CSV import/export (generic CSV + LinkedIn CSV auto-detection and mapping)
	- JSON backup/restore
- Table productivity:
	- live search input with instant filtering
	- date-range filter for last-contacted
	- combined filter pipeline before scoring/sort render
- Prioritization:
	- computes per-contact score using `js/priority.js`
	- priority bands: High / Medium / Lower
	- row signals (green/yellow/red/blue) from timing/momentum/goal fit
	- collapsible "Priority Reason" explainer card
- Analytics/reporting:
	- contacts added this month
	- due this week / overdue
	- top momentum contacts
	- timeline cards
	- streaks + monthly wins/opportunities
- Copilot-like local helpers:
	- who to contact today
	- generated outreach drafts by mode (intro/follow-up/reconnect)
	- pending follow-up drafts from Playbook
- Settings panel includes scoring weights, display/privacy options, and lightweight idle lock.

### 3) Networking Sites Playbook (`networking-sites.html` + `js/networking-sites.js`)

- Platform quick-compare + top platform playbooks.
- Weekly workflow + rhythm coach recommendation.
- Personalized starter packs from Planner context + selected persona.
- Signals section + outreach templates + event follow-up script generator.
- Networking simulator:
	- evaluates draft messages for clarity, specificity, and tone.
- Momentum scoring:
	- weighted model with optional components (events, publishing, CRM execution)
	- trend tracking via history entries
- Playbook settings let users tune enabled platforms, cadence, persona, and momentum weights.
- Section controls:
	- collapsible sections include quick-compare, top sites, weekly workflow, starter packs, signals, outreach templates, and event follow-up scripts.

## Local Planner Combination Count

When OpenAI is unavailable, planner steps are sampled from a local combinatorial library.

`LOCAL_PLAN_VARIATION_COUNT` is computed as:

```text
STEP1_TITLES.length
* STEP1_DETAILS.length
* STEP2_TITLES.length
* STEP2_DETAILS.length
* STEP3_TITLES.length
* STEP3_DETAILS.length
```

Current arrays produce a very large combination space and the UI reports that total in Planner results metadata.

## Runtime Modes

### Option A: Full mode (recommended)

Run the local Node server to serve static assets and enable optional OpenAI generation.

1. Ensure Node.js 18+ is installed.
2. In PowerShell:

```powershell
cd C:\Users\BrandonTaylor-Hughle\Projects\network-guide-crm
$env:OPENAI_API_KEY="your_key_here"   # optional but required for OpenAI plan generation
$env:OPENAI_MODEL="gpt-4o-mini"       # optional
npm start
```

3. Open `http://localhost:8787`.

Alternatives:

```powershell
npm run dev        # same as start but auto-restarts on file changes (node --watch)
.\start.ps1        # PowerShell convenience script
node .\server.mjs  # direct invocation
```

### Option B: Static-file mode

Open `index.html` directly in a browser. The app still works with local planner fallback, but OpenAI requests are not available without the server route.

## API

### `POST /api/plan`

Request body:

```json
{
	"role": "string",
	"skills": "comma,separated,skills",
	"goal": "string"
}
```

Successful response:

```json
{
	"steps": [
		{ "title": "...", "detail": "..." },
		{ "title": "...", "detail": "..." },
		{ "title": "...", "detail": "..." }
	]
}
```

If `OPENAI_API_KEY` is missing, server returns `503` with an error JSON payload.

## Persistence Model (localStorage)

Core keys used across the app:

- `ngc_profile_v1`
- `ngc_contacts_v1`
- `ngc_accounts_v1`
- `ngc_auth_user_v1`
- `ngc_crm_settings_v1`
- `ngc_crm_import_history_v1`
- `ngc_crm_last_backup_v1`
- `ngc_sites_settings_v1`
- `ngc_momentum_history_v1`
- `ngc_activity_log_v1`
- `ngc_pending_followups_v1`

## Important Notes

- The in-browser auth modal is convenience-only and stores credentials in localStorage. It is not production-grade authentication.
- The app is designed for local/personal workflow usage unless you harden auth, validation, transport, and storage.
- AI labeling in the UI can exist even when OpenAI is not active; behavior depends on runtime mode and env vars.

## Troubleshooting

### Available npm scripts

| Command | What it does |
|---|---|
| `npm start` | Start the server |
| `npm run dev` | Start with `--watch` (auto-restart on changes) |

If you run an unlisted script name (e.g. `npm run serve`), npm will error. Use `npm start` or `npm run dev`.

### Planner says it used local generation

- Confirm app is opened via `http://localhost:8787` (not `file://...`).
- Confirm `OPENAI_API_KEY` is set in the same shell where `server.mjs` is launched.
- Confirm network access to OpenAI API from your machine.

## Suggested Next Improvements

- Add a real auth system (server-side sessions + hashed passwords).
- Add typed schema validation for imports/settings.
- Add unit tests for scoring, momentum, and planner fallback logic.
- Add end-to-end test flows for Planner -> CRM -> Playbook.
- Add `lint` and `test` npm scripts.

## License

No license file is currently present in this repository. Add one before distribution.
