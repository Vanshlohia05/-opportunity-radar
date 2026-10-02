// USAJobs (US government) — Pathways internships, apprenticeships, fellowships & scholarships.
// OPTIONAL: requires two free credentials from https://developer.usajobs.gov/
// Set USAJOBS_API_KEY and USAJOBS_EMAIL env vars; the source silently skips otherwise.
import { fetchJson } from "../lib/http.mjs";
import { classifyType, detectRegion, makeId, stripHtml } from "../lib/util.mjs";

const QUERIES = ["internship", "apprenticeship", "fellowship", "scholarship"];

export default {
  id: "usajobs",
  name: "USAJobs (US Gov)",
  homeUrl: "https://www.usajobs.gov",
  async fetchOpportunities() {
    const key = process.env.USAJOBS_API_KEY;
    const email = process.env.USAJOBS_EMAIL;
    if (!key || !email) {
      console.log("  [usajobs] skipped — set USAJOBS_API_KEY + USAJOBS_EMAIL to enable");
      return [];
    }
    const out = [];
    for (const q of QUERIES) {
      try {
        const data = await fetchJson(
          `https://data.usajobs.gov/api/search?Keyword=${encodeURIComponent(q)}&ResultsPerPage=50&SortField=OpenDate`,
          { headers: { "User-Agent": email, "Authorization-Key": key } }
        );
        for (const j of data?.SearchResult?.SearchResultItems || []) {
          const d = j.MatchedObjectDescriptor;
          if (!d) continue;
          const title = stripHtml(d.PositionTitle || "", 140);
          const org = stripHtml(d.OrganizationName || "", 80);
          const uri = d.PositionURI;
          if (!title || !org || !uri) continue;
          const type = classifyType(`${title} ${q}`) || "internship";
          const loc = Array.isArray(d.PositionLocation) && d.PositionLocation[0]
            ? `${d.PositionLocation[0].CityName || ""}, ${d.PositionLocation[0].CountrySubDivisionName || ""}`.replace(/^, |, $/g, "")
            : null;
          out.push({
            id: makeId(uri),
            title,
            organization: org,
            type,
            location: loc,
            region: loc ? detectRegion(loc) : "United States",
            remote: false,
            url: uri,
            deadline: d.ApplicationCloseDate ? d.ApplicationCloseDate.slice(0, 10) : null,
            postedDate: d.PublicationStartDate ? d.PublicationStartDate.slice(0, 10) : null,
            source: this.id,
            sourceName: this.name,
            tags: ["US government", "Pathways"],
            description: stripHtml(d.UserArea?.Details?.MajorDuties?.join(" ") || "", 200) || null,
          });
        }
      } catch (err) {
        console.error(`  [usajobs] query "${q}" failed: ${err.message}`);
      }
    }
    return out;
  },
};
