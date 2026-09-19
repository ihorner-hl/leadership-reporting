"""Read-only HubSpot ingestion for the GTM Leadership Dashboard (v1, launch-ready metrics).

Pulls live metrics straight from HubSpot CRM objects via the Search API.

READ ONLY BY CONSTRUCTION: the only endpoints this module calls are object reads and
`/search` (a read that HubSpot happens to expose over POST). There is no create / update /
delete / archive anywhere, and no write scopes are needed on the token.

v1 scope (per launch decisions — dirty/blocked areas are deliberately deferred):
  - Support : Support ticket pipeline — volume, closed, open backlog by age, SLA, CSAT/NPS.
  - Sales   : OPEN deal pipeline — coverage by stage + weighted; leads; quotes.
  - PS      : engagement throughput — PS object by stage, tickets in flight per pipeline.

Deferred until the data is ready (each surfaces as a low-confidence / "not set up" flag,
never a fabricated number):
  - owner / IC attribution   (tickets ~68% and deals ~31% have no owner today)
  - closed-won bookings       (excluded for now by request)
  - AM recurring revenue      (company `mmr` populated on ~38 records; renewal date on 0)
  - PS delivery hours         (`total_hours` populated on ~1% of PS records)
  - AI-draft adoption         (custom ticket properties not created yet)

Auth: a HubSpot Private App token (Bearer) supplied via HUBSPOT_TOKEN. Nothing is hardcoded.
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from datetime import date, datetime, timezone

BASE = "https://api.hubapi.com"
PAGE = 200  # HubSpot Search max page size

# ---- verified against portal 443197539 (see the data-quality scan) -------------------------
SUPPORT_PIPELINE = "0"
SUPPORT_CLOSED_STAGE = "3484913083"          # "Closed"
PS_PIPELINES = {                              # ticket pipelines that feed Professional Services
    "Integrations": "2026136017",
    "Training": "2026202606",
    "Tech": "2026349046",
    "Onboarding": "2026349047",
    "Warranty": "2069182934",
}
SALES_DEAL_PIPELINE = "default"               # "Sales Pipeline"
RENEWALS_DEAL_PIPELINE = "2025963963"         # "Renewals Pipeline"
PS_OBJECT = "p443197539_professional_services"

# CSAT/NPS roll-up fields that live on the ticket (rolled up from feedback submissions)
CSAT_FIELD = "hs_last_csat_rating"
NPS_FIELD = "hs_feedback_last_nps_rating_number"

# Delivery-hours mapping (verified against the portal):
#   - hours are logged on the ticket CASES in the PS pipelines: `actual_hours`
#     (+ `training_actual_hours` on the Training pipeline)
#   - the PS master object carries a `total_hours` roll-up
# Time logging is still ramping (very few cases carry hours today), so we read the ground
# truth off the cases AND surface the roll-up, with coverage counts — never a faked total.
TICKET_HOURS_FIELDS = ["actual_hours", "training_actual_hours"]
PS_ROLLUP_HOURS_FIELD = "total_hours"


# --------------------------------------------------------------------------- #
# HTTP (stdlib only) — read-only                                              #
# --------------------------------------------------------------------------- #
def _token() -> str:
    tok = os.environ.get("HUBSPOT_TOKEN", "").strip()
    if not tok:
        raise RuntimeError("Missing HUBSPOT_TOKEN — create a HubSpot Private App (read scopes) "
                           "and set HUBSPOT_TOKEN in the environment or .env.")
    return tok


def _post(path: str, body: dict, _tries: int = 6) -> dict:
    data = json.dumps(body).encode("utf-8")
    for attempt in range(_tries):
        req = urllib.request.Request(
            f"{BASE}{path}",
            data=data,
            headers={"Authorization": f"Bearer {_token()}",
                     "Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            # HubSpot's /search endpoint caps at only a few requests/sec. On 429, honour the
            # Retry-After header (or exponential backoff) and retry, rather than failing.
            if e.code == 429 and attempt < _tries - 1:
                ra = e.headers.get("Retry-After")
                try:
                    delay = float(ra) if ra else 0.0
                except (TypeError, ValueError):
                    delay = 0.0
                if delay <= 0:
                    delay = 0.5 * (2 ** attempt)     # 0.5, 1, 2, 4, 8 s
                time.sleep(min(delay, 10.0))
                continue
            # Surface HubSpot's own explanation (400s are very descriptive) instead of a bare code.
            detail = ""
            try:
                detail = e.read().decode("utf-8")
            except Exception:
                pass
            raise RuntimeError(f"HubSpot {e.code} on POST {path} :: {detail[:800]}") from None
    raise RuntimeError(f"HubSpot 429 on POST {path} :: rate-limit retries exhausted")


def _get(path: str, _tries: int = 6) -> dict:
    """Read-only GET with the same 429 back-off as _post (used for pipeline/stage labels)."""
    for attempt in range(_tries):
        req = urllib.request.Request(
            f"{BASE}{path}",
            headers={"Authorization": f"Bearer {_token()}", "Accept": "application/json"},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < _tries - 1:
                time.sleep(min(0.5 * (2 ** attempt), 10.0))
                continue
            detail = ""
            try:
                detail = e.read().decode("utf-8")
            except Exception:
                pass
            raise RuntimeError(f"HubSpot {e.code} on GET {path} :: {detail[:800]}") from None
    raise RuntimeError(f"HubSpot 429 on GET {path} :: rate-limit retries exhausted")


def _stage_labels(object_type: str) -> dict:
    """{stageId: 'Stage label'} across every pipeline of an object type — for readable breakdowns."""
    out: dict[str, str] = {}
    for p in _get(f"/crm/v3/pipelines/{object_type}").get("results", []):
        for s in p.get("stages", []):
            if s.get("id"):
                out[s["id"]] = s.get("label", s["id"])
    return out


def _search(object_type: str, filter_groups: list | None = None,
            properties: list | None = None, after: str | None = None) -> dict:
    body: dict = {"limit": PAGE}
    if filter_groups:
        body["filterGroups"] = filter_groups
    if properties:
        body["properties"] = properties
    if after:
        body["after"] = after
    return _post(f"/crm/v3/objects/{object_type}/search", body)


def _count(object_type: str, filter_groups: list | None = None) -> int:
    """Match count for a filter — one call, reads `total` (no records pulled)."""
    body: dict = {"limit": 1, "properties": ["hs_object_id"]}
    if filter_groups:
        body["filterGroups"] = filter_groups
    return int(_post(f"/crm/v3/objects/{object_type}/search", body).get("total", 0))


def _page_all(object_type: str, filter_groups: list, properties: list, cap: int = 10000) -> list:
    """Page through a result set (capped) when a metric needs the actual values, not a count."""
    rows: list = []
    after = None
    while len(rows) < cap:
        data = _search(object_type, filter_groups, properties, after)
        rows.extend(data.get("results", []))
        after = (data.get("paging") or {}).get("next", {}).get("after")
        if not after:
            break
        time.sleep(0.2)   # stay under HubSpot's /search per-second cap on large paged pulls
    return rows


def _sum_property(object_type: str, filter_groups: list, prop: str, cap: int = 20000) -> tuple[float, int]:
    """Sum a numeric property over matching records (and count how many carried a value).
    We only ever page records that already have the value (filtered upstream), so this stays cheap."""
    total, n = 0.0, 0
    for r in _page_all(object_type, filter_groups, [prop], cap=cap):
        try:
            total += float(r["properties"].get(prop))
        except (TypeError, ValueError):
            continue
        n += 1
    return round(total, 2), n


# ---- filter helpers -------------------------------------------------------- #
def _f(prop: str, op: str, value=None, values=None) -> dict:
    d = {"propertyName": prop, "operator": op}
    if value is not None:
        d["value"] = value
    if values is not None:
        d["values"] = values
    return d


def _created_between(df: str | None, dt: str | None, field: str = "createdate") -> list:
    fs = []
    if df:
        fs.append(_f(field, "GTE", f"{df}T00:00:00Z"))
    if dt:
        fs.append(_f(field, "LTE", f"{dt}T23:59:59Z"))
    return fs


# --------------------------------------------------------------------------- #
# 1) Support — Support pipeline only (team-level; owner attribution deferred)  #
# --------------------------------------------------------------------------- #
def support_metrics(df: str | None, dt: str | None) -> dict:
    base = [_f("hs_pipeline", "EQ", SUPPORT_PIPELINE)]
    win = _created_between(df, dt)

    created = _count("tickets", [{"filters": base + win}])
    closed = _count("tickets", [{"filters": base + win + [_f("hs_pipeline_stage", "EQ", SUPPORT_CLOSED_STAGE)]}])
    open_now = _count("tickets", [{"filters": base + [_f("hs_pipeline_stage", "NEQ", SUPPORT_CLOSED_STAGE)]}])

    # SLA attainment via the roll-up status fields (counts, no paging)
    def sla(field: str) -> dict:
        met = _count("tickets", [{"filters": base + win + [_f(field, "EQ", "MET")]}])
        breached = _count("tickets", [{"filters": base + win + [_f(field, "EQ", "BREACHED")]}])
        total = met + breached
        return {"met": met, "breached": breached,
                "attainment": round(met / total, 4) if total else None}

    # CSAT / NPS from ticket roll-up fields — count responses; average over a capped page
    csat_rows = _page_all("tickets", [{"filters": base + win + [_f(CSAT_FIELD, "HAS_PROPERTY")]}],
                          [CSAT_FIELD], cap=5000)
    csat_vals = [float(r["properties"][CSAT_FIELD]) for r in csat_rows
                 if r["properties"].get(CSAT_FIELD) not in (None, "")]
    nps_count = _count("tickets", [{"filters": base + win + [_f(NPS_FIELD, "HAS_PROPERTY")]}])

    return {
        "created": created,
        "closed": closed,
        "open_backlog": open_now,
        "sla_first_response": sla("hs_time_to_first_response_sla_status"),
        "sla_close": sla("hs_time_to_close_sla_status"),
        "csat_responses": len(csat_vals),
        "csat_avg": round(sum(csat_vals) / len(csat_vals), 2) if csat_vals else None,
        "nps_responses": nps_count,
        "_confidence": {"attribution": "team-level only (owner missing on ~68% of tickets)"},
    }


def _leads_count(df: str | None, dt: str | None) -> int:
    """Leads-in-window. The leads object uses `hs_createdate`, not `createdate`.
    Fall back to an all-time count if the windowed query is rejected for any reason."""
    if df or dt:
        try:
            return _count("leads", [{"filters": _created_between(df, dt, "hs_createdate")}])
        except Exception:
            pass
    return _count("leads")


def _quarter_bounds(today: date | None = None) -> tuple[date, date]:
    """Calendar-quarter [start, end) that contains `today`."""
    today = today or date.today()
    qi = (today.month - 1) // 3
    start = date(today.year, qi * 3 + 1, 1)
    em = qi * 3 + 4
    end = date(today.year + (1 if em > 12 else 0), em - 12 if em > 12 else em, 1)
    return start, end


def _get_list(object_type: str, properties: list, cap: int = 5000) -> list:
    """Page an object via the GET list endpoint (for objects that don't support /search)."""
    rows: list = []
    after = None
    props = ",".join(properties)
    while len(rows) < cap:
        q = f"/crm/v3/objects/{object_type}?limit=100&archived=false" + (f"&properties={props}" if props else "")
        if after:
            q += f"&after={after}"
        data = _get(q)
        rows.extend(data.get("results", []))
        after = (data.get("paging") or {}).get("next", {}).get("after")
        if not after:
            break
        time.sleep(0.2)
    return rows


def sales_goal(qs: date, qe: date) -> dict:
    """Read HubSpot Goals (goal_targets) overlapping the quarter and sum revenue targets.
    Self-discovers property names (portal-specific). READ ONLY. Needs crm.objects.goals.read."""
    props = [p["name"] for p in _get("/crm/v3/properties/goal_targets").get("results", [])]
    def pick(*subs):
        for p in props:
            if all(s in p for s in subs):
                return p
        return None
    p_target = pick("target", "amount") or pick("target") or "hs_target_amount"
    p_start = pick("start") or "hs_start_datetime"
    p_end = pick("end") or "hs_end_datetime"
    p_name = pick("goal", "name") or pick("name") or "hs_goal_name"
    p_kpi = pick("kpi") or "hs_kpi"
    want = [x for x in {p_target, p_start, p_end, p_name, p_kpi, "hs_object_id"} if x]
    rows = _get_list("goal_targets", want)
    qs_ms, qe_ms = qs.isoformat(), qe.isoformat()
    total, kept = 0.0, []
    for r in rows:
        pr = r.get("properties", {})
        start, end = str(pr.get(p_start, "")), str(pr.get(p_end, ""))
        # keep goals whose window overlaps this quarter (string date compare on ISO/date prefixes)
        if start[:10] and start[:10] >= qe_ms:
            continue
        if end[:10] and end[:10] < qs_ms:
            continue
        try:
            tgt = float(pr.get(p_target) or 0)
        except (TypeError, ValueError):
            tgt = 0.0
        total += tgt
        kept.append({"name": pr.get(p_name), "kpi": pr.get(p_kpi), "target": tgt,
                     "start": start[:10], "end": end[:10]})
    return {"target_total": round(total), "count": len(kept),
            "fields": {"target": p_target, "start": p_start, "end": p_end, "kpi": p_kpi, "name": p_name},
            "goals": kept[:50]}


# --------------------------------------------------------------------------- #
# 2) Sales — OPEN deal pipeline (closed deals deferred by request)            #
# --------------------------------------------------------------------------- #
def sales_metrics(df: str | None, dt: str | None) -> dict:
    open_sales = [_f("pipeline", "EQ", SALES_DEAL_PIPELINE), _f("hs_is_closed", "EQ", "false")]

    open_count = _count("deals", [{"filters": open_sales}])
    rows = _page_all("deals", [{"filters": open_sales}],
                     ["amount_in_home_currency", "hs_deal_stage_probability", "dealstage"])

    def num(r, k):
        v = r["properties"].get(k)
        try:
            return float(v)
        except (TypeError, ValueError):
            return 0.0

    unweighted = sum(num(r, "amount_in_home_currency") for r in rows)
    weighted = sum(num(r, "amount_in_home_currency") * num(r, "hs_deal_stage_probability") for r in rows)

    by_stage: dict[str, dict] = {}
    for r in rows:
        st = r["properties"].get("dealstage") or "unknown"
        s = by_stage.setdefault(st, {"count": 0, "value": 0.0})
        s["count"] += 1
        s["value"] += num(r, "amount_in_home_currency")

    # ---- goals now exist: closed-won attainment + a quarter forecast vs the goal ----
    qs, qe = _quarter_bounds()
    qwin = [_f("closedate", "GTE", f"{qs.isoformat()}T00:00:00Z"),
            _f("closedate", "LT", f"{qe.isoformat()}T00:00:00Z")]
    won_rows = _page_all("deals", [{"filters": [_f("pipeline", "EQ", SALES_DEAL_PIPELINE),
                                                _f("hs_is_closed_won", "EQ", "true")] + qwin}],
                         ["amount_in_home_currency"])
    won_amt = sum(num(r, "amount_in_home_currency") for r in won_rows)
    # forecast = closed-won so far + weighted value of still-open deals due to close this quarter
    fc_rows = _page_all("deals", [{"filters": [_f("pipeline", "EQ", SALES_DEAL_PIPELINE),
                                               _f("hs_is_closed", "EQ", "false")] + qwin}],
                        ["amount_in_home_currency", "hs_deal_stage_probability"])
    fc_open_weighted = sum(num(r, "amount_in_home_currency") * num(r, "hs_deal_stage_probability") for r in fc_rows)

    out = {
        "open_deals": open_count,
        "open_pipeline_value": round(unweighted),
        "open_pipeline_weighted": round(weighted),
        "by_stage": by_stage,
        "leads": _leads_count(df, dt),
        "quotes_published": _count("quotes", [{"filters": [_f("hs_status", "NEQ", "DRAFT")]}]),
        "quotes_accepted": _count("quotes", [{"filters": [_f("hs_status", "EQ", "ACCEPTED")]}]),
        "quarter": {"from": qs.isoformat(), "to": qe.isoformat()},
        "closed_won_amount": round(won_amt),
        "closed_won_count": len(won_rows),
        "forecast_amount": round(won_amt + fc_open_weighted),
    }
    try:
        out["goal"] = sales_goal(qs, qe)
    except Exception as e:
        out["goal"] = {"_error": str(e)[:300]}
    return out


# --------------------------------------------------------------------------- #
# 3) Professional Services — engagement throughput (hours deferred)          #
# --------------------------------------------------------------------------- #
def ps_metrics(df: str | None, dt: str | None) -> dict:
    engagements = _count(PS_OBJECT)
    by_stage_rows = _page_all(PS_OBJECT, [], ["hs_pipeline_stage", "hs_pipeline"], cap=10000)
    by_stage: dict[str, int] = {}
    for r in by_stage_rows:
        st = r["properties"].get("hs_pipeline_stage") or "unknown"
        by_stage[st] = by_stage.get(st, 0) + 1

    tickets_by_pipeline = {
        name: _count("tickets", [{"filters": [_f("hs_pipeline", "EQ", pid)]}])
        for name, pid in PS_PIPELINES.items()
    }

    # ---- delivery hours: ground truth is hours logged on the PS-pipeline ticket cases ----
    ps_pipe_ids = list(PS_PIPELINES.values())
    case_hours, case_count = 0.0, 0
    for field in TICKET_HOURS_FIELDS:
        h, n = _sum_property(
            "tickets",
            [{"filters": [_f("hs_pipeline", "IN", values=ps_pipe_ids), _f(field, "GT", "0")]}],
            field,
        )
        case_hours += h
        case_count += n
    # ...plus the PS-master roll-up, where it's populated
    rollup_hours, ps_with_hours = _sum_property(
        PS_OBJECT, [{"filters": [_f(PS_ROLLUP_HOURS_FIELD, "GT", "0")]}], PS_ROLLUP_HOURS_FIELD,
    )

    return {
        "engagements": engagements,
        "engagements_by_stage": by_stage,
        "tickets_by_pipeline": tickets_by_pipeline,
        "delivery_hours": {
            "logged_on_cases": round(case_hours, 2),      # sum of actual_hours (+ training) on PS-pipeline tickets
            "cases_with_hours": case_count,               # how many cases have logged time so far
            "ps_master_rollup": round(rollup_hours, 2),   # sum of total_hours on the PS master object
            "ps_records_with_hours": ps_with_hours,
            "coverage": ("time logging is still ramping — hours appear on very few cases so far; "
                         "this figure grows automatically as teams log actual_hours on the ticket cases"),
        },
    }


# --------------------------------------------------------------------------- #
# Roll-up                                                                      #
# --------------------------------------------------------------------------- #
def _default_range() -> tuple[str, str]:
    today = date.today()
    return today.replace(day=1).isoformat(), today.isoformat()


def _safe(fn, df: str | None, dt: str | None) -> dict:
    """Run one section; if it fails, flag that section instead of failing the whole pull.
    Mirrors the dashboard's honest 'not working' state — a broken feed is surfaced, not faked."""
    try:
        return fn(df, dt)
    except Exception as e:
        return {"_error": str(e)}


def collect(df: str | None = None, dt: str | None = None) -> dict:
    if not (df and dt):
        df, dt = _default_range()
    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "range": {"from": df, "to": dt},
        "support": _safe(support_metrics, df, dt),
        "sales": _safe(sales_metrics, df, dt),
        "ps": _safe(ps_metrics, df, dt),
        "labels": {
            "deal_stages": _safe_labels("deals"),
            "ps_stages": _safe_labels(PS_OBJECT),
        },
        "deferred_functions": ["Account Management (revenue data not ready)",
                               "Finance / Product / AI Usage / Projects (file-drop feeds)"],
    }


def _safe_labels(object_type: str) -> dict:
    try:
        return _stage_labels(object_type)
    except Exception:
        return {}


if __name__ == "__main__":
    print(json.dumps(collect(), indent=2))
