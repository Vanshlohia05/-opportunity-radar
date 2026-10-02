// Hacker News "Who is hiring?" thread scanner via the free Algolia HN Search API.
// Comments in the monthly thread are often the *earliest* public signal for
// internships/apprenticeships before they hit any job board.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

export default {
  id: "hackernews",
  name: "Hacker News (Who is hiring)",
  homeUrl: "https://news.ycombinator.com",
  async fetchOpportunities() {
    // 1. Find the latest monthly thread
    const stories = await fetchJson(
      'https://hn.algolia.com/api/v1/search_by_date?query="Ask HN: Who is hiring"&tags=story&hitsPerPage=5'
    );
    const story = (stories?.hits || []).find((h) => /ask hn: who is hiring/i.test(h.title || ""));
    if (!story) return [];

    // 2. Pull newest comments from that thread
    const comments = await fetchJson(
      `https://hn.algolia.com/api/v1/search_by_date?tags=comment,story_${story.objectID}&hitsPerPage=250`
    );

    const out = [];
    for (const c of comments?.hits || []) {
      const text = stripHtml(c.comment_text || "", 300);
      if (!text) continue;
      const type = classifyType(text);
      if (!type) continue;
      // "Company | Role | Location" is the thread convention
      const firstLine = text.split(/(?<=[.!?)])\s/)[0] || text;
      const parts = firstLine.split(/\s*[|•·—]\s*/).filter(Boolean);
      const organization = (parts[0] || "").slice(0, 80) || "Hacker News poster";
      const titleGuess = parts[1] ? `${parts[0]} — ${parts[1]}` : firstLine.slice(0, 120);
      out.push({
        id: makeId(`https://news.ycombinator.com/item?id=${c.objectID}`),
        title: titleGuess.slice(0, 140),
        organization,
        type,
        location: parts[2] ? parts[2].slice(0, 80) : null,
        region: detectRegion(parts[2] || ""),
        remote: /remote/i.test(text.slice(0, 200)),
        url: `https://news.ycombinator.com/item?id=${c.objectID}`,
        deadline: null,
        postedDate: c.created_at || null,
        source: this.id,
        sourceName: this.name,
        tags: ["early signal"],
        description: text,
      });
      if (out.length >= 40) break;
    }
    return out;
  },
};
