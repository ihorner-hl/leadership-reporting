# GTM Leadership Dashboard — HubSpot ingestion (v1)

Live, **read-only** data layer for the leadership dashboard. It pulls metrics straight from
HubSpot CRM objects via the Search API and serves them as JSON to the dashboard UI.

> **Read only.** The only HubSpot calls are object reads and `/search`. There are no
> create/update/delete calls anywhere, and the Private App needs **no write scopes**.

## Run it

```bash
# from this folder — Python 3.11+, standard library only (no pip install)
cp .env.example .env          # then paste your HubSpot Private App token into HUBSPOT_TOKEN
python3 serve.py
```

Open <http://localhost:8792>. `GET /api/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD` returns the
aggregated JSON; the default window is month-to-date.

## What it computes (v1 — launch-ready only)

Scoped to what the live data supports today (see the data-quality scan). Everything is
**team-level**, not owner/IC-level.

| Function | Source | Metrics |
|----------|--------|---------|
| **Support** | Tickets — Support pipeline (`0`) | created, closed, open backlog, SLA attainment (first-response + close), CSAT avg + response counts, NPS responses |
| **Sales** | Deals — open Sales pipeline | open pipeline value + weighted, by stage; leads; quotes sent |
| **Professional Services** | PS custom object + 5 ticket pipelines | active engagements, engagements by stage, tickets in flight per pipeline |

## Deliberately deferred (data not ready — shown as low-confidence / "not set up", never faked)

| Deferred | Why (from the live scan) |
|----------|--------------------------|
| Owner / IC attribution | owner missing on ~68% of tickets and ~31% of deals (mostly system/auto records) |
| Closed-won bookings | excluded for now by request |
| Account Management revenue | company `mmr` populated on ~38 records; `hs_next_renewal_date` on 0 |
| PS delivery hours | `total_hours` populated on ~1% of PS records — time not reported yet |
| AI-draft adoption | custom ticket properties not created yet |

## How dirty data is handled

The dashboard's design already carries **confidence dots** and **"not set up / not working"**
states. The ingestion layer's job is to *feed those honestly*: it reports coverage and counts,
excludes system records where noted, and never invents a number for a field that isn't
populated. Launch shows the trustworthy metrics and flags the rest.

## Files

```
metrics.py     HubSpot read-only pulls + aggregation (verified pipeline IDs / fields inside)
serve.py       local stdlib server + /api/metrics
index.html     the dashboard UI  (to be added — the published design)
.env.example   token template — copy to .env (gitignored)
```
