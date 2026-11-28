export type BlogCategory =
  | "SEO"
  | "Paid Ads"
  | "Web Design"
  | "Analytics"
  | "Growth Strategy";

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  readTime: string;
  publishedAt: string;
  author: {
    name: string;
    role: string;
  };
  takeaways: string[];
  sections: {
    heading: string;
    paragraphs: string[];
    checklist?: string[];
  }[];
}

export const BLOG_CATEGORIES: ("All" | BlogCategory)[] = [
  "All",
  "SEO",
  "Paid Ads",
  "Web Design",
  "Analytics",
  "Growth Strategy",
];

export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: "technical-seo-architecture-playbook",
    title: "The 2026 Technical SEO Architecture Playbook for Compounding Traffic",
    excerpt:
      "How to structure crawl budgets, canonical clusters, and Core Web Vitals so every new landing page ranks faster without cannibalization.",
    category: "SEO",
    readTime: "8 min read",
    publishedAt: "Nov 18, 2026",
    author: {
      name: "Maya Lin",
      role: "Head of Organic Search",
    },
    takeaways: [
      "Keep high-intent commercial pages within 3 clicks of the homepage.",
      "Eliminate parameter-based duplicate URLs using strict self-referencing canonicals.",
      "Target INP < 200ms and LCP < 2.5s on mobile templates before scaling content.",
    ],
    sections: [
      {
        heading: "1. Design a Shallow, Intent-Mapped URL Hierarchy",
        paragraphs: [
          "Search engines allocate crawl budget based on authority and internal link depth. When service pages or comparison hubs sit five clicks deep behind paginated archives, discovery slows and rankings plateau.",
          "Group your commercial pages into clean topic clusters: a pillar service hub linking bi-directionally to supporting use-case pages, case studies, and interactive tools.",
        ],
        checklist: [
          "Audit click depth across all revenue-generating URLs",
          "Enforce lowercase, trailing-slash-consistent canonical tags",
          "Submit segmented XML sitemaps for services, blog, and tools",
        ],
      },
      {
        heading: "2. Core Web Vitals as a Conversion Multiplier",
        paragraphs: [
          "Passing Core Web Vitals isn't just a ranking tie-breaker—it directly lowers paid and organic bounce rates. Deferring non-critical third-party tag scripts and serving AVIF/WebP hero media routinely lifts form submissions by 12–18%.",
        ],
      },
    ],
  },
  {
    slug: "google-search-ads-roas-guardrails",
    title: "Google Search Ads: Building Tight ROAS Guardrails Without Starving Scale",
    excerpt:
      "A practical framework for negative keyword hygiene, exact-match intent sculpting, and offline conversion imports.",
    category: "Paid Ads",
    readTime: "7 min read",
    publishedAt: "Nov 12, 2026",
    author: {
      name: "Devon Brooks",
      role: "Director of Performance Media",
    },
    takeaways: [
      "Feed qualified CRM pipeline stages back into Google Ads via GCLID offline imports.",
      "Separate high-intent non-brand exact campaigns from broad discovery tests.",
      "Review search term reports weekly to prune low-intent informational queries.",
    ],
    sections: [
      {
        heading: "1. Stop Optimizing for Raw Form Fills",
        paragraphs: [
          "Smart Bidding algorithms optimize for whatever signal you give them. If your conversion action fires on every unverified lead form, automated bidding will chase cheap, low-intent clicks.",
          "By syncing CRM lead qualification back to Google Ads, Target ROAS and Maximize Conversion Value bids shift budget toward prospects that actually close.",
        ],
        checklist: [
          "Capture GCLID on every landing page form submission",
          "Assign tiered conversion values to MQL, SQL, and Closed-Won",
          "Maintain shared negative keyword lists across all search campaigns",
        ],
      },
    ],
  },
  {
    slug: "high-converting-service-landing-pages",
    title: "Anatomy of a High-Converting B2B Service Page",
    excerpt:
      "Why above-the-fold clarity, proof-adjacent CTAs, and transparent pricing anchors outperform clever copy.",
    category: "Web Design",
    readTime: "6 min read",
    publishedAt: "Nov 05, 2026",
    author: {
      name: "Elena Rostova",
      role: "Principal Product Designer",
    },
    takeaways: [
      "State who it's for, what outcome it drives, and how fast it launches in the first 5 seconds.",
      "Place concrete social proof (metrics, logos, or deliverables) directly beside primary CTAs.",
      "Reduce form friction to 4–5 essential fields on initial capture.",
    ],
    sections: [
      {
        heading: "1. Clarity Beats Cleverness Every Time",
        paragraphs: [
          "Visitors arriving from search or paid ads decide in under five seconds whether your page solves their problem. Replace vague slogans with specific outcomes, clear deliverables, and a frictionless next step.",
        ],
        checklist: [
          "Hero H1 states the exact service and measurable outcome",
          "Primary CTA contrasts clearly against the background surface",
          "Mobile viewport shows headline, subcopy, and CTA without scrolling",
        ],
      },
    ],
  },
  {
    slug: "ga4-server-side-attribution-blueprint",
    title: "GA4 & Server-Side Attribution: Fixing Dark-Funnel Blind Spots",
    excerpt:
      "How to unify UTM governance, first-party cookies, and CRM revenue attribution in one clean reporting pipeline.",
    category: "Analytics",
    readTime: "9 min read",
    publishedAt: "Oct 28, 2026",
    author: {
      name: "Arjun Mehta",
      role: "Lead Analytics Engineer",
    },
    takeaways: [
      "Standardize UTM naming conventions across paid social, search, and email.",
      "Move critical conversion events server-side to prevent ad-blocker data loss.",
      "Reconcile ad platform conversions against CRM closed revenue monthly.",
    ],
    sections: [
      {
        heading: "1. Standardize Your UTM Taxonomy",
        paragraphs: [
          "Inconsistent casing or ad-hoc campaign tags fragment your acquisition reports. Enforce lowercase, hyphenated UTMs across every channel so GA4 and your CRM agree on source/medium.",
        ],
      },
    ],
  },
  {
    slug: "unifying-seo-and-paid-media-budget",
    title: "How to Unify SEO and Paid Media Under One Growth Budget",
    excerpt:
      "Stop running organic and paid teams in silos. Use paid search data to validate SEO keywords before investing in content.",
    category: "Growth Strategy",
    readTime: "5 min read",
    publishedAt: "Oct 19, 2026",
    author: {
      name: "Maya Lin",
      role: "Head of Organic Search",
    },
    takeaways: [
      "Test commercial keyword conversion rates with Search Ads in 14 days before writing 2,000-word guides.",
      "Reallocate paid spend away from terms where you already hold #1 organic + map pack visibility.",
      "Measure blended CAC across all 13 channels rather than siloed channel vanity metrics.",
    ],
    sections: [
      {
        heading: "1. Paid Data Fuels Smarter Organic Content",
        paragraphs: [
          "Keyword volume tools rarely tell you which queries actually convert into paying customers. Running a focused 2-week search campaign reveals true click-through rates, CPCs, and lead quality—giving your SEO team a validated roadmap.",
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string): BlogArticle | undefined {
  return BLOG_ARTICLES.find((a) => a.slug === slug);
}
