// Jobicy remote jobs API — filtered for early-career opportunity keywords.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

export default {
  id: "jobicy",
  name: "Jobicy",
  homeUrl: "https://jobicy.com",
  async fetchOpportunities() {
    const data = await fetchJson("https://jobicy.com/api/v2/remote-jobs?count=50");
    const out = [];
    for (const j of data?.jobs || []) {
      const title = stripHtml(j.jobTitle || "", 140);
      const company = stripHtml(j.companyName || "", 80);
      if (!title || !company) continue;
      const tags = Array.isArray(j.tags) ? j.tags.join(" ") : "";
      const type = classifyType(`${title} ${tags} ${j.jobLevel || ""}`);
      if (!type) continue;
      out.push({
        id: makeId(j.url || String(j.id)),
        title,
        organization: company,
        type,
        location: j.jobGeo ? stripHtml(j.jobGeo, 80) : null,
        region: detectRegion(j.jobGeo || "Remote"),
        remote: true,
        url: j.url,
        deadline: null,
        postedDate: j.pubDate ? new Date(j.pubDate).toISOString() : null,
        source: this.id,
        sourceName: this.name,
        tags: (Array.isArray(j.tags) ? j.tags : []).slice(0, 4),
        description: stripHtml(j.jobExcerpt || "", 200) || null,
      });
    }
    return out;
  },
};
