import { createHash } from "node:crypto";

export function sha1(input) {
  return createHash("sha1").update(String(input || "")).digest("hex").slice(0, 16);
}

export function canonicalUrl(rawUrl) {
  if (!rawUrl) return "";
  try {
    const u = new URL(rawUrl.trim());
    const dropPrefixes = ["utm_", "ref", "source", "fbclid", "gclid", "mc_cid", "mc_eid"];
    const toDelete = [];
    u.searchParams.forEach((_, key) => {
      const k = key.toLowerCase();
      if (dropPrefixes.some((p) => k.startsWith(p)) || k === "tracking") {
        toDelete.push(key);
      }
    });
    toDelete.forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    u.pathname = pathname;
    return u.toString();
  } catch {
    return String(rawUrl).trim().replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

export function makeId(url) {
  return sha1(canonicalUrl(url));
}

export function stripHtml(raw, maxLen) {
  if (!raw) return "";
  const clean = String(raw)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#8217;/gi, "'")
    .replace(/&#8216;/gi, "'")
    .replace(/&#8220;/gi, '"')
    .replace(/&#8221;/gi, '"')
    .replace(/&#8211;/gi, "-")
    .replace(/&#8212;/gi, "--")
    .replace(/\s+/g, " ")
    .trim();

  if (typeof maxLen === "number" && clean.length > maxLen) {
    const cut = clean.slice(0, maxLen);
    const lastSpace = cut.lastIndexOf(" ");
    return (lastSpace > maxLen * 0.4 ? cut.slice(0, lastSpace) : cut) + "...";
  }
  return clean;
}

export function excerpt(text, maxLen = 220) {
  return stripHtml(text, maxLen);
}

export const TYPES = ["internship", "fellowship", "apprenticeship", "scholarship"];

const TYPE_RULES = [
  {
    type: "scholarship",
    pattern: /\b(scholarship|scholarships|bursary|bursaries|grant|grants|tuition\s*(?:fee)?\s*(?:waiver|award)|financial\s*aid|stipend\s*award|study\s*grant)\b/i,
  },
  {
    type: "fellowship",
    pattern: /\b(fellowship|fellowships|visiting\s*fellow|research\s*fellow|postdoctoral\s*fellow|graduate\s*fellow|fellow\s*program)\b/i,
  },
  {
    type: "apprenticeship",
    pattern: /\b(apprenticeship|apprenticeships|apprentice|ausbildung|traineeship|traineeships|dual\s*study|duales\s*studium)\b/i,
  },
  {
    type: "internship",
    pattern: /\b(internship|internships|intern|interns|co-?op|coop|placement|placements|industrial\s*placement|summer\s*analyst|praktikum|praktikant|trainee)\b/i,
  },
];

export function classifyType(text, defaultType = null) {
  if (!text) return defaultType;
  const str = String(text);
  for (const { type, pattern } of TYPE_RULES) {
    if (pattern.test(str)) {
      return type;
    }
  }
  return defaultType;
}

const REGION_PATTERNS = [
  { region: "Remote", re: /\b(remote|anywhere|worldwide|virtual|telework|work\s*from\s*home)\b/i },
  { region: "United States", re: /\b(united states|usa|u\.s\.a|u\.s\.|california|new york|texas|washington|seattle|san francisco|austin|boston|chicago|los angeles|colorado|massachusetts)\b/i },
  { region: "Germany", re: /\b(germany|deutschland|berlin|munich|münchen|frankfurt|hamburg|cologne|köln|stuttgart)\b/i },
  { region: "United Kingdom", re: /\b(united kingdom|uk|u\.k\.|england|london|scotland|edinburgh|manchester|oxford|cambridge|bristol)\b/i },
  { region: "India", re: /\b(india|bengaluru|bangalore|delhi|mumbai|hyderabad|pune|gurugram|noida|chennai)\b/i },
  { region: "Canada", re: /\b(canada|toronto|vancouver|montreal|ottawa|waterloo|calgary)\b/i },
  { region: "Europe", re: /\b(europe|france|paris|switzerland|zurich|netherlands|amsterdam|ireland|dublin|sweden|stockholm|spain|italy)\b/i },
  { region: "Asia-Pacific", re: /\b(asia|singapore|japan|tokyo|australia|sydney|melbourne|new zealand|korea|seoul)\b/i },
];

export function detectRegion(location) {
  if (!location) return "Global";
  const str = String(location);
  for (const { region, re } of REGION_PATTERNS) {
    if (re.test(str)) return region;
  }
  return "Global";
}

export function detectCountry(location) {
  const reg = detectRegion(location);
  const flags = {
    Remote: "🌍",
    "United States": "🇺🇸",
    Germany: "🇩🇪",
    "United Kingdom": "🇬🇧",
    India: "🇮🇳",
    Canada: "🇨🇦",
    Europe: "🇪🇺",
    "Asia-Pacific": "🌏",
    Global: "🌐",
  };
  return { name: reg, code: flags[reg] || "📍" };
}

const MONTHS = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

export function extractDeadline(text) {
  if (!text) return null;
  const str = String(text);

  const markerRegex = /(?:deadline|closing\s*date|apply\s*by|closes|due\s*date|expires\s*on)[:\s—–-]+([A-Za-z0-9,.\s\/-]{4,30})/i;
  const match = str.match(markerRegex);
  const candidate = match ? match[1].trim() : null;

  const tryParse = (s) => {
    if (!s) return null;
    const iso = s.match(/\b(202[5-9])-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    const dmy = s.match(/\b([0-2]?\d|3[01])(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(202[5-9])\b/);
    if (dmy) {
      const day = parseInt(dmy[1], 10);
      const mStr = dmy[2].toLowerCase();
      if (MONTHS[mStr] !== undefined) {
        const m = String(MONTHS[mStr] + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${dmy[3]}-${m}-${d}`;
      }
    }

    const mdy = s.match(/\b([A-Za-z]+)\s+([0-2]?\d|3[01])(?:st|nd|rd|th)?,?\s+(202[5-9])\b/);
    if (mdy) {
      const mStr = mdy[1].toLowerCase();
      const day = parseInt(mdy[2], 10);
      if (MONTHS[mStr] !== undefined) {
        const m = String(MONTHS[mStr] + 1).padStart(2, "0");
        const d = String(day).padStart(2, "0");
        return `${mdy[3]}-${m}-${d}`;
      }
    }

    return null;
  };

  if (candidate) {
    const res = tryParse(candidate);
    if (res) return res;
  }

  return tryParse(str);
}
