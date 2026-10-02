#!/usr/bin/env node
// OpportunityRadar data pipeline.
// Fetches every configured source, normalizes + dedupes, merges with the
// previous dataset (preserving "firstSeen" so genuinely NEW items are
// identifiable), applies a freshness TTL, and writes:
//   public/data/opportunities.json  — the site's dataset
//   public/feed.xml                 — subscribe-via-RSS to be first to know
//
// Zero npm dependencies: runs with plain `node scripts/fetch.mjs`.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TYPES } from "./lib/util.mjs";
import { makeRssSource } from "./sources/rss.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = path.join(ROOT, "public", "data");
const OUT_JSON = path.join(DATA_DIR, "opportunities.json");
const OUT_RSS = path.join(ROOT, "public", "feed.xml");

const config = JSON.parse(await readFile(path.join(ROOT, "data", "sources.json"), "utf8"));

// ---- source registry -------------------------------------------------------
const sources = [
  (await import("./sources/simplify.mjs")).default,
  (await import("./sources/remoteok.mjs")).default,
  (await import("./sources/arbeitnow.mjs")).default,
  (await import("./sources/jobicy.mjs")).default,
  (await import("./sources/remotive.mjs")).default,
  (await import("./sources/hackernews.mjs")).default,
  (await import("./sources/usajobs.mjs")).default,
  ...config.rss.map(makeRssSource),
];

// ---- fetch all sources in parallel -----------------------------------------
console.log(`Fetching ${sources.length} sources…`);
const results = await Promise.allSettled(sources.map((s) => s.fetchOpportunities()));

const byId = new Map(); // dedupe across sources: first source wins
const sourceStatus = [];
let totalRaw = 0;

results.forEach((res, i) => {
  const src = sources[i];
  if (res.status === "fulfilled") {
    let count = 0;
    for (const item of res.value) {
      totalRaw++;
      if (!item?.url || !item?.title) continue;
      if (!TYPES.includes(item.type)) continue;
      if (!byId.has(item.id)) byId.set(item.id, item);
      count++;
    }
    sourceStatus.push({ id: src.id, name: src.name, ok: true, count, url: src.homeUrl });
    console.log(`  ✓ ${src.id.padEnd(24)} ${count} items`);
  } else {
    sourceStatus.push({ id: src.id, name: src.name, ok: false, count: 0, error: String(res.reason?.message || res.reason), url: src.homeUrl });
    console.error(`  ✗ ${src.id.padEnd(24)} ${res.reason?.message || res.reason}`);
  }
});

// ---- merge with previous dataset -------------------------------------------
const now = new Date().toISOString();
const nowMs = Date.now();
const prev = existsSync(OUT_JSON) ? JSON.parse(await readFile(OUT_JSON, "utf8")) : null;
const prevById = new Map((prev?.opportunities || []).map((o) => [o.id, o]));

const merged = [];
for (const item of byId.values()) {
  const old = prevById.get(item.id);
  const firstSeen = old?.firstSeen || item.postedDate || now;
  merged.push({ ...item, firstSeen, lastSeen: now });
}

// Keep items that were seen recently even if a source failed this run (TTL).
for (const old of prevById.values()) {
  if (byId.has(old.id)) continue;
  const ageMs = nowMs - Date.parse(old.lastSeen || old.firstSeen);
  if (ageMs < config.ttlDays * 24 * 3600 * 1000) merged.push(old);
}
merged.sort((a, b) => Date.parse(b.firstSeen) - Date.parse(a.firstSeen));
const opportunities = merged.slice(0, config.maxItems);

// ---- write dataset ----------------------------------------------------------
const counts = Object.fromEntries(TYPES.map((t) => [t, 0]));
for (const o of opportunities) counts[o.type]++;
const dataset = {
  meta: {
    generatedAt: now,
    total: opportunities.length,
    counts,
    sources: sourceStatus,
    ttlDays: config.ttlDays,
  },
  opportunities,
};
await mkdir(DATA_DIR, { recursive: true });
await writeFile(OUT_JSON, JSON.stringify(dataset));
console.log(
  `\nWrote ${opportunities.length} opportunities (${counts.internship} internships, ` +
    `${counts.fellowship} fellowships, ${counts.apprenticeship} apprenticeships, ${counts.scholarship} scholarships)`
);

// ---- write RSS feed ----------------------------------------------------------
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const rssItems = opportunities
  .slice(0, 150)
  .map(
    (o) => `    <item>
      <title>[${o.type}] ${esc(o.title)} — ${esc(o.organization)}</title>
      <link>${esc(o.url)}</link>
      <guid isPermaLink="false">${o.id}</guid>
      <pubDate>${new Date(o.firstSeen).toUTCString()}</pubDate>
      <description>${esc(o.description || o.title)}</description>
    </item>`
  )
  .join("\n");
await writeFile(
  OUT_RSS,
  `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>OpportunityRadar — fresh internships, fellowships, apprenticeships & scholarships</title>
  <link>https://opportunityradar.example</link>
  <description>Auto-updated every 3 hours. Be the first to know.</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rssItems}
</channel></rss>`
);
console.log("Wrote public/feed.xml");
