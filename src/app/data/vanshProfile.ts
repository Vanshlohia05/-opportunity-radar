export interface UserProfile {
  name: string;
  headline: string;
  location: string;
  email: string;
  phone: string;
  education: {
    degree: string;
    institution: string;
    duration: string;
    score: string;
  }[];
  experience: {
    role: string;
    organization: string;
    period: string;
    description: string;
  }[];
  projects: {
    title: string;
    role: string;
    period: string;
    url?: string;
    tags?: string[];
    description: string;
  }[];
  skills: string[];
  interests: string[];
  languages: string[];
}

export const VANSH_PROFILE: UserProfile = {
  name: "Vansh Lohia",
  headline: "BBA Candidate (Manipal University Jaipur) • Vibe Coder & Product Builder • Founder, SahiRaasta • Author",
  location: "Sarupathar, Assam, India - 785601",
  email: "lohiavansh24.work@gmail.com",
  phone: "+91 93653 24146",
  education: [
    {
      degree: "Bachelor of Business Administration (BBA)",
      institution: "Manipal University Jaipur",
      duration: "2024 – 2027 (Expected)",
      score: "3rd Sem SGPA: 8.0 (77.6%)",
    },
    {
      degree: "High School",
      institution: "Amrit International School",
      duration: "2022 – 2024",
      score: "Higher Secondary",
    },
  ],
  experience: [
    {
      role: "Joint Secretary & Volunteer Leader",
      organization: "Marwari Yuva Manch",
      period: "2022 – Present (4 years)",
      description:
        "Actively organizing large community service initiatives and outreach events for 150-200 attendees. Elevated to Joint Secretary in April 2026.",
    },
    {
      role: "Community Operations & Project Management",
      organization: "Ashadeep NGO",
      period: "Jan 2025 – Present",
      description:
        "Hands-on operations in non-profit project management, volunteer coordination, and mental health & community welfare programs.",
    },
  ],
  projects: [
    {
      title: "SahiRaasta Platform",
      role: "Founder & Product Lead",
      period: "April 2026 – Present",
      url: "https://sahirasta.vercel.app/",
      tags: ["100% Vibe Coded", "Next.js", "AI-Driven", "EdTech"],
      description:
        "Conceptualized and developed an AI-driven educational guidance and career roadmap platform for Indian students. Built end-to-end via AI-driven vibe coding workflows, defining core product vision, user journey, and business logic.",
    },
    {
      title: "DS Power Cement",
      role: "Creator & Web Architect",
      period: "2026",
      url: "https://www.dspowercement.com/",
      tags: ["100% Vibe Coded", "Industrial / Corporate", "AI Built"],
      description:
        "Full-featured commercial corporate website built using pure AI-driven vibe coding workflows. Engineered modern brand positioning, responsive architecture, and production deployment.",
    },
    {
      title: "XAlumni Platform",
      role: "Creator & Full-Stack Builder",
      period: "2026",
      url: "https://xalumni.web.app/",
      tags: ["100% Vibe Coded", "Firebase", "Alumni Network"],
      description:
        "Comprehensive alumni networking, engagement, and directory web platform deployed on Firebase, created entirely through AI-driven coding.",
    },
    {
      title: "Whispers of the Soul",
      role: "Author & Self-Publisher",
      period: "Jan 2024",
      tags: ["Amazon KDP", "Author", "Design"],
      description:
        "Authored and published a full-length title via Amazon KDP, managing composition, editorial review, graphic design via Canva, and digital distribution.",
    },
  ],
  skills: [
    "Product Management & MVP Prototyping",
    "Generative AI Workflows & Vibe Coding",
    "Business Administration & Operations",
    "Non-Profit & Community Development",
    "Event Organization & Volunteer Coordination",
    "Graphic Design (Canva)",
    "Project Coordination & Team Leadership",
  ],
  interests: [
    "Social & Community Development",
    "Mental Health Services",
    "Educational Guidance (EdTech)",
    "Youth Leadership & Public Policy",
  ],
  languages: ["English", "Hindi"],
};

export function matchOpportunityForVansh(opp: {
  title: string;
  organization: string;
  type: string;
  description?: string | null;
  tags?: string[];
  location?: string | null;
  region?: string | null;
  remote?: boolean;
}): { isMatch: boolean; score: number; reasons: string[] } {
  const fullText = `${opp.title} ${opp.organization} ${opp.description || ""} ${(opp.tags || []).join(" ")} ${opp.location || ""}`.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // Match 1: Global Scholarships & Fellowships (Universal fit for ambitious undergraduate)
  if (opp.type === "scholarship") {
    score += 8;
    reasons.push("Scholarship Opportunity");
  } else if (opp.type === "fellowship") {
    score += 8;
    reasons.push("Fellowship Grant");
  } else if (opp.type === "apprenticeship") {
    score += 6;
    reasons.push("Apprenticeship / Traineeship");
  }

  // Match 2: Business, Operations, Product Management (BBA & SahiRaasta match)
  const businessKeywords = [
    "product manager",
    "associate product",
    "apm",
    "business",
    "operations",
    "project manager",
    "program manager",
    "marketing",
    "growth",
    "analyst",
    "management consultant",
    "strategy",
  ];
  if (businessKeywords.some((k) => fullText.includes(k))) {
    score += 5;
    reasons.push("Business & Product Management");
  }

  // Match 3: Social Impact, Community, NGO, Leadership, Youth (Ashadeep & Marwari Yuva Manch match)
  const impactKeywords = [
    "social impact",
    "community",
    "leadership",
    "youth",
    "ngo",
    "nonprofit",
    "volunteer",
    "changemaker",
    "education",
    "edtech",
    "sustainability",
  ];
  if (impactKeywords.some((k) => fullText.includes(k))) {
    score += 5;
    reasons.push("Community Leadership & Social Impact");
  }

  // Match 4: Publishing, Creative, Writing, Design (Author of Whispers of the Soul & Canva design)
  const creativeKeywords = ["design", "creative", "writer", "editorial", "publishing", "content", "communications"];
  if (creativeKeywords.some((k) => fullText.includes(k))) {
    score += 3;
    reasons.push("Creative & Design");
  }

  // Match 5: India native or Remote friendly
  if (fullText.includes("india")) {
    score += 4;
    reasons.push("India Region");
  } else if (opp.remote) {
    score += 3;
    reasons.push("Remote Friendly");
  }

  return {
    isMatch: score >= 5,
    score,
    reasons: Array.from(new Set(reasons)),
  };
}
