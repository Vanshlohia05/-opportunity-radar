// Arbeitnow job board API — strong source for German "Ausbildung" apprenticeships.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, extractDeadline, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

export default {
  id: "arbeitnow",
  name: "Arbeitnow",
  homeUrl: "https://www.arbeitnow.com",
  async fetchOpportunities() {
    const data = await fetchJson("https://www.arbeitnow.com/api/job-board-api");
    const out = [];
    for (const j of data?.data || []) {
      const title = stripHtml(j.title || "", 140);
      const company = stripHtml(j.company_name || "", 80);
      if (!title || !company) continue;
      const tags = Array.isArray(j.tags) ? j.tags.join(" ") : "";
      const jobTypes = Array.isArray(j.job_types)
        ? j.job_types.map((t) => (typeof t === "string" ? t : t?.name || "")).join(" ")
        : "";
      const type = classifyType(`${title} ${tags} ${jobTypes}`);
      if (!type) continue;
      const desc = stripHtml(j.description || "", 200);
      out.push({
        id: makeId(j.url || `https://www.arbeitnow.com${j.slug ? `/jobs/${j.slug}` : ""}`),
        title,
        organization: company,
        type,
        location: j.location ? stripHtml(j.location, 80) : null,
        region: detectRegion(j.location || (j.remote ? "Remote" : "Germany")),
        remote: Boolean(j.remote) || /remote/i.test(j.location || ""),
        url: j.url || `https://www.arbeitnow.com/jobs/${j.slug}`,
        deadline: extractDeadline(desc),
        postedDate: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
        source: this.id,
        sourceName: this.name,
        tags: (Array.isArray(j.tags) ? j.tags : []).slice(0, 4),
        description: desc || null,
      });
    }
    return out;
  },
};
