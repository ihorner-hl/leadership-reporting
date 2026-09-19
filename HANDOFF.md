# H&L GTM Reporting — Context & Handoff Pack

**Purpose of this pack:** everything a fresh Claude conversation needs to build **stop-gap
reporting for the next few weeks** that bridges the **old (Creatio)** and **new (HubSpot)**
worlds, while continuing to produce the **weekly executive deck**. Hand Claude this whole
folder.

Owner: Izaak Horner (izaak.horner@hlpos.com), H&L / HLPOS. Portal (HubSpot) id: **443197539**.
Prepared: 2026-09-19.

---

## 1. The situation in one paragraph

H&L is migrating GTM systems from **Creatio → HubSpot** (migration go-live was ~31 Aug 2026).
Leadership reporting is being rebuilt on HubSpot as a tiered dashboard, but the new reports
aren't all built and some HubSpot data is still dirty/ramping. Meanwhile the business still
needs its **weekly executive deck** every week. So for the next few weeks we need **stop-gap
reporting** that can pull **whatever is trustworthy from HubSpot now**, **fall back to
Creatio / file-drops where HubSpot isn't ready**, and **keep the exec deck looking and reading
exactly as it does today**.

The stop-gap's job is to keep the weekly deck honest and on-time during the cut-over, not to
be the final architecture.

---

## 2. The three things in this pack

| # | Thing | Folder / file | What it is |
|---|-------|---------------|------------|
| A | **Old dashboard (Creatio)** | `support-dashboard/` | The proven, live Creatio-backed support dashboard. Python stdlib server + HTML. Source of Creatio data model + the current numbers. |
| B | **New app (HubSpot)** | `New Reporting/` | The read-only HubSpot ingestion + the leadership dashboard UI. Built during this project; live and working for Support/Sales/PS. |
| C | **Weekly exec deck** | `deck.pptx` | The current H&L Weekly Update (17 slides). The output that must keep being produced. Structure documented in §6. |
| + | Plans & design | `PLAN.md`, `leadership.html`, `wireframe.png` | The leadership-dashboard plan, the finished design (9-tab HTML), the original wireframe that set the visual direction. |

---

## 3. What "stop-gap reporting" needs to do (the actual ask)

1. **Produce the weekly exec deck** (`deck.pptx` structure) every week, same styling/content.
2. For each metric, pull from the **best available source right now**:
   - **HubSpot** where the data is trustworthy (see §5 readiness table),
   - **Creatio** where HubSpot isn't migrated/clean yet (support history, etc.),
   - **file-drops** for genuinely external feeds (Finance/Sysnet, product sheet, tooling logs, delivery tracker).
3. **Never fabricate** a number — where a source isn't ready, show the honest "not set up / not
   working / estimate" state (this is the whole design ethos, see §7).
4. Be **read-only** against every source (see §8).

---

## 4. Verified HubSpot data model (portal 443197539)

These constants were verified live against the portal — they are the expensive, hard-won part.
They live in `New Reporting/metrics.py`; reproduced here so the new chat has them immediately.

**Tickets**
- Support pipeline id: `0`  ·  Support "Closed" stage id: `3484913083`
- PS ticket pipelines (feed Professional Services):
  - Integrations `2026136017`, Training `2026202606`, Tech `2026349046`,
    Onboarding `2026349047`, Warranty `2069182934`
- Hours logged on ticket **cases**: `actual_hours` (+ `training_actual_hours` on Training);
  `is_billable` flag exists. These roll up to the PS master `total_hours`.
- CSAT/NPS roll-up fields on tickets: `hs_last_csat_rating`, `hs_feedback_last_nps_rating_number`
- SLA status fields: `hs_time_to_first_response_sla_status`, `hs_time_to_close_sla_status`
  (values MET / BREACHED) — **not populated yet** on Support tickets.

**Deals**
- Sales pipeline id: `default`  ·  Renewals pipeline id: `2025963963`
- Amount for aggregation: `amount_in_home_currency`; probability: `hs_deal_stage_probability`
- Closed flags: `hs_is_closed`, `hs_is_closed_won`; stage: `dealstage`; date: `closedate`

**Leads** — object type `leads`; creation date property is `hs_createdate` (NOT `createdate`).

**Quotes** — object `quotes`; status `hs_status` (DRAFT / APPROVAL_NOT_NEEDED / ACCEPTED …).
Non-DRAFT = published; ACCEPTED = accepted. Lightly used so far (~tens).

**Companies** — object `companies`; `mmr` and `hs_next_renewal_date` populated on very few
records (Account Management revenue therefore deferred).

**Professional Services custom object** — `p443197539_professional_services`; rollup hours
field `total_hours` (populated on ~1% of records — time logging still ramping).

**Goals (Sales targets)** — object `goal_targets`, read via `/crm/v3/objects/goal_targets`
(GET list) + `/crm/v3/properties/goal_targets` to discover fields. Requires scope
`crm.objects.goals.read`. Field names are portal-specific — `metrics.py:sales_goal()`
self-discovers target/start/end/kpi/name.

**Pipeline/stage labels** — `/crm/v3/pipelines/{object}` gives stage-id → label maps
(used to render readable stage names).

---

## 5. Data-quality / readiness (live scan) — what to trust today

All-time counts from the live scan (portal 443197539). Drives what's HubSpot-ready vs deferred.

| Area | Live finding | Stop-gap source |
|------|--------------|-----------------|
| Support volumes (Support pipeline) | Live & trustworthy (created/closed/backlog) | **HubSpot** |
| Support SLA attainment | SLA fields not populated (0 MET/0 BREACHED) | Creatio / not set up |
| Support CSAT/NPS | No responses flowing on Support tickets | Creatio (`SatisfactionLevel`) |
| Sales open pipeline / stages / leads / quotes | Live & trustworthy | **HubSpot** |
| Sales goals + forecast | Now available (goals scope granted) | **HubSpot** |
| Closed-won bookings | Available (`hs_is_closed_won`, `closedate`) | **HubSpot** |
| Invoiced revenue / attainment | Not in HubSpot | **Sysnet export (file-drop)** — labeled "Sysnet", not "Xero" |
| Owner / IC attribution | Owner missing on ~68% of tickets, ~31% of deals | Deferred |
| PS engagements & ticket volumes | Live | **HubSpot** |
| PS delivery hours | `actual_hours` on ~27 cases; `total_hours` ~1% | HubSpot (ramping) — reads low by design |
| Account Management revenue (NRR/GRR/MRR) | company `mmr` ~38 records, renewal date ~0 | Deferred |
| Product / AI Usage / Projects | Not in HubSpot | **file-drops** |

Deal totals at scan: ~16,496 deals (11,782 closed-won all-time); tickets ~154,503
(Support pipeline ~55,041; PS pipelines ~99,462); companies ~29,489 (2,528 customers);
PS object ~8,812.

---

## 6. The weekly exec deck (`deck.pptx`) — structure to preserve

17 slides, branded H&L (navy/teal/terracotta/gold). Four-chapter narrative:

1. **DID WE SELL?** (Sales & partner motion)
   - Target vs Invoiced — sales team roll-up (Finance)
   - New Products — target vs traction (Sales & Product)
   - H&L Pay — referrals to ValPay; commercial execution plan; product teaser (Sales)
   - Sales Pipeline — Q3 FY26 (open unweighted/weighted, closed-won)
2. **DID WE DELIVER?** (Professional Services, Finance)
   - Utilisation & Delivery Hours (billed vs non-billed, total utilisation vs capacity)
   - Won vs Invoiced & Retention (closed-won ARR vs invoiced ARR, awaiting go-live ARR)
3. **DID WE KEEP THEM?** (Support)
   - Backlog (open backlog, aged 31d+, unanswered, total cases)
   - AI Support Agent (adoption over closed tickets; L1/L2/L3; voicemail excluded)
4. **BUILDING THE FUTURE?** (Product, IT, Portfolio)
   - Q3 Roadmap (items across 6 sprints); GTM Readiness matrix
   - AI Usage — adoption & activity (IT); lines of code WoW
   - Projects — portfolio status (incl. the HubSpot Migration project itself)

Cover: "H&L Weekly Update · Week commencing <date> · Generated: <date>".
This four-chapter spine (SELL / DELIVER / KEEP / BUILD) is the same spine used by the new
dashboard's Overview "chapters" — keep them aligned.

---

## 7. Design system (brand + ethos) — keep consistent

- **Font:** Poppins. **Palette:** navy `#12293A`, teal `#2C8394`, terracotta `#B4552D`,
  gold `#C88A2E`, green `#3D8F5F`; bg `#F2F6F8`. Light/dark theming in the HTML.
- **"Pace against the clock":** every measure is drawn against **quarter-elapsed** (a tick on
  a bar); status is days ahead/behind. Needs a **target** — from HubSpot **Goals** (now live
  for Sales) or interim targets. Where no target exists, show a neutral bar + "no target set".
- **"No number without provenance":** each figure carries a **source** and a **confidence**
  (●●● system of record / ●●○ kept by hand / ●○○ derived-estimate); estimates render hollow;
  broken feeds show **"not working"**, unconfigured ones **"not set up"**. A **source register**
  lists every feed's health.
- Source naming note: the finance export is **"Sysnet"**, never "Xero".

---

## 8. Hard constraints (do not break)

- **Read-only against every live source.** The HubSpot app only ever calls object reads and
  `/search` (a read over POST) + pipeline/property GETs. No create/update/delete, no write
  scopes. The Creatio app validates a login and reads Cases over OData; credentials live in
  memory only, never written to disk or sent to the browser.
- **Secrets stay with the user.** Tokens/creds live in a gitignored `.env` (or in-memory).
  Never commit or paste them. HubSpot uses a **Service Key** (legacy "private app" replacement)
  with read-only scopes: deals, line_items, quotes, leads, tickets, companies, custom,
  owners, schemas.custom, **goals**.
- **Artifacts can't call the API** (sandboxed) — production must be a **hosted app** that holds
  the token, not a Claude artifact. Current interim run is local (`python3 serve.py`).

---

## 9. How to run each app

**New HubSpot app** (`New Reporting/`, Python 3.11+, stdlib only):
```bash
cd "New Reporting"
cp .env.example .env      # paste the HubSpot Service Key into HUBSPOT_TOKEN
python3 serve.py          # http://localhost:8792  (PORT is 8792 in the file; user runs 8793 locally)
# GET /api/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD  → aggregated JSON; / → index.html dashboard
```
**Old Creatio app** (`support-dashboard/`, Python 3.11+, stdlib only):
```bash
cd support-dashboard
python3 serve.py          # http://localhost:8791  (enter Creatio URL/user/pass in the UI, or .env)
```
Both are standard-library only — no `pip install`. Both keep the token/creds out of the browser.

---

## 10. Kick-off prompt for the NEW conversation (paste this)

> I'm building **stop-gap GTM reporting for H&L for the next few weeks** while we migrate from
> Creatio to HubSpot. I've attached a context pack (`HANDOFF.md` + both apps + the weekly exec
> deck + design). Please read `HANDOFF.md` first.
>
> Goal: keep producing the **weekly executive deck** (`deck.pptx` — same four-chapter structure,
> styling and content) each week, pulling each metric from the **best available source right
> now**: HubSpot where it's trustworthy (per the readiness table in §5), Creatio where HubSpot
> isn't ready, and file-drops for external feeds (Sysnet/Finance, product sheet, tooling logs,
> delivery tracker). Everything **read-only**; never fabricate a number — use the "not set up /
> not working / estimate" states.
>
> The verified HubSpot data model (pipeline IDs, field names, goals, hours mapping) is in §4 and
> already implemented in `New Reporting/metrics.py`. Start by proposing how you'd generate this
> week's deck from the mixed sources, and what you need from me.

---

## 11. File manifest

```
HANDOFF.md                     ← this file (read first)
deck.pptx                      ← weekly executive deck (17 slides) to keep producing
leadership.html                ← finished 9-tab leadership dashboard design (demo data)
wireframe.png                  ← original wireframe that set the visual direction
PLAN.md                        ← leadership dashboard plan (HubSpot-grounded, tiered, deck spec)
New Reporting/                 ← NEW read-only HubSpot app (live for Support/Sales/PS)
  metrics.py                   ← HubSpot ingestion (all verified IDs/fields, goals, hours)
  serve.py                     ← stdlib server + /api/metrics
  index.html                   ← the dashboard UI wired to /api/metrics
  README.md, .env.example, .gitignore
support-dashboard/             ← OLD Creatio support dashboard (proven, live)
  metrics.py                   ← Creatio OData ingestion (Cases: closed/CSAT/AI adoption)
  serve.py, index.html, README.md, .env.example, .gitignore
```

No real `.env` / tokens / credentials are included — you supply those locally.
