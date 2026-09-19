# Exec Deck — weekly generator (cutover safety net)

Produces the **H&L Weekly Update** (4-chapter exec deck: SELL / DELIVER / KEEP / BUILD)
in the established house style, from a per-week data file. Built as the stop-gap while
leadership reporting moves from Creatio to HubSpot (go-live 8 Sep 2026).

## Run it

```bash
cd exec-deck
npm install          # pptxgenjs only
node build_deck.js data/wc-2026-09-14.json
# → output/H&L Weekly Update - WC 14 Sep 2026.pptx
```

Upload the output to SharePoint:
`HL-Management / Shared Documents / Reporting / Executive Slide Output`.

## Weekly cycle

1. Copy last week's `data/wc-*.json` to the new week and update:
   - **HubSpot (live, read-only)** — support inflow/closed/backlog + age bands,
     unanswered (first-agent-reply null on open), Q3 pipeline (open deals with Q3
     `closedate`, `amount_in_home_currency`, weighted by `hs_deal_stage_probability`),
     closed-won / lost, won & created this week, AI agent counts by ticket
     `ai_draft_status` on tickets closed in the week, PS pipeline volumes and
     `actual_hours` coverage. IDs/fields are the verified set in
     `New Reporting/metrics.py` and `HANDOFF.md` §4.
   - **File drops** (`HL-Management / Shared Documents / Reporting / Weekly File Drop`):
     Sysnet weekly sales extract (hardware by AM from the "Rev Group Summary by
     Account Manager" block), Q3 Roadmap & GTM Tracker, Claude Admin capture,
     ValPay export + identification register, Finance Weekly Invoicing register.
2. `node build_deck.js data/wc-<date>.json`, eyeball every slide, ship.

## Rules the deck must keep (HANDOFF.md §7)

- **No number without provenance** — every slide carries a source pill; anything not
  refreshed this week is labelled "as at <date> · refresh pending".
- **Never fabricate** — a feed that isn't ready renders "not set up" (e.g. PS
  utilisation until HubSpot time logging reaches coverage), not an estimate.
- **Pace against the clock** — bars carry the quarter/month pace tick.
- **Cutover flags** — slides whose source moved to HubSpot carry the terracotta
  `CUTOVER · NOW HUBSPOT` chip; WoW comparisons crossing 8 Sep are basis changes.
  Slide 3 (the cutover register) is a one-period special: drop it once the sources
  settle.

## Files

- `build_deck.js` — layout + house style (navy/teal/terracotta/gold, Poppins).
- `data/wc-2026-09-14.json` — the week's numbers **with provenance notes**; the
  auditable record of what was reported and from where.
- `reference/` — the pre-cutover template deck (visual reference).
- `output/` — generated decks.
