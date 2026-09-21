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
    if (b.lead) runs.push({ text: b.lead + (b.block ? "" : " "), options: { color: NAVY, bold: true, fontSize: 9, breakLine: !!b.block } });
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
    { n: 1, c: TEAL, t: "DID WE SELL?", st: "Sales & partner motion", items: ["Target vs Invoiced — sales team roll-up", "AI-Infused Products — pipeline & conversion", "H&L Pay — partner motion"] },
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
  s.addText([{ text: fmtK(t.mrr.qtd), options: { fontSize: 24, bold: true, color: TERRA } }, { text: `  of ${fmtK(t.mrr.okr2)} target · register live`, options: { fontSize: 9.5, color: MUTED } }],
    { x: 0.65, y: 1.46, w: 3.9, h: 0.42, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(`▲ +${fmt$(t.mrr.deltaWk)} this wk`, { x: 4.15, y: 1.5, w: 2.25, h: 0.34, align: "right", fontFace: FONT, fontSize: 9.5, bold: true, color: GREEN, isTextBox: true, margin: 0 });
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
  s.addText("NEW MRR ($/qtr) · register live", { x: TX + 1.98, y: TY + 0.42, w: 2.4, h: 0.22, fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0 });
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
  s.addText(fmtK(t.mrr.qtd), { x: TX + 2.62, y: totY, w: 0.62, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.hardware.team), { x: TX + 4.6, y: totY, w: 0.7, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(fmtK(t.hardware.qtd), { x: TX + 5.34, y: totY, w: 0.72, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(`${pct(t.hardware.qtd, t.hardware.team)}%`, { x: TX + 6.12, y: totY, w: 1.06, h: 0.3, align: "center", fontFace: FONT, fontSize: 8.5, bold: true, color: TERRA, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("+" + fmtK(t.hardware.deltaWk).slice(1), { x: TX + 7.22, y: totY, w: 0.9, h: 0.3, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: GREEN, isTextBox: true, margin: 0, valign: "middle" });
  s.addText("MRR = net new + expansion invoiced in Q3 (movement register, live to 20 Sep) · H&L Pay net new $" + t.hlPayNetNewMrr.toLocaleString() + "/mo is tracked separately and never sits inside core MRR", { x: TX + 0.22, y: totY + 0.32, w: TW - 0.44, h: 0.24, fontFace: FONT, fontSize: 7, color: FAINT, isTextBox: true, margin: 0 });

  aiSummary(s, 9.0, 2.56, 3.88, 4.42, [
    { lead: "Hardware is $410k (57%)", text: "against an 89% pace mark. This week's extract (14–20 Sep) added $38k gross — Jasmine +$27k, Bradford +$5k, Bjorn +$4k; the prior (7–13 Sep) week's $38k closed the skipped WC 7 Sep deck.", dot: TERRA },
    { lead: "Watch the discounts:", text: "hardware discounts ran -$10.2k this week (-$10.0k on Jasmine's deals) vs -$2.2k last week — gross $37.6k nets to $27.4k.", dot: GOLD },
    { lead: "New MRR is now live — and behind.", text: `The movement register has rerun: $${t.mrr.qtd.toLocaleString()} invoiced this quarter (43% of the $28k OKR2) against an 89% pace mark, with only $${t.mrr.deltaWk} added in the reporting week. Bjorn leads on $4.4k (89% of target); Jasmine sits at 27%.`, dot: TEAL },
    { text: "HW = commissionable only, gross of discounts · attainment = invoiced, never closed-won · pace = day 82 of 92 in Q3.", muted: true, dot: FAINT },
  ]);
  sourcePill(s, t.source);
}

// =============================================================================
// 6 · AI-INFUSED PRODUCTS — PIPELINE & CONVERSION
// =============================================================================
{
  const s = pres.addSlide();
  const A = D.aiProducts;
  const usd = (a) => Math.round(a * A.fx);
  const US = (a) => "US$" + usd(a).toLocaleString();
  const AU = (a) => "A$" + Math.round(a).toLocaleString();
  header(s, "AI-Infused Products — Pipeline", "Sales & Product", 1, { cutover: true });

  kpi(s, 0.45, 1.08, 2.95, 1.2, "OPEN PIPELINE", US(A.openAud), `${AU(A.openAud)} · ${A.openDeals} deals not yet ordered`, NAVY, 24);
  kpi(s, 3.6, 1.08, 2.95, 1.2, "ORDER PLACED", US(A.placedAud), `${AU(A.placedAud)} · ${A.placedDeals} deals since 1 Jul`, GREEN, 24);
  kpi(s, 6.75, 1.08, 2.95, 1.2, "CLOSED LOST", US(A.lostAud), `${AU(A.lostAud)} · ${A.lostDeals} deals since 1 Jul`, TERRA, 24);
  kpi(s, 9.9, 1.08, 2.98, 1.2, "CONVERSION — OF CLOSED", `${A.convCount}%`, `${A.placedDeals} placed / ${A.lostDeals} lost by count · ${A.convValue}% by value`, TEAL, 24);

  // ---- stage flow, split order placed vs not -------------------------------
  const CX = 0.45, CY = 2.42, CW = 7.5, CH = 3.5;
  card(s, CX, CY, CW, CH);
  s.addText([{ text: "PIPELINE BY STAGE   ", options: { fontSize: 11.5, bold: true, color: TEAL } },
             { text: "converted at " + A.fx + " AUD→USD", options: { fontSize: 6.8, color: FAINT } }],
    { x: CX + 0.22, y: CY + 0.1, w: CW - 0.44, h: 0.24, fontFace: FONT, isTextBox: true, margin: 0 });
  const allV = A.stages.map((st) => st.aud), maxV = Math.max(...allV);
  const bx = CX + 1.55, bw = 4.1, rowH2 = 0.38;
  A.stages.forEach((st, i) => {
    const y = CY + 0.46 + i * rowH2;
    const col = st.placed ? GREEN : st.lost ? TERRA : TEAL;
    s.addText(st.name, { x: CX + 0.28, y, w: 1.2, h: rowH2, fontFace: FONT, fontSize: 8.5, bold: true, color: st.lost ? MUTED : NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addShape("roundRect", { x: bx, y: y + 0.11, w: Math.max(0.06, (st.aud / maxV) * bw), h: 0.2, rectRadius: 0.08, fill: { color: col }, line: { type: "none" } });
    s.addText(US(st.aud), { x: bx + bw + 0.1, y, w: 0.95, h: rowH2, align: "right", fontFace: FONT, fontSize: 9, bold: true, color: col, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(`${st.deals} ${st.deals === 1 ? "deal" : "deals"}`, { x: bx + bw + 1.1, y, w: 0.72, h: rowH2, align: "right", fontFace: FONT, fontSize: 7.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });
  // divider between "not order placed" and "order placed"
  const opY = CY + 0.46 + 3 * rowH2;
  s.addShape("rect", { x: CX + 0.28, y: opY - 0.025, w: CW - 0.56, h: 0.014, fill: { color: GREEN }, line: { type: "none" } });
  s.addText("▲  NOT ORDER PLACED", { x: CX + 3.9, y: opY - 0.2, w: 1.75, h: 0.17, align: "right", fontFace: FONT, fontSize: 6, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText("▼  ORDER PLACED", { x: CX + 3.9, y: opY + 0.03, w: 1.75, h: 0.17, align: "right", fontFace: FONT, fontSize: 6, bold: true, color: GREEN, isTextBox: true, margin: 0 });

  // ---- share bars: value and count -----------------------------------------
  const sbY = CY + 0.46 + 5 * rowH2 + 0.16;
  s.addText("ORDER PLACED VS NOT — SHARE", { x: CX + 0.28, y: sbY, w: 3.0, h: 0.2, fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  const segs = [["Order placed", A.placedAud, A.placedDeals, GREEN], ["Still open", A.openAud, A.openDeals, TEAL], ["Closed lost", A.lostAud, A.lostDeals, TERRA]];
  const totV = A.placedAud + A.openAud + A.lostAud, totN = A.placedDeals + A.openDeals + A.lostDeals;
  [["BY VALUE", segs.map((x) => x[1]), totV], ["BY DEALS", segs.map((x) => x[2]), totN]].forEach(([lbl, vals, tot], ri) => {
    const y = sbY + 0.26 + ri * 0.34, x0 = CX + 1.55, w0 = 5.2;
    s.addText(lbl, { x: CX + 0.28, y, w: 1.2, h: 0.26, fontFace: FONT, fontSize: 7, bold: true, color: FAINT, isTextBox: true, margin: 0, valign: "middle" });
    let cx2 = x0;
    vals.forEach((v, i) => {
      const seg = Math.max(0.03, (v / tot) * w0);
      s.addShape("rect", { x: cx2, y: y + 0.05, w: seg, h: 0.18, fill: { color: segs[i][3] }, line: { type: "none" } });
      if (seg > 0.34) s.addText(Math.round((v / tot) * 100) + "%", { x: cx2, y: y + 0.03, w: seg, h: 0.22, align: "center", valign: "middle", fontFace: FONT, fontSize: 6.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
      cx2 += seg + 0.02;
    });
  });
  let lx2 = CX + 3.55;
  segs.forEach((sg) => {
    s.addShape("rect", { x: lx2, y: sbY + 0.05, w: 0.1, h: 0.1, fill: { color: sg[3] }, line: { type: "none" } });
    s.addText(sg[0], { x: lx2 + 0.14, y: sbY, w: 1.0, h: 0.2, fontFace: FONT, fontSize: 6.3, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    lx2 += 1.2;
  });

  // ---- by product ----------------------------------------------------------
  const PX = 8.15, PW = 4.73;
  card(s, PX, CY, PW, 2.0);
  cardTitle(s, PX, CY, "BY PRODUCT", 4.2);
  ["PRODUCT", "OPEN", "PLACED", "LOST"].forEach((h2, i) => {
    const xs = [0.22, 2.35, 3.15, 3.95], ws = [2.05, 0.72, 0.72, 0.6];
    s.addText(h2, { x: PX + xs[i], y: CY + 0.42, w: ws[i], h: 0.18, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 6.5, bold: true, color: FAINT, isTextBox: true, margin: 0 });
  });
  A.byProduct.forEach((p, i) => {
    const y = CY + 0.64 + i * 0.33;
    s.addText(p.name, { x: PX + 0.22, y, w: 2.05, h: 0.2, fontFace: FONT, fontSize: 7.5, bold: true, color: p.openAud || p.placedAud ? NAVY : FAINT, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(p.note, { x: PX + 0.22, y: y + 0.15, w: 2.1, h: 0.15, fontFace: FONT, fontSize: 5.3, color: FAINT, isTextBox: true, margin: 0 });
    [[p.openAud, 2.35, 0.72, TEAL], [p.placedAud, 3.15, 0.72, GREEN], [p.lostAud, 3.95, 0.6, TERRA]].forEach(([v, x, w2, c]) =>
      s.addText(v ? US(v) : "—", { x: PX + x, y, w: w2, h: 0.2, align: "right", fontFace: FONT, fontSize: 7.5, bold: !!v, color: v ? c : FAINT, isTextBox: true, margin: 0, valign: "middle" }));
  });

  card(s, PX, CY + 2.14, PW, 1.18);
  s.addText([{ text: "ANNUALISED VIEW   ", options: { fontSize: 9, bold: true, color: TEAL } }, { text: "ROAM lines are one month", options: { fontSize: 6, color: GOLD } }],
    { x: PX + 0.22, y: CY + 2.22, w: PW - 0.44, h: 0.22, fontFace: FONT, isTextBox: true, margin: 0 });
  s.addText(US(A.roamAnnualAud), { x: PX + 0.22, y: CY + 2.46, w: 1.75, h: 0.42, fontFace: FONT, fontSize: 18, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(`open ROAM pipeline at ×12 (${AU(A.roamAnnualAud)}) — the contract value behind the ${US(A.openAud)} of monthly lines`,
    { x: PX + 2.05, y: CY + 2.44, w: PW - 2.3, h: 0.5, fontFace: FONT, fontSize: 7, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  s.addText(A.fxNote, { x: PX + 0.22, y: CY + 2.94, w: PW - 0.44, h: 0.3, fontFace: FONT, fontSize: 5.8, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  aiSummary(s, 0.45, 6.02, 12.43, 0.98, [
    { lead: "Conversion is real but tiny.", text: `${A.placedDeals} orders placed since 1 Jul (${US(A.placedAud)}) against ${A.lostDeals} lost — ${A.convCount}% by count, ${A.convValue}% by value. All of it is ROAM; Sentinel has ${US(A.byProduct[1].openAud)} in play and no order yet.`, dot: GREEN },
    { lead: "The book is stuck mid-funnel:", text: `${US(A.stages[1].aud + A.stages[2].aud)} of the ${US(A.openAud)} open sits in Quote Sent and Negotiation across 27 deals — the movement to chase is quote-to-order, not top-of-funnel.`, dot: TEAL },
    { text: "QR Ordering is priced $0 on every line, so its value reads nil · ROAM lines are one month, not contract value.", muted: true, dot: FAINT },
  ]);
  sourcePill(s, A.source);
}


// =============================================================================
// 7 · H&L PAY — REFERRALS TO VALPAY
// =============================================================================
{
  const s = pres.addSlide();
  const hp = D.hlPay, F = hp.flow;
  header(s, "H&L Pay — Our Referrals to ValPay", "Sales · ValPay export as at 6 Sep · identification register live", 1);
  kpi(s, 0.45, 1.06, 4.1, 1.12, "REFERRALS GIVEN — ALL-TIME", String(hp.referred), "tagged referred deals in the partner pipeline", NAVY);
  s.addText(hp.qtrNote, { x: 2.6, y: 1.14, w: 1.75, h: 0.2, align: "right", fontFace: FONT, fontSize: 7.5, bold: true, color: GOLD, isTextBox: true, margin: 0 });
  kpi(s, 4.7, 1.06, 4.1, 1.12, "REFERRED GMV — SIGNED", hp.signedGmv, `${hp.won} deals won · 2 venues live & billing`, TEAL);
  s.addText(`${hp.shareOfWins} of all wins`, { x: 6.85, y: 1.14, w: 1.75, h: 0.2, align: "right", fontFace: FONT, fontSize: 7.5, bold: true, color: GREEN, isTextBox: true, margin: 0 });
  kpi(s, 8.95, 1.06, 3.93, 1.12, "REFERRED — OPEN PIPELINE", hp.openPipe, `${hp.openDeals} referred deals in negotiation`, TEAL);

  const CX = 0.45, CY = 2.34, CW = 7.6, CH = 3.34;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "THE REFERRAL ENGINE — IDENTIFIED BY H&L → REFERRED → SIGNED", 7.1);
  const fw = 1.5, fx0 = CX + 0.22, fy = CY + 0.44, fh = 0.62;
  hp.funnel.forEach((f, i) => {
    const x = fx0 + i * 1.38;
    s.addShape(i === 0 ? "homePlate" : "chevron", { x, y: fy, w: fw, h: fh, fill: { color: f.col }, line: { type: "none" } });
    s.addText(f.label, { x: x + (i === 0 ? 0.12 : 0.26), y: fy + 0.05, w: fw - 0.42, h: 0.16, fontFace: FONT, fontSize: 5.5, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
    s.addText(f.value, { x: x + (i === 0 ? 0.12 : 0.26), y: fy + 0.2, w: fw - 0.42, h: 0.36, fontFace: FONT, fontSize: 16, bold: true, color: "FFFFFF", isTextBox: true, margin: 0, valign: "middle" });
    s.addText(f.cap, { x: x + (i === 0 ? 0.04 : 0.18), y: fy + fh + 0.02, w: fw - 0.2, h: 0.22, fontFace: FONT, fontSize: 5.5, color: FAINT, isTextBox: true, margin: 0, valign: "top" });
  });
  s.addText("REFERRAL FLOW — WHEN REFERRALS WERE GIVEN", { x: CX + 0.22, y: CY + 1.36, w: 3.6, h: 0.2, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText(F.note, { x: CX + 3.8, y: CY + 1.36, w: 3.5, h: 0.2, align: "right", fontFace: FONT, fontSize: 5.8, color: FAINT, isTextBox: true, margin: 0 });
  s.addChart([
    { type: pres.ChartType.bar, data: [
        { name: "identified", labels: F.labels, values: F.identified },
        { name: "referred", labels: F.labels, values: F.referred }],
      options: { chartColors: ["24435C", TEAL], barGrouping: "clustered", barGapWidthPct: 45, barOverlapPct: -10 } },
    { type: pres.ChartType.line, data: [
        { name: "cumulative referred", labels: F.labels, values: F.cumulative }],
      options: { chartColors: [GOLD], lineSize: 2, lineSmooth: false, lineDataSymbolSize: 5 } },
  ], {
    x: CX + 0.18, y: CY + 1.58, w: CW - 0.42, h: CH - 1.82,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 7, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 6, valAxisLabelFontFace: FONT,
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 6.5, legendFontFace: FONT, showTitle: false,
  });

  const RX = 8.2, RW = 4.68;
  card(s, RX, CY, RW, CH);
  cardTitle(s, RX, CY, "WHO IS GIVING THE REFERRALS", 4.2);
  const rx = [0.22, 2.65, 3.35, 4.0], rw = [2.3, 0.6, 0.55, 0.5];
  ["REFERRER", "GIVEN", "WON", "GMV"].forEach((h2, i) => s.addText(h2, { x: RX + rx[i], y: CY + 0.44, w: rw[i], h: 0.18, align: i === 0 ? "left" : "right", fontFace: FONT, fontSize: 6.5, bold: true, color: FAINT, isTextBox: true, margin: 0 }));
  const maxGiven = Math.max(...hp.referrers.map((r) => r[1]));
  hp.referrers.forEach((r, i) => {
    const y = CY + 0.66 + i * 0.40;
    s.addText(r[0], { x: RX + rx[0], y, w: rw[0], h: 0.24, fontFace: FONT, fontSize: 8.5, bold: true, color: r[0] === "Unattributed" ? FAINT : NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addShape("rect", { x: RX + rx[0], y: y + 0.25, w: Math.max(0.06, (r[1] / maxGiven) * 2.2), h: 0.045, fill: { color: TEAL }, line: { type: "none" } });
    s.addText(String(r[1]), { x: RX + rx[1], y, w: rw[1], h: 0.24, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(String(r[2]), { x: RX + rx[2], y, w: rw[2], h: 0.24, align: "right", fontFace: FONT, fontSize: 8.5, bold: true, color: r[2] ? GREEN : FAINT, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(String(r[3]), { x: RX + rx[3], y, w: rw[3], h: 0.24, align: "right", fontFace: FONT, fontSize: 8.5, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });
  s.addText(hp.footnote, { x: RX + 0.22, y: CY + CH - 0.26, w: RW - 0.44, h: 0.22, fontFace: FONT, fontSize: 5.8, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  aiSummary(s, 0.45, 5.78, 12.43, 1.24, [
    { lead: "Our referrals convert:", text: `${hp.referred} referred deals have produced ${hp.won} wins worth ${hp.signedGmv} GMV — ${hp.shareOfWins} of everything H&L Pay has signed — with ${hp.openPipe} more in negotiation. Flow: 6 (Jun) → 2 (Jul) → 5 (Aug), 27 YTD.`, dot: TERRA },
    { lead: "Identification is now tracked ahead of referral:", text: `${hp.identified} accounts flagged (${hp.identifiedDeals} unique venues) but only ${hp.identReferred} carry a referral date — converting identified into referred is the gap. Ho (13) and Bradford (11) identify; Bjorn has flagged 4 and referred none.`, dot: TEAL },
  ]);
  sourcePill(s, hp.source);
}



// =============================================================================
// 8 · UTILISATION & DELIVERY HOURS (billable utilisation on HubSpot PS records)
// =============================================================================
{
  const s = pres.addSlide();
  const u = D.utilisation;
  header(s, "Utilisation & Delivery Hours", "Professional Services", 2, { cutover: true });

  kpi(s, 0.45, 1.12, 3.98, 1.25, "BILLABLE UTILISATION", u.utilPct + "%",
      `${u.billedHours}h billed of ${u.availableHours}h available · target ${u.targetPct}%`, GOLD);
  kpi(s, 4.63, 1.12, 3.98, 1.25, "AVAILABLE HOURS — THIS WEEK", u.availableHours + "h",
      `${u.staffCount} people assigned to PS-pipeline tickets × ${u.weekHours}h standard week`, NAVY);
  kpi(s, 8.81, 1.12, 4.07, 1.25, "TIME-LOGGING COVERAGE", u.coveragePct + "%",
      `${u.itemsWithHours} of ${u.itemsCreated} PS items raised this week carry hours — utilisation reads low because logging is ramping, not because delivery stopped`, GOLD);

  const CY = 2.62, CH = 3.9;

  // ---- left: billable by employee -------------------------------------------
  const CX = 0.45, CW = 7.2;
  card(s, CX, CY, CW, CH);
  s.addText([{ text: "BILLABLE BY EMPLOYEE  ", options: { fontSize: 12, bold: true, color: TEAL } },
             { text: `hours logged against ${u.weekHours}h available each`, options: { fontSize: 7, color: FAINT } }],
    { x: CX + 0.22, y: CY + 0.12, w: CW - 0.44, h: 0.3, fontFace: FONT, isTextBox: true, margin: 0 });

  const EX = { name: 0.25, bar: 2.25, hrs: 5.05, pct: 6.05 };
  const BARW = 2.6;
  [["PS TEAM MEMBER", EX.name, 1.9, "left"], ["UTILISATION OF 38h", EX.bar, BARW, "left"],
   ["HOURS", EX.hrs, 0.9, "right"], ["UTIL %", EX.pct, 0.9, "right"]]
   .forEach(([t, x, w, al]) => s.addText(t, { x: CX + x, y: CY + 0.48, w, h: 0.2, align: al, fontFace: FONT, fontSize: 7, bold: true, color: FAINT, isTextBox: true, margin: 0 }));

  u.byEmployee.forEach((r, i) => {
    const y = CY + 0.70 + i * 0.185;
    const zero = r[1] === 0;
    s.addText(r[0], { x: CX + EX.name, y, w: 1.95, h: 0.185, fontFace: FONT, fontSize: 8, bold: !zero, color: zero ? MUTED : NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addShape("roundRect", { x: CX + EX.bar, y: y + 0.066, w: BARW, h: 0.065, rectRadius: 0.032, fill: { color: TRACK }, line: { type: "none" } });
    if (!zero) s.addShape("roundRect", { x: CX + EX.bar, y: y + 0.066, w: Math.max(0.05, Math.min(1, r[3] / 100) * BARW), h: 0.065, rectRadius: 0.032, fill: { color: TEAL }, line: { type: "none" } });
    s.addText(zero ? "—" : r[1].toFixed(2) + "h", { x: CX + EX.hrs, y, w: 0.9, h: 0.185, align: "right", fontFace: FONT, fontSize: 8, bold: !zero, color: zero ? FAINT : TEAL, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(zero ? "no time logged" : r[3].toFixed(1) + "%", { x: CX + EX.pct, y, w: 0.9, h: 0.185, align: "right", fontFace: FONT, fontSize: zero ? 6 : 8, bold: !zero, color: zero ? FAINT : NAVY, isTextBox: true, margin: 0, valign: "middle" });
  });
  // 80% target marker across the bar column
  s.addShape("rect", { x: CX + EX.bar + BARW * 0.8, y: CY + 0.66, w: 0.008, h: u.byEmployee.length * 0.185, fill: { color: TERRA }, line: { type: "none" } });
  s.addText("80% target", { x: CX + EX.bar + BARW * 0.8 - 0.48, y: CY + 0.46, w: 0.96, h: 0.18, align: "center", fontFace: FONT, fontSize: 6, bold: true, color: TERRA, isTextBox: true, margin: 0 });
  s.addText(u.staffBasis, { x: CX + 0.25, y: CY + 3.56, w: CW - 0.5, h: 0.28, fontFace: FONT, fontSize: 5.8, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  // ---- right top: billable by PS work ---------------------------------------
  const RX = 7.85, RW = 5.03, RH = 1.86;
  card(s, RX, CY, RW, RH);
  s.addText([{ text: "BILLABLE BY PS WORK  ", options: { fontSize: 11, bold: true, color: TEAL } },
             { text: "share of hours logged", options: { fontSize: 6.5, color: FAINT } }],
    { x: RX + 0.22, y: CY + 0.1, w: RW - 0.44, h: 0.26, fontFace: FONT, isTextBox: true, margin: 0 });
  [["SERVICE TYPE", 0.22, 1.5, "left"], ["", 1.8, 1.6, "left"], ["HOURS", 3.4, 0.7, "right"], ["SHARE", 4.15, 0.66, "right"]]
    .forEach(([t, x, w, al]) => { if (t) s.addText(t, { x: RX + x, y: CY + 0.38, w, h: 0.18, align: al, fontFace: FONT, fontSize: 6.8, bold: true, color: FAINT, isTextBox: true, margin: 0 }); });
  const wMax = Math.max(...u.byWork.map((r) => r[1])) || 1;
  u.byWork.forEach((r, i) => {
    const y = CY + 0.60 + i * 0.215;
    const zero = r[1] === 0;
    s.addText(r[0], { x: RX + 0.22, y, w: 1.5, h: 0.215, fontFace: FONT, fontSize: 8, bold: !zero, color: zero ? MUTED : NAVY, isTextBox: true, margin: 0, valign: "middle" });
    s.addShape("roundRect", { x: RX + 1.8, y: y + 0.075, w: 1.5, h: 0.065, rectRadius: 0.032, fill: { color: TRACK }, line: { type: "none" } });
    if (!zero) s.addShape("roundRect", { x: RX + 1.8, y: y + 0.075, w: Math.max(0.05, (r[1] / wMax) * 1.5), h: 0.065, rectRadius: 0.032, fill: { color: TEAL }, line: { type: "none" } });
    s.addText(zero ? "—" : r[1].toFixed(2) + "h", { x: RX + 3.4, y, w: 0.7, h: 0.215, align: "right", fontFace: FONT, fontSize: 8, bold: !zero, color: zero ? FAINT : TEAL, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(zero ? "none" : r[3].toFixed(1) + "%", { x: RX + 4.15, y, w: 0.66, h: 0.215, align: "right", fontFace: FONT, fontSize: zero ? 6.5 : 8, color: zero ? FAINT : MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });

  aiSummary(s, RX, CY + 2.0, RW, CH - 2.0, [
    { lead: `${u.utilPct}% billable utilisation is a logging number, not a delivery number.`, text: `${u.billedHours}h landed against ${u.availableHours}h of capacity, but only ${u.coveragePct}% of the week's ${u.itemsCreated} PS items carry hours.`, dot: TERRA },
    { lead: "Two people carry the entire logged total.", text: `Katherine Fenwick 38.2% and Rhys Woolcock 36.4%; the other ${u.byEmployee.filter((r) => r[1] === 0).length} PS members logged nothing at all.`, dot: GOLD },
    { lead: "Work is landing even where hours aren't.", text: `${u.psCasesThisWk} PS cases opened this week; Tech carries 95% of logged time. Median time to close since 8 Sep: Tech 0.6 d.`, dot: TEAL },
  ]);
  footnote(s, u.billableNote + " " + u.hygieneNote, 6.72);
  sourcePill(s, u.source);
}





// =============================================================================
// 10 · WON VS INVOICED & RETENTION
// =============================================================================
{
  const s = pres.addSlide();
  const w = D.wonVsInvoiced, M = w.monthly;
  header(s, "Won vs Invoiced & Retention", "Sales, Professional Services & Finance", 2);
  const WX = 0.45, WY = 1.1, WW = 7.35, WH = 3.15;
  card(s, WX, WY, WW, WH);
  s.addText([{ text: "CLOSED WON ARR VS INVOICED ARR BY MONTH · 2026   ", options: { fontSize: 11.5, bold: true, color: TEAL } },
             { text: "frozen at cutover", options: { fontSize: 6.8, color: GOLD } }],
    { x: WX + 0.22, y: WY + 0.1, w: WW - 0.44, h: 0.24, fontFace: FONT, isTextBox: true, margin: 0 });
  s.addChart(pres.ChartType.bar, [
    { name: "Closed won", labels: M.labels, values: M.won },
    { name: "Invoiced (new + expansion)", labels: M.labels, values: M.invoiced },
  ], {
    x: WX + 0.2, y: WY + 0.36, w: WW - 0.44, h: WH - 0.78,
    barDir: "col", chartColors: [TEAL, GREEN], barGapWidthPct: 45, barOverlapPct: -10,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 8, catAxisLabelFontFace: FONT,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 6.5, valAxisLabelFontFace: FONT, valAxisFormatCode: '$#,##0,"k"',
    valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: true, legendPos: "t", legendColor: MUTED, legendFontSize: 7.5, legendFontFace: FONT, showTitle: false,
  });
  s.addText(M.note, { x: WX + 0.22, y: WY + WH - 0.38, w: WW - 0.44, h: 0.32, fontFace: FONT, fontSize: 6.2, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  const KX = 7.95, KW = 4.93;
  kpi(s, KX, 1.1, KW, 0.98, "AWAITING GO-LIVE — ARR", `$${w.awaitingGoLiveK}k`, `${w.wonSinceMar} deals won since Mar · ${w.invoiced} invoiced · ${w.outstanding} outstanding`, GOLD, 20);
  kpi(s, KX, 2.18, KW, 0.98, "CHURNED ARR · 2025→", `$${w.churnedArrM}M`, `${w.logosLost} logos lost · register live`, TERRA, 20);
  kpi(s, KX, 3.26, KW, 0.99, "NET MRR MOVEMENT", `-$${Math.abs(w.netMrrQ3K)}k`, `${w.netMrrNote} — the base is still shrinking`, TERRA, 20);

  const TX = 6.9, TY = 4.4, TW = 5.98, TH = 2.56;
  card(s, TX, TY, TW, TH);
  s.addText([{ text: "TOP 10 NOT INVOICED   ", options: { fontSize: 11, bold: true, color: TEAL } }, { text: "ARR — sums to the awaiting figure", options: { fontSize: 6.5, color: FAINT } }],
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

  const AX = 0.45, AW = 6.3;
  card(s, AX, TY, AW, TH);
  cardTitle(s, AX, TY, "AI SUMMARY", 5.8);
  s.addText([
    { text: "•  ", options: { color: TERRA, bold: true, fontSize: 8.5 } },
    { text: "Install-to-invoice lag runs 60–90 days — wins bill ~a quarter later; March wins still uninvoiced are past normal lag and worth chasing.", options: { color: "3A4B57", fontSize: 8.5, breakLine: true, paraSpaceAfter: 6 } },
    { text: "•  ", options: { color: GOLD, bold: true, fontSize: 8.5 } },
    { text: `Uninvoiced is top-loaded: Oscars Group is 62% of the $${w.awaitingGoLiveK}k awaiting go-live; the top 3 clients are ~78%.`, options: { color: "3A4B57", fontSize: 8.5, breakLine: true, paraSpaceAfter: 6 } },
    { text: "•  ", options: { color: TEAL, bold: true, fontSize: 8.5 } },
    { text: `Churn is now read live from the movement register: $${w.churnedArrM}M of ARR across ${w.logosLost} logos since 2025, plus $${w.contractionArrK}k lost to contraction on accounts that stayed. Q3 net MRR is -$${Math.abs(w.netMrrQ3K)}k — new business is not covering it.`, options: { color: "3A4B57", fontSize: 8.5, breakLine: true, paraSpaceAfter: 6 } },
    { text: "•  ", options: { color: FAINT, bold: true, fontSize: 8.5 } },
    { text: "AVC excluded — Creatio MRR field misstated (annual values in the monthly field); correction pending.", options: { color: FAINT, fontSize: 8.5, breakLine: true, paraSpaceAfter: 8 } },
    { text: "GO-LIVE CONTEXT", options: { color: TEAL, bold: true, fontSize: 9, breakLine: true } },
    { text: "◆  ", options: { color: GOLD, bold: true, fontSize: 8.5 } },
    { text: "Oscars Group — ", options: { color: NAVY, bold: true, fontSize: 8.5 } },
    { text: "Signed — ~1.5x rollout timeline expected. Keen to start but held by old provider's contract terms; asking H&L for a discount to bridge.", options: { color: "3A4B57", fontSize: 8.5 } },
  ], { x: AX + 0.22, y: TY + 0.44, w: AW - 0.45, h: TH - 0.58, fontFace: FONT, isTextBox: true, margin: 0, valign: "top" });
  footnote(s, "Invoiced = new + expansion MRR movements annualised", 7.06);
  sourcePill(s, w.source);
}



// =============================================================================
// 11 · BACKLOG (Creatio frozen at cutover · HubSpot after)
// =============================================================================
{
  const s = pres.addSlide();
  const b = D.backlog, AS = b.ageSeries;
  header(s, "Backlog", "Support", 3, { cutover: true });
  kpi(s, 0.45, 1.12, 2.95, 1.25, "OPEN BACKLOG", String(b.open), `${b.aged31} aged 31d+ · as at ${b.asAt}`, TERRA);
  kpi(s, 3.6, 1.12, 2.95, 1.25, "UNANSWERED OPEN", String(b.unanswered), "no first response · HubSpot-conversation basis — overstates during transition", TERRA);
  kpi(s, 6.75, 1.12, 2.95, 1.25, "OPEN PAST 30 DAYS", String(b.past30), "de facto resolution overdue", TERRA);
  kpi(s, 9.9, 1.12, 2.98, 1.25, "TOTAL CASES", b.totalCases.toLocaleString(), b.totalCasesNote, NAVY);

  const BANDS = ["0–7 days", "8–30 days", "31–90 days", "90+ days"];
  const BCOL = ["3D8F5F", "6FAEBB", "C88A2E", "7A3B21"];
  const CX = 0.45, CY = 2.62, CW = 7.2, CH = 4.28;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "OPEN BACKLOG BY AGE BAND — WEEKLY", 5.4);
  // shared legend
  let lx = CX + 0.24;
  BANDS.forEach((bn, i) => {
    s.addShape("rect", { x: lx, y: CY + 0.45, w: 0.12, h: 0.12, fill: { color: BCOL[i] }, line: { type: "none" } });
    s.addText(bn, { x: lx + 0.15, y: CY + 0.4, w: 0.78, h: 0.22, fontFace: FONT, fontSize: 6.8, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
    lx += 0.92;
  });
  const chY = CY + 0.72, chH = 2.95, MAXV = 800;
  const mkSeries = (rows) => BANDS.map((bn, bi) => ({ name: bn, labels: rows.map((r) => r.wk), values: rows.map((r) => r.bands[bi]) }));
  const common = {
    barDir: "col", barGrouping: "stacked", chartColors: BCOL, barGapWidthPct: 55,
    showValue: true, dataLabelPosition: "ctr", dataLabelColor: "FFFFFF", dataLabelFontSize: 6.5, dataLabelFontFace: FONT,
    catAxisLabelColor: NAVY, catAxisLabelFontSize: 7.5, catAxisLabelFontFace: FONT,
    valAxisMaxVal: MAXV, valAxisMinVal: 0, valGridLine: { color: TRACK, size: 0.5 }, catGridLine: { style: "none" },
    showLegend: false, showTitle: false,
  };
  s.addChart(pres.ChartType.bar, mkSeries(AS.creatio), Object.assign({}, common, {
    x: CX + 0.14, y: chY, w: 4.3, h: chH,
    valAxisLabelColor: FAINT, valAxisLabelFontSize: 6.5, valAxisLabelFontFace: FONT,
  }));
  s.addChart(pres.ChartType.bar, mkSeries(AS.hubspot), Object.assign({}, common, {
    x: CX + 4.72, y: chY, w: 2.32, h: chH, valAxisHidden: true,
  }));
  // cutover divider between the two series
  const dX = CX + 4.58;
  s.addShape("rect", { x: dX, y: chY + 0.05, w: 0.022, h: chH - 0.4, fill: { color: TERRA }, line: { type: "none" } });
  s.addShape("roundRect", { x: dX - 0.5, y: CY + 0.4, w: 1.05, h: 0.22, rectRadius: 0.11, fill: { color: TERRA }, line: { type: "none" } });
  s.addText("CUTOVER 8 SEP", { x: dX - 0.5, y: CY + 0.4, w: 1.05, h: 0.22, align: "center", valign: "middle", fontFace: FONT, fontSize: 6, bold: true, color: "FFFFFF", isTextBox: true, margin: 0 });
  s.addText("CREATIO — FROZEN", { x: CX + 0.6, y: chY + chH - 0.12, w: 3.4, h: 0.2, align: "center", fontFace: FONT, fontSize: 6.5, bold: true, color: GOLD, isTextBox: true, margin: 0 });
  s.addText("HUBSPOT — LIVE", { x: CX + 4.72, y: chY + chH - 0.12, w: 2.32, h: 0.2, align: "center", fontFace: FONT, fontSize: 6.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
  s.addText(AS.note, { x: CX + 0.22, y: CY + CH - 0.42, w: CW - 0.44, h: 0.36, fontFace: FONT, fontSize: 6.5, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  aiSummary(s, 7.85, CY, 5.03, CH, [
    { lead: "The tail is finally coming down.", text: "90+ day cases fell 35 → 10 and the 31–90 band 151 → 132 across the first two HubSpot weeks; backlog 681 → 575. Outflow beat inflow this week (591 resolved vs 490 in).", dot: GREEN },
    { lead: "History is frozen, not restated.", text: "Weeks to 30 Aug are the Creatio series as it stood at the final extract. The migration re-dated old closes, so those weeks cannot be recomputed in HubSpot — and the 7 Sep week sits inside the cutover, so it is not reported.", dot: GOLD },
    { lead: "The queue is still the live risk:", text: `${b.unanswered} open cases show no first response. Migrated tickets answered only in Creatio count as unanswered here — treat as a ceiling until the transition washes through.`, dot: TERRA },
    { text: "SLA fields are populating on new HubSpot tickets — attainment reporting returns once coverage is credible.", muted: true, dot: FAINT },
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
  const ai = D.aiUsage, CM = ai.codeMatrix, BW = ai.byWeek, CO = ai.cowork;
  header(s, "AI Usage — Adoption & Activity", "IT", 4);
  kpi(s, 0.45, 1.08, 2.95, 1.2, "ACTIVE MEMBERS", `${ai.activeWeekly} of ${ai.allMembers}`, `weekly active · ${ai.daily} daily · ${ai.monthly} monthly`, NAVY);
  kpi(s, 3.6, 1.08, 2.95, 1.2, "LINES OF CODE — LAST WEEK", ai.locLastWeek.toLocaleString() + " ▲", `+${ai.locWoWPct}% WoW · ${ai.locWeekEnding}`, TEAL, 24);
  {
    const x = 6.75, y = 1.08, w2 = 6.13, h = 1.2;
    card(s, x, y, w2, h);
    s.addText("PLATFORM STICKINESS — SHARE OF MONTHLY USERS ACTIVE DAILY", { x: x + 0.18, y: y + 0.08, w: w2 - 0.36, h: 0.22, fontFace: FONT, fontSize: 8.5, bold: true, color: TEAL, isTextBox: true, margin: 0 });
    ai.stickiness.forEach(([name, v], i) => {
      const ry = y + 0.34 + i * 0.2;
      s.addText(name, { x: x + 0.18, y: ry, w: 1.15, h: 0.18, fontFace: FONT, fontSize: 7.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
      s.addShape("roundRect", { x: x + 1.45, y: ry + 0.04, w: 3.6, h: 0.1, rectRadius: 0.04, fill: { color: TRACK }, line: { type: "none" } });
      s.addShape("roundRect", { x: x + 1.45, y: ry + 0.04, w: Math.max(0.05, 3.6 * v / 100), h: 0.1, rectRadius: 0.04, fill: { color: TEAL }, line: { type: "none" } });
      s.addText(v + "%", { x: x + 5.15, y: ry, w: 0.75, h: 0.18, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
    });
  }

  const CX = 0.45, CY = 2.42, CW = 8.2, CH = 3.7;
  card(s, CX, CY, CW, CH);
  cardTitle(s, CX, CY, "THE CODE PICTURE — WHO, BY MONTH · AND THE WEEKLY RHYTHM BENEATH IT", 7.6);
  const nameX = CX + 0.2, nameW = 1.55, colX = [CX + 1.8, CX + 2.98, CX + 4.16, CX + 5.34], colW = 1.15, totX = CX + 6.55, totW = 1.4;
  CM.months.forEach((mo, i) => s.addText(mo, { x: colX[i], y: CY + 0.42, w: colW, h: 0.2, align: "center", fontFace: FONT, fontSize: 8, bold: true, color: NAVY, isTextBox: true, margin: 0 }));
  s.addText("TOTAL", { x: totX, y: CY + 0.42, w: totW, h: 0.2, align: "right", fontFace: FONT, fontSize: 8, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  const maxC = Math.max(...CM.rows.flatMap((r) => r[1]));
  const tintC = (v) => { const f = v / maxC; return f > 0.7 ? "8FC3CC" : f > 0.45 ? "B5D9E0" : f > 0.2 ? "D4E9ED" : f > 0 ? "EDF5F7" : "FFFFFF"; };
  CM.rows.forEach((row, ri) => {
    const y = CY + 0.66 + ri * 0.19;
    s.addText(row[0], { x: nameX, y, w: nameW, h: 0.18, fontFace: FONT, fontSize: 7.2, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
    row[1].forEach((v, i) => {
      if (v > 0) s.addShape("rect", { x: colX[i] + 0.03, y: y + 0.008, w: colW - 0.06, h: 0.165, fill: { color: tintC(v) }, line: { type: "none" } });
      s.addText(v > 0 ? v.toLocaleString() : "—", { x: colX[i], y, w: colW, h: 0.18, align: "center", valign: "middle", fontFace: FONT, fontSize: 6.8, color: v > 0 ? NAVY : FAINT, isTextBox: true, margin: 0 });
    });
    s.addText(row[1].reduce((a, b) => a + b, 0).toLocaleString(), { x: totX, y, w: totW, h: 0.18, align: "right", fontFace: FONT, fontSize: 7, bold: true, color: MUTED, isTextBox: true, margin: 0, valign: "middle" });
  });
  const adY = CY + 0.66 + CM.rows.length * 0.19 + 0.03;
  s.addShape("rect", { x: nameX, y: adY - 0.03, w: CW - 0.4, h: 0.012, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("ALL DEVELOPERS", { x: nameX, y: adY, w: nameW, h: 0.22, fontFace: FONT, fontSize: 7.5, bold: true, color: NAVY, isTextBox: true, margin: 0, valign: "middle" });
  CM.allDevelopers.forEach((v, i) => s.addText(v.toLocaleString(), { x: colX[i], y: adY, w: colW, h: 0.22, align: "center", fontFace: FONT, fontSize: 7.5, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" }));
  s.addText(CM.allDevelopers.reduce((a, b) => a + b, 0).toLocaleString(), { x: totX, y: adY, w: totW, h: 0.22, align: "right", fontFace: FONT, fontSize: 7.5, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });

  // BY WEEK strip
  const bwY = adY + 0.34;
  s.addText([{ text: "BY WEEK  ", options: { fontSize: 7.5, bold: true, color: NAVY } }, { text: "cell = one week", options: { fontSize: 6, color: FAINT } }],
    { x: nameX, y: bwY, w: nameW, h: 0.22, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  const n = BW.valuesK.length, cellW = 6.15 / n, bx0 = CX + 1.8, maxW = Math.max(...BW.valuesK);
  BW.valuesK.forEach((v, i) => {
    const x = bx0 + i * cellW, f = v / maxW;
    const col = f > 0.85 ? TEAL : f > 0.6 ? "8FC3CC" : f > 0.4 ? "B5D9E0" : "D4E9ED";
    s.addShape("rect", { x: x + 0.02, y: bwY, w: cellW - 0.04, h: 0.24, fill: { color: col }, line: { type: "none" } });
    s.addText(v + "k", { x, y: bwY, w: cellW, h: 0.24, align: "center", valign: "middle", fontFace: FONT, fontSize: 6.2, bold: f > 0.85, color: f > 0.85 ? "FFFFFF" : NAVY, isTextBox: true, margin: 0 });
    s.addText(BW.labels[i], { x, y: bwY + 0.25, w: cellW, h: 0.16, align: "center", fontFace: FONT, fontSize: 5.5, color: FAINT, isTextBox: true, margin: 0 });
  });
  s.addText(BW.note, { x: nameX, y: CY + CH - 0.28, w: CW - 0.4, h: 0.22, fontFace: FONT, fontSize: 6, color: FAINT, isTextBox: true, margin: 0 });

  // Cowork panel
  const RX = 8.85, RW = 4.03;
  card(s, RX, CY, RW, CH);
  cardTitle(s, RX, CY, "COWORK — SESSIONS PER WEEK", 3.6);
  s.addText(`~${CO.perWkTotal}`, { x: RX + 0.2, y: CY + 0.42, w: 1.5, h: 0.6, fontFace: FONT, fontSize: 30, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
  s.addText([{ text: "team total / wk\n", options: { fontSize: 7.5, color: MUTED } }, { text: `~${CO.baseline} baseline`, options: { fontSize: 7, color: FAINT } }],
    { x: RX + 1.6, y: CY + 0.45, w: 2.2, h: 0.55, fontFace: FONT, isTextBox: true, margin: 0, valign: "middle" });
  CO.members.forEach((m, i) => {
    const y = CY + 1.12 + i * 0.21;
    s.addText(m[0], { x: RX + 0.2, y, w: 1.9, h: 0.22, fontFace: FONT, fontSize: 7.5, bold: i < 5, color: i < 5 ? NAVY : MUTED, isTextBox: true, margin: 0, valign: "middle" });
    const d = m[2];
    const arrow = d == null ? "new" : d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : "—";
    s.addText(arrow, { x: RX + 2.15, y, w: 0.75, h: 0.22, align: "right", fontFace: FONT, fontSize: 6.8, bold: true, color: d == null ? FAINT : d > 0 ? GREEN : d < 0 ? TERRA : FAINT, isTextBox: true, margin: 0, valign: "middle" });
    s.addText(`~${m[1]}/wk`, { x: RX + 3.0, y, w: 0.83, h: 0.22, align: "right", fontFace: FONT, fontSize: 7.5, bold: true, color: TEAL, isTextBox: true, margin: 0, valign: "middle" });
  });
  s.addText(CO.note, { x: RX + 0.2, y: CY + CH - 0.3, w: RW - 0.4, h: 0.26, fontFace: FONT, fontSize: 6, color: FAINT, isTextBox: true, margin: 0, valign: "top" });

  aiSummary(s, 0.45, 6.2, 12.43, 0.86, [
    { lead: `${ai.activeWeekly} of ${ai.allMembers} active weekly (${ai.daily} daily)`, text: `— Cowork edges Claude Code on stickiness (64% vs 63% DAU/MAU); code output ${ai.locLastWeek.toLocaleString()} lines (+${ai.locWoWPct}% WoW), Nicolas leading September. Engineers show zero Cowork sessions because they live in Claude Code — Cowork is the ops and leadership surface, not a sign of inactivity.`, dot: TEAL },
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
