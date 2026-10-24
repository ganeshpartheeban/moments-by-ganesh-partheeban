/**
 * Moments by Ganesh · enquiry intake (Google Apps Script Web App).
 * Drop-in replacement for the existing script. Handles enquiry, notify and
 * testimonial submissions; logs to the "Enquiries" sheet; emails the owner;
 * auto-replies to clients; sends a daily follow-up digest.
 *
 * Script Properties (Project Settings > Script properties) override the
 * constants below, so secrets need not live in the code:
 *   FORM_TOKEN, SHEET_ID, NOTIFY_EMAIL, BROCHURE_URL
 */

const CONFIG = {
  FORM_TOKEN: "REPLACE_WITH_SAME_VALUE_AS_VITE_FORM_TOKEN",
  SHEET_ID: "REPLACE_WITH_GOOGLE_SHEET_ID",
  NOTIFY_EMAIL: "ganeshpartheeban@gmail.com",
  BROCHURE_URL: "https://ganeshpartheeban.in/brochure.pdf",
};
const SHEET_NAME = "Enquiries";
const OWNER_NAME = "Ganesh Partheeban";
const OWNER_WHATSAPP = "919884426838";
const SITE_URL = "https://ganeshpartheeban.in";
const TZ = "Asia/Kolkata";

const HEADERS = [
  "Timestamp", "Type", "Status", "Name", "Email", "Phone",
  "EventType", "Date", "City/Location", "Budget", "Message",
  "FoundVia", "Source page", "Landing page",
  "UTM source", "UTM medium", "UTM campaign", "Locale",
  "IP location", "User agent", "Follow-up date", "Notes",
];

function _cfg(key) {
  const v = PropertiesService.getScriptProperties().getProperty(key);
  return v || CONFIG[key];
}

function doGet() {
  return _json({ ok: true, service: "Moments enquiry intake", time: new Date().toISOString() });
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.token !== _cfg("FORM_TOKEN")) return _json({ ok: false, error: "Invalid token" });
    // Honeypot: bots fill the hidden "website" field. Pretend success.
    if (p.website) return _json({ ok: true });

    const type = _resolveType(p);
    const now = new Date();
    const followUp = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const sheet = _openSheet();
    const idx = _headerIndex(sheet);

    const values = {
      "Timestamp": now,
      "Type": type,
      "Status": "New",
      "Name": p.name,
      "Email": p.email,
      "Phone": p.phone,
      "EventType": p.eventType,
      "Date": p.date,
      // Client sends the city as "city"; older payloads put it in "location".
      "City/Location": p.city || (p.ipLocation ? p.location : ""),
      "Budget": p.budget,
      "Message": p.message || p.notes,
      "FoundVia": p.foundVia,
      "Source page": p.page || p.source,
      "Landing page": p.landingPage,
      "UTM source": p.utm_source,
      "UTM medium": p.utm_medium,
      "UTM campaign": p.utm_campaign,
      "Locale": p.locale,
      "IP location": p.ipLocation || p.location,
      "User agent": p.userAgent,
      "Follow-up date": followUp,
      "Notes": "",
    };
    const row = new Array(sheet.getLastColumn()).fill("");
    Object.keys(values).forEach(function (h) {
      if (idx[h] !== undefined) row[idx[h]] = values[h] || "";
    });
    sheet.appendRow(row);

    try { _notifyOwner(p, type, now); } catch (err) { console.error("notify failed: " + err); }
    if (type === "enquiry") {
      try { _autoReply(p); } catch (err) { console.error("autoreply failed: " + err); }
    }
    return _json({ ok: true });
  } catch (err) {
    console.error(err);
    return _json({ ok: false, error: String(err) });
  }
}

/** Explicit p.type wins; otherwise infer from the payloads the site sends today. */
function _resolveType(p) {
  const t = String(p.type || "").toLowerCase();
  if (t === "enquiry" || t === "notify" || t === "testimonial") return t;
  const et = String(p.eventType || "");
  if (/testimonial/i.test(et)) return "testimonial";
  if (/\(notify\)/i.test(et)) return "notify";
  return "enquiry";
}

/* ---------- sheet ---------- */

function _openSheet() {
  const ss = SpreadsheetApp.openById(_cfg("SHEET_ID"));
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  // Migrate an older header row: only ever append missing columns on the
  // right; existing columns (and their data) are never moved or overwritten.
  const lastCol = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  const aliases = { "Location": "City/Location", "IPLocation": "IP location", "UserAgent": "User agent", "Source": "Source page" };
  const have = {};
  existing.forEach(function (h) { have[aliases[h] || h] = true; });
  const missing = HEADERS.filter(function (h) { return !have[h]; });
  if (missing.length) {
    sheet.getRange(1, lastCol + 1, 1, missing.length).setValues([missing]);
  }
  return sheet;
}

/** Map header name to 0-based column, honouring legacy header names. */
function _headerIndex(sheet) {
  const aliases = { "Location": "City/Location", "IPLocation": "IP location", "UserAgent": "User agent", "Source": "Source page" };
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const idx = {};
  headers.forEach(function (h, i) {
    const name = aliases[String(h)] || String(h);
    if (idx[name] === undefined) idx[name] = i;
  });
  return idx;
}

/* ---------- email ---------- */

function _waLink(phone, text) {
  let digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) digits = "91" + digits; // assume India
  return "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
}

function _notifyOwner(p, type, when) {
  const label = type === "enquiry" ? "New enquiry" : type === "notify" ? "Notify signup" : "New testimonial";
  const subject = label + " · " + (p.name || "anon") + (p.eventType ? " · " + p.eventType : "");
  const first = String(p.name || "there").split(" ")[0];
  const wa = _waLink(
    p.phone,
    "Hi " + first + ", this is Ganesh from Moments. Thanks for your enquiry" +
      (p.eventType ? " about " + p.eventType : "") + ". When is a good time to chat?"
  );
  const lines = [
    "Time: " + Utilities.formatDate(when, TZ, "d MMM yyyy, h:mm a") + " IST",
    "Type: " + type,
    "Name: " + (p.name || "-"),
    "Email: " + (p.email || "-"),
    "Phone: " + (p.phone || "-"),
    "Event: " + (p.eventType || "-"),
    "Date: " + (p.date || "-"),
    "City: " + (p.city || "-"),
    "Budget: " + (p.budget || "-"),
    "Found via: " + (p.foundVia || "-"),
    "Page: " + (p.page || p.source || "-"),
    "Landing: " + (p.landingPage || "-"),
    "UTM: " + [p.utm_source, p.utm_medium, p.utm_campaign].filter(String).join(" / "),
    "IP location: " + (p.ipLocation || p.location || "-"),
    "",
    "Message:",
    p.message || p.notes || "(none)",
  ];
  if (wa) lines.push("", "WhatsApp the client (prefilled): " + wa);
  const opts = {};
  if (p.email && type === "enquiry") opts.replyTo = p.email;
  MailApp.sendEmail(_cfg("NOTIFY_EMAIL"), subject, lines.join("\n"), opts);
}

function _autoReply(p) {
  const email = String(p.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
  const first = String(p.name || "").split(" ")[0] || "there";
  const brochure = _cfg("BROCHURE_URL");
  const wa = "https://wa.me/" + OWNER_WHATSAPP + "?text=" +
    encodeURIComponent("Hi Ganesh, I just sent an enquiry through your site.");
  const body = [
    "Hi " + first + ",",
    "",
    "Thank you for writing. I have your note" +
      (p.eventType ? " about your " + String(p.eventType).toLowerCase() : "") +
      (p.date ? " on " + p.date : "") + ", and I'm glad you reached out.",
    "",
    "I reply to every enquiry personally, usually within 24 hours. Until then, my brochure has the way I work, what coverage looks like and how booking a date goes:",
    brochure,
    "",
    "If it's easier to talk, you can also reach me on WhatsApp:",
    wa,
    "",
    "Looking forward to hearing more about your day.",
    "",
    "Warmly,",
    OWNER_NAME,
    "Moments by Ganesh · Chennai, available across India",
    SITE_URL,
  ].join("\n");
  MailApp.sendEmail(email, "Thank you, I'll be in touch within a day", body, {
    name: OWNER_NAME,
    replyTo: _cfg("NOTIFY_EMAIL"),
  });
}

/* ---------- daily digest ---------- */

/** Run once from the editor to install the 9:00 IST daily trigger. */
function setupTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "dailyFollowUpDigest") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("dailyFollowUpDigest")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .inTimezone(TZ)
    .create();
}

function dailyFollowUpDigest() {
  const sheet = _openSheet();
  const last = sheet.getLastRow();
  if (last < 2) return;
  const idx = _headerIndex(sheet);
  const data = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
  const now = new Date();
  const due = [];
  data.forEach(function (r) {
    const type = String(r[idx["Type"]] || "");
    if (type && type !== "enquiry") return;
    const status = String(r[idx["Status"]] || "");
    const fu = r[idx["Follow-up date"]];
    const isNew = status === "New";
    const isDue = fu instanceof Date && fu.getTime() <= now.getTime() && status !== "Booked" && status !== "Closed" && status !== "Lost";
    if (isNew || isDue) due.push(r);
  });
  if (!due.length) return;
  const lines = due.map(function (r) {
    const ts = r[idx["Timestamp"]];
    const when = ts instanceof Date ? Utilities.formatDate(ts, TZ, "d MMM") : "";
    const phone = r[idx["Phone"]];
    const wa = phone ? " · " + _waLink(phone, "Hi " + String(r[idx["Name"]] || "").split(" ")[0] + ", following up on your enquiry with Moments.") : "";
    return "- " + (r[idx["Name"]] || "?") + " · " + (r[idx["EventType"]] || "") + " · " +
      (r[idx["Date"]] || "no date") + " · " + (r[idx["City/Location"]] || "") +
      " · " + r[idx["Status"]] + " · received " + when + " · " + (r[idx["Email"]] || "") + wa;
  });
  MailApp.sendEmail(
    _cfg("NOTIFY_EMAIL"),
    "Follow-up digest · " + due.length + " lead" + (due.length === 1 ? "" : "s") + " waiting",
    "Leads that are New or past their follow-up date:\n\n" + lines.join("\n") +
      "\n\nUpdate the Status column (Contacted, Quoted, Booked, Closed, Lost) to take a lead off this list."
  );
}

function _json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
