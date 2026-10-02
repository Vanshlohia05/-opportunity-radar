"use client";

import React from "react";
import type { Opportunity, OpportunityType } from "../types";

interface Props {
  opportunity: Opportunity;
}

const TYPE_CONFIG: Record<
  OpportunityType,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  internship: {
    label: "Internship",
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
  fellowship: {
    label: "Fellowship",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    dot: "bg-purple-400",
  },
  apprenticeship: {
    label: "Apprenticeship",
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  scholarship: {
    label: "Scholarship",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
};

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const ms = new Date(dateStr).getTime();
  if (isNaN(ms)) return "";
  const diffHours = Math.round((Date.now() - ms) / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.round(diffDays / 30)}mo ago`;
}

function formatDeadlineToCountdown(deadlineStr: string | null): { text: string; urgent: boolean } | null {
  if (!deadlineStr) return null;
  const deadlineMs = new Date(deadlineStr).getTime();
  if (isNaN(deadlineMs)) return { text: `Due: ${deadlineStr}`, urgent: false };

  const diffDays = Math.ceil((deadlineMs - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { text: "Closed", urgent: false };
  if (diffDays === 0) return { text: "Closes today!", urgent: true };
  if (diffDays === 1) return { text: "Closes tomorrow!", urgent: true };
  if (diffDays <= 7) return { text: `${diffDays} days left`, urgent: true };
  return { text: `Closes ${deadlineStr}`, urgent: false };
}

export const OpportunityCard: React.FC<Props> = ({ opportunity }) => {
  const typeStyle = TYPE_CONFIG[opportunity.type] || TYPE_CONFIG.internship;
  const deadlineInfo = formatDeadlineToCountdown(opportunity.deadline);

  // Is fresh early-bird discovery (seen in last 72 hours)
  const isFresh =
    opportunity.firstSeen &&
    Date.now() - new Date(opportunity.firstSeen).getTime() < 72 * 60 * 60 * 1000;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-xl hover:shadow-cyan-950/20">
      {/* Top row: Type + Fresh Badge + Deadline */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${typeStyle.dot}`} />
              {typeStyle.label}
            </span>

            {isFresh && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                NEW
              </span>
            )}
          </div>

          {deadlineInfo && (
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                deadlineInfo.urgent
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-slate-800 text-slate-400 border border-slate-700/60"
              }`}
            >
              ⏰ {deadlineInfo.text}
            </span>
          )}
        </div>

        {/* Title & Organization */}
        <h3 className="line-clamp-2 text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
          {opportunity.title}
        </h3>

        <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <span className="truncate">{opportunity.organization}</span>
        </div>

        {/* Location & Remote details */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          {opportunity.location && (
            <span className="inline-flex items-center gap-1 truncate max-w-[200px]" title={opportunity.location}>
              <span>📍</span>
              <span className="truncate">{opportunity.location}</span>
            </span>
          )}

          {opportunity.remote && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-800/40">
              🌐 Remote
            </span>
          )}

          {opportunity.region && opportunity.region !== "Remote" && (
            <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[11px] text-slate-400">
              {opportunity.region}
            </span>
          )}
        </div>

        {/* Description snippet if present */}
        {opportunity.description && (
          <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
            {opportunity.description}
          </p>
        )}

        {/* Tags */}
        {opportunity.tags && opportunity.tags.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {opportunity.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded-md bg-slate-800/70 border border-slate-750 px-2 py-0.5 text-[11px] text-slate-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card footer: Source & Apply Button */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 text-[11px] truncate max-w-[130px]" title={opportunity.sourceName}>
          via {opportunity.sourceName.replace(/\s*\(GitHub\)/, "")}
        </span>

        <a
          href={opportunity.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition-all hover:bg-cyan-500 hover:text-black hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/25 focus:outline-none"
        >
          <span>Apply</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
};
