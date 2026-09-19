# Leadership Reporting Dashboard — Plan

> Status: **Draft structure, grounded in the live HubSpot account** (portal `443197539`, AP1,
> AUD, Australia/Adelaide). v1 launch target ≈ **2 weeks**, with further enhancements expected —
> so v1 favours what's reportable *today* and flags setup-dependent items as fast-follows.

## 1. Purpose & scope

A single **tiered leadership reporting dashboard** replacing the Creatio-backed support tool as
operations move into HubSpot.

- **Eventual scope (6 functions):** Support, Sales, Account Management, Professional Services,
  Finance, IT.
- **v1 scope (4 functions):** **Support, Sales, Account Management, Professional Services.**
  Finance and IT come later.
- **All four v1 functions report from HubSpot today** → v1 is a "HubSpot is the hub" build.
  Future migrations (**PS→Asana**) and additions (Finance/IT systems) sit behind swappable
  data-source seams.
- **The exec deck already spans all six functions** plus Product/AI (§10). The dashboard *computes*
  the slides for the four functions it owns; the remaining slides (Product roadmap, GTM, AI Usage,
  H&L Pay/ValPay) are fed by **file-drop / owner inputs**, which the deck module also assembles.

## 2. Tiered structure

The dashboard mirrors the **existing exec-deck narrative spine** (§10) so the on-screen views and
the weekly PowerPoint tell the same story:

> **1 · DID WE SELL?** (Sales) · **2 · DID WE DELIVER?** (PS) · **3 · DID WE KEEP THEM?** (Support)
> · **4 · BUILDING THE FUTURE?** (Product/AI — later functions)

- **Tier 1 — Leadership scorecard.** One exec view; a small band of headline KPIs per function,
  one shared period selector. This is the on-screen twin of the deck's **Executive Summary** slide.
- **Tier 2 — Per-department drill-through.** A view per function with operational depth — the
  twin of each detailed deck slide.

```
        ┌──────────────────────────────────────────────┐
        │      TIER 1 · Leadership scorecard            │
        │  Support │ Sales │ Acct Mgmt │ Prof Services   │
        └─────┬──────┬─────────┬────────────┬───────────┘
         ┌────▼─┐ ┌──▼──┐  ┌───▼───┐   ┌────▼─────┐
         │ Sup. │ │Sales│  │  AM   │   │    PS    │       TIER 2 · department detail
         └──────┘ └─────┘  └───────┘   └──────────┘
```

## 3. Data-source map (verified against the account)

Department routing keys off **object type + pipeline**.

| Function | Source | Verified detail |
|----------|--------|-----------------|
| **Support** | Tickets — **Support Pipeline** (`hs_pipeline = 0`) | Stages: New · In Progress · Pending Internal · Pending External · **Closed**. SLA fields present. |
| **Sales** | **Deals** (Sales Pipeline) + **Leads** + **Quotes** | Sales stages: Discovery · Quote Sent · Negotiation · Pending Finance · **Ordered Placed** (`closedwon`) · Closed Lost. |
| **Account Mgmt** | **Companies** + **Deals (Renewals Pipeline)** | Renewals stages: 120/90/60/30 Days to Renewal · Closed Won · Closed Lost. Rich churn/MRR fields on Company (below). |
| **Professional Services** | **Custom PS object** `p443197539_professional_services` + tickets across 5 pipelines | PS pipelines: Integrations · Training · Tech · Onboarding · Warranty (each with its own stages; terminal = **Complete** / Cancelled). PS object is a Work Order (SF-migrated). → **Asana** later. |

**Teams** (replace the hard-coded roster + fuzzy matching entirely):
- Support: **Tier 1 / Tier 2 / Tier 3**, Support, Tech
- PS: Professional Services, Integrations, Onboarding, Training
- Sales: **Sales - NSW / SA / QLD / VIC / WA / International**, Sales & Account Management
- Finance (exists; function deferred)

## 4. Key findings vs. earlier assumptions

**Better than assumed:**
- **PS is richer than "throughput only."** The PS object carries `start_date`, `end_date`,
  `golive_date`/`proposed_golive_date` (→ **on-time delivery**), `total_amount`+`tax`
  (→ **value/margin**), and even `total_hours` (→ partial **hours** reporting *before* Asana),
  plus a full billing lifecycle (`billing_status`, `invoiced`, `charge_status`, `approval_status`).
- **AM is not just an approximation.** Companies carry a real recurring-revenue field (`mmr`),
  a full churn model (`churn_risk_level`, `churn_date`, `churn_reason`, `churned_mrr`,
  `hs_csm_sentiment`, `acct_mgr_at_churn`, `account_tier`) and `hs_next_renewal_date` — and
  **renewals/expansion are also tracked as Deals** (Renewals pipeline + deal types
  *Expansion (New Venue)/(Other)*, *Change of Ownership*). So NRR/GRR, churn, at-risk and
  renewals are all feasible in v1.
- **Roster solved** by Teams (Tiers + regions) — no code list, no Levenshtein matching.

**Surveys — confirmed present.** CSAT/NPS/CES roll-up fields exist on tickets
(`hs_last_csat_rating`/`hs_last_csat_date`, `hs_feedback_last_nps_rating_number`/
`hs_last_nps_survey_comment`, CES equivalents), rolled up from associated feedback submissions.
So Support satisfaction is reportable at launch by aggregating the per-ticket rating fields to
owner/team. *(The `feedback_submissions` object itself didn't surface to the API tools, so
aggregation reads the ticket-level fields — verify the CSAT rating scale during build.)*

**One genuine gap at launch (fast-follow):**
- ⛔ **AI-draft adoption has no source yet.** It's a **manual card** being added to the support
  ticket, mirroring Creatio's `UsrAiDraftText` (draft present) and `UsrAiApproved` (draft used) —
  **not yet created in HubSpot**. Needs two custom ticket properties added and populated before it
  can report. Exact mapping is pinned (below).

## 5. Metric catalog (per function)

Each function keeps an **owner/team breakdown + a total**. ✅ ready now · 🟡 setup-dependent.

### 5.1 Support — Tickets (Support Pipeline)
- ✅ **Tickets closed** by owner/team — stage = `Closed`; + avg/day.
- ✅ **SLA / response time** — `time_to_first_agent_reply`, `time_to_close`, and the SLA-status
  fields (`hs_time_to_first_response_sla_status`, `hs_time_to_close_sla_status`).
- ✅ **Volume & backlog** — created vs. closed; open backlog; by `hs_ticket_priority`/`source_type`.
- ✅ **Survey NPS/CSAT** — aggregate the ticket roll-up fields `hs_last_csat_rating` and
  `hs_feedback_last_nps_rating_number` to owner/team; keep the old NPS methodology for comparability.
- 🟡 **AI-agent adoption** — needs two custom ticket properties first (see §5.1a).

#### 5.1a AI-draft properties to create (mapped from Creatio)
| Creatio field | Purpose | New HubSpot ticket property (proposed) | Type |
|---------------|---------|----------------------------------------|------|
| `UsrAiDraftText` | an AI draft was written | `ai_draft_present` (or keep the draft text) | bool / text |
| `UsrAiApproved` | the draft was used/approved | `ai_draft_used` | bool |

Adoption (closed tickets only) = `ai_draft_used` ÷ `ai_draft_present`, per owner/team — identical
to today's logic. Populated via the manual card on the ticket.

### 5.2 Sales — Deals + Leads + Quotes
- ✅ **Bookings** (closed-won value, stage `Ordered Placed`), **win rate**, avg deal size,
  **cycle length** (`days_to_close`), pipeline created & coverage — by rep and by **region team**.
- ✅ **New business vs. expansion** via `dealtype`.
- ✅ **Leads** — new leads, lead→deal conversion, follow-up SLA.
- ✅ **Quotes** — sent, acceptance rate (`hs_status`), avg value, quote→close.
- 🟡 **Quota attainment** — HubSpot **Goals** chosen but *not set up yet* → later.

### 5.3 Account Management — Companies + Renewals deals
- ✅ **Accounts by account manager** (`hubspot_owner_id`, `account_tier`).
- ✅ **Recurring revenue / MRR** (`mmr`); **churn** (`churn_date`, `churned_mrr`, `churn_reason`)
  → GRR/NRR, churned MRR, logo churn.
- ✅ **At-risk** (`churn_risk_level`, `hs_csm_sentiment`).
- ✅ **Renewals** — `hs_next_renewal_date` + the Renewals deal pipeline (120→30 days to renewal,
  won/lost).
- ✅ **Expansion** — `dealtype = Expansion (…)`.

### 5.4 Professional Services — PS object + 5 ticket pipelines
- ✅ **Active engagements by stage** (PS object pipeline/stage) and by type
  (`professional_service_type`).
- ✅ **Throughput & cycle time per pipeline** (Integrations/Training/Tech/Onboarding);
  `hs_v2_time_in_current_stage`.
- ✅ **On-time delivery / go-live** — `proposed_golive_date` vs `golive_date`; `start`/`end_date`.
- ✅ **Value & billing** — `total_amount`, `invoiced`/`billing_status`; **hours** via `total_hours`.
- ✅ **Warranty volume & cycle** — Warranty pipeline.
- 🔜 **Asana (later):** task-level delivery, true utilization/capacity — via the PS adapter.

## 6. Tier-1 scorecard (headline per function)
- **Support:** SLA attainment · open backlog · tickets closed *(CSAT once surveys live)*
- **Sales:** bookings · win rate · pipeline coverage *(vs. target once Goals live)*
- **Account Mgmt:** net revenue retention · churned MRR · renewals due · at-risk count
- **Professional Services:** active engagements · on-time go-live % · warranty volume

## 7. Architecture

- **Native HubSpot reports/dashboards** for everything above marked ✅ — fastest path to the
  2-week launch, no hosting.
- **Small custom aggregation layer** (evolution of today's `serve.py`/`metrics.py`, HubSpot
  **Private App token**, aggregates-only to the browser) reserved for what native can't do:
  AI-adoption roll-up (once properties exist), any cross-object KPI, and the Tier-1 composition
  if native layout can't express it.
- **Swappable data-source adapters** per function so **PS→Asana** (and future Finance/IT/billing
  sources) re-point one adapter, not the dashboard. Same isolation the current tool uses for
  Creatio.
- **File-drop ingestion (retained, same as the old dashboard).** Built the same way as the
  current support dashboard's setup (Python stdlib server + local files/`.env`, no external deps).
  External-component files (systems not in HubSpot) drop into the reporting folder and are read by
  a **file adapter**, merged with HubSpot data.
- **Executive slide deck (unchanged output) — PowerPoint.** The current exec deck stays exactly
  as-is: same styling, layout, and content. The new system feeds it from the aggregated numbers
  via a **deck-output module** that renders into the existing `.pptx` template (via `python-pptx`),
  auto-generating the same deliverable. **Supplied and analysed — full spec in §10.**
- **Hosting.** Per the current "Leadership Reporting & Hosting" project: **SharePoint interim
  hosting** now, **AWS** proposed (pending budget sign-off). The `New Reporting/` app is built to
  run either place (stdlib server, no heavy deps) so the host can move without a rewrite.

### 7.1 Repository layout
Everything lives in a new folder **`New Reporting/`** in the `leadership-reporting` repo, mirroring
the old `support-dashboard/` structure:
```
New Reporting/
  metrics.py        # HubSpot pulls + per-function aggregation (adapters per source)
  serve.py          # local stdlib server (same pattern as the old dashboard)
  index.html        # Tier-1 scorecard + Tier-2 drill-through UI
  deck.py           # renders the exec PowerPoint from aggregated data
  drops/            # file-drop location for external components (CSV/XLSX)
  template.pptx     # the supplied exec-deck template  (to be provided)
  .env.example      # HubSpot Private App token, etc.
```

## 8. Delivery — geared to a 2-week launch

- **Phase 1 (launch): native dashboards for everything ✅** — Support ops (closed/SLA/backlog),
  Sales (Deals/Leads/Quotes), AM (Companies + Renewals), PS (engagements/on-time/value). This is
  the bulk of the value and needs no code.
- **Phase 2 (fast-follow): unblock the 🟡 gaps** — enable feedback surveys → CSAT/NPS; create +
  populate AI-draft ticket properties → AI-adoption; set up Sales Goals → quota attainment.
- **Phase 3: Tier-1 scorecard** composition + custom layer where needed.
- **Later:** Finance & IT functions; PS→Asana; deeper trends/exports.
- **Expect iteration:** structure is designed to absorb post-launch changes without rework.

## 9. Open questions
1. ✅ *Resolved* — surveys are configured (ticket roll-up fields); satisfaction ships at launch.
2. ✅ *Resolved* — AI-draft is a manual card; create `ai_draft_present` + `ai_draft_used` (§5.1a).
3. **AM source of truth** — confirm `mmr` on Company is the recurring-revenue field to report on
   (vs. deriving from Renewals deals).
4. **Custom layer packaging** — standalone page (same as old dashboard) vs. embedded HubSpot UI
   Extension. *(Leaning standalone, to match the retained file-drop system.)*
5. **Audience & access** — leadership only, or wider?
6. ✅ *Resolved* — exec PowerPoint supplied and analysed (§10); styling/structure captured.
7. **File-drop feeds** — one is already live (**ValPay HubSpot export, weekly**, slide 6). Please
   confirm the full set the new system must accept (e.g. Finance movement register, product plan,
   GTM tracker, AI-usage/code stats) and their formats, so the file adapter can parse each.
8. **Hosting** — confirm SharePoint interim now / AWS later, and who owns deployment.

## 10. Executive deck (canonical output — supplied & analysed)

The current deck is **`HL_Weekly_Update`** — a weekly leadership PowerPoint. The new system must
reproduce it exactly, then auto-populate it from the aggregated data. Captured spec:

### 10.1 Styling (to preserve verbatim)
- **Format:** PowerPoint, **16:9 widescreen** (13.333in × 7.5in).
- **Font:** **Poppins** throughout (headings + body).
- **Palette (brand):**
  - Navy/ink `#12293A` (dominant — titles, text, dark headers)
  - Teal `#2C8394` and light teal `#5FB2C4` (primary accent)
  - Slate `#3D505E` / muted `#8FA6B4` (secondary text, rules)
  - Terracotta `#B4552D` (warning / attention) · Gold `#C88A2E` (caution) · Green `#3D8F5F` (positive)
  - Light tints for cards/backgrounds: `#DDE6EA`, `#DCEEF2`, `#ECF1F3`, `#F2F6F8`, `#C9E2E8`, `#F7F9FA`
- **Motif:** white slides; big **stat callouts** (large number + small label) in tinted cards;
  dense data tables with a dark navy header row; a per-slide theme tag (e.g. "1 · DID WE SELL?")
  and a function tag (Finance / Sales / Support / …); an **"AI SUMMARY"** bullet block per slide;
  a **"Source:"** footer per slide. The H&L wordmark top-right.

### 10.2 Structure (17 slides) & data ownership
| # | Slide | Theme | Function | Source today → v1 |
|---|-------|-------|----------|-------------------|
| 1 | Title (week commencing / generated date) | — | — | auto |
| 2 | Agenda | — | — | static |
| 3 | Executive Summary (6 tiles, leadership-editable `xx`) | — | all | **= Tier-1 scorecard** |
| 4 | Target vs Invoiced — Sales roll-up | 1 Sell | Finance/Sales | Finance register (file-drop) + Deals |
| 5 | New Products — Target vs Traction | 1 Sell | Sales/Product | Creatio→HubSpot + product plan (file-drop) |
| 6 | H&L Pay — Referrals to ValPay | 1 Sell | Sales | **ValPay HubSpot export (file-drop, weekly)** |
| 7 | H&L Pay — Commercial Execution Plan | 1 Sell | Sales | marketing plan (temp) |
| 8 | H&L Pay — One POS | 1 Sell | Sales | marketing (static) |
| 9 | Sales Pipeline — Q3 FY26 | 1 Sell | Sales | Creatio→**Deals** |
| 10 | Utilisation & Delivery Hours | 2 Deliver | PS | **PS object** (`total_hours`, work orders) |
| 11 | Won vs Invoiced & Retention | 2 Deliver | Sales/PS/Finance | Deals + Finance (file-drop) |
| 12 | Backlog (age bands) | 3 Keep | Support | Creatio→**Support tickets** |
| 13 | AI Support Agent (adoption) | 3 Keep | Support | Creatio→**AI-draft props (to create)** |
| 14 | Q3 Roadmap | 4 Future | Product | GTM tracker (file-drop) |
| 15 | GTM Readiness | 4 Future | Product | GTM tracker (file-drop) |
| 16 | AI Usage — Adoption & Activity | 4 Future | IT | code/usage stats (file-drop) |
| 17 | Projects — Portfolio Status | 4 Future | Portfolio | weekly meeting record (file-drop) |

The four **v1 dashboard functions own slides 9–13** (Sales pipeline, PS utilisation, Support
backlog + AI). Slides 4–8, 11, 14–17 are **file-drop / owner-fed** and assembled by the deck module.

### 10.3 Metric definitions to preserve exactly (for comparability)
- **AI adoption** = approved & sent ÷ *all* drafts in scope; **confidence** = sent as-is ÷ approved;
  **closed tickets only**; Level 1/2/3 or unassigned; voicemail excluded; rejects *not* counted
  (not separable from auto-clear). Headline = all-time (Year), plus this-week beside it.
- **Support backlog** age bands: 0–7 / 8–30 / 31–90 / 90+ days; "unanswered open" = no first response.
- **PS utilisation** = all hours ÷ capacity (target **80%**); billed vs non-billed split; per member.
- **Sales**: closed-won attributed by **expected close date**; win rate = won ÷ (won+lost) by count;
  weighted = ARR × win probability.
- **Commentary**: computed lines are pre-filled; `xx` lines are **leadership-editable** and must be
  left as editable placeholders, not auto-filled.

### 10.4 Build approach
Template-based (unzip the supplied `.pptx` → edit `slideN.xml` text/table/chart values in place →
re-zip), so every visual detail is preserved by construction. Charts (slides 9, 11, 12) update via
their embedded data; stat callouts and tables update by text replacement keyed to stable anchors.
