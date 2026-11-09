# PROJECT_CONTEXT.md - E.D.I.T.H.

> Single source of truth for the project. Read this fully before every change. Update it at the end of every phase (see Section 19 and MASTER_INSTRUCTIONS.md).

**Last updated:** (fill in at each phase)
**Current phase:** (fill in)
**Status legend:** NOT STARTED / IN PROGRESS / DONE (tested) / BLOCKED

---

## 1. Project Overview

**Name:** E.D.I.T.H. - Enhanced Digital Identity, Trust & Heuristics
**Domain:** Cybersecurity, Digital Identity and Privacy
**One-line description:** A trust layer above operating-system permissions. It monitors how applications use the access they were granted, scores that behaviour continuously, explains every change, and recommends (and applies) the smallest permission change that reduces risk.

**What is built (hackathon MVP):** a full-stack web application containing the **EDITH Sandbox**, a simulated device with four apps. A real simulator engine generates normalized access events. A rule-plus-statistics engine detects behavioural change. A transparent trust-score model updates continuously. Alerts explain why. The user can approve, restrict, suspend or revoke, and those controls are genuinely enforced inside the sandbox (blocked events appear afterwards).

**What is NOT built:** real monitoring of installed apps on a phone or PC (a browser app cannot do this). Only an optional, read-only Windows agent (Phase 12) is a real-device integration.

**Long-term vision (not built now):** platform-independent monitoring across Android, Windows, Linux, web apps and cloud services via native agents/adapters that emit the normalized event schema defined in Section 9.1.

---

## 2. Original Problem Statement

Users regularly share personal information, files and account access with different applications and digital services. However, they often have limited visibility and control over how these applications use their data.

Users may not know whether an application accesses unnecessary information, requests excessive permissions or behaves suspiciously after receiving permission.

Traditional permission systems primarily depend on permissions granted during installation. They do not necessarily provide continuous monitoring of how applications use those permissions over time.

An application might initially behave normally but later start requesting additional permissions, accessing sensitive resources more frequently or exhibiting suspicious behaviour.

**Challenge:** Develop a smart permission management system that monitors how applications use user data, detects suspicious activity and helps users make informed decisions about permissions.

**Expected features:**
1. Centralized permission management.
2. Access monitoring: which application accessed which resource, when, and why (when available).
3. Trust score for applications based on permissions, usage patterns and past activity.
4. Suspicious activity detection, including excessive permission requests and unusual access patterns.
5. Intelligent permission recommendations.
6. Access control: approve, restrict, suspend, revoke (where technically supported).
7. Activity history and monitoring.

**Expected outcome:** a working prototype that simulates multiple applications accessing user data, monitors their activities, detects suspicious behaviour and recommends appropriate permission changes. It must demonstrate **continuous** trust evaluation rather than installation-time permissions only.

**Suggested scenario:** three applications initially behave normally. Later, one application requests additional permissions and starts accessing user data more frequently. The system identifies the change, updates its trust score, generates an alert and recommends restrictions.

---

## 3. Project Objectives

1. Provide one place to see and control every app's permissions (sandbox device).
2. Record every access and permission request as a normalized, persisted event.
3. Compute an explainable trust score that is re-evaluated every simulation window.
4. Detect permission escalation, frequency spikes, new-resource use, background access, access-to-egress patterns, purpose mismatch and persistent blocked attempts.
5. Recommend concrete, reversible actions with predicted score impact.
6. Enforce actions in the sandbox and show their effect.
7. Be technically honest: label simulated vs real data; label the score as an estimate.
8. Be demonstrable in 5 to 7 minutes and fully runnable offline.

---

## 4. Target Users

- **Everyday smartphone user (non-technical):** wants a one-glance answer ("is this app okay?") and a one-tap fix.
- **Privacy-conscious enthusiast:** wants evidence (timestamps, counts, baselines, rule IDs, z-scores).
- **Parent / small-office admin:** wants an audit trail and quick suspend.

The UI therefore has a **Simple / Technical** detail toggle.

---

## 5. Honesty Constraints (never violate)

- Never claim real-device monitoring unless an adapter is implemented and tested.
- Every event has `source = simulated | real_device`. The UI shows a persistent **SIMULATED DEVICE** badge for sandbox data and a distinct **REAL DEVICE** badge for real events.
- The trust score is an **estimated application trust indicator**, not proof of safety or malice. Score analysis views show: "Estimated trust indicator based on observed permissions and behaviour. Not a guarantee of safety."
- Restrict/suspend/revoke are enforced only in the sandbox. Devices carry capability flags (`supports_revoke`, `supports_restrict`, `supports_suspend`); unsupported actions are disabled and labelled "Monitor-only on this source".
- Detection, scoring and recommendations work with no external AI and no internet. An LLM (Phase 11) may only reword already-computed findings.
- Competitor/OS facts used in presentations must be re-verified against current OS versions.

---

## 6. Finalized Features and MVP Scope

Complexity: L/M/H. All "MVP" items are required.

### Core
| ID | Feature | Phase |
|---|---|---|
| C1 | App registry and permission profiles (4 seeded apps) | 4 |
| C2 | Permission console (apps x permissions, change state) | 5, 9 |
| C3 | Normalized event pipeline (validate, gate, persist, publish) | 6 |
| C4 | Live activity monitor (WebSocket stream, filters, pause) | 6, 10 |
| C5 | Trust score engine (E, G, B, D components) | 7 |
| C6 | Suspicious-activity detection (rules R1 to R7) | 7 |
| C7 | Explainable alerts and incidents | 8, 10 |
| C8 | Recommendation engine | 8, 10 |
| C9 | Access control: approve, restrict, suspend, resume, revoke, undo | 5, 9 |
| C10 | Activity history and audit log | 10 |
| C11 | Scenario simulator (seed, start/pause/step, scenarios, reset) | 6, 10 |

### Adopted from existing products
E1 per-permission usage timeline with foreground/background marker (9); E2 access counts per app per window (9); E3 sensitivity levels (7, 9); E4 alert aggregation into incidents (8); E5 network destination and bytes view, simulated (6, 9); E6 dormant-permission suggestion (8).

### Problem-solving
P1 permission necessity analysis (7, 8); P2 "Why did my score change?" breakdown (7, 9); P3 permission drift tracking (7); P4 reversible actions and audit trail (5, 9); P5 Simple/Technical detail toggle (9, 10).

### Innovative
I1 access-to-egress correlation, rule R6 (7); I2 what-if permission simulator (8, 9); I3 grounded privacy assistant, optional (8 template, 11 LLM); I4 platform-neutral event schema (6).

### Stretch
A1 Windows ConsentStore agent (12); A3 report export JSON (14, optional); A4 policy profiles (not planned unless time permits).

### Out of scope
Real mobile agents, multi-device sync, cloud deployment of agents, trained ML models, light theme.

### Finalized decisions
Four apps (three from the brief plus control app PixelPal); SQLite for the MVP (PostgreSQL-ready); dark theme only; simulated user auto-grants permission requests by default (toggle available); LLM assistant optional; Windows agent optional.

---

## 7. Technical Architecture

```
+----------------------+     HTTPS/JSON + WebSocket      +-----------------------------------------+
|  React SPA (Vite)    | <-----------------------------> |  FastAPI application                    |
|  Dashboard, Apps,    |                                 |  API routers (auth, apps, events,       |
|  Live Monitor, Lab   |                                 |   alerts, recs, actions, sim, settings) |
+----------------------+                                 |  Services layer                         |
                                                         |   - IngestService (validate, persist)   |
  Future event sources                                   |   - PolicyGate (sandbox enforcement)    |
  +----------------+   POST /api/events (ingest token)   |   - BaselineService (EWMA)              |
  | Windows agent  | ----------------------------------> |   - DetectionEngine (R1-R7)             |
  | Android adapter|                                     |   - TrustEngine (score + breakdown)     |
  | Web/cloud log  |                                     |   - RecommendationEngine (+ what-if)    |
  +----------------+                                     |   - ControlService (actions, undo)      |
  +----------------+      in-process calls               |   - ExplainService (template / LLM)     |
  | Sandbox        | ----------------------------------> |   - EventBus -> WebSocket broadcaster   |
  | Simulator loop |                                     +------------------+----------------------+
  +----------------+                                                        |
                                                            SQLAlchemy -> SQLite (PostgreSQL-ready)
```

The simulator is just another event source calling the same `IngestService` a real agent would call.

### Component responsibilities
| Component | Responsibility |
|---|---|
| API routers | HTTP/WS surface, auth, validation, error mapping. No business logic. |
| IngestService | Validate event schema v1, run PolicyGate, persist, publish to EventBus. |
| PolicyGate | Decide allowed / limited / blocked from app status and permission state. |
| BaselineService | EWMA mean/variance per (app, resource, context); poisoning guard. |
| DetectionEngine | Evaluate rules each window; create findings, incidents, alerts. |
| TrustEngine | Pure `compute_score()`; store per-window score with explanation. |
| RecommendationEngine | Rule table; what-if via `compute_score()` on hypothetical state. |
| ControlService | approve / restrict / revoke / suspend / resume / undo; audit log. |
| ExplainService | Template explanations (default); optional validated LLM rewording. |
| Simulator | Tick loop, profiles, scenarios, seeded RNG. |
| EventBus | In-process pub/sub to WebSocket clients. |

### Tick pipeline (order matters)
For each tick `t` (one tick = 10 simulated minutes):
1. Apply pending auto-grants from tick `t-1` (emit `permission_change` events).
2. Simulator generates events for `t` from profiles and active scenario.
3. For each event: validate, PolicyGate sets `outcome`, persist, publish `event` message.
4. For each app: read baselines (before updating), run detection rules, create findings, update incidents and alerts.
5. Compute `B_t`, then `compute_score()`, store `trust_scores` row with explanation, publish `trust_update`.
6. Recompute recommendations, publish `recommendation` / `alert` messages.
7. Update baselines (poisoning guard applies if the app had findings).
8. Increment `sim_state.tick`; publish `sim_status`.

### Frontend/backend flow
SPA logs in (`POST /api/auth/login`), keeps the JWT in memory plus `sessionStorage` for reload, sends `Authorization: Bearer`. Initial data via REST (TanStack Query). Live updates via `/ws?token=` messages patch the query cache. If the socket drops: reconnect with exponential backoff, show "Reconnecting", poll every 5 s meanwhile.

---

## 8. Technology Stack

- **Frontend:** React 18, Vite, TypeScript (strict), Tailwind CSS 3, React Router 6, TanStack Query 5, Recharts, lucide-react, clsx. Tests: Vitest + React Testing Library; Playwright (E2E).
- **Backend:** Python 3.11+, FastAPI, Pydantic v2 (+ pydantic-settings), SQLAlchemy 2.x, Uvicorn, PyJWT, bcrypt, httpx. Tests: pytest, pytest-asyncio. Lint/format: ruff.
- **Database:** SQLite (WAL mode) via SQLAlchemy; avoid SQLite-only SQL so PostgreSQL works by changing `DATABASE_URL`. Tables via `Base.metadata.create_all` plus `app/seed.py`. Alembic is optional.
- **Realtime:** FastAPI WebSocket `/ws`; in-process pub/sub.
- **Background work:** one asyncio task (simulator loop) started in the FastAPI lifespan.
- **Optional LLM:** Anthropic API behind an interface with template fallback (Phase 11).
- **Fonts:** IBM Plex Sans and IBM Plex Mono (Google Fonts, with system fallbacks).

---

## 9. Domain Specification (authoritative)

### 9.1 Normalized event schema v1
```json
{
  "schema_version": "1.0",
  "event_id": "uuid",
  "source": "simulated | real_device",
  "platform": "sandbox | windows | android | linux | web | cloud",
  "device_id": "string",
  "app_key": "string",
  "event_type": "access | permission_request | permission_change | network",
  "resource": "location_fine | location_background | camera | microphone | contacts | sms | call_log | photos | storage | calendar | clipboard | bluetooth | sensors | notifications | network",
  "action": "read | write | record | capture | upload | request",
  "timestamp": "ISO-8601 UTC (simulated time in the sandbox)",
  "sim_tick": 123,
  "context": "foreground | background | unknown",
  "purpose_code": "core_feature | sync | analytics | advertising | unknown | null",
  "outcome": "allowed | limited | blocked   (set by PolicyGate; ignored on input)",
  "count": 1,
  "bytes_out": 0,
  "destination": "string or null"
}
```
Sim time = `2026-01-01T08:00:00Z + tick * 10 minutes`. Each access is one event row with `count = 1`; cap 30 rows per (app, resource, context, tick), merging the remainder into the last row's `count`. `purpose_code` is optional; the UI shows "purpose not reported" when null.

### 9.2 Constants (`services/constants.py`)
**Sensitivity weights `w`:** location_background 10, sms 9, location_fine 8, camera 8, microphone 8, call_log 8, contacts 7, storage 6, photos 5, calendar 4, clipboard 4, bluetooth 3, sensors 2, network 1, notifications 1. **Sensitive** means `w >= 4`.

**Expected permissions by category:**
- messaging: contacts, microphone, camera, photos, notifications, network
- navigation: location_fine, location_background, network, notifications, bluetooth
- photo_editor: camera, photos, storage, network
- utility_flashlight: camera, notifications

**Expected purposes by category:** messaging {core_feature, sync}; navigation {core_feature, sync}; photo_editor {core_feature, sync}; utility_flashlight {core_feature}.

**Bands:** 80-100 Trusted, 60-79 Watch, 40-59 Suspicious, 0-39 High risk.

**Impact notes (static map, never LLM-generated):** a dictionary keyed by (category, resource, action) giving a plain sentence. Examples: (utility_flashlight, contacts, revoke) "Flashlight works normally; any contact-based feature will stop."; (navigation, location_background, revoke) "Turn-by-turn navigation may stop when the screen is off."; (utility_flashlight, app, suspend) "The app cannot use sensitive resources or the network until resumed." Provide a generic fallback sentence per action.

### 9.3 Permission semantics
Permission states: `granted`, `restricted` (options `foreground_only` bool, `max_per_tick` int), `denied` (used for revoke). App status: `active` or `suspended`.

### 9.4 PolicyGate
`gate(app, permission, event) -> outcome`:
1. App `suspended` and (resource is sensitive or resource == network) -> `blocked`.
2. Permission missing or `denied` -> `blocked`.
3. `restricted`: `blocked` if `foreground_only` and context is background; `blocked` if the tick's allowed count already reached `max_per_tick`; otherwise `limited`.
4. Else `allowed`.
`permission_request` events are never blocked: they are recorded; if `auto_grant_requests` is on they are granted at the start of the next tick (`requested_by = runtime`, `granted_tick` set), else a `pending_requests` row is created.

### 9.5 Simulator
Deterministic: per tick use `random.Random(f"{seed}:{tick}")`; implement Poisson (Knuth) yourself. Rates are per tick (fg = foreground, bg = background).

- **ChatterBox:** contacts fg 0.3; microphone fg 0.2; camera fg 0.1; notifications bg 1.0; network bytes_out mean 40000 sd 15000 to `chat.chatterbox.example` (purpose sync).
- **RouteRunner:** location_fine fg 2.0; location_fine bg 1.0; location_background bg 1.0; notifications bg 0.5; network mean 120000 sd 30000 to `tiles.routerunner.example` (purpose core_feature).
- **PixelPal:** camera fg 0.3; photos fg 0.5; network mean 80000 sd 40000 with probability 0.3 per tick to `cdn.pixelpal.example`.
- **FlashLite:** camera fg 0.2; network mean 2000 sd 500 to `updates.flashlite.example`.

Normal events use purpose `core_feature` (network: as listed). Network events are `event_type = network`, `resource = network`, `action = upload`, with `bytes_out` and `destination`.

**Seeding:** `seed-baseline` generates 48 ticks (0 to 47) through the real pipeline (events, baselines, trust scores). Live ticks start at 48.

**Scenario `rogue_flashlight`** (r = ticks since trigger): r0: FlashLite emits 4 `permission_request` events (contacts, location_fine, location_background, microphone), purpose analytics. r1: requests granted (auto-grant on). From r1 until blocked, per tick FlashLite emits: location_background bg rate 10, location_fine bg 4, contacts bg 12, microphone bg 2 (all purpose analytics), network bytes_out mean 400000 sd 50000 to `collector.ads-metrics.example` (purpose analytics). After PolicyGate blocks (suspended or denied), it keeps attempting 6 accesses per tick for 2 ticks (outcome blocked), then stops.
**Scenario `benign_trip`:** RouteRunner location_fine fg and bg rates triple for 8 ticks.

### 9.6 Baselines
EWMA of per-tick counts per (app, resource, context): `mu = a*x + (1-a)*mu`, variance likewise, `a = 0.1`. If the app had any finding in a window, update with weight `0.1*a` (poisoning guard). `observed_windows` counts ticks since seeding. **Learning state:** `observed_windows < 24`. Confidence = `min(1, observed_windows/48)`.

### 9.7 Detection
Evaluate once per tick per app after all events are ingested, using baselines as they were **before** the tick's update. `z = (x - mu) / max(sqrt(var), 0.5, 0.3*mu)`.

| Rule | Condition | Points | Needs baseline |
|---|---|---|---|
| R1 Frequency spike | per (resource, context): z >= 3 and count >= 3; points `min(15, 3*(z-2))`; x1.5 if the same resource was flagged in the previous tick | up to 22 | yes |
| R2 New resource use | count > 0 for a resource whose baseline mean is 0 in both contexts; 12 if unexpected for category else 6 | 6-12 | yes |
| R3 Permission escalation | each `permission_request` for a sensitive resource: 8 if unexpected for category else 3; cap 16 per window | 3-16 | no |
| R4 Background sensitive access | location_*, camera, microphone or contacts in background while (resource, background) baseline mean < 0.2 | 10 | yes |
| R5 Persistent blocked attempts | >= 3 blocked access events in one window | 8 | no |
| R6 Access-to-egress | R1 or R2 active on a sensitive resource in this or previous tick AND total bytes_out in window >= 5x network baseline mean and >= 50000 | 15 | yes |
| R7 Purpose mismatch | access on a sensitive resource with purpose in {analytics, advertising, unknown} not in the category's expected purposes; cap 12 | 6 | no |

Learning state skips "needs baseline" rules. `raw_t` = sum of points. **Alert severity from `raw_t`:** <8 low, 8-19 medium, 20-34 high, >=35 critical. Each finding stores rule_id, points, message (plain sentence), evidence_event_ids, plus baseline_mean and z where applicable.
**Incidents:** a finding opens an incident for the app or joins the open one if within 3 ticks of its last activity; severity is the max seen; the incident auto-resolves after 6 consecutive clean ticks. Create an alert when an incident opens and whenever its severity escalates.

### 9.8 Trust score (`services/trust.py`, pure function `compute_score(state)`)
```
E = 20 * min(1, sum(w_r * m_r over permissions r) / 50)
G = 20 * min(1, sum(w_r * m_r for r not in expected(category)) / 20)
B_t = min(40, 0.9 * B_(t-1) + raw_t)            # stateful per app; read B_(t-1) from the latest trust_scores row
D = min(10, 5 * sum(m_r for sensitive permissions with requested_by='runtime',
                    tick - granted_tick <= 144, and still effective))
score = round(max(0, 100 - E - G - B - D))
m_r: granted 1.0, restricted 0.5, denied 0; multiply by 0.5 for all resources while the app is suspended
```
Store per tick: score, band, confidence, e, g, b, d, prev_score, `explanation` JSON (component deltas, top contributing findings, one-sentence template summary such as "Score fell 52 points: behaviour +40, necessity gap +20"). Learning state shows a Low-confidence badge. **Recovery:** with no findings, B decays 10% per window; E, G, D fall immediately when permissions change.

### 9.9 Recommendations
Recomputed each tick for apps with an open incident or a score drop. At most one open recommendation per (app, rec_rule, target); mark `stale` when its trigger no longer holds or it was applied.
- **REC-SUSPEND:** score dropped >= 25 within 6 ticks, or band High risk with >= 2 independent rules including R6 or (R3 and R1). Action suspend on the app; priority high.
- **REC-REVOKE:** granted permission not expected for category AND (granted at runtime within 144 ticks OR involved in a finding). Action revoke.
- **REC-RESTRICT:** expected permission with an R1/R4 finding. Action restrict with `foreground_only = true`, `max_per_tick = ceil(baseline_mean * 2)`.
- **REC-DORMANT:** sensitive permission with zero events in the last 144 ticks and baseline ready. Action revoke; priority low.
- **REC-KEEP:** expected permission within baseline. Action approve (informational).

`confidence`: high if >= 2 independent rules support it; medium if one rule with z >= 4 or R3 unexpected; else low. `predicted_score_after` = `compute_score()` on a copy of the state with the action applied. `impact_note` from the static map. `reversible` is true for all sandbox actions.

### 9.10 Control service
Actions: `approve` (set granted, resolve a pending request, or mark a recommendation reviewed), `restrict`, `revoke` (state denied), `suspend`, `resume` (status only; permission states kept), `undo` (restore `previous_state` of one action). Every action writes a `control_actions` row with previous/new state, updates affected recommendations, recomputes the app's score immediately (new `trust_scores` row at the current tick), and publishes an `action` message. Viewers receive 403. `apply-bundle` applies all open high/medium recommendations for an app in one transaction.

### 9.11 Explain service
Template explanations always work: built from findings (rule, resource, counts, baseline mean, z, bytes) and the score breakdown. Optional LLM mode (Phase 11) only when `LLM_ENABLED=true` and a key exists, timeout 5 s, input limited to structured findings JSON, output validated (no numbers, apps, resources or rule IDs absent from the input); otherwise return the template. Response includes `mode: "llm" | "template"`. The LLM never decides detections, scores or actions.

### 9.12 Seed data
One device `EDITH Sandbox` (platform sandbox, source simulated, capabilities all true). Users: owner and viewer from env. Apps with initial permissions (all `granted`, `requested_by = install`, `granted_tick = -1`):
- ChatterBox (messaging): contacts, microphone, camera, notifications, network
- RouteRunner (navigation): location_fine, location_background, notifications, network
- PixelPal (photo_editor): camera, photos, network
- FlashLite (utility_flashlight): camera, notifications

---

## 10. Database Schema

UUID string primary keys; UTC `created_at` on every table. Avoid SQLite-only features.

| Table | Columns / notes |
|---|---|
| `users` | id, email (unique), password_hash, role (owner/viewer) |
| `devices` | id, name, platform, source, capabilities JSON {supports_revoke, supports_restrict, supports_suspend} |
| `apps` | id, device_id FK, app_key (unique per device), name, category, publisher, status (active/suspended), declared_purposes JSON |
| `app_permissions` | id, app_id FK, resource, state (granted/restricted/denied), options JSON {foreground_only, max_per_tick}, granted_at, granted_tick (int), last_changed_at, requested_by (install/runtime); unique (app_id, resource) |
| `events` | id, event_id (unique), schema_version, device_id, app_id FK, event_type, resource, action, ts, sim_tick, context, purpose_code, outcome, count, bytes_out, destination, source; indexes (app_id, ts), (resource, ts), (sim_tick) |
| `baselines` | id, app_id FK, resource, context, mean, variance, observed_windows, updated_tick; unique (app_id, resource, context) |
| `trust_scores` | id, app_id FK, sim_tick, ts, score, band, confidence, e, g, b, d, prev_score, explanation JSON |
| `incidents` | id, app_id FK, status (open/acknowledged/resolved/dismissed), severity, opened_tick, last_activity_tick, closed_tick, title, summary |
| `findings` | id, app_id FK, incident_id FK, rule_id, sim_tick, points, severity, message, evidence_event_ids JSON, baseline_mean, z |
| `alerts` | id, incident_id FK, app_id FK, severity, title, message, status (new/ack/dismissed) |
| `recommendations` | id, app_id FK, incident_id FK null, rec_rule, target_type (app/permission), target, action (suspend/revoke/restrict/approve), options JSON, priority, confidence (high/medium/low), rationale JSON, predicted_score_after, impact_note, reversible, status (open/applied/dismissed/stale) |
| `control_actions` | id, app_id FK, actor_user_id FK null, action (approve/restrict/revoke/suspend/resume/undo), target, previous_state JSON, new_state JSON, reason, recommendation_id FK null, undone (bool), ts |
| `pending_requests` | id, app_id FK, resource, purpose_code, requested_tick, status (pending/granted/denied) |
| `sim_state` | id (=1), seed, tick, running, ms_per_tick, active_scenario, scenario_start_tick, auto_grant_requests |
| `settings` | key (PK), value JSON (keys: simple_mode, llm_enabled) |

Relationships: device 1-n apps; app 1-n permissions, events, trust_scores, findings, incidents, alerts, recommendations; incident 1-n findings; recommendation may link to the action that applied it.

---

## 11. API Specification

Base path `/api`; JSON, snake_case; Bearer JWT unless noted. **(O)** = owner only; viewers get 403 on all writes, including simulator endpoints.

**Error body (all errors):** `{"error": {"code": "STRING_CODE", "message": "human text", "details": {}}}`. Status codes: 400, 401, 403, 404, 409, 422, 429, 500.

- `POST /auth/login` `{email, password}` -> `{access_token, token_type, user:{id,email,role}}` (public). `GET /auth/me`. `GET /health` (public) -> `{status:"ok", version, sim_running}`.
- `GET /apps` -> `[{id, name, category, status, score, band, confidence, prev_score, open_alerts, last_activity_ts, sparkline:[{tick,score}]}]`.
- `GET /apps/{id}` -> app + `permissions:[{resource, state, options, granted_at, granted_tick, requested_by, sensitivity_weight, expected_for_category, last_used_ts, uses_24h}]`, latest breakdown, open recommendations, open incident.
- `GET /apps/{id}/trust?limit=200` -> `[{sim_tick, ts, score, band, confidence, e, g, b, d, explanation}]`.
- `GET /apps/{id}/timeline?resource=&from_tick=&to_tick=` -> per-tick counts by resource and context, plus bytes_out series.
- `GET /events?app_id=&resource=&outcome=&source=&from_tick=&to_tick=&limit=50&cursor=` -> `{items:[event], next_cursor}`.
- `POST /events` (header `X-Ingest-Token`, rate limited) event schema v1 -> `201 {event_id, outcome}`.
- `GET /stats/summary` -> `{events_total, events_blocked, open_alerts, apps_by_band, last_tick}`.
- `POST /apps/{id}/permissions/{resource}/action` **(O)** `{action:"approve|restrict|revoke", options?:{foreground_only,max_per_tick}, reason?}` -> `{permission, app_score, action_id}`.
- `POST /apps/{id}/status` **(O)** `{action:"suspend|resume", reason?}` -> `{app, app_score, action_id}`.
- `POST /actions/{action_id}/undo` **(O)`; `GET /actions?app_id=&limit=` (audit log).
- `GET /alerts?status=&severity=&app_id=`; `GET /alerts/{id}` -> alert with incident, findings (rule_id, points, message, evidence events, baseline_mean, z), score deltas; `POST /alerts/{id}/ack` and `/dismiss` **(O)** `{reason?, mark_expected?}` (`mark_expected` raises affected baselines to the observed level and records the decision in the audit log).
- `GET /recommendations?status=open&app_id=`; `POST /recommendations/{id}/apply` **(O)**; `POST /recommendations/{id}/dismiss` **(O)**; `POST /recommendations/apply-bundle` **(O)** `{app_id}`; `POST /recommendations/preview` `{app_id, changes:[{resource,state,options?}], suspend?:bool}` -> `{current_score, predicted_score, predicted_band, delta, breakdown_before, breakdown_after}`.
- `GET /trust/overview` -> `{counts_by_band, average_score, apps:[...with sparklines]}`.
- `GET /sim/status`; **(O)** `POST /sim/reset` `{seed?}`; `POST /sim/seed-baseline` `{ticks?:48}`; `POST /sim/start`; `POST /sim/pause`; `POST /sim/step` `{n?:1}`; `POST /sim/speed` `{ms_per_tick}`; `POST /sim/scenario/{name}` (`rogue_flashlight` | `benign_trip`); `GET /sim/pending-requests`; `POST /sim/pending-requests/{id}/decision` `{decision:"grant|deny"}`.
- `POST /assistant/explain` `{alert_id?, app_id?}` -> `{text, mode:"llm|template"}`.
- `GET /settings`; `PUT /settings` **(O)** `{auto_grant_requests?, llm_enabled?, simple_mode?}`.
- `WS /ws?token=` server messages `{type:"event"|"trust_update"|"alert"|"recommendation"|"action"|"sim_status", payload:{...}}`.

---

## 12. UI/UX Guidelines

**Concept:** a calm instrument panel on a dark ink canvas; colour is reserved for risk. Signature elements: trust arc gauge, Trust Ribbon, permission matrix that looks like a switchboard.

**Routes:** `/` Landing, `/login`, `/dashboard` (Command Center), `/apps`, `/apps/:id` (tabs via `?tab=overview|permissions|activity|trust|recommendations`), `/monitor`, `/alerts`, `/recommendations`, `/history`, `/lab`, `/settings`. Left rail on desktop, bottom nav on mobile.

**Design tokens:** canvas `#0B1118`, surface `#121B26`, raised `#1A2634`, border `#263648`, text `#E6EDF5`, muted `#93A4B8`, accent `#5CC8B8`; bands trusted `#3DDC97`, watch `#F2C14E`, suspicious `#FF9A52`, high-risk `#FF5C75`; simulated badge violet `#9B8CFF`; real-device badge green. Fonts: IBM Plex Sans (UI), IBM Plex Mono (timestamps, rule IDs, numbers). 4 px grid, 10 px radius, 1 px borders, no heavy shadows. Motion 150-250 ms; respect `prefers-reduced-motion`. Verify WCAG AA contrast.

**Signature components (`components/trust/`):** `TrustGauge` (270-degree arc, number, band icon + word, confidence badge); `TrustRibbon` (score over ticks with markers for permission requests, alerts, control actions, shaded Suspended periods; click marker opens related drawer); `PermissionMatrix` (state, sensitivity dot, expected-for-category icon, last used, action menu); `BreakdownBars` (Exposure, Unneeded access, Recent behaviour, New permissions for E, G, B, D); `EvidenceDrawer` (rule ID, plain sentence, baseline mean, z, linked events; Simple/Technical toggle); `EventTable` (resource chips with icons, outcome badge, blocked rows struck through, source badge).

**Pages:** Landing (hero, honest-limits strip, CTA). Login. Command Center (fleet summary, four gauge cards with sparklines, open-incident panel, top 3 recommendations, KPI tiles, last 8 events ticker). Apps (sortable table/cards, quick suspend/resume). App Detail (gauge header, SIMULATED badge, Suspend/Resume, What-if, tabs). Live Monitor (streaming table, filters, pause). Alerts (incident list, severity filter, drawer). Recommendations (cards with action, confidence, predicted score, impact note, reversible tag). History (Events tab, Audit tab). Sandbox Lab (tick counter, sim time, controls, scenario buttons, pending requests, auto-grant switch). Settings (Simple/Technical, LLM toggle, user and role).

**States:** every data view has skeleton loading, a purposeful empty state with an action, and an inline error with Retry. Every mutation shows a success toast stating its effect with Undo for 10 seconds, or an error toast with the server message.
**Responsive:** 360 px single column + bottom nav; 768 px two columns; 1280 px rail + 12-column grid; tables become cards on mobile; no horizontal page scroll.
**Accessibility:** semantic landmarks, visible focus ring, full keyboard operation, `aria-live="polite"` throttled for the live feed, status never by colour alone, 44 px touch targets, labelled fields.

### Interaction Register (every visible control must match a row)
| Control | Action | Backend | Success | Failure |
|---|---|---|---|---|
| Landing: Open demo | go to /login | none | route | n/a |
| Login: Sign in | authenticate, go to /dashboard | POST /auth/login | redirect | inline "Invalid email or password" |
| Logout | clear token, go to /login | none | redirect | n/a |
| Left rail items | navigate | none | active state | n/a |
| App card/row | open detail | GET /apps/{id} | page loads | error state + Retry |
| Suspend / Resume | change app status | POST /apps/{id}/status | toast + Undo | error toast |
| Permission menu: Approve | set granted | POST .../permissions/{r}/action | toast + Undo | error toast |
| Permission menu: Restrict | dialog (foreground-only, max per window), submit | same | toast + Undo | error toast, dialog stays |
| Permission menu: Revoke | confirm, set denied | same | toast + Undo | error toast |
| Toast Undo / Audit Undo | revert one action | POST /actions/{id}/undo | state restored | error toast |
| What-if | dialog with toggles, show predicted score | POST /recommendations/preview | predicted score + diff | inline error |
| Recommendation Apply | apply one | POST /recommendations/{id}/apply | toast + Undo | error toast |
| Apply recommended (bundle) | apply all open for app | POST /recommendations/apply-bundle | toast listing actions | error toast |
| Recommendation Preview | what-if prefilled | preview | modal | inline error |
| Recommendation Dismiss | mark dismissed | POST /recommendations/{id}/dismiss | card removed | error toast |
| Alert Acknowledge / Dismiss | update status | POST /alerts/{id}/ack or dismiss | badge changes | error toast |
| Alert Mark as expected | dismiss + adapt baseline | dismiss with mark_expected | toast | error toast |
| Alert Explain | fetch explanation | POST /assistant/explain | text + mode badge | fallback text |
| Simple/Technical toggle | switch detail level | PUT /settings | content switches | local only |
| Monitor filters (app, resource, outcome) | filter stream | GET /events + client filter | list updates | error state |
| Monitor Pause/Resume | freeze view, buffer | none | "Paused (N new)" | n/a |
| Event row click | open EvidenceDrawer | GET /alerts/{id} or event data | drawer | error state |
| Ribbon marker click | open related drawer | alert/finding endpoints | drawer | error state |
| History filters, pagination, tab | query | GET /events, GET /actions | table updates | error state |
| Lab: Seed baseline | generate 48 windows | POST /sim/seed-baseline | toast with counts | error toast |
| Lab: Start / Pause / Step | control loop | POST /sim/start, /pause, /step | status badge | error toast |
| Lab: Speed slider | set ms per tick | POST /sim/speed | label updates | error toast |
| Lab: Reset (confirm) | clear sim data and reseed | POST /sim/reset | toast | error toast |
| Lab: Trigger rogue FlashLite / benign trip | start scenario | POST /sim/scenario/{name} | banner with relative tick | error toast |
| Lab: Auto-grant switch | toggle simulated user | PUT /settings | switch state | error toast |
| Lab: Pending request Grant/Deny | decide | POST /sim/pending-requests/{id}/decision | leaves queue | error toast |
| Settings: LLM toggle, Save | persist | PUT /settings | toast | error toast |
| Connection badge | retry WebSocket | none | status updates | n/a |

---

## 13. Security Requirements

- Synthetic data only; visible banner "Demo data is synthetic". No real personal data anywhere in the MVP.
- Passwords hashed with bcrypt. JWT HS256 with expiry; secrets only in environment variables; never commit `.env`.
- Role checks on every write route; WebSocket validates the token.
- Pydantic validation on every input; enum-only for resource, action, context, outcome; free text limited to 500 characters; parameterised ORM queries only; React output escaping (never `dangerouslySetInnerHTML` with data).
- CORS limited to `CORS_ORIGINS`. Login and ingest endpoints rate limited (in-memory limiter is enough).
- Never log tokens, passwords or API keys.
- LLM (if enabled) receives only structured synthetic findings; output validated; fallback to templates.
- Future real agents: local-first, explicit consent, read-only by default, minimal retention.

---

## 14. Error Handling and Logging

- Uniform error body (Section 11) via a global exception handler; validation errors map to 422 with field details; unexpected exceptions return a generic 500 and log the stack trace with the request ID.
- Python `logging`, level from `LOG_LEVEL`, request ID on every line. INFO for control actions, alerts, scenario changes; DEBUG for per-event detail; WARNING for rejected events; ERROR for exceptions.
- Simulator: each tick runs in its own transaction; a failing tick is logged and skipped; the loop never dies silently.
- Frontend: error boundary per route, toast on failed mutations, inline retry on failed queries, WebSocket status indicator.

---

## 15. Environment Variables (`.env.example`)

```
DATABASE_URL=sqlite:///./edith.db
JWT_SECRET=change-me-long-random
JWT_EXPIRE_MINUTES=60
CORS_ORIGINS=http://localhost:5173
INGEST_TOKEN=change-me-ingest
DEMO_OWNER_EMAIL=owner@edith.local
DEMO_OWNER_PASSWORD=ChangeMe123!
DEMO_VIEWER_EMAIL=viewer@edith.local
DEMO_VIEWER_PASSWORD=ChangeMe123!
SIM_DEFAULT_SEED=42
SIM_MS_PER_TICK=1000
LLM_ENABLED=false
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-haiku-5-5
LOG_LEVEL=INFO
VITE_API_BASE=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000/ws
```
Verify the current Anthropic model name in Anthropic's documentation before Phase 11.

---

## 16. Folder Structure

```
edith/
  README.md  PROJECT_CONTEXT.md  MASTER_INSTRUCTIONS.md  .env.example  .gitignore
  docker-compose.yml (Phase 15, optional)
  backend/
    requirements.txt  pytest.ini  ruff.toml
    app/
      main.py config.py db.py seed.py
      core/ (errors.py logging.py security.py bus.py clock.py)
      models/ (user device app permission event baseline trust finding incident alert recommendation action sim_state setting pending_request)
      schemas/ (event.py api.py)
      routers/ (auth apps events alerts recommendations actions trust sim settings assistant ws health)
      services/ (ingest policy_gate baseline detection trust recommend control explain constants)
      sim/ (profiles.py scenarios.py engine.py)
    tests/ (unit/ api/ scenarios/)
    agents/windows_agent.py        (Phase 12)
  frontend/
    package.json vite.config.ts tailwind.config.ts tsconfig.json
    src/ (api/ components/ui/ components/trust/ features/ routes/ layouts/ lib/ styles/)
    tests/
  e2e/
  docs/ (DEMO.md ARCHITECTURE.md)
```

---

## 17. Demo Scenario and Acceptance Targets

After seeding (seed 42) all four apps score >= 80 with no open alerts (expected initial ranges: ChatterBox 85-95, RouteRunner 85-95, PixelPal 90-98, FlashLite 92-99).

`rogue_flashlight` expected flow: r0 R3 fires, High alert "FlashLite requested 4 permissions unrelated to a flashlight". r1 R2, R4, R1, R6 fire; score falls roughly 50 points into High risk; incident Critical. Recommendations appear: REC-SUSPEND (high), REC-REVOKE for contacts, microphone, location_background, REC-RESTRICT for location_fine foreground-only. User applies the bundle; app becomes suspended; blocked attempts show in Live Monitor; R5 fires once. User resumes; after 15 clean windows the score recovers into 60-85 but stays below its original level.

**Must pass (verified by tests, never assumed):** detection within 2 windows of r1; score drop >= 30 points within 3 windows; zero alerts on the other three apps; zero `allowed` events for revoked resources after the bundle; final score 60-85 after 15 clean windows; `benign_trip` produces no High or Critical alert on RouteRunner and offers REC-KEEP with "Mark as expected".

---

## 18. Important Technical Decisions

| # | Decision | Reason |
|---|---|---|
| D1 | Simulated sandbox is the core demo | A browser cannot observe other apps; honesty over false realism |
| D2 | Simulator calls the same ingest path as a real agent | Demonstrates the real pipeline and platform-neutral schema |
| D3 | Rules + EWMA/z-score, no ML | Explainable, offline, testable |
| D4 | `compute_score()` is a pure function reused by what-if | Predicted equals actual |
| D5 | SQLite now, PostgreSQL-ready | Zero setup; venue Wi-Fi risk |
| D6 | Baseline poisoning guard | Prevents slow ramps from becoming "normal" |
| D7 | Incident grouping | Prevents alert fatigue |
| D8 | Static impact notes | LLM must never invent consequences |
| D9 | Auto-grant on by default | Models a user tapping Allow; matches the problem scenario |
| D10 | Windows agent is monitor-only | Only last-use timestamps are readable; programmatic revoke unverified |
| D11 | `apply-bundle` endpoint and `pending_requests` table | Added beyond the early draft; this document is the final contract |
| D12 | `granted_tick` column on `app_permissions` | Needed for drift (D component) |

---

## 19. Development Roadmap and Progress Tracker

Update the Status and Notes columns at the end of every phase. Never mark DONE unless tests pass.

| Phase | Name | Depends on | Status | Notes / date |
|---|---|---|---|---|
| 1 | Project initialization and tooling | none | NOT STARTED | |
| 2 | Frontend design system and app shell | 1 | NOT STARTED | |
| 3 | Trust components and page skeletons | 2 | NOT STARTED | |
| 4 | Database models, seed, auth, errors, logging | 1 | NOT STARTED | |
| 5 | Apps and permissions APIs, PolicyGate, ControlService | 4 | NOT STARTED | |
| 6 | Event schema, ingestion, simulator, WebSocket | 5 | NOT STARTED | |
| 7 | Baselines, detection, trust-score engine | 6 | NOT STARTED | |
| 8 | Recommendations, alert lifecycle, what-if, explanations | 7 | NOT STARTED | |
| 9 | Integration A: auth, Command Center, Apps, App Detail | 3, 8 | NOT STARTED | |
| 10 | Integration B: Monitor, Alerts, Recommendations, History, Lab, Settings | 9 | NOT STARTED | |
| 11 | Optional LLM assistant | 10 | NOT STARTED | |
| 12 | Optional Windows agent | 10 | NOT STARTED | |
| 13 | Testing and QA | 10 | NOT STARTED | |
| 14 | Debugging, optimization, hardening | 13 | NOT STARTED | |
| 15 | Deployment and presentation prep | 14 | NOT STARTED | |

### Feature-to-phase map
C1:4 | C2:5,9 | C3:6 | C4:6,10 | C5:7 | C6:7 | C7:8,10 | C8:8,10 | C9:5,9 | C10:10 | C11:6,10 | E1:9 | E2:9 | E3:7,9 | E4:8 | E5:6,9 | E6:8 | P1:7,8 | P2:7,9 | P3:7 | P4:5,9 | P5:9,10 | I1:7 | I2:8,9 | I3:8,11 | I4:6 | A1:12

---

## 20. Known Limitations

- The core demo is simulated; the optional Windows agent only reads last-use timestamps (snapshots, no full history, no revoke).
- Sensitivity weights, caps, thresholds and the necessity map are heuristics, tunable in `constants.py`; the score is an estimate.
- Detection thresholds were not validated on real-world data.
- WebSocket support must be verified on any hosting platform; local run is the primary demo path.
- OS dashboard facts (Android 12, iOS 15.2 era) must be re-verified against current versions before stating them publicly.

---

## 21. Change Log

(Cursor appends one dated line per phase: what changed, files added, APIs added/changed, known issues.)