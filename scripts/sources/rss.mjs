import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "../lib/http.mjs";
import { classifyType, extractDeadline, makeId, stripHtml, detectRegion } from "../lib/util.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourcesPath = resolve(__dirname, "../../data/sources.json");

function extract(block, tag) {
  const tagStr = typeof tag === "string" ? tag : tag.source;
  const m = block.match(new RegExp(`<(${tagStr})[^>]*>([\\s\\S]*?)</\\1>`, "i"));
  if (m && m[2]) return m[2].trim();

  // Check self-closing or attribute-based links: <link href="..." />
  const attrMatch = block.match(new RegExp(`<(${tagStr})[^>]*href=["']([^"']+)["'][^>]*\\/?>`, "i"));
  if (attrMatch && attrMatch[2]) return attrMatch[2].trim();

  return "";
}

function unwrapCdata(s) {
  if (!s || typeof s !== "string") return "";
  return s.replace(/^<!\[CDATA\[/i, "").replace(/\]\]>$/i, "").trim();
}

function parseFeed(xml, feedMeta) {
  const items = [];
  const blocks = [...xml.matchAll(/<(item|entry)[\s\S]*?<\/\1>/gi)].map((m) => m[0]);

  for (const block of blocks) {
    const rawTitle = extract(block, "title");
    const title = stripHtml(unwrapCdata(rawTitle), 160);
    if (!title) continue;

    let linkRaw = extract(block, "link");
    if (!linkRaw) {
      const guid = extract(block, "guid") || extract(block, "id");
      if (guid && /^https?:\/\//i.test(guid)) {
        linkRaw = guid;
      }
    }
    const cleanLink = unwrapCdata(linkRaw);
    const url = cleanLink || feedMeta.homeUrl;

    const descRaw = extract(block, "description") || extract(block, "content") || extract(block, "summary");
    const desc = stripHtml(unwrapCdata(descRaw), 300);

    const pubRaw = extract(block, "pubDate") || extract(block, "published") || extract(block, "updated");
    const pub = unwrapCdata(pubRaw);

    const cats = [...block.matchAll(/<category[^>]*>([\\s\\S]*?)<\/category>/gi)].map((c) =>
      stripHtml(unwrapCdata(c[1]))
    );

    const type = classifyType(`${title} ${desc} ${cats.join(" ")}`) || "scholarship";
    const region = feedMeta.region || detectRegion(`${title} ${desc}`);

    items.push({
      id: makeId(url),
      title: title.slice(0, 160),
      organization: feedMeta.name,
      type,
      location: region === "Remote" ? "Online / Worldwide" : region,
      region,
      remote: /remote|online|virtual/i.test(`${title} ${desc}`),
      url,
      deadline: extractDeadline(`${title} ${desc}`),
      postedDate: pub && !isNaN(Date.parse(pub)) ? new Date(pub).toISOString() : null,
      source: feedMeta.id,
      sourceName: feedMeta.name,
      tags: [type, ...cats.filter(Boolean)].slice(0, 4),
      description: desc || null,
    });
  }
  return items;
}

export default {
  id: "rss",
  name: "Scholarship & Fellowship Feeds",
  homeUrl: "https://opportunitydesk.org",
  async fetchOpportunities() {
    let feeds = [];
    try {
      const cfg = JSON.parse(readFileSync(sourcesPath, "utf-8"));
      feeds = cfg.rss || [];
    } catch {
      feeds = [];
    }

    const all = [];
    for (const feed of feeds) {
      try {
        const xml = await fetchText(feed.url, { retries: 1, timeoutMs: 15000 });
        const items = parseFeed(xml, feed);
        all.push(...items);
      } catch (err) {
        console.warn(`  [rss] ${feed.name} failed: ${err.message}`);
      }
    }
    return all;
  },
};

export function makeRssSource(feedMeta) {
  return {
    id: feedMeta.id,
    name: feedMeta.name,
    homeUrl: feedMeta.homeUrl || feedMeta.url,
    async fetchOpportunities() {
      const xml = await fetchText(feedMeta.url, { retries: 1, timeoutMs: 15000 });
      return parseFeed(xml, feedMeta);
    },
  };
}
