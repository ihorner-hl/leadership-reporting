# PS & Support reporting — how the numbers are pulled

Context pack for a Claude session. It covers the two locked slides in the H&L Weekly Update:
**Utilisation & Delivery Hours** (PS) and **Backlog** (Support). It records where every number comes from, the exact
HubSpot filters, the definitions, the traps, and the WC 19 Oct 2026 figures as published.

Source of truth for the published figures: `exec-deck/data/wc-2026-10-19.json` (keys `psEconomics`,
`supportFlow`, `utilisation`, `execSummary`). Generator: `exec-deck/build_deck.js` (Node + pptxgenjs).
Build: `cd exec-deck && node build_deck.js data/wc-2026-10-19.json`.

---

## 0. Ground rules

- **Read-only** against HubSpot. Never write to records; field fixes go to the owners.
- **Never fabricate.** Anything not yet measurable shows "Not set up", "held" or "as at <date>".
- The Finance export is called **Sysnet**, never "Xero".
- Weeks are **Sydney weeks, Monday to Sunday**. "WC 19 Oct" = 19–25 Oct 2026.
- Uploaded spreadsheets (P&L, commissions) are not committed. Only derived figures go into the data JSON.

## 1. HubSpot reference IDs

**Portal:** 443197539. Record URLs: tickets `/record/0-5/{id}`, deals `0-3`, companies `0-2`.

**Ticket pipelines**

| Pipeline | ID |
|---|---|
| Support | `0` |
| PS Integrations | `2026136017` |
| PS Training | `2026202606` |
| PS Tech | `2026349046` |
| PS Onboarding | `2026349047` |
| PS Warranty | `2069182934` |

**Support pipeline stages**

| Stage | ID |
|---|---|
| New | `3485068732` |
| In Progress | `3485068731` |
| Pending Internal | `3484912121` |
| Pending External | `3484913082` |
| Closed | `3484913083` |

**PS staff (ticket owner IDs).** Only these count; anyone else on a PS ticket is excluded.

| Owner ID | Person |
|---|---|
| 366307924 | Isayah Kuhlmann |
| 366307917 | Rhys Woolcock |
| 366307915 | Gregory St Clare-Hobbs |
| 366307919 | Ryan Neil Orande |
| 366307930 | Joshua Casey |
| 366307927 | Isaac Mercado |
| 366307911 | Rodney Nolan |
| 366307916 | Karim AlRifaii |
| 366307926 | Argenis Rafael Guevara |

Excluded (not PS): Anton Lopez 366307925, Bjorn Magabo 366307949, and others.

**Ticket fields used**

| Field | Meaning |
|---|---|
| `actual_hours` | Hours on a PS ticket. Filled by the work-order playbook. |
| `is_billable` | true/false |
| `chargeable` | "Is Chargeable?" — Yes / No / blank. Introduced WC 19 Oct. |
| `integration_level_3` | Partner the work relates to (used for the partner table). |
| `source_type` | PHONE / EMAIL / other (voice : email ratio) |
| `time_to_first_agent_reply` | Milliseconds |
| `time_to_close` | Milliseconds |
| `closed_date` | Date the ticket closed |
| `createdate` | Date the ticket was created |
| `hs_pipeline` | Pipeline ID |
| `hs_pipeline_stage` | Stage ID |
| `hubspot_owner_id` | Ticket owner |

## 2. HubSpot MCP behaviour (the traps)

- **Aggregations are unreliable at day edges.** `query_crm_data` matches aggregation date filters by UTC day, not Sydney day.
  - Exact weekly counts: use `search_crm_objects` with epoch-millisecond `BETWEEN` filters and read `total`.
  - Alternatively, run a plain row `SELECT` with a timestamp literal (`'2026-10-19 00:00:00'`), which is read as Sydney time.
- **`DATE_TRUNC(x,'WEEK')` matches Sydney weeks.** Start the lower filter a week early, or the first bucket is cut short.
- **Large results get saved to a file.** Anything over about 40k characters lands in `tool-results/…txt`. Parse it with:
  ```python
  rows = [json.loads(r["content"])["properties"] for r in json.load(open(f))["results"]]
  ```
- **Cross-object queries (`COMPANY.name`) fail with full timestamps** ("Failed to resolve date range"). Use a date only (`'2026-09-30'`).
- **Long OR chains fail** (nesting limit of 20). Use `IN (…)`.

**Sydney week starts (epoch ms, AEDT)**

| Week starting | Epoch ms |
|---|---|
| 28 Sep | 1790517600000 |
| 5 Oct | 1791118800000 |
| 12 Oct | 1791723600000 |
| 19 Oct | 1792328400000 |
| 26 Oct | 1792933200000 |

Add 604800000 for each following week.

---

## 3. PS slide — Utilisation & Delivery Hours

### Pull

```sql
SELECT hs_object_id, createdate, hubspot_owner_id, hs_pipeline, actual_hours,
       is_billable, chargeable, integration_level_3, subject
FROM TICKET
WHERE hs_pipeline IN ('2026136017','2026202606','2026349046','2026349047','2069182934')
  AND createdate >= '2026-10-01 00:00:00' AND actual_hours > 0
LIMIT 500
```

Keep only the 9 PS owner IDs. Assign each ticket to a week by `createdate` converted to Australia/Sydney, Monday start.
For company and account grouping, run a second query:

```sql
SELECT hs_object_id, actual_hours, COMPANY.name FROM TICKET
WHERE hs_pipeline IN (…) AND createdate >= '2026-09-30' AND actual_hours > 0
```

### Definitions (as the user set them)

**Total hours logged**
- The sum of `actual_hours` on PS tickets for the week.
- Shown beside it: available hours.

**Available hours**
- Each PS person counts as 38h a week (7.6h a day), minus leave and sick days.
- WC 19 Oct = 9 × 38 − 53.2 = **288.8h**. The 53.2h is:
  - Argenis: Thu–Fri leave, 15.2h
  - Karim: Thu–Fri leave, 15.2h
  - Greg: 3 sick days, 22.8h
- Earlier weeks:
  - 12–18 Oct: 304h (8 staff; Isayah on leave)
  - 5–11 Oct: 342h (9 staff)
  - 28 Sep–4 Oct: 266h (7 staff; Rhys and Rodney on leave)
- Leave is not in HubSpot. It comes from the user and must be asked for each week.

**Billable utilisation**
- = billable hours ÷ available hours. Target 50%.
- This is the parent box. Billable·chargeable and billable·non-chargeable are its two children, grouped visually.

**Billable · chargeable**
- `is_billable = true` AND `chargeable` is **Yes or blank**.
- Rule: **"If there is no flag, it is chargeable."**

**Billable · non-chargeable**
- `is_billable = true` AND `chargeable = No` only.
- This is the "hidden work": billable work H&L can't charge for, because of partner rev-share deals and large legacy customers.
- It is tracked so these arrangements can be renegotiated.

**Utilised · non-billable** and **Non-utilised**
- Both show **"Not set up"**. The buckets don't exist in HubSpot yet; Izaak is rolling them out this week.

**Week-on-week figures**
- The change shown under each box compares this week with last week, both as they read today.

### Week-on-week table (bottom left)

- Rows are the last three weeks: billable, chargeable, non-chargeable, util, and first reported.
- **First reported** is what the week showed when first published. Weeks restate upward as staff back-fill time, so the table shows how far each has moved.
- First-reported values are stored in the JSON. They can't be re-pulled.

### Partners table

- Partners are matched on **`integration_level_3`**, not on ticket subject.
- Columns:
  - Commission Jan–Sep: from the Premium Partner Commissions 2026 sheet
  - Q4 hours
  - Unrecognised revenue
- Name map:

| Integration Level 3 value | Partner name |
|---|---|
| Seven Rooms | 7Rs (SevenRooms) |
| Zeller Pay @ Table | Zeller |
| Hungry Hungry | HungryHungry |
| Now Book It Gift Cards | NowBookIt |

- H&L Pay commission shows **$0**, not "separate".

### Key accounts table

- These are customers where the cost is built into the engagement ("work Rodney does").
- Grouping is a regex over company name plus ticket subject:

| Account | Pattern |
|---|---|
| AVC | `\bAVC\b` |
| Solotel | `Solotel` |
| Trader House | `\bTH -\|Stokehouse\|Trader House` |
| Lucas Collective | `\bLC -\|Lucas Collective` |
| Perks Hospitality | `Perks` |
| HHG | `HHG` |
| BRG | `\bBRG\b` |
| Locals Co | `Locals Co` |
| Liquor Barons | `\bLB\b\|Liquor Baron` |

- Ticket 283985380831, "UPGRADES - AVC 9.2 Upgrades" (18h, owner Joshua), is linked to the company "H&L", not AVC. It is **forced into AVC**.
- The AVC upgrades are non-chargeable. HubSpot now reads `chargeable = No` (corrected 25 Oct), so the earlier override is removed.

### Unrecognised revenue

- = non-chargeable hours × **$150**. Shows "—" when there are no non-chargeable hours.
- Chargeable hours (including blank) count as recognised: if it's charged, it's recognised.

### P&L chart (Jan–Sep)

- From the Finance PS P&L sheet. Revenue and cost are bars; contribution (revenue − cost) is the line.

| | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep |
|---|---|---|---|---|---|---|---|---|---|
| Revenue | 24,452 | 27,867 | 30,164 | 23,947 | 32,107 | 32,610 | 35,340 | 66,642 | 20,359 |
| Cost | 56,087 | 63,765 | 75,839 | 69,343 | 60,274 | 60,368 | 60,240 | 50,403 | 65,362 |

- Headline: PS is $268k short on its P&L while partners paid H&L $1.29M in commission.

### WC 19 Oct figures as published (re-pulled 26 Oct)

| | 5–11 Oct | 12–18 Oct | 19–25 Oct |
|---|---|---|---|
| Billable hours | 35.25 | 60.02 | **13.5** |
| Chargeable | 17.25 | 59.02 | **10.5** (78%) |
| Non-chargeable | 18.0 | 1.0 | **3.0** (22%) |
| Available | 342 | 304 | **288.8** |
| Billable utilisation | 10.3% | 19.7% | **4.7%** |
| First reported | 21.25 | 39.45 | 11.5 |

**Q4 hidden work:** 22h = $3,300.
- AVC 9.2 upgrades: 18h.
- Four H&L Pay activations: 4h. They are Beauford, Marlin, Terminus Morgan and Star Hotel Milton.
- Only Beauford and Marlin have H&L Pay in Integration Level 3, so the partner table shows H&L Pay at 2h, $300.

**Key accounts, Q4 hours:**

| Account | Hours | Split |
|---|---|---|
| AVC | 21.5 | 3.5 chargeable, 18 non-chargeable |
| Perks | 10.0 | |
| Solotel | 7.0 | |
| Trader House | 3.5 | |
| Locals Co | 3.5 | |
| HHG | 3.5 | |
| Lucas Collective | 3.0 | |
| Liquor Barons | 2.5 | |
| BRG | 2.07 | |

### Known data issues (PS)

- **Work orders on the wrong record.** Work orders logged on Deals, Tasks or PS records instead of the Ticket don't roll up to `actual_hours`. This is why Greg's and others' hours go missing (PS Weekly, 26 Oct).
- **Hours always restate upward.** Re-pull every week shown; never reuse last week's numbers.
- **Integration Level 3 is often blank**, so partner hours are understated.

---

## 4. Support slide — Backlog

**Scope:** the Support pipeline (`0`) only. PS pipelines are excluded.

### Weekly new vs closed (chart, about 6 months)

- **New** = tickets created in the Sydney week.
- **Closed** = tickets with `closed_date` in the Sydney week.
- **Net** = new − closed. All three share one axis (bars for new and closed, a line for net, no dual axis).
- 7 Sep is excluded: a cutover artefact.
- Exact counts use `search_crm_objects`:
  ```
  hs_pipeline EQ 0, createdate BETWEEN <weekStartMs> AND <nextWeekStartMs-1>    -> total = new
  hs_pipeline EQ 0, closed_date BETWEEN <weekStartMs> AND <nextWeekStartMs-1>   -> total = closed
  ```
- For history: `SELECT DATE_TRUNC(createdate,'WEEK'), COUNT(*) … GROUP BY …`, and the same with `closed_date` plus stage `3484913083`.

### KPI boxes

Each box shows this week against last week.

**Open backlog**
- Count where `hs_pipeline_stage != '3484913083'`, taken at the end of the week.
- Live: `SELECT hs_pipeline_stage, COUNT(*) … GROUP BY hs_pipeline_stage`.
- As at a past date: tickets created before it that are either still open or closed after it.

**Voice : Email**
- New tickets in the week by `source_type`, PHONE ÷ EMAIL.
- `SELECT DATE_TRUNC(createdate,'WEEK'), source_type, COUNT(*) …`

**Median ticket age**
- Median of `createdate` across all open tickets, expressed as days before the end of the week.

**Avg first response**
- `AVG(time_to_first_agent_reply)` for tickets created in the week with a value (milliseconds → hours).
- Only email-answered tickets carry a value. Phone and AI-agent tickets don't, so the base is thin (55 of 395).

**Avg time to close**
- `AVG(time_to_close)` for tickets closed in the week (milliseconds → days).
- The median is in the notes but not shown. The user wanted the average.

**CSAT** has been removed. All CSAT surveys were inactive, so there are zero responses. Youssef is re-enabling them.

### "Where the open sit" box

- Open tickets by stage (New / In Progress / Pending Internal / Pending External), with a composition bar.
- It sits above the AI summary.

### WC 19 Oct figures as published

| KPI | This week | Last week |
|---|---|---|
| Open backlog (as at Sun 25 Oct) | **389** | 588 |
| New | 395 | 561 |
| Closed | 595 | 608 |
| Net | −200 | |
| Voice : email | 2.2 : 1 (261 / 120 / 16 other) | 3.2 : 1 |
| Median ticket age | 31 days | 27 |
| Avg first response | 14.7 hrs (median 12.1) | 46.8 |
| Avg time to close | 14.0 days (median 2.1) | 8.6 |

- Open by stage (25 Oct): New 280 · In Progress 60 · Pending Internal 10 · Pending External 39.
- Live on 27 Oct: 278 / 58 / 13 / 29.
- On 19 Oct, 54 old September voice tickets were bulk-closed within one minute. This inflates closed and average time to close; disclose it.
- First published 396 new / 597 closed; re-pulled 395 / 595 (merges).

### Known data issues (Support)

- **Pending External** doesn't auto-close tickets; the workflow is broken (HubSpot Enhancement Weekly, 23 Oct).
- **AI drafts** reply only to the primary contact, not people on CC.
- **Freshdesk shuts down on 30 Nov.** The customer knowledge base must be live in HubSpot by then.

---

## 5. Weekly refresh checklist

1. Copy last week's JSON to `data/wc-YYYY-MM-DD.json` and set `generated` and the week labels.
2. Ask the user for **PS leave and sick days** for the week, then recompute available hours.
3. **PS:**
   - Re-pull PS tickets from 1 Oct onward.
   - Recompute all three week-on-week rows.
   - Keep each week's "first reported" figure.
   - Recompute the partner and key-account tables, and Q4 hidden work.
4. **Support:**
   - Get exact new and closed counts for the new week.
   - Append it to `weeks` and drop the oldest week (keep about 6 months).
   - Recompute open count, median age, first response, time to close, voice:email and stages.
5. Update the AI summary bullets and `execSummary.ps` and `execSummary.support`.
6. Build, then render slides 7 (PS) and 9 (Support) to PNG and check for overflow:
   ```
   soffice --headless --convert-to pdf; pdftoppm -f N -l N -png
   ```
7. Commit and push to `claude/leadership-reporting-safety-net-ghta1h`, then fast-forward `main`.
