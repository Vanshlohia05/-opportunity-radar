import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Dataset } from "./types";
import { OpportunityBoard } from "./components/OpportunityBoard";

export const revalidate = 300; // Cache on edge for up to 5 minutes

function getInitialData(): Dataset {
  const filePath = resolve(process.cwd(), "public/data/opportunities.json");
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.warn("Could not read opportunities.json during build/render:", err);
    }
  }

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      total: 0,
      counts: {
        internship: 0,
        fellowship: 0,
        apprenticeship: 0,
        scholarship: 0,
      },
      sources: [],
      ttlDays: 45,
    },
    opportunities: [],
  };
}

export default function HomePage() {
  const initialData = getInitialData();
  return (
    <main className="min-h-screen bg-[#070b14]">
      <OpportunityBoard initialData={initialData} />
    </main>
  );
}
