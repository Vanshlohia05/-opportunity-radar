# 📡 OpportunityRadar

> **Catch fresh internships, fellowships, apprenticeships & scholarships before the crowd.**  
> Continuously crawls raw sources, monitors early-signal discussion boards, and auto-updates every 3 hours.

---

## ⚡ The Early-Bird Differentiator

Most job portals and scholarship engines crawl aggregators with days or weeks of delay. **OpportunityRadar** bypasses aggregators by pulling directly from:
- **Upstream Git Repositories**: Community repos where recruiters push new openings directly (e.g. SimplifyJobs, Summer tech lists).
- **Early-Signal Feeds**: Hacker News "Who is hiring" threads and developer community boards.
- **Direct Career APIs**: European & global boards (Arbeitnow, RemoteOK, Jobicy, Remotive, USAJobs Pathways).
- **University & Global Grant Feeds**: Opportunity Desk, Scholars4Dev, After School Africa, Scholarships Corner.

### 🕒 `firstSeen` Timestamp Tracking
Every opportunity's canonical URL is fingerprinted. The engine records a persistent `firstSeen` timestamp:
- Any position discovered within the last 72 hours gets an active **⚡ NEW** badge.
- Sorting by **Newest Discovered** ensures you apply within minutes or hours of a posting going live, maximizing interview and grant conversion rates.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ installed
- npm / pnpm / bun

### 1. Installation
```bash
git clone https://github.com/your-username/opportunity-radar.git
cd opportunity-radar
npm install
```

### 2. Run Data Pipeline (Harvest Fresh Listings)
```bash
npm run fetch
```
This queries all 8+ integrated sources, deduplicates links, parses deadlines, updates `public/data/opportunities.json`, and generates an RSS feed at `public/feed.xml`.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Continuous 3-Hour Auto-Update

The site runs on autopilot via GitHub Actions:
- **Cron Workflow**: Defined in `.github/workflows/update-data.yml`. Runs every 3 hours (`15 */3 * * *`).
- **Zero Cost / Serverless**: The GitHub Action runs `node scripts/fetch.mjs` and commits the updated `public/data/opportunities.json` back to the repository.
- **Live Client Polling**: The frontend checks for fresh data every 4 minutes and hot-reloads the list without requiring a manual browser refresh.
- **RSS Early-Alert Feed**: Anyone can subscribe to `/feed.xml` in Slack, Discord, Feedly, or Telegram to receive notifications the moment new postings drop.

---

## 🛠️ Adding New Sources

### Adding an RSS / Atom Feed (Zero Code)
Simply open `data/sources.json` and append your feed:
```json
{
  "id": "my-university-feed",
  "name": "University Fellowship Board",
  "url": "https://example.org/fellowships/feed/",
  "homeUrl": "https://example.org",
  "region": "United States"
}
```

### Adding a Custom API Fetcher
Create a new file in `scripts/sources/my-source.mjs`:
```javascript
export default {
  id: "my-source",
  name: "My Source Name",
  homeUrl: "https://example.com",
  async fetchOpportunities() {
    // Return array of normalized Opportunity objects
    return [];
  }
};
```
Then import it in `scripts/fetch.mjs`.

---

## 🌐 Deploy to Vercel or GitHub Pages

### Deploying on Vercel (Recommended)
1. Push this directory to your GitHub repository.
2. Import the project into [Vercel](https://vercel.com).
3. Every time the GitHub Action commits new data, Vercel automatically deploys the latest build!

### Optional Environment Variables
- `USAJOBS_API_KEY`: API Key for Federal Pathways opportunities.
- `USAJOBS_EMAIL`: Registered contact email for USAJobs API.
