// Remotive remote jobs API — filtered for early-career opportunity keywords.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, extractDeadline, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

export default {
  id: "remotive",
  name: "Remotive",
  homeUrl: "https://remotive.com",
  async fetchOpportunities() {
    const data = await fetchJson("https://remotive.com/api/remote-jobs?limit=100");
    const out = [];
    for (const j of data?.jobs || []) {
      const title = stripHtml(j.title || "", 140);
      const company = stripHtml(j.company_name || "", 80);
      if (!title || !company) continue;
      const type = classifyType(`${title} ${j.category || ""}`);
      if (!type) continue;
      const desc = stripHtml(j.description || "", 200);
      out.push({
        id: makeId(j.url),
        title,
        organization: company,
        type,
        location: j.candidate_required_location ? stripHtml(j.candidate_required_location, 80) : null,
        region: detectRegion(j.candidate_required_location || "Remote"),
        remote: true,
        url: j.url,
        deadline: extractDeadline(desc),
        postedDate: j.publication_date ? new Date(j.publication_date).toISOString() : null,
        source: this.id,
        sourceName: this.name,
        tags: [j.category].filter(Boolean),
        description: desc || null,
      });
    }
    return out;
  },
};
