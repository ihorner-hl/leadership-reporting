/**
 * H&L Weekly Executive Deck — stop-gap generator (Creatio → HubSpot cutover period).
 *
 * Reads a weekly data file (data/wc-YYYY-MM-DD.json) and renders the 4-chapter deck
 * (SELL / DELIVER / KEEP / BUILD) in the established H&L house style:
 * Poppins · navy #12293A · teal #2C8394 · terracotta #B4552D · gold #C88A2E · green #3D8F5F.
 *
 * Design ethos (per HANDOFF.md §7): pace against the clock, no number without provenance,
 * and honest "not set up / not working / as at <date>" states — never a fabricated number.
 *
 * Usage:  node build_deck.js [data/wc-2026-09-14.json]
 */

const fs = require("fs");
const path = require("path");
const PptxGenJS = require("pptxgenjs");

const dataPath = process.argv[2] || path.join(__dirname, "data", "wc-2026-09-14.json");
const D = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// ---- tokens -----------------------------------------------------------------
const NAVY = "12293A", TEAL = "2C8394", TERRA = "B4552D", GOLD = "C88A2E", GREEN = "3D8F5F";
const BG = "F2F6F8", CARD = "FFFFFF", MUTED = "5E7280", FAINT = "8FA1AC", TRACK = "E2EAEE";
const TEAL_DK = "1C5765", TEAL_LT = "6FAEBB", TEAL_PALE = "E4F1F4", NA_GRAY = "C7D3DA";
const FONT = "Poppins";
const PAGEW = 13.33, PAGEH = 7.5;
const CHAPTER = { 1: TEAL, 2: GREEN, 3: GOLD, 4: NAVY };
const CHAPTER_LABEL = { 1: "DID WE SELL?", 2: "DID WE DELIVER?", 3: "DID WE KEEP THEM?", 4: "BUILDING THE FUTURE?" };

const pres = new PptxGenJS();
pres.defineLayout({ name: "WIDE", width: PAGEW, height: PAGEH });
pres.layout = "WIDE";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

const fmtK = (n) => (n == null ? "—" : "$" + Math.round(n / 1000) + "k");
const fmt$ = (n) => (n == null ? "—" : "$" + Math.round(n).toLocaleString("en-AU"));
const pct = (a, b) => Math.round((a / b) * 100);

function shadow() { return { type: "outer", color: "9AAAB5", blur: 6, offset: 2, angle: 90, opacity: 0.35 }; }

function card(s, x, y, w, h, fill = CARD) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.07, fill: { color: fill }, line: { type: "none" }, shadow: shadow() });
}

function motif(s, cx, cy, scale = 1) {
  const rings = [[0.46, TEAL_DK], [0.355, TEAL], [0.25, TEAL_LT], [0.145, TEAL_PALE]];
  rings.forEach(([r, c]) => {
    const rr = r * scale;
    s.addShape("ellipse", { x: cx - rr, y: cy - rr, w: rr * 2, h: rr * 2, fill: { color: c }, line: { type: "none" } });
  });
}

function header(s, title, dept, chapter, opts = {}) {
  s.background = { color: BG };
  s.addShape("rect", { x: 0, y: 0, w: PAGEW, h: 0.92, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("roundRect", { x: 0.42, y: 0.17, w: 0.8, h: 0.58, rectRadius: 0.09, fill: { color: CARD }, line: { type: "none" } });
  s.addText("H&L", { x: 0.42, y: 0.17, w: 0.8, h: 0.58, align: "center", valign: "middle", fontFace: FONT, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText(title, { x: 1.42, y: 0.06, w: 7.9, h: 0.52, fontFace: FONT, fontSize: 23, bold: true, color: "FFFFFF", isTextBox: true, margin: 0, valign: "middle" });
  if (dept) s.addText(dept, { x: 1.44, y: 0.56, w: 7.7, h: 0.28, fontFace: FONT, fontSize: 10.5, color: TEAL_LT, isTextBox: true, margin: 0 });
  const pillY = opts.cutover ? 0.09 : 0.27;
  if (chapter) {
    const pillFill = chapter === 4 ? "24435C" : CHAPTER[chapter];
    s.addShape("roundRect", { x: 9.5, y: pillY, w: 2.15, h: 0.38, rectRadius: 0.19, fill: { color: pillFill }, line: { color: "FFFFFF", width: 0.75, transparency: 55 } });
    s.addText(`${chapter}  ·  ${CHAPTER_LABEL[chapter]}`, { x: 9.5, y: pillY, w: 2.15, h: 0.38, align: "center", valign: "middle", fontFace: FONT, fontSize: 8.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  }
  if (opts.cutover) {
    s.addShape("roundRect", { x: 9.5, y: 0.53, w: 2.15, h: 0.34, rectRadius: 0.17, fill: { color: TERRA }, line: { type: "none" } });
    s.addText("CUTOVER · NOW HUBSPOT", { x: 9.5, y: 0.53, w: 2.15, h: 0.34, align: "center", valign: "middle", fontFace: FONT, fontSize: 7.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  }
  motif(s, 12.35, 0.46, 1);
}

function sourcePill(s, text) {
  const full = "Source: " + text;
  const w = Math.min(0.3 + full.length * 0.068, 6.4);
  s.addShape("roundRect", { x: PAGEW - 0.45 - w, y: 7.12, w, h: 0.28, rectRadius: 0.13, fill: { color: NAVY }, line: { type: "none" } });
  s.addText(full, { x: PAGEW - 0.45 - w, y: 7.12, w, h: 0.28, align: "center", valign: "middle", fontFace: FONT, fontSize: 7, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
}

function footnote(s, text, y = 7.12) {
  s.addText(text, { x: 0.45, y, w: 8.3, h: 0.28, fontFace: FONT, fontSize: 7.5, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });
}

function kpi(s, x, y, w, h, label, value, sub, valColor = NAVY, valSize = 26) {
  card(s, x, y, w, h);
  s.addText(label, { x: x + 0.18, y: y + 0.1, w: w - 0.36, h: 0.3, fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  const subH = sub ? Math.min(0.46, h - 0.72) : 0;
  s.addText(value, { x: x + 0.16, y: y + 0.3, w: w - 0.32, h: Math.max(0.32, h - 0.34 - subH - 0.06), fontFace: FONT, fontSize: valSize, bold: true, color: valColor, isTextBox: true, margin: 0, valign: "middle" });
  if (sub) s.addText(sub, { x: x + 0.18, y: y + h - subH - 0.06, w: w - 0.36, h: subH, fontFace: FONT, fontSize: 7.8, color: MUTED, isTextBox: true, margin: 0, valign: "top" });
}

function cardTitle(s, x, y, text, w = 5) {
  s.addText(text, { x: x + 0.22, y: y + 0.12, w, h: 0.3, fontFace: FONT, fontSize: 12, bold: true, color: TEAL, isTextBox: true, margin: 0 });
}

function aiSummary(s, x, y, w, h, bullets, title = "AI SUMMARY") {
  card(s, x, y, w, h);
  cardTitle(s, x, y, title, w - 0.4);
  const runs = [];
  bullets.forEach((b, i) => {
    runs.push({ text: "•  ", options: { color: b.dot || TERRA, bold: true, fontSize: 9 } });
    if (b.lead) runs.push({ text: b.lead + " ", options: { color: NAVY, bold: true, fontSize: 9 } });
    runs.push({ text: b.text, options: { color: b.muted ? FAINT : "3A4B57", fontSize: 9, breakLine: true, paraSpaceAfter: 8 } });
  });
  s.addText(runs, { x: x + 0.22, y: y + 0.46, w: w - 0.45, h: h - 0.6, fontFace: FONT, isTextBox: true, margin: 0, valign: "top" });
}

function progressBar(s, x, y, w, attainPct, pacePct, fillColor = TERRA) {
  s.addShape("roundRect", { x, y, w, h: 0.11, rectRadius: 0.05, fill: { color: TRACK }, line: { type: "none" } });
  const fw = Math.max(0.06, Math.min(1, attainPct / 100) * w);
  s.addShape("roundRect", { x, y, w: fw, h: 0.11, rectRadius: 0.05, fill: { color: fillColor }, line: { type: "none" } });
  if (pacePct != null) {
    const px = x + Math.min(1, pacePct / 100) * w;
    s.addShape("rect", { x: px - 0.011, y: y - 0.05, w: 0.022, h: 0.21, fill: { color: NAVY }, line: { type: "none" } });
  }
}

function statusChip(s, x, y, w, text, color, textColor = "FFFFFF") {
  s.addShape("roundRect", { x, y, w, h: 0.32, rectRadius: 0.16, fill: { color }, line: { type: "none" }, shadow: shadow() });
  s.addText(text, { x, y, w, h: 0.32, align: "center", valign: "middle", fontFace: FONT, fontSize: 8.5, bold: true, color: textColor, isTextBox: true, margin: 0 });
}

// =============================================================================
// 1 · COVER
// =============================================================================
{
  const s = pres.addSlide();
  s.background = { color: NAVY };
  motif(s, 12.55, 0.55, 4.2);
  s.addShape("roundRect", { x: 0.95, y: 0.85, w: 1.15, h: 1.15, rectRadius: 0.16, fill: { color: CARD }, line: { type: "none" }, shadow: shadow() });
  s.addText("H&L", { x: 0.95, y: 0.85, w: 1.15, h: 1.15, align: "center", valign: "middle", fontFace: FONT, fontSize: 24, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("H&L Weekly Update", { x: 0.95, y: 3.0, w: 11.4, h: 1.15, fontFace: FONT, fontSize: 54, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  s.addText(D.week.label, { x: 0.98, y: 4.35, w: 9, h: 0.45, fontFace: FONT, fontSize: 18, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  s.addText("Generated: " + D.week.generated, { x: 0.98, y: 4.85, w: 9, h: 0.35, fontFace: FONT, fontSize: 11, color: TEAL_LT, isTextBox: true, margin: 0 });
  s.addShape("roundRect", { x: 0.98, y: 5.5, w: 5.0, h: 0.44, rectRadius: 0.22, fill: { color: TERRA }, line: { type: "none" } });
  s.addText("CUTOVER EDITION — FIRST DECK ON HUBSPOT SOURCES", { x: 0.98, y: 5.5, w: 5.0, h: 0.44, align: "center", valign: "middle", fontFace: FONT, fontSize: 9, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  s.addNotes("First weekly deck produced after the Creatio → HubSpot migration (live 8 Sep 2026). Slide 3 carries the cutover register; per-slide source pills carry the provenance.");
}

// =============================================================================
// 2 · AGENDA
// =============================================================================
{
  const s = pres.addSlide();
  header(s, "Agenda", null, null);
  const cards = [
    { n: 1, c: TEAL, t: "DID WE SELL?", st: "Sales & partner motion", items: ["Target vs Invoiced — sales team roll-up", "New Products — target vs traction", "H&L Pay — partner motion", "Sales Pipeline — Q3 FY26"] },
    { n: 2, c: GREEN, t: "DID WE DELIVER?", st: "From signed to billed", items: ["Utilisation & Delivery Hours", "Won vs Invoiced & Retention"] },
    { n: 3, c: GOLD, t: "DID WE KEEP THEM?", st: "Support health", items: ["Backlog, ageing & first response", "AI Support Agent"] },
    { n: 4, c: NAVY, t: "BUILDING THE FUTURE?", st: "Product, AI & projects", items: ["Q3 Roadmap · GTM Readiness", "AI Usage — adoption & activity", "Projects — portfolio status"] },
  ];
  cards.forEach((cfg, i) => {
    const x = 0.45 + i * 3.17, y = 1.5, w = 2.92, h = 4.9;
    s.addShape("rect", { x, y, w, h: 0.09, fill: { color: cfg.c }, line: { type: "none" } });
    card(s, x, y + 0.09, w, h - 0.09);
    s.addShape("ellipse", { x: x + w / 2 - 0.34, y: y + 0.55, w: 0.68, h: 0.68, fill: { color: cfg.c }, line: { type: "none" }, shadow: shadow() });
    s.addText(String(cfg.n), { x: x + w / 2 - 0.34, y: y + 0.55, w: 0.68, h: 0.68, align: "center", valign: "middle", fontFace: FONT, fontSize: 22, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
    s.addText(cfg.t, { x: x + 0.1, y: y + 1.4, w: w - 0.2, h: 0.35, align: "center", fontFace: FONT, fontSize: 13.5, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(cfg.st, { x: x + 0.1, y: y + 1.75, w: w - 0.2, h: 0.3, align: "center", fontFace: FONT, fontSize: 10, bold: true, color: cfg.c === NAVY ? FAINT : cfg.c, isTextBox: true, margin: 0 });
    s.addShape("roundRect", { x: x + w / 2 - 0.35, y: y + 2.12, w: 0.7, h: 0.055, rectRadius: 0.02, fill: { color: TRACK }, line: { type: "none" } });
    s.addText(cfg.items.map((it, j) => ({ text: it, options: { bullet: j >= 0 ? { code: "2022" } : false, color: "3A4B57", fontSize: 9.5, breakLine: true, paraSpaceAfter: 10 } })),
      { x: x + 0.22, y: y + 2.35, w: w - 0.44, h: h - 2.6, fontFace: FONT, isTextBox: true, margin: 0, valign: "top" });
  });
}

// =============================================================================
// 3 · REPORTING CUTOVER (one-week special)
// =============================================================================
{
  const s = pres.addSlide();
  header(s, "Reporting Cutover — Creatio → HubSpot", "All teams · this week's deck reads from the new sources", null);
  const kY = 1.08, kH = 1.12;
  kpi(s, 0.45, kY, 3.9, kH, "CREATIO EXTRACTS ENDED", "4 Sep", "last case / task / work-order export — history frozen", NAVY, 22);
  kpi(s, 4.55, kY, 3.9, kH, "HUBSPOT LIVE", "8 Sep", "support, sales & PS now read live from the portal", TEAL, 22);
  kpi(s, 8.65, kY, 4.23, kH, "THIS DECK", "1st on new sources", "WC 7 Sep deck skipped in the cutover — deltas flagged where they bridge two weeks", TERRA, 14);

  const tY = 2.36, rowH = 0.61;
  card(s, 0.45, tY, 12.43, rowH * D.cutover.register.length + 0.42);
  s.addText([
    { text: "AREA", options: { color: TEAL, bold: true, fontSize: 8.5 } },
  ], { x: 0.67, y: tY + 0.08, w: 2.5, h: 0.25, fontFace: FONT, isTextBox: true, margin: 0 });
  s.addText("OLD → NEW", { x: 3.25, y: tY + 0.08, w: 3.4, h: 0.25, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText("STATUS", { x: 6.75, y: tY + 0.08, w: 1.3, h: 0.25, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText("WHAT IT MEANS FOR THE NUMBERS", { x: 8.2, y: tY + 0.08, w: 4.4, h: 0.25, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  const chipColor = { "LIVE": GREEN, "UPGRADE": TEAL, "BASIS CHANGE": GOLD, "LAGGED": GOLD, "NOT SET UP": TERRA, "AS BEFORE": "8CA0AC" };
  D.cutover.register.forEach((r, i) => {
    const y = tY + 0.38 + i * rowH;
    if (i > 0) s.addShape("rect", { x: 0.67, y: y - 0.03, w: 12.0, h: 0.008, fill: { color: TRACK }, line: { type: "none" } });
    s.addText(r.area, { x: 0.67, y, w: 2.5, h: rowH - 0.06, fontFace: FONT, fontSize: 9, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addText([{ text: r.old + "  ", options: { color: FAINT, fontSize: 8 } }, { text: "→  " + r.new, options: { color: NAVY, fontSize: 8, bold: true } }],
      { x: 3.25, y, w: 3.4, h: rowH - 0.06, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
    statusChip(s, 6.75, y + rowH / 2 - 0.19, 1.32, r.status, chipColor[r.status] || MUTED);
    s.addText(r.note, { x: 8.2, y, w: 4.45, h: rowH - 0.04, fontFace: FONT, fontSize: 7.3, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });
  footnote(s, "Week-on-week comparisons that cross the cutover are basis changes, not performance moves — treat levels as a new baseline where flagged.", 7.14);
  sourcePill(s, "cutover register · HANDOFF.md");
}

// =============================================================================
// 4 · EXECUTIVE SUMMARY
// =============================================================================
{
  const s = pres.addSlide();
  header(s, "Executive Summary", null, null);
  const cells = [
    ["OVERALL PERFORMANCE & FINANCE SUMMARY", D.execSummary.finance],
    ["SALES & ACCOUNT MANAGEMENT SUMMARY", D.execSummary.sales],
    ["PROFESSIONAL SERVICES SUMMARY", D.execSummary.ps],
    ["SUPPORT SUMMARY", D.execSummary.support],
    ["PRODUCT", D.execSummary.product],
    ["AI USAGE SUMMARY", D.execSummary.aiUsage],
  ];
  cells.forEach(([title, line], i) => {
    const x = 0.45 + (i % 3) * 4.23, y = 1.25 + Math.floor(i / 3) * 2.75, w = 3.98, h = 2.55;
    card(s, x, y, w, h);
    s.addText(title, { x: x + 0.2, y: y + 0.14, w: w - 0.4, h: 0.42, fontFace: FONT, fontSize: 10.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
    s.addText([
      { text: "Team on track to target and why? ", options: { color: TEAL, fontSize: 9 } },
      { text: line, options: { color: "3A4B57", fontSize: 9, breakLine: true, paraSpaceAfter: 10 } },
      { text: "What's working well? ", options: { color: TEAL, fontSize: 9 } },
      { text: "xx", options: { color: "3A4B57", fontSize: 9, breakLine: true, paraSpaceAfter: 10 } },
      { text: "What's not? ", options: { color: TEAL, fontSize: 9 } },
      { text: "xx", options: { color: "3A4B57", fontSize: 9 } },
    ], { x: x + 0.2, y: y + 0.6, w: w - 0.4, h: h - 0.75, fontFace: FONT, isTextBox: true, margin: 0, valign: "top" });
  });
  footnote(s, "Commentary is leadership-editable — pre-filled lines are computed from this week's sources; 'xx' needs an owner's input");
}

// =============================================================================
// 5 · TARGET VS INVOICED (Finance file drop)
// =============================================================================
{
  const s = pres.addSlide();
  const t = D.targetVsInvoiced;
  header(s, "Target vs Invoiced — Sales Team Roll-up", "Finance", 1);
  const pace = D.week.quarterPacePct;

  // headline cards
  card(s, 0.45, 1.1, 6.05, 1.28);
  s.addText(`NEW MRR — Q3 · OKR2 ${fmtK(t.mrr.okr2)} · team ${fmtK(t.mrr.team)}`, { x: 0.65, y: 1.2, w: 5.6, h: 0.26, fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText([{ text: fmtK(t.mrr.qtd), options: { fontSize: 24, bold: true, color: TERRA } }, { text: `  of ${fmtK(t.mrr.okr2)} target · as at ${t.mrr.asAt}`, options: { fontSize: 9.5, color: MUTED } }],
    { x: 0.65, y: 1.46, w: 3.9, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("Δ wk: register refresh pending", { x: 4.15, y: 1.5, w: 2.25, h: 0.34, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: GOLD, isTextBox: true, margin: 0 });
  progressBar(s, 0.65, 2.08, 4.6, pct(t.mrr.qtd, t.mrr.okr2), pace);
  s.addText([{ text: `${pct(t.mrr.qtd, t.mrr.okr2)}%`, options: { bold: true, color: TERRA, fontSize: 10 } }, { text: ` · pace ${pace}%`, options: { color: FAINT, fontSize: 8 } }],
    { x: 5.35, y: 1.97, w: 1.1, h: 0.3, align: "right", fontFace: FONT, isTextBox: true, margin: 0 });

  card(s, 6.83, 1.1, 6.05, 1.28);
  s.addText(`HARDWARE — Q3 · OKR2 ${fmtK(t.hardware.okr2)} · team ${fmtK(t.hardware.team)}`, { x: 7.03, y: 1.2, w: 5.6, h: 0.26, fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText([{ text: fmtK(t.hardware.qtd), options: { fontSize: 24, bold: true, color: TERRA } }, { text: `  of ${fmtK(t.hardware.okr2)} target`, options: { fontSize: 9.5, color: MUTED } }],
    { x: 7.03, y: 1.46, w: 3.9, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(`▲ +${fmtK(t.hardware.deltaWk)} this wk`, { x: 10.4, y: 1.5, w: 2.25, h: 0.34, align: "right", fontFace: FONT, fontSize: 9.5, bold: true, color: GREEN, isTextBox: true, margin: 0 });
  progressBar(s, 7.03, 2.08, 4.6, pct(t.hardware.qtd, t.hardware.okr2), pace);
  s.addText([{ text: `${pct(t.hardware.qtd, t.hardware.okr2)}%`, options: { bold: true, color: TERRA, fontSize: 10 } }, { text: ` · pace ${pace}%`, options: { color: FAINT, fontSize: 8 } }],
    { x: 11.73, y: 1.97, w: 1.1, h: 0.3, align: "right", fontFace: FONT, isTextBox: true, margin: 0 });

  // member table
  const TX = 0.45, TW = 8.35, TY = 2.56, TH = 4.42;
  card(s, TX, TY, TW, TH);
  s.addText([{ text: "Q3 BY MEMBER   ", options: { fontSize: 12, bold: true, color: TEAL } }, { text: "▮ pace mark = share of quarter elapsed (89%)", options: { fontSize: 8, color: FAINT } }],
    { x: TX + 0.22, y: TY + 0.12, w: TW - 0.44, h: 0.3, fontFace: FONT, isTextBox: true, margin: 0 });
  const cols = [
    { label: "MEMBER", x: 0.22, w: 1.7, align: "left" },
    { label: "TGT", x: 1.98, w: 0.62, align: "right" }, { label: "QTD", x: 2.62, w: 0.62, align: "right" },
    { label: "ATTAIN", x: 3.3, w: 1.06, align: "left" },
    { label: "TGT", x: 4.6, w: 0.7, align: "right" }, { label: "QTD", x: 5.34, w: 0.72, align: "right" },
    { label: "ATTAIN", x: 6.12, w: 1.06, align: "left" }, { label: "Δ WK", x: 7.22, w: 0.9, align: "right" },
  ];
  s.addText("NEW MRR ($/qtr) · as at 6 Sep", { x: TX + 1.98, y: TY + 0.42, w: 2.4, h: 0.22, fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText("HARDWARE ($/qtr) · extracts to 20 Sep · Δ wk = 14–20 Sep", { x: TX + 4.6, y: TY + 0.42, w: 3.7, h: 0.22, fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  cols.forEach((c) => s.addText(c.label, { x: TX + c.x, y: TY + 0.66, w: c.w, h: 0.2, align: c.align, fontFace: FONT, fontSize: 7.5, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  const rows = t.members;
  const rH = 0.345;
  rows.forEach((m, i) => {
    const y = TY + 0.92 + i * rH;
    s.addShape("rect", { x: TX + 0.22, y: y + rH - 0.04, w: TW - 0.44, h: 0.007, fill: { color: TRACK }, line: { type: "none" } });
    const nameColor = m.name === "Unassigned" ? GOLD : NAVY;
    s.addText(m.name, { x: TX + 0.22, y, w: 1.74, h: rH, fontFace: FONT, fontSize: 9, color: nameColor, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(fmtK(m.mrrTgt), { x: TX + 1.98, y, w: 0.62, h: rH, align: "right", fontFace: FONT, fontSize: 8.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(m.mrrQtd >= 1000 ? fmtK(m.mrrQtd) : fmt$(m.mrrQtd), { x: TX + 2.62, y, w: 0.62, h: rH, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
    progressBar(s, TX + 3.34, y + rH / 2 - 0.05, 0.8, m.mrrTgt ? pct(m.mrrQtd, m.mrrTgt) : 0, 89);
    s.addText(m.mrrTgt ? `${pct(m.mrrQtd, m.mrrTgt)}%` : "—", { x: TX + 3.3 + 0.88, y, w: 0.42, h: rH, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(m.hwTgt ? fmtK(m.hwTgt) : "—", { x: TX + 4.6, y, w: 0.7, h: rH, align: "right", fontFace: FONT, fontSize: 8.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(m.hwQtd != null ? fmtK(m.hwQtd) : "—", { x: TX + 5.34, y, w: 0.72, h: rH, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
    if (m.hwQtd != null && m.hwTgt) {
      progressBar(s, TX + 6.16, y + rH / 2 - 0.05, 0.8, pct(m.hwQtd, m.hwTgt), 89);
      s.addText(`${pct(m.hwQtd, m.hwTgt)}%`, { x: TX + 6.12 + 0.88, y, w: 0.42, h: rH, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
    } else {
      s.addText("—", { x: TX + 6.12, y, w: 1.06, h: rH, align: "center", fontFace: FONT, fontSize: 8, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });
    }
    s.addText(m.hwDelta != null ? "+" + fmtK(m.hwDelta).slice(1) : "—", { x: TX + 7.22, y, w: 0.9, h: rH, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: m.hwDelta ? GREEN : FAINT, isTextBox: true, margin: 0, valign: "middle" });
  });
  const totY = TY + 0.92 + rows.length * rH + 0.04;
  s.addShape("rect", { x: TX + 0.22, y: totY - 0.05, w: TW - 0.44, h: 0.016, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("SALES TEAM TOTAL", { x: TX + 0.22, y: totY, w: 1.74, h: 0.3, fontFace: FONT, fontSize: 9, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.mrr.team), { x: TX + 1.98, y: totY, w: 0.62, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.mrr.qtd) + "*", { x: TX + 2.62, y: totY, w: 0.62, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.hardware.team), { x: TX + 4.6, y: totY, w: 0.7, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.hardware.qtd), { x: TX + 5.34, y: totY, w: 0.72, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(`${pct(t.hardware.qtd, t.hardware.team)}%`, { x: TX + 6.12, y: totY, w: 1.06, h: 0.3, align: "center", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("+" + fmtK(t.hardware.deltaWk).slice(1), { x: TX + 7.22, y: totY, w: 0.9, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: GREEN, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("* MRR QTD held at last register run (6 Sep) — movement register refresh pending post-cutover", { x: TX + 0.22, y: totY + 0.32, w: TW - 0.44, h: 0.24, fontFace: FONT, fontSize: 7.2, color: GOLD, isTextBox: true, margin: 0 });

  aiSummary(s, 9.0, 2.56, 3.88, 4.42, [
    { lead: "Hardware is $410k (57%)", text: "against an 89% pace mark. This week's extract (14–20 Sep) added $38k gross — Jasmine +$27k, Bradford +$5k, Bjorn +$4k; the prior (7–13 Sep) week's $38k closed the skipped WC 7 Sep deck.", dot: TERRA },
    { lead: "Watch the discounts:", text: "hardware discounts ran -$10.2k this week (-$10.0k on Jasmine's deals) vs -$2.2k last week — gross $37.6k nets to $27.4k.", dot: GOLD },
    { lead: "New MRR is the remaining gap:", text: "the movement register (the line of record) hasn't rerun since 6 Sep; this week's extract shows a net -$148 S/W subscription movement (credits), a different measure shown for direction only.", dot: TEAL },
    { text: "HW = commissionable only, gross of discounts · attainment = invoiced, never closed-won · pace = day 82 of 92 in Q3.", muted: true, dot: FAINT },
  ]);
  sourcePill(s, t.source);
}

// =============================================================================
// 6 · NEW PRODUCTS
// =============================================================================
{
  const s = pres.addSlide();
  const n = D.newProducts;
  header(s, "New Products — Target vs Traction", "Sales & Product", 1, { cutover: true });
  card(s, 0.45, 1.1, 6.05, 1.28);
  s.addText(`NEW-PRODUCT MRR — SEPTEMBER · committed ${fmtK(n.monthCommitted)}/mo`, { x: 0.65, y: 1.2, w: 5.6, h: 0.26, fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText([{ text: "$0", options: { fontSize: 24, bold: true, color: TERRA } }, { text: `  recorded of ${fmtK(n.monthCommitted)} committed`, options: { fontSize: 9.5, color: MUTED } }],
    { x: 0.65, y: 1.46, w: 4.4, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("▲ +10 Roam deals this wk", { x: 4.3, y: 1.5, w: 2.1, h: 0.34, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: GREEN, isTextBox: true, margin: 0 });
  progressBar(s, 0.65, 2.08, 4.6, 0, D.week.monthPacePct);
  s.addText([{ text: "0%", options: { bold: true, color: TERRA, fontSize: 10 } }, { text: ` · pace ${D.week.monthPacePct}%`, options: { color: FAINT, fontSize: 8 } }],
    { x: 5.35, y: 1.97, w: 1.1, h: 0.3, align: "right", fontFace: FONT, isTextBox: true, margin: 0 });

  card(s, 6.83, 1.1, 6.05, 1.28);
  s.addText("PATH TO DECEMBER · exit $136.8k MRR · 77% AI-built", { x: 7.03, y: 1.2, w: 5.6, h: 0.26, fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText([{ text: "$0", options: { fontSize: 24, bold: true, color: TERRA } }, { text: "  of $137k committed", options: { fontSize: 9.5, color: MUTED } }],
    { x: 7.03, y: 1.46, w: 3.9, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("plan-to-date $30k/mo", { x: 10.4, y: 1.5, w: 2.25, h: 0.34, align: "right", fontFace: FONT, fontSize: 9.5, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  progressBar(s, 7.03, 2.08, 4.6, 0, 22);
  s.addText([{ text: "0%", options: { bold: true, color: TERRA, fontSize: 10 } }, { text: " · pace 22%", options: { color: FAINT, fontSize: 8 } }],
    { x: 11.73, y: 1.97, w: 1.1, h: 0.3, align: "right", fontFace: FONT, isTextBox: true, margin: 0 });

  const TX = 0.45, TW = 8.35, TY = 2.56, TH = 4.42;
  card(s, TX, TY, TW, TH);
  s.addText([{ text: "BY PRODUCT   ", options: { fontSize: 12, bold: true, color: TEAL } }, { text: "▮ open pipe & Δ now HubSpot keyword-matched (deal name) · MRR from the deal mrr field", options: { fontSize: 7.5, color: FAINT } }],
    { x: TX + 0.22, y: TY + 0.12, w: TW - 0.44, h: 0.3, fontFace: FONT, isTextBox: true, margin: 0 });
  const hdr = ["PRODUCT", "MO TGT", "QTD MRR", "STATE", "Δ WK PIPE", "DEC TGT", "OPEN PIPE"];
  const colX = [0.22, 2.35, 3.25, 4.2, 5.55, 6.55, 7.2], colW = [2.05, 0.85, 0.9, 1.3, 0.95, 0.6, 1.0];
  hdr.forEach((h2, i) => s.addText(h2, { x: TX + colX[i], y: TY + 0.5, w: colW[i], h: 0.22, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 7.5, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  n.products.forEach((p, i) => {
    const y = TY + 0.8 + i * 0.62;
    s.addShape("rect", { x: TX + 0.22, y: y + 0.56, w: TW - 0.44, h: 0.007, fill: { color: TRACK }, line: { type: "none" } });
    const vals = [p.name, p.moTgt ? fmtK(p.moTgt) : "—", "$" + p.qtdMrr, p.note, p.wkPipe, fmtK(p.decTgt), p.openPipe];
    vals.forEach((v, j) => s.addText(String(v), { x: TX + colX[j], y, w: colW[j], h: 0.56, align: j === 0 ? "left" : "right", fontFace: FONT, fontSize: j === 0 ? 9.5 : 8.5, bold: j === 0 || j === 2, color: j === 0 ? NAVY : j === 2 ? TERRA : j === 3 ? GOLD : MUTED, isTextBox: true, margin: 0, valign: "middle" }));
  });
  const totY = TY + 0.8 + 4 * 0.62 + 0.08;
  s.addShape("rect", { x: TX + 0.22, y: totY - 0.06, w: TW - 0.44, h: 0.016, fill: { color: NAVY }, line: { type: "none" } });
  s.addText([{ text: "TOTAL   ", options: { bold: true, fontSize: 9.5, color: NAVY } }, { text: "$30k committed · $0 recorded · open pipe 24 deals · ~$1.6k/mo keyword-matched", options: { fontSize: 8.5, color: MUTED } }],
    { x: TX + 0.22, y: totY, w: TW - 0.44, h: 0.3, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText([{ text: "COMMITTED TRAJECTORY   ", options: { bold: true, fontSize: 8.5, color: TEAL } }, { text: n.trajectory, options: { fontSize: 8.5, color: MUTED } }],
    { x: TX + 0.22, y: totY + 0.4, w: TW - 0.44, h: 0.26, fontFace: FONT, isTextBox: true, margin: 0 });

  aiSummary(s, 9.0, 2.56, 3.88, 4.42, [
    { lead: "September recorded MRR is $0 on the new basis", text: "— 2 Roam wins closed this month carry no MRR value on the deal. That's a tagging gap to fix in HubSpot, not zero traction.", dot: TERRA },
    { lead: "Pipe is moving:", text: "+10 Roam-matched deals created this week; open pipe 18 · $372/mo (Roam), 2 · $598/mo (Sentinel).", dot: TEAL },
    { lead: "Basis change:", text: "keyword matching moved from Creatio opportunity names to HubSpot deal names, and $ now read the deal mrr field — levels reset against last week's $217 QTD.", dot: GOLD },
    { text: "Demos & pilots still come from the product-team feed — the CRM carries no demo/pilot signal. Product tagging in HubSpot is the unlock.", muted: true, dot: FAINT },
  ]);
  sourcePill(s, n.source);
}

// =============================================================================
// 7 · H&L PAY — REFERRALS (file drop, as at 6 Sep)
// =============================================================================
{
  const s = pres.addSlide();
  const hp = D.hlPay;
  header(s, "H&L Pay — Our Referrals to ValPay", "Sales · figures as at 6 Sep — weekly export pending", 1);
  kpi(s, 0.45, 1.12, 2.95, 1.25, "REFERRALS GIVEN — ALL-TIME", String(hp.referred), "tagged referred deals in the partner pipeline", NAVY);
  kpi(s, 3.6, 1.12, 2.95, 1.25, "REFERRED GMV — SIGNED", hp.signedGmv, `${hp.won} deals won · ${hp.shareOfWins} of all wins`, TEAL);
  kpi(s, 6.75, 1.12, 2.95, 1.25, "REFERRED — OPEN PIPELINE", hp.openPipe, `${hp.openDeals} referred deals in negotiation`, TERRA);
  kpi(s, 9.9, 1.12, 2.98, 1.25, "IDENTIFIED BY H&L", String(hp.identified), "identification register — tracked ahead of referral", GOLD);

  const TX = 0.45, TY = 2.62, TW = 4.75, TH = 3.9;
  card(s, TX, TY, TW, TH);
  cardTitle(s, TX, TY, "WHO IS GIVING THE REFERRALS", 4.2);
  const hcols = ["REFERRER", "GIVEN", "WON", "GMV"];
  const hx = [0.22, 2.45, 3.2, 3.75], hw = [2.2, 0.7, 0.5, 0.78];
  hcols.forEach((h2, i) => s.addText(h2, { x: TX + hx[i], y: TY + 0.5, w: hw[i], h: 0.22, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 8, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  hp.referrers.forEach((r, i) => {
    const y = TY + 0.78 + i * 0.48;
    s.addShape("rect", { x: TX + 0.22, y: y + 0.43, w: TW - 0.44, h: 0.007, fill: { color: TRACK }, line: { type: "none" } });
    s.addText(r[0], { x: TX + hx[0], y, w: hw[0], h: 0.44, fontFace: FONT, fontSize: 8.5, bold: true, color: r[0] === "Unattributed" ? FAINT : NAVY, isTextBox: true, margin: 0, valign: "middle" });
    [1, 2, 3].forEach((j) => s.addText(String(r[j]), { x: TX + hx[j], y, w: hw[j], h: 0.44, align: "right", fontFace: FONT, fontSize: 8.5, bold: j === 3, color: j === 3 ? TEAL : MUTED, isTextBox: true, margin: 0, valign: "middle" }));
  });

  const FX = 5.35, FW = 3.3;
  card(s, FX, TY, FW, TH);
  cardTitle(s, FX, TY, "REFERRAL FLOW — WHEN GIVEN", 2.9);
  s.addChart(pres.ChartType.bar, [
    { name: "Referred", labels: hp.flow.labels, values: hp.flow.referred },
  ], {
    x: FX + 0.18, y: TY + 0.48, w: FW - 0.38, h: TH - 1.15,
    barDir: "col", chartColors: [TEAL], barGapWidthPct: 45,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: MUTED, dataLabelFontSize: 7.5, dataLabelFontFace: FONT,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 7, catAxisLabelFontFace: FONT,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, showTitle: false,
  });
  s.addText(hp.flow.note, { x: FX + 0.2, y: TY + TH - 0.6, w: FW - 0.4, h: 0.5, fontFace: FONT, fontSize: 7, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  aiSummary(s, 8.8, TY, 4.08, TH, [
    { lead: "Our referrals convert:", text: `${hp.referred} referred deals → ${hp.won} wins worth ${hp.signedGmv} GMV — ${hp.shareOfWins} of everything H&L Pay has signed — with ${hp.openPipe} more in negotiation.`, dot: TERRA },
    { lead: "Bjorn leads", text: "with 11 referrals (6 won). Referring is concentrated in a handful of AMs — widening the referrer base is the lever.", dot: TEAL },
    { lead: "Weekly export pending:", text: "the ValPay drop and identification register haven't updated since 6 Sep (cutover fortnight). Figures shown are the last verified state, not this week's movement.", dot: GOLD },
    { text: "GMV = estimated annual (AUD) · referrer = Account Manager on the deal · 6 deals untagged — referral figures are a floor.", muted: true, dot: FAINT },
  ]);
  footnote(s, "Temp basis note: identification register tracks accounts H&L flags before referral — CRM-to-CRM connection with ValPay still to come.", 6.72);
  sourcePill(s, hp.source);
}

// =============================================================================
// 8 · SALES PIPELINE — Q3 (HubSpot live — flagship cutover slide)
// =============================================================================
{
  const s = pres.addSlide();
  const sp = D.salesPipeline;
  header(s, "Sales Pipeline — Q3 FY26", "Sales", 1, { cutover: true });
  kpi(s, 0.45, 1.12, 2.95, 1.25, "Q3 PIPELINE (UNWEIGHTED)", `$${sp.q3UnweightedK}k`, `${sp.q3Deals} open deals with a Q3 close date`, NAVY);
  kpi(s, 3.6, 1.12, 2.95, 1.25, "Q3 PIPELINE (WEIGHTED)", `$${sp.q3WeightedK}k`, "× HubSpot stage probability · point-in-time", NAVY);
  kpi(s, 6.75, 1.12, 2.95, 1.25, "CLOSED WON — Q3", `$${sp.q3WonK}k`, `${sp.q3WonDeals} deals · deal amount, by close date`, GREEN);
  kpi(s, 9.9, 1.12, 2.98, 1.25, "Q3 WIN RATE", `${sp.winRatePct}%`, `${sp.q3WonDeals} won / ${sp.q3LostDeals} lost, closed in Q3 · by count`, GREEN);
  s.addText(`▲ won this wk: ${sp.wonThisWk} · $${sp.wonThisWkK}k (prior wk ${sp.wonPriorWk} · $${sp.wonPriorWkK}k) · new this wk: ${sp.newThisWk} · $${sp.newThisWkK}k`,
    { x: 0.45, y: 2.4, w: 9, h: 0.26, fontFace: FONT, fontSize: 9, bold: true, color: GREEN, isTextBox: true, margin: 0 });

  const CX = 0.45, CY = 2.72, CW = 7.2, CH = 4.28;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "Q3 PIPELINE BY OWNER — UNWEIGHTED VS WEIGHTED", 6.6);
  s.addChart(pres.ChartType.bar, [
    { name: "Unweighted", labels: sp.byMember.map((m) => m.name).reverse(), values: sp.byMember.map((m) => Math.round(m.unw / 1000)).reverse() },
    { name: "Weighted", labels: sp.byMember.map((m) => m.name).reverse(), values: sp.byMember.map((m) => Math.round(m.wtd / 1000)).reverse() },
  ], {
    x: CX + 0.25, y: CY + 0.5, w: CW - 0.55, h: CH - 0.75,
    barDir: "bar", chartColors: [TEAL, GREEN], barGapWidthPct: 60, barOverlapPct: -10,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "$#,##0\\k", dataLabelColor: MUTED, dataLabelFontSize: 7, dataLabelFontFace: FONT,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 8.5, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 7.5, valAxisLabelFontFace: FONT, valAxisFormatCode: "$#,##0\\k",
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 8, legendFontFace: FONT,
    showTitle: false,
  });

  aiSummary(s, 7.85, CY, 5.03, CH, [
    { lead: "Basis change — read levels as a new baseline.", text: "Values are HubSpot deal amounts (AUD), not the old Creatio ARR measure; weighted uses HubSpot stage probabilities (10/30/50/80%). Closed-won Q3 reads $809k across 246 deals on this basis.", dot: GOLD },
    { lead: "Pipeline hygiene transformed:", text: `only ${sp.hygiene.undated} open deals ($${sp.hygiene.undatedK}k) carry no close date — down from 1,678 in Creatio. The migrated dating debt now shows as ${sp.hygiene.pastDated.toLocaleString()} open deals ($${sp.hygiene.pastDatedM}M) with a lapsed close date — the clean-up queue for AMs.`, dot: TERRA },
    { lead: "Movement restarts:", text: "week movement now reads live (won / new above). Deal-level NET Δ returns as weekly HubSpot snapshots accumulate — first snapshot taken this week.", dot: TEAL },
    { text: "Owner attribution now live on the open Q3 book — Bjorn holds the most ($117k unweighted).", muted: true, dot: FAINT },
  ]);
  sourcePill(s, sp.source);
}

// =============================================================================
// 9 · UTILISATION & DELIVERY HOURS (honest cutover state)
// =============================================================================
{
  const s = pres.addSlide();
  const u = D.utilisation;
  header(s, "Utilisation & Delivery Hours", "Professional Services", 2, { cutover: true });
  kpi(s, 0.45, 1.12, 3.98, 1.25, "BILLED VS NON-BILLED", "not set up", "Creatio work-order feed ended 4 Sep — HubSpot time logging not yet at coverage", GOLD, 20);
  kpi(s, 4.63, 1.12, 3.98, 1.25, "TOTAL UTILISATION", "not set up", "capacity model to be rebuilt on HubSpot hours · 80% target unchanged", GOLD, 20);
  kpi(s, 8.81, 1.12, 4.07, 1.25, "PS CASES OPENED — THIS WEEK", "64", "Tech 40 · Integrations 14 · Training 7 · Onboarding 3 · Warranty 0 (HubSpot, live)", NAVY);

  const CX = 0.45, CY = 2.62, CW = 7.2, CH = 3.9;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "HOURS LOGGED ON HUBSPOT CASES — RAMPING", 6.6);
  s.addText(`${u.hoursLoggedAllTime}h`, { x: CX + 0.25, y: CY + 0.45, w: 2.2, h: 0.55, fontFace: FONT, fontSize: 30, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText(`across ${u.casesWithHours} cases, all-time — the new ground truth (actual_hours on the ticket case)`, { x: CX + 2.5, y: CY + 0.5, w: 4.4, h: 0.5, fontFace: FONT, fontSize: 8.5, color: MUTED, isTextBox: true, margin: 0 });
  const hx = [0.25, 1.9, 4.6, 5.7], hw2 = [1.6, 2.6, 1.0, 1.0];
  ["PIPELINE", "", "HOURS", "CASES"].forEach((h2, i) => h2 && s.addText(h2, { x: CX + hx[i], y: CY + 1.2, w: hw2[i], h: 0.22, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 8, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  const maxH = Math.max(...u.hoursByPipeline.map((r) => r[1]));
  u.hoursByPipeline.forEach((r, i) => {
    const y = CY + 1.48 + i * 0.42;
    s.addShape("rect", { x: CX + 0.25, y: y + 0.37, w: CW - 0.5, h: 0.007, fill: { color: TRACK }, line: { type: "none" } });
    s.addText(r[0], { x: CX + hx[0], y, w: hw2[0], h: 0.38, fontFace: FONT, fontSize: 9.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addShape("roundRect", { x: CX + hx[1], y: y + 0.115, w: Math.max(0.05, (r[1] / maxH) * hw2[1]), h: 0.15, rectRadius: 0.06, fill: { color: TEAL }, line: { type: "none" } });
    s.addText(r[1].toFixed(1) + "h", { x: CX + hx[2], y, w: hw2[2], h: 0.38, align: "right", fontFace: FONT, fontSize: 9.5, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(String(r[2]), { x: CX + hx[3], y, w: hw2[3], h: 0.38, align: "right", fontFace: FONT, fontSize: 9.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });

  aiSummary(s, 7.85, CY, 5.03, CH, [
    { lead: "Utilisation is deliberately blank this week.", text: "The Creatio work-order feed (the old basis) ended 4 Sep. HubSpot's actual_hours covers ~99 hours on 48 cases all-time — far below the ~1,000h/month the old view measured, so computing a % would fabricate a collapse that isn't real.", dot: TERRA },
    { lead: "What it takes to switch this back on:", text: "PS members logging actual_hours on every case (Training adds training_actual_hours), plus the 38h/week capacity roster re-based in the new reporting. The number returns automatically as coverage lands.", dot: TEAL },
    { lead: "Demand signal is live meanwhile:", text: "64 PS cases opened this week, concentrated in Tech (40).", dot: GOLD },
    { text: "Last Creatio-based reading (week of 30 Aug): 69.4% total utilisation, 31.8% billed — kept as the pre-cutover baseline.", muted: true, dot: FAINT },
  ]);
  footnote(s, "Per the design ethos: where a source isn't ready the state is shown honestly — never an estimated utilisation presented as measured.", 6.72);
  sourcePill(s, u.source);
}

// =============================================================================
// 10 · WON VS INVOICED & RETENTION (register as at 6 Sep)
// =============================================================================
{
  const s = pres.addSlide();
  const w = D.wonVsInvoiced;
  header(s, "Won vs Invoiced & Retention", "Sales, Professional Services & Finance · as at 6 Sep — refresh pending", 2);
  // chart card (left) + KPI stack (right)
  const WX = 0.45, WY = 1.1, WW = 7.35, WH = 3.15;
  card(s, WX, WY, WW, WH);
  s.addText([{ text: "CLOSED WON ARR VS INVOICED ARR BY MONTH · 2026   ", options: { fontSize: 11.5, bold: true, color: TEAL } }, { text: w.monthly.note, options: { fontSize: 6.8, color: GOLD } }],
    { x: WX + 0.22, y: WY + 0.1, w: WW - 0.44, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0 });
  s.addChart(pres.ChartType.bar, [
    { name: "Closed won", labels: w.monthly.labels, values: w.monthly.won },
    { name: "Invoiced (new + expansion)", labels: w.monthly.labels, values: w.monthly.invoiced },
  ], {
    x: WX + 0.22, y: WY + 0.52, w: WW - 0.5, h: WH - 0.72,
    barDir: "col", chartColors: [TEAL, GREEN], barGapWidthPct: 55, barOverlapPct: -12,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 8, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 7, valAxisLabelFontFace: FONT, valAxisFormatCode: "$#,##0",
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 8, legendFontFace: FONT, showTitle: false,
  });
  const KX = 7.95, KW = 4.93;
  kpi(s, KX, 1.1, KW, 0.98, "AWAITING GO-LIVE — ARR", `$${w.awaitingGoLiveK}k`, `${w.wonSinceMar} won since Mar · ${w.invoiced} invoiced · ${w.outstanding} outstanding`, TERRA, 20);
  kpi(s, KX, 2.18, KW, 0.98, "CHURNED ARR · 2025→", `$${w.churnedArrM}M`, `${w.logosLost} logos lost`, TERRA, 20);
  kpi(s, KX, 3.26, KW, 0.99, "NET MRR MOVEMENT", `-$${Math.abs(w.netMrrK)}k`, "cumulative — the base is shrinking", TERRA, 20);

  const TX = 6.9, TY = 4.4, TW = 5.98, TH = 2.56;
  card(s, TX, TY, TW, TH);
  s.addText([{ text: "TOP 10 NOT INVOICED   ", options: { fontSize: 11, bold: true, color: TEAL } }, { text: "ARR — sums to the awaiting figure", options: { fontSize: 7, color: FAINT } }],
    { x: TX + 0.22, y: TY + 0.09, w: TW - 0.44, h: 0.26, fontFace: FONT, isTextBox: true, margin: 0 });
  const cx2 = [0.48, 3.0, 3.95, 4.75, 5.3], cw2 = [2.5, 0.9, 0.75, 0.5, 0.42];
  ["CLIENT", "ARR", "MRR/mo", "WON", "DEALS"].forEach((h2, i) => s.addText(h2, { x: TX + cx2[i], y: TY + 0.36, w: cw2[i], h: 0.18, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 7, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  w.topNotInvoiced.forEach((r, i) => {
    const y = TY + 0.56 + i * 0.192;
    s.addText(String(i + 1), { x: TX + 0.22, y, w: 0.22, h: 0.19, fontFace: FONT, fontSize: 7, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(r[0], { x: TX + cx2[0], y, w: cw2[0], h: 0.19, fontFace: FONT, fontSize: 7.5, bold: i < 3, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(r[1], { x: TX + cx2[1], y, w: cw2[1], h: 0.19, align: "right", fontFace: FONT, fontSize: 7.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(r[2], { x: TX + cx2[2], y, w: cw2[2], h: 0.19, align: "right", fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(r[3], { x: TX + cx2[3], y, w: cw2[3], h: 0.19, align: "right", fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(String(r[4]), { x: TX + cx2[4], y, w: cw2[4], h: 0.19, align: "right", fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });

  aiSummary(s, 0.45, TY, 6.3, TH, [
    { lead: "Held at the 6 Sep register run", text: "— figures and chart are the last verified state (customer-spine matched), shown rather than re-derived on a new basis mid-migration.", dot: GOLD },
    { lead: "Install-to-invoice lag runs 60–90 days", text: "— March wins still uninvoiced (Oscars Group $155k) are past normal lag and worth chasing. Oscars: held by old provider's contract terms; asking H&L for a bridging discount.", dot: TERRA },
    { text: "Invoiced = new + expansion MRR movements annualised · AVC excluded pending Creatio MRR-field correction.", muted: true, dot: FAINT },
  ]);
  sourcePill(s, w.source);
}

// =============================================================================
// 11 · BACKLOG (HubSpot live)
// =============================================================================
{
  const s = pres.addSlide();
  const b = D.backlog;
  header(s, "Backlog", "Support", 3, { cutover: true });
  kpi(s, 0.45, 1.12, 2.95, 1.25, "OPEN BACKLOG", String(b.open), `${b.aged31} aged 31d+`, TERRA);
  kpi(s, 3.6, 1.12, 2.95, 1.25, "UNANSWERED OPEN", String(b.unanswered), `${b.unansweredOld} older than 2 days · HubSpot-conversation basis — overstates during transition`, TERRA);
  kpi(s, 6.75, 1.12, 2.95, 1.25, "OPEN PAST 30 DAYS", String(b.past30), "de facto resolution overdue", TERRA);
  kpi(s, 9.9, 1.12, 2.98, 1.25, "TOTAL CASES", b.totalCases.toLocaleString(), b.totalCasesNote, NAVY);

  const CX = 0.45, CY = 2.62, CW = 7.2, CH = 4.28;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "WEEKLY INFLOW VS RESOLVED — LAST 6 WEEKS (HUBSPOT)", 6.6);
  s.addChart(pres.ChartType.bar, [
    { name: "Created", labels: b.weekly.map((r) => r.wk), values: b.weekly.map((r) => r.in) },
    { name: "Resolved", labels: b.weekly.map((r) => r.wk), values: b.weekly.map((r) => r.out) },
  ], {
    x: CX + 0.25, y: CY + 0.48, w: CW - 0.55, h: CH - 1.05,
    barDir: "col", chartColors: [TEAL, TERRA], barGapWidthPct: 50, barOverlapPct: -15,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: MUTED, dataLabelFontSize: 7, dataLabelFontFace: FONT,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 8.5, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 7.5, valAxisLabelFontFace: FONT,
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 8, legendFontFace: FONT, showTitle: false,
  });
  s.addText("09-07 resolved spike (1,250) is migration cleanup — not real throughput", { x: CX + 0.25, y: CY + CH - 0.42, w: CW - 0.5, h: 0.26, fontFace: FONT, fontSize: 7.5, italic: true, color: GOLD, isTextBox: true, margin: 0 });

  const AX = 7.85, AW = 5.03;
  card(s, AX, CY, AW, 2.42);
  s.addText([{ text: "OPEN BACKLOG BY AGE BAND — WoW   ", options: { fontSize: 11, bold: true, color: TEAL } }, { text: "history restarts at cutover", options: { fontSize: 7, color: GOLD } }],
    { x: AX + 0.22, y: CY + 0.1, w: AW - 0.44, h: 0.26, fontFace: FONT, isTextBox: true, margin: 0 });
  const bandLabels = ["0–7 days", "8–30 days", "31–90 days", "90+ days"];
  const bandColors = ["A9CBD4", "6FAEBB", TEAL, TEAL_DK];
  s.addChart(pres.ChartType.bar, bandLabels.map((bl, bi) => ({
    name: bl, labels: b.bandSnapshots.map((sn) => sn.label), values: b.bandSnapshots.map((sn) => sn.bands[bi]),
  })), {
    x: AX + 0.2, y: CY + 0.4, w: AW - 0.45, h: 1.92,
    barDir: "col", barGrouping: "stacked", chartColors: bandColors, barGapWidthPct: 80,
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: "FFFFFF", dataLabelFontSize: 7, dataLabelFontFace: FONT,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 8, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 7, valAxisLabelFontFace: FONT,
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 7.5, legendFontFace: FONT, showTitle: false,
  });

  aiSummary(s, AX, CY + 2.56, AW, CH - 2.56, [
    { lead: "Outflow beat inflow", text: "(591 out vs 490 in) — backlog 681 → 570 WoW, with the 90+ tail cut from 35 to 10. Pre-cutover age bands can't be restated (migration re-dated old closes).", dot: TEAL },
    { lead: "The queue is the live risk:", text: "535 open with no first response (441 past 2 days) — a ceiling while migrated tickets answered only in Creatio wash through.", dot: TERRA },
  ]);
  sourcePill(s, b.source);
}

// =============================================================================
// 12 · AI SUPPORT AGENT (HubSpot state machine)
// =============================================================================
{
  const s = pres.addSlide();
  const a = D.aiAgent;
  header(s, "AI Support Agent", "Support", 3, { cutover: true });
  s.addText([
    { text: "Adoption basis: ", options: { color: FAINT, fontSize: 7.5 } },
    { text: "tickets closed this week (14–20 Sep) with an AI draft in scope · voicemail/junk excluded · ", options: { color: MUTED, fontSize: 7.5, bold: true } },
    { text: "now read live from the HubSpot draft state machine (ai_draft_status) — Creatio all-time history frozen at cutover", options: { color: TEAL, fontSize: 7.5 } },
  ], { x: 0.45, y: 0.96, w: 12.4, h: 0.24, fontFace: FONT, isTextBox: true, margin: 0 });

  kpi(s, 0.45, 1.26, 2.95, 1.2, "APPROVED & SENT — THIS WEEK", String(a.week.sent), `${a.week.asIs} as-is · ${a.week.edited} edited`, GREEN);
  kpi(s, 3.6, 1.26, 2.95, 1.2, "REJECTED — THIS WEEK", String(a.week.rejected), "now measurable — separable from auto-clear for the first time", GOLD);
  kpi(s, 6.75, 1.26, 2.95, 1.2, "DRAFTED (IN SCOPE)", String(a.week.drafted), "on tickets closed this week", NAVY);
  kpi(s, 9.9, 1.26, 2.98, 1.2, "DECISION RATE — NEW", `${a.week.decisionRatePct}%`, "approved / (approved + rejected) = 4/6 — the metric Creatio couldn't measure", TEAL);

  kpi(s, 0.45, 2.62, 4.05, 1.2, "ADOPTION — APPROVED OF ALL DRAFTS", `${a.week.adoptionPct}%`, `${a.week.sent} of ${a.week.drafted} drafts in scope · since cutover (8 Sep): ${a.sinceCutover.adoptionPct}% (${a.sinceCutover.sent}/${a.sinceCutover.drafted}) · human-approved throughout`, TERRA);
  kpi(s, 4.7, 2.62, 4.05, 1.2, "CONFIDENCE — RIGHT FIRST TIME", `${a.week.confidencePct}%`, `${a.week.asIs} as-is of ${a.week.sent} approved · target 95% · small base this week`, GOLD);
  kpi(s, 8.95, 2.62, 3.93, 1.2, "OPEN QUEUE — NOT YET DECIDED", String(a.openQueue.pendingReview), `pending review on open tickets · +${a.openQueue.needsHuman} flagged needs-human`, TERRA);

  card(s, 0.45, 4.0, 12.43, 2.62);
  cardTitle(s, 0.45, 4.0, "HOW TO READ ADOPTION — POST-CUTOVER", 8);
  s.addText([
    { text: "•  ", options: { color: TEAL, bold: true, fontSize: 9 } },
    { text: "This week: 65 in-scope drafts on closed tickets, 4 approved & sent (1 as-is, 3 edited) = 6.2% adoption. Every approved reply is human-reviewed — assisted resolution, not autonomous deflection.", options: { color: "3A4B57", fontSize: 9, breakLine: true, paraSpaceAfter: 8 } },
    { text: "•  ", options: { color: GOLD, bold: true, fontSize: 9 } },
    { text: "The cutover upgrade: ", options: { color: NAVY, bold: true, fontSize: 9 } },
    { text: "ai_draft_status now distinguishes sent as-is / sent edited / rejected / pending review / needs human. Rejects are separable from auto-clears for the first time, so the true decision rate (67% this week, 4 of 6 decided drafts approved) is finally measurable — the number the old CRM export could never produce.", options: { color: "3A4B57", fontSize: 9, breakLine: true, paraSpaceAfter: 8 } },
    { text: "•  ", options: { color: TERRA, bold: true, fontSize: 9 } },
    { text: "Comparisons: ", options: { color: NAVY, bold: true, fontSize: 9 } },
    { text: "Creatio all-time (7.3% adoption, 64/874) is frozen as the pre-cutover baseline — don't chain it with HubSpot weeks. 34 closed tickets this week ended needs-human (drafts weak on complex technical fixes — knowledge-base gaps, not tone) and 25 closed with a draft still pending review: the review-queue habit is the adoption lever.", options: { color: "3A4B57", fontSize: 9 } },
  ], { x: 0.67, y: 4.42, w: 12.0, h: 2.1, fontFace: FONT, isTextBox: true, margin: 0, valign: "top" });
  footnote(s, "Adoption = approved & sent / drafts in scope on closed tickets · confidence = sent as-is / approved · decision rate = approved / (approved + rejected)", 6.74);
  sourcePill(s, a.source);
}

// =============================================================================
// 13 · Q3 ROADMAP
// =============================================================================
{
  const s = pres.addSlide();
  const r = D.roadmap;
  header(s, "Q3 Roadmap", "Product", 4);
  const legend = [[`${r.counts.done} Done`, GREEN], [`${r.counts.onTrack} On Track`, GOLD], [`${r.counts.notStarted} Not Started`, NA_GRAY], [`${r.counts.atRisk} At risk`, TERRA]];
  let lx = 0.45;
  legend.forEach(([t2, c]) => {
    s.addShape("ellipse", { x: lx, y: 1.08, w: 0.18, h: 0.18, fill: { color: c }, line: { type: "none" } });
    s.addText(t2, { x: lx + 0.24, y: 1.0, w: 1.6, h: 0.32, fontFace: FONT, fontSize: 11, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    lx += 0.35 + t2.length * 0.085 + 0.35;
  });
  s.addText("· 27 items across 6 sprints", { x: lx, y: 1.0, w: 2.6, h: 0.32, fontFace: FONT, fontSize: 9.5, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });

  const gridX = 4.15, gridW = 8.73, colW2 = gridW / 6, rowY0 = 1.72, rowH2 = 0.192;
  r.sprints.forEach((sp2, i) => s.addText(sp2, { x: gridX + i * colW2, y: 1.38, w: colW2, h: 0.26, align: "center", fontFace: FONT, fontSize: 9, bold: true, color: TEAL, isTextBox: true, margin: 0 }));
  const STATUS_COLOR = { done: GREEN, ontrack: GOLD, notstarted: NA_GRAY, atrisk: TERRA };
  r.items.forEach((it, i) => {
    const [name, owner, st, s0, s1] = it;
    const y = rowY0 + i * rowH2;
    if (i % 2 === 0) s.addShape("rect", { x: 0.45, y, w: 12.43, h: rowH2, fill: { color: "FFFFFF" }, line: { type: "none" } });
    s.addText(name, { x: 0.5, y, w: 3.6, h: rowH2, fontFace: FONT, fontSize: 7.3, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    for (let c = 0; c < 6; c++) s.addShape("rect", { x: gridX + c * colW2, y: y + 0.02, w: 0.012, h: rowH2 - 0.03, fill: { color: TRACK }, line: { type: "none" } });
    const bx = gridX + s0 * colW2 + 0.03, bw = (s1 - s0 + 1) * colW2 - 0.06;
    s.addShape("roundRect", { x: bx, y: y + 0.022, w: bw, h: rowH2 - 0.05, rectRadius: 0.065, fill: { color: STATUS_COLOR[st], transparency: st === "notstarted" ? 25 : 0 }, line: { type: "none" } });
    s.addText(owner, { x: bx + 0.08, y: y + 0.008, w: bw - 0.12, h: rowH2 - 0.02, fontFace: FONT, fontSize: 6.5, bold: true, color: st === "notstarted" ? MUTED : "FFFFFF", isTextBox: true, margin: 0, valign: "middle" });
  });
  sourcePill(s, r.source);
}

// =============================================================================
// 14 · GTM READINESS
// =============================================================================
{
  const s = pres.addSlide();
  const g = D.gtm;
  header(s, "GTM Readiness", "Product", 4);
  const RAG = { green: GREEN, amber: GOLD, red: TERRA, na: NA_GRAY };
  const hdrY = 1.1;
  s.addShape("roundRect", { x: 0.45, y: hdrY, w: 12.43, h: 0.5, rectRadius: 0.06, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("PRODUCT", { x: 0.65, y: hdrY, w: 1.9, h: 0.5, fontFace: FONT, fontSize: 9, bold: true, color: "FFFFFF", isTextBox: true, margin: 0, valign: "middle" });
  const pillW = 1.06, pill0 = 2.75, pillGap = 1.13;
  g.dims.forEach((d2, i) => s.addText(d2, { x: pill0 + i * pillGap, y: hdrY + 0.04, w: pillW + 0.04, h: 0.44, align: "center", fontFace: FONT, fontSize: 5.8, bold: true, color: "FFFFFF", isTextBox: true, margin: 0, valign: "middle" }));
  g.rows.forEach((row, ri) => {
    const y = 1.78 + ri * 0.78;
    card(s, 0.45, y, 12.43, 0.66);
    s.addText(row.product, { x: 0.65, y, w: 2.0, h: 0.66, fontFace: FONT, fontSize: 11, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    row.pills.forEach(([owner, rag], i) => {
      statusChip(s, pill0 + i * pillGap, y + 0.17, pillW, owner, RAG[rag], rag === "na" ? MUTED : "FFFFFF");
    });
  });

  aiSummary(s, 0.45, 4.3, 6.6, 2.62, [
    { lead: "Launch scoreboard —", text: g.summary.scoreboard, dot: TEAL },
    { lead: "Red gates —", text: g.summary.redGates, dot: TERRA },
    { lead: "Who owns it —", text: g.summary.owners, dot: TEAL },
    { text: g.summary.footnote, muted: true, dot: FAINT },
  ], "GTM READINESS — AI SUMMARY");
  aiSummary(s, 7.25, 4.3, 5.63, 2.62, D.roadmap.notes.map(([lead, text]) => ({ lead, text, dot: GOLD })), "ROADMAP — AI SUMMARY");
  sourcePill(s, g.source);
}

// =============================================================================
// 15 · AI USAGE
// =============================================================================
{
  const s = pres.addSlide();
  const ai = D.aiUsage;
  header(s, "AI Usage — Adoption & Activity", "IT · weekly capture", 4);
  kpi(s, 0.45, 1.12, 2.95, 1.25, "ACTIVE MEMBERS", `${ai.activeWeekly} of ${ai.allMembers}`, `weekly active · ${ai.daily} daily · ${ai.monthly} monthly`, NAVY);
  kpi(s, 3.6, 1.12, 2.95, 1.25, "LINES OF CODE — WK TO 11 SEP", ai.locLastWeek.toLocaleString() + " ▲", `+${ai.locWoWPct}% WoW · derived from Friday-capture deltas`, TEAL);
  {
    const x = 6.75, y = 1.12, w2 = 6.13, h = 1.25;
    card(s, x, y, w2, h);
    s.addText("PLATFORM STICKINESS — SHARE OF MONTHLY USERS ACTIVE DAILY", { x: x + 0.18, y: y + 0.08, w: w2 - 0.36, h: 0.24, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
    ai.stickiness.forEach(([name, v], i) => {
      const ry = y + 0.36 + i * 0.21;
      s.addText(name, { x: x + 0.18, y: ry, w: 1.15, h: 0.19, fontFace: FONT, fontSize: 7.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
      s.addShape("roundRect", { x: x + 1.45, y: ry + 0.045, w: 3.6, h: 0.1, rectRadius: 0.04, fill: { color: TRACK }, line: { type: "none" } });
      s.addShape("roundRect", { x: x + 1.45, y: ry + 0.045, w: Math.max(0.05, 3.6 * v / 100), h: 0.1, rectRadius: 0.04, fill: { color: TEAL }, line: { type: "none" } });
      s.addText(v + "%", { x: x + 5.15, y: ry, w: 0.75, h: 0.19, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
    });
  }

  const CX = 0.45, CY = 2.62, CW = 7.2, CH = 3.9;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "THE CODE PICTURE — SEPTEMBER TO 11 SEP, BY MEMBER", 6.6);
  const half = Math.ceil(ai.sepToDate.length / 2);
  [0, 1].forEach((col) => {
    ai.sepToDate.slice(col * half, col * half + half).forEach((r, i) => {
      const y = CY + 0.46 + i * 0.31, x = CX + 0.25 + col * 3.5;
      s.addShape("rect", { x, y: y + 0.27, w: 3.2, h: 0.007, fill: { color: TRACK }, line: { type: "none" } });
      s.addText(r[0], { x, y, w: 2.1, h: 0.28, fontFace: FONT, fontSize: 8, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
      s.addText(r[1].toLocaleString(), { x: x + 2.1, y, w: 1.1, h: 0.28, align: "right", fontFace: FONT, fontSize: 8, color: TEAL, bold: true, isTextBox: true, margin: 0, valign: "middle" });
    });
  });
  s.addText([{ text: "ALL MEMBERS  ", options: { bold: true, fontSize: 8.5, color: NAVY } }, { text: ai.sepTotal.toLocaleString() + " lines Sep-to-date (capture 11 Sep)", options: { fontSize: 7.5, color: MUTED } },
    { text: "      BY WEEK — THE RHYTHM BENEATH IT", options: { bold: true, fontSize: 8.5, color: TEAL } }],
    { x: CX + 0.25, y: CY + 2.06, w: CW - 0.5, h: 0.24, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addChart(pres.ChartType.bar, [
    { name: "Lines of code (k)", labels: ai.weeklyLoc.labels, values: ai.weeklyLoc.valuesK },
  ], {
    x: CX + 0.2, y: CY + 2.3, w: CW - 0.45, h: 1.28,
    barDir: "col", chartColors: [TEAL], barGapWidthPct: 30,
    showValue: true, dataLabelPosition: "outEnd", dataLabelColor: MUTED, dataLabelFontSize: 6, dataLabelFontFace: FONT, dataLabelFormatCode: "#0\\k",
    catAxisLabelColor: MUTED, catAxisLabelFontSize: 6, catAxisLabelFontFace: FONT,
    valAxisHidden: true, valGridLine: { style: "none" }, catGridLine: { style: "none" },
    showLegend: false, showTitle: false,
  });
  s.addText(ai.weeklyLoc.note, { x: CX + 0.25, y: CY + CH - 0.31, w: CW - 0.5, h: 0.24, fontFace: FONT, fontSize: 6.5, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });

  const AX = 7.85, AW = 5.03;
  card(s, AX, CY, AW, 2.3);
  cardTitle(s, AX, CY, "COWORK — SESSIONS PER WEEK (30-DAY RATE)", 4.6);
  ai.coworkPerWk.slice(0, 5).forEach((r, i) => {
    const y = CY + 0.5 + i * 0.33;
    s.addText(r[0], { x: AX + 0.22, y, w: 1.75, h: 0.3, fontFace: FONT, fontSize: 8, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(`~${r[1]}/wk`, { x: AX + 1.98, y, w: 0.62, h: 0.3, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
    const others = ai.coworkPerWk[i + 5];
    if (others) {
      s.addText(others[0], { x: AX + 2.85, y, w: 1.45, h: 0.3, fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle", align: "left" });
      s.addText(`~${others[1]}/wk`, { x: AX + 4.3, y, w: 0.5, h: 0.3, align: "right", fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    }
  });

  aiSummary(s, AX, CY + 2.46, AW, CH - 2.46, [
    { lead: `${ai.activeWeekly} of ${ai.allMembers} active weekly (${ai.daily} daily)`, text: `— Cowork now edges Claude Code on stickiness (64% vs 63% DAU/MAU). Code & scripts are 50% of Cowork file output.`, dot: TEAL },
    { text: ai.coworkNote, muted: true, dot: GOLD },
  ]);
  sourcePill(s, ai.source);
}

// =============================================================================
// 16 · PROJECTS — PORTFOLIO STATUS
// =============================================================================
{
  const s = pres.addSlide();
  const p = D.projects;
  header(s, "Projects — Portfolio Status", "Portfolio · " + p.asAt, 4);
  ["PROJECT", "STATUS", "CURRENT STATE", "ROADBLOCK"].forEach((h2, i) => {
    const xs = [0.85, 4.95, 6.35, 9.75];
    s.addText(h2, { x: xs[i], y: 1.05, w: 3, h: 0.26, fontFace: FONT, fontSize: 9, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  });
  const STATUS = { "DONE": TEAL, "WATCH": GOLD, "ON TRACK": GREEN };
  p.rows.forEach((r, i) => {
    const y = 1.42 + i * 1.36;
    card(s, 0.6, y, 12.13, 1.22);
    s.addText(r.name, { x: 0.85, y: y + 0.12, w: 3.9, h: 0.34, fontFace: FONT, fontSize: 13, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(r.phase, { x: 0.85, y: y + 0.5, w: 3.9, h: 0.26, fontFace: FONT, fontSize: 8.5, color: FAINT, isTextBox: true, margin: 0 });
    s.addText("Owner " + r.owner, { x: 0.85, y: y + 0.82, w: 3.9, h: 0.26, fontFace: FONT, fontSize: 8, color: FAINT, isTextBox: true, margin: 0 });
    statusChip(s, 4.95, y + 0.32, 1.25, r.status, STATUS[r.status] || MUTED);
    s.addText(r.state, { x: 6.35, y: y + 0.12, w: 3.25, h: 1.0, fontFace: FONT, fontSize: 8.5, color: "3A4B57", isTextBox: true, margin: 0, valign: "top" });
    s.addText(r.roadblock, { x: 9.75, y: y + 0.12, w: 2.85, h: 1.0, fontFace: FONT, fontSize: 8, color: TERRA, isTextBox: true, margin: 0, valign: "top" });
  });
  footnote(s, "Current state = next action from the weekly meeting record · roadblock = flagged risks · Operating Model Update not yet a tracked project — add it to the record to appear here.", 7.0);
}

// -----------------------------------------------------------------------------
const outName = `H&L Weekly Update - WC 14 Sep 2026.pptx`;
const outPath = path.join(__dirname, "output", outName);
pres.writeFile({ fileName: outPath }).then(() => console.log("written:", outPath));
