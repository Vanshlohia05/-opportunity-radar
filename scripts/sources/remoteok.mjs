// RemoteOK public API — filtered for internships/fellowships/apprenticeships.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

export default {
  id: "remoteok",
  name: "RemoteOK",
  homeUrl: "https://remoteok.com",
  async fetchOpportunities() {
    const data = await fetchJson("https://remoteok.com/api");
    if (!Array.isArray(data)) return [];
    const out = [];
    for (const j of data) {
      if (!j || typeof j !== "object" || j.legal) continue; // first element is a legal notice
      const title = stripHtml(j.position || j.title || "", 140);
      const company = stripHtml(j.company || j.company_name || "", 80);
      if (!title || !company) continue;
      const tags = Array.isArray(j.tags) ? j.tags.join(" ") : "";
      // Classify on title + tags only (descriptions are too noisy).
      const type = classifyType(`${title} ${tags}`);
      if (!type) continue;
      out.push({
        id: makeId(j.url || `https://remoteok.com/remote-jobs/${j.slug}`),
        title,
        organization: company,
        type,
        location: j.location ? stripHtml(j.location, 80) : null,
        region: detectRegion(j.location || "Remote"),
        remote: true,
        url: j.url || `https://remoteok.com/remote-jobs/${j.slug}`,
        deadline: null,
        postedDate: j.date ? new Date(j.date).toISOString() : j.epoch ? new Date(j.epoch * 1000).toISOString() : null,
        source: this.id,
        sourceName: this.name,
        tags: (Array.isArray(j.tags) ? j.tags : []).slice(0, 4),
        description: stripHtml(j.description || "", 200) || null,
      });
    }
    return out;
  },
};
