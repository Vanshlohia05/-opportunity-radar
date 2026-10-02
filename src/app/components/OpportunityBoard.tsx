"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Dataset, Opportunity, OpportunityType } from "../types";
import { OpportunityCard } from "./OpportunityCard";
import { ProfileSideSection } from "./ProfileSideSection";
import { matchOpportunityForVansh, VANSH_PROFILE } from "../data/vanshProfile";

interface Props {
  initialData: Dataset;
}

const ITEMS_PER_PAGE = 24;

export const OpportunityBoard: React.FC<Props> = ({ initialData }) => {
  const [data, setData] = useState<Dataset>(initialData);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<OpportunityType | "all">("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [onlyFresh, setOnlyFresh] = useState(false);
  const [onlyVanshMatches, setOnlyVanshMatches] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "deadline" | "alpha">("newest");
  const [page, setPage] = useState(1);
  const [rssCopied, setRssCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Background polling every 4 minutes to catch fresh auto-updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsUpdating(true);
        const res = await fetch("/data/opportunities.json", { cache: "no-store" });
        if (res.ok) {
          const freshData: Dataset = await res.json();
          setData(freshData);
        }
      } catch (err) {
        console.warn("Silent background poll failed:", err);
      } finally {
        setIsUpdating(false);
      }
    }, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedType, selectedRegion, onlyRemote, onlyFresh, onlyVanshMatches, sortBy]);

  // Count of matched opportunities for Vansh
  const vanshMatchesCount = useMemo(() => {
    return data.opportunities.filter((o) => matchOpportunityForVansh(o).isMatch).length;
  }, [data.opportunities]);

  // Unique regions list from dataset
  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    data.opportunities.forEach((o) => {
      if (o.region) set.add(o.region);
    });
    return Array.from(set).sort();
  }, [data.opportunities]);

  // Filtered and sorted opportunities
  const filtered = useMemo(() => {
    let list = data.opportunities;

    // Filter by Vansh's CV match
    if (onlyVanshMatches) {
      list = list.filter((o) => matchOpportunityForVansh(o).isMatch);
    }

    // Filter by Type
    if (selectedType !== "all") {
      list = list.filter((o) => o.type === selectedType);
    }

    // Filter by Region
    if (selectedRegion !== "all") {
      list = list.filter((o) => o.region === selectedRegion);
    }

    // Filter by Remote
    if (onlyRemote) {
      list = list.filter((o) => o.remote);
    }

    // Filter by Freshness (< 72 hours)
    if (onlyFresh) {
      const cutoff = Date.now() - 72 * 60 * 60 * 1000;
      list = list.filter((o) => new Date(o.firstSeen).getTime() >= cutoff);
    }

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o) => {
        return (
          o.title.toLowerCase().includes(q) ||
          o.organization.toLowerCase().includes(q) ||
          (o.location && o.location.toLowerCase().includes(q)) ||
          (o.description && o.description.toLowerCase().includes(q)) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "deadline") {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (sortBy === "alpha") {
        return a.organization.localeCompare(b.organization);
      }
      // default: newest discovered first
      return new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime();
    });
  }, [data.opportunities, selectedType, selectedRegion, onlyRemote, onlyFresh, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  const copyRssLink = () => {
    const url = window.location.origin + "/feed.xml";
    navigator.clipboard.writeText(url);
    setRssCopied(true);
    setTimeout(() => setRssCopied(false), 2500);
  };

  const timeSinceSync = useMemo(() => {
    if (!data.meta?.generatedAt) return "Just now";
    const min = Math.round((Date.now() - new Date(data.meta.generatedAt).getTime()) / 60000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    const h = Math.round(min / 60);
    return `${h}h ago`;
  }, [data.meta?.generatedAt]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header Bar */}
      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-slate-800/80 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-xl shadow-lg shadow-cyan-500/20">
              📡
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Opportunity<span className="text-cyan-400">Radar</span>
                <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 tracking-normal uppercase">
                  Early Bird
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Catch internships, fellowships, apprenticeships & scholarships before the crowd.
              </p>
            </div>
          </div>
        </div>

        {/* Live sync pill & actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUpdating ? "bg-amber-400" : "bg-emerald-400"} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isUpdating ? "bg-amber-500" : "bg-emerald-500"}`} />
            </span>
            <span>
              {isUpdating ? "Syncing..." : `Auto-updated ${timeSinceSync}`}
            </span>
          </div>

          <button
            onClick={copyRssLink}
            className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/90 px-3.5 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-500 hover:text-cyan-300 transition-colors"
            title="Subscribe with any RSS reader (Slack, Discord, Feedly) for instant alerts"
          >
            <span>📡</span>
            <span>{rssCopied ? "Feed URL Copied!" : "RSS Alerts"}</span>
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2 rounded-full border border-indigo-500/40 bg-indigo-950/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:border-indigo-400 hover:bg-indigo-900/80 transition-all shadow-md shadow-indigo-950/40"
          >
            <span>👤</span>
            <span>Vansh's CV Matches ({vanshMatchesCount})</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </button>

          <button
            onClick={() => setShowSources(!showSources)}
            className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>ℹ️ Sources ({data.meta?.sources?.length || 0})</span>
          </button>

          <a
            href="https://github.com/Vanshlohia05/-opportunity-radar"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
            title="View Open Source Repository on GitHub"
          >
            <span>⭐</span>
            <span>GitHub</span>
          </a>
        </div>
      </header>

      {/* Monitored Sources Drawer */}
      {showSources && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Automated Data Sources Monitored
            </h3>
            <span className="text-xs text-slate-400">
              Scraped and synced every 3 hours via GitHub Actions
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.meta?.sources?.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-xs"
              >
                <div className="truncate mr-2">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-200 hover:text-cyan-400 hover:underline"
                  >
                    {s.name}
                  </a>
                  <p className="text-[11px] text-slate-400">{s.count} items active</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    s.ok
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {s.ok ? "Healthy" : "Offline"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row: 4 Category Cards */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {[
          {
            type: "internship" as OpportunityType,
            label: "Internships",
            count: data.meta.counts.internship || 0,
            icon: "🎓",
            accent: "from-sky-500/20 to-blue-500/5 hover:border-sky-500/50",
            activeBorder: "border-sky-500 ring-1 ring-sky-500",
            textColor: "text-sky-400",
          },
          {
            type: "fellowship" as OpportunityType,
            label: "Fellowships",
            count: data.meta.counts.fellowship || 0,
            icon: "🔬",
            accent: "from-purple-500/20 to-indigo-500/5 hover:border-purple-500/50",
            activeBorder: "border-purple-500 ring-1 ring-purple-500",
            textColor: "text-purple-400",
          },
          {
            type: "apprenticeship" as OpportunityType,
            label: "Apprenticeships",
            count: data.meta.counts.apprenticeship || 0,
            icon: "🛠️",
            accent: "from-amber-500/20 to-yellow-500/5 hover:border-amber-500/50",
            activeBorder: "border-amber-500 ring-1 ring-amber-500",
            textColor: "text-amber-400",
          },
          {
            type: "scholarship" as OpportunityType,
            label: "Scholarships",
            count: data.meta.counts.scholarship || 0,
            icon: "🏆",
            accent: "from-emerald-500/20 to-teal-500/5 hover:border-emerald-500/50",
            activeBorder: "border-emerald-500 ring-1 ring-emerald-500",
            textColor: "text-emerald-400",
          },
        ].map((item) => {
          const isSelected = selectedType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => setSelectedType(isSelected ? "all" : item.type)}
              className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 text-left transition-all duration-200 cursor-pointer ${
                item.accent
              } ${isSelected ? item.activeBorder : "border-slate-800 bg-slate-900/40"}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xl">{item.icon}</span>
                <span className={`text-2xl font-black ${item.textColor}`}>
                  {item.count.toLocaleString()}
                </span>
              </div>
              <h3 className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {item.label}
              </h3>
            </button>
          );
        })}
      </section>

      {/* Filter and Search Bar */}
      <section className="mt-8 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md">
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              🔍
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role, company, skills (e.g. AI, Software, Finance, London)..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/70 py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Region Dropdown */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">📍 All Locations</option>
            {availableRegions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-700/80 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="newest">⚡ Newest Discovered (Early Bird)</option>
            <option value="deadline">⏰ Closing Soonest</option>
            <option value="alpha">🏢 Company (A-Z)</option>
          </select>
        </div>

        {/* Toggles & Category Chips */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedType("all")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                selectedType === "all"
                  ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-750"
              }`}
            >
              All Types ({data.opportunities.length})
            </button>
            {(["internship", "fellowship", "apprenticeship", "scholarship"] as OpportunityType[]).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                  selectedType === t
                    ? "bg-cyan-500 text-black shadow-md shadow-cyan-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-750"
                }`}
              >
                {t}s ({data.meta.counts[t] || 0})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyVanshMatches(!onlyVanshMatches)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                onlyVanshMatches
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🎯</span>
              <span>Matched for Vansh ({vanshMatchesCount})</span>
            </button>

            <button
              onClick={() => setOnlyFresh(!onlyFresh)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                onlyFresh
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ⚡ Added &lt; 72h
            </button>

            <button
              onClick={() => setOnlyRemote(!onlyRemote)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                onlyRemote
                  ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>🌐</span>
              Remote Only
            </button>
          </div>
        </div>
      </section>

      {/* Results Header */}
      <div className="mt-8 flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{filtered.length}</span> opportunities
          {filtered.length !== data.opportunities.length && ` (filtered from ${data.opportunities.length})`}
        </div>
        <div>
          Page <span className="font-semibold text-slate-200">{page}</span> of {totalPages}
        </div>
      </div>

      {/* Opportunity Cards Grid */}
      {paginated.length > 0 ? (
        <section className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginated.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </section>
      ) : (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-800 p-12 text-center">
          <span className="text-4xl">🔭</span>
          <h3 className="mt-3 text-lg font-bold text-slate-200">No opportunities match your filter</h3>
          <p className="mt-1 text-sm text-slate-400">
            Try clearing search keywords or turning off the strict filters.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSelectedType("all");
              setSelectedRegion("all");
              setOnlyRemote(false);
              setOnlyFresh(false);
            }}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-slate-750 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="px-3 text-xs text-slate-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </nav>
      )}

      {/* Footer Info */}
      <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-12 text-center text-xs text-slate-400">
        <p>
          OpportunityRadar automates continuous web surveillance across official job boards, university scholarship feeds, and community GitHub directories.
        </p>
        <p className="mt-2">
          New listings are indexed automatically every 3 hours. Subscribe to the{" "}
          <a href="/feed.xml" className="text-cyan-400 hover:underline font-medium">
            RSS feed
          </a>{" "}
          to receive early notifications the moment an application opens.
        </p>
      </footer>

      {/* Vansh's Profile & Matched Opportunities Side Section */}
      <ProfileSideSection
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        allOpportunities={data.opportunities}
        onApplyProfileFilterToBoard={() => setOnlyVanshMatches(!onlyVanshMatches)}
        isProfileFilterActiveOnBoard={onlyVanshMatches}
      />

      {/* Floating launcher button for Vansh's CV matches */}
      {!isProfileOpen && (
        <button
          onClick={() => setIsProfileOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-white shadow-xl shadow-indigo-600/30 hover:scale-105 hover:shadow-cyan-500/40 transition-all border border-indigo-400/30"
          title="Open Vansh's Matched Opportunities & CV Profile"
        >
          <span>👤</span>
          <span>Vansh's CV Matches ({vanshMatchesCount})</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
        </button>
      )}
    </div>
  );
};
