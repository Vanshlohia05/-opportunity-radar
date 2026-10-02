"use client";

import React, { useState, useMemo } from "react";
import type { Opportunity, OpportunityType } from "../types";
import { VANSH_PROFILE, matchOpportunityForVansh } from "../data/vanshProfile";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allOpportunities: Opportunity[];
  onApplyProfileFilterToBoard: () => void;
  isProfileFilterActiveOnBoard: boolean;
}

export const ProfileSideSection: React.FC<Props> = ({
  isOpen,
  onClose,
  allOpportunities,
  onApplyProfileFilterToBoard,
  isProfileFilterActiveOnBoard,
}) => {
  const [activeTab, setActiveTab] = useState<"matches" | "profile">("matches");
  const [typeFilter, setTypeFilter] = useState<OpportunityType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Compute matched opportunities with scores and reasons
  const matchedOpportunities = useMemo(() => {
    return allOpportunities
      .map((opp) => {
        const match = matchOpportunityForVansh(opp);
        return {
          ...opp,
          matchScore: match.score,
          matchReasons: match.reasons,
          isMatch: match.isMatch,
        };
      })
      .filter((opp) => opp.isMatch)
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [allOpportunities]);

  // Counts by type
  const counts = useMemo(() => {
    const c = { scholarship: 0, fellowship: 0, apprenticeship: 0, internship: 0 };
    matchedOpportunities.forEach((m) => {
      if (c[m.type] !== undefined) c[m.type]++;
    });
    return c;
  }, [matchedOpportunities]);

  // Filtered matched list based on sub-tab/type inside sidebar
  const displayedMatches = useMemo(() => {
    let list = matchedOpportunities;
    if (typeFilter !== "all") {
      list = list.filter((m) => m.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.organization.toLowerCase().includes(q) ||
          m.matchReasons.some((r) => r.toLowerCase().includes(q))
      );
    }
    return list;
  }, [matchedOpportunities, typeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-lg font-bold text-white shadow-md shadow-cyan-500/20">
            VL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{VANSH_PROFILE.name}</h2>
              <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                Verified CV
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{VANSH_PROFILE.headline}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Close Sidebar"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 px-5 pt-2">
        <button
          onClick={() => setActiveTab("matches")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "matches"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>🎯 Matched for Vansh</span>
          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[10px] text-cyan-300">
            {matchedOpportunities.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all ${
            activeTab === "profile"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <span>👤 CV & Background</span>
        </button>
      </div>

      {/* Tab 1: Matched Opportunities */}
      {activeTab === "matches" && (
        <div className="flex flex-1 flex-col overflow-hidden p-5">
          {/* Action Bar */}
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Found {matchedOpportunities.length} curated matches
              </p>
              <p className="text-[11px] text-slate-400">
                Targeting BBA, SahiRaasta leadership & community impact
              </p>
            </div>

            <button
              onClick={onApplyProfileFilterToBoard}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                isProfileFilterActiveOnBoard
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20"
              }`}
            >
              {isProfileFilterActiveOnBoard ? "✕ Clear Main Board Filter" : "📌 Sync to Main Board"}
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setTypeFilter("all")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                typeFilter === "all"
                  ? "bg-slate-200 text-slate-900"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              All ({matchedOpportunities.length})
            </button>
            <button
              onClick={() => setTypeFilter("scholarship")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                typeFilter === "scholarship"
                  ? "bg-emerald-500 text-black"
                  : "bg-slate-900 text-emerald-400 border border-slate-800 hover:border-emerald-500/40"
              }`}
            >
              🏆 Scholarships ({counts.scholarship})
            </button>
            <button
              onClick={() => setTypeFilter("fellowship")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                typeFilter === "fellowship"
                  ? "bg-purple-500 text-white"
                  : "bg-slate-900 text-purple-400 border border-slate-800 hover:border-purple-500/40"
              }`}
            >
              🔬 Fellowships ({counts.fellowship})
            </button>
            <button
              onClick={() => setTypeFilter("apprenticeship")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                typeFilter === "apprenticeship"
                  ? "bg-amber-500 text-black"
                  : "bg-slate-900 text-amber-400 border border-slate-800 hover:border-amber-500/40"
              }`}
            >
              🛠️ Apprenticeships ({counts.apprenticeship})
            </button>
            <button
              onClick={() => setTypeFilter("internship")}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                typeFilter === "internship"
                  ? "bg-sky-500 text-black"
                  : "bg-slate-900 text-sky-400 border border-slate-800 hover:border-sky-500/40"
              }`}
            >
              🎓 Internships ({counts.internship})
            </button>
          </div>

          {/* Search within sidebar */}
          <div className="relative mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search within Vansh's matches..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          </div>

          {/* Matches List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {displayedMatches.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 transition-all hover:border-cyan-500/40 hover:bg-slate-900/90"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      opp.type === "scholarship"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : opp.type === "fellowship"
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                        : opp.type === "apprenticeship"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    }`}
                  >
                    {opp.type}
                  </span>

                  <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 rounded px-1.5 py-0.5">
                    Match Score: {opp.matchScore}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                  {opp.title}
                </h4>

                <p className="text-xs text-slate-300 font-medium mt-1">{opp.organization}</p>

                <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-slate-400">
                  {opp.location && <span>📍 {opp.location}</span>}
                  {opp.remote && <span className="text-cyan-300 font-medium">• 🌐 Remote</span>}
                </div>

                {/* Match Reasons */}
                <div className="mt-2.5 flex flex-wrap gap-1">
                  {opp.matchReasons.map((r, i) => (
                    <span
                      key={i}
                      className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300"
                    >
                      ✨ {r}
                    </span>
                  ))}
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">via {opp.sourceName}</span>
                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-cyan-500 px-2.5 py-1 text-xs font-bold text-black hover:bg-cyan-400 transition-colors"
                  >
                    Apply Now →
                  </a>
                </div>
              </div>
            ))}

            {displayedMatches.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                No opportunities match the current filter.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Profile & CV Details */}
      {activeTab === "profile" && (
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Quick Contact Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
              Contact & Location
            </h3>
            <p className="text-xs text-slate-200">📍 {VANSH_PROFILE.location}</p>
            <p className="text-xs text-slate-200 mt-1">✉️ {VANSH_PROFILE.email}</p>
            <p className="text-xs text-slate-200 mt-1">📞 {VANSH_PROFILE.phone}</p>
            <p className="text-xs text-slate-400 mt-2">
              Languages: {VANSH_PROFILE.languages.join(", ")}
            </p>
          </div>

          {/* Education */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              🎓 Education
            </h3>
            <div className="space-y-3">
              {VANSH_PROFILE.education.map((edu, idx) => (
                <div key={idx} className="border-l-2 border-cyan-500/40 pl-3">
                  <h4 className="text-xs font-bold text-white">{edu.degree}</h4>
                  <p className="text-xs text-slate-300">{edu.institution}</p>
                  <p className="text-[11px] text-slate-400">
                    {edu.duration} • <span className="text-cyan-300">{edu.score}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Initiatives / Projects */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                🚀 Key Initiatives & Vibe-Coded Products
              </h3>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                ⚡ 100% AI-Driven
              </span>
            </div>
            <div className="space-y-4">
              {VANSH_PROFILE.projects.map((proj, idx) => (
                <div key={idx} className="border-l-2 border-indigo-500/40 pl-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white">{proj.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{proj.period}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-indigo-300">{proj.role}</p>

                  {proj.tags && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {proj.tags.map((t, ti) => (
                        <span
                          key={ti}
                          className="rounded bg-indigo-950/60 border border-indigo-800/40 px-1.5 py-0.5 text-[9px] font-medium text-indigo-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{proj.description}</p>

                  {proj.url && (
                    <div className="mt-2.5">
                      <a
                        href={proj.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500 hover:text-black transition-all shadow-sm"
                      >
                        <span>🌐</span>
                        <span>Visit Live Site</span>
                        <span>↗</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              💼 Professional & Volunteer Experience
            </h3>
            <div className="space-y-4">
              {VANSH_PROFILE.experience.map((exp, idx) => (
                <div key={idx} className="border-l-2 border-emerald-500/40 pl-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white">{exp.role}</h4>
                    <span className="text-[10px] text-slate-400">{exp.period}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-300">{exp.organization}</p>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              ⚡ Core Competencies
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {VANSH_PROFILE.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-slate-800 border border-slate-700/60 px-2.5 py-1 text-xs text-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
