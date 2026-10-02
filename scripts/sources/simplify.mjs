// SimplifyJobs curated internship lists (community-maintained, updated near-daily).
// https://github.com/SimplifyJobs/Summer2026-Internships
import { fetchJson } from "../lib/http.mjs";
import { classifyType, extractDeadline, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

const REPOS = [
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
  "https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json",
];

function toStr(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return typeof v === "string" ? v : "";
}

export default {
  id: "simplify",
  name: "Simplify Internships (GitHub)",
  homeUrl: "https://github.com/SimplifyJobs/Summer2026-Internships",
  async fetchOpportunities() {
    const out = [];
    for (const url of REPOS) {
      try {
        const listings = await fetchJson(url);
        if (!Array.isArray(listings)) continue;
        for (const l of listings) {
          if (l.active === false) continue;
          const link = l.url || l.apply_url || l.link;
          if (!link) continue;
          const title = stripHtml(l.title || "", 140);
          const company = stripHtml(l.company_name || l.company || "", 80);
          if (!title || !company) continue;
          const location = toStr(l.locations || l.location);
          const posted =
            l.date_posted && Number.isFinite(+l.date_posted)
              ? new Date(+l.date_posted * (String(l.date_posted).length > 10 ? 1 : 1000)).toISOString()
              : null;
          out.push({
            id: makeId(link),
            title,
            organization: company,
            type: classifyType(title) || "internship",
            location: location || null,
            region: detectRegion(location),
            remote: /remote/i.test(location),
            url: link,
            deadline: extractDeadline(title),
            postedDate: posted,
            source: this.id,
            sourceName: this.name,
            tags: [l.category, ...toStr(l.terms).split(/[,;] */)].filter(Boolean).slice(0, 4),
            description: null,
          });
        }
        break; // first repo that works is enough
      } catch (err) {
        console.error(`  [simplify] ${url} failed: ${err.message}`);
      }
    }
    return out;
  },
};
