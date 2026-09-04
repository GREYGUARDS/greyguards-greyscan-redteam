/**
 * GreyScan demo datasets for the three Red Team simulation companies.
 *
 * Everything here is derived from the fictional canon in simulationCompanies.ts
 * so the GreyScan demo and the Red Team demo tell the same story. No real
 * company, person or news report is depicted.
 */

import type { DemoCompany } from "./demoData";
import { SIMULATION_COMPANIES, type SimulationCompany } from "./simulationCompanies";

// Deterministic pseudo-random so the demo looks identical on every visit.
const seeded = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs(h % 1000) / 1000;
  };
};

const buildTimeline = (companyId: string, days: number, baseVolume: number, volatility: number) => {
  const rand = seeded(companyId + "timeline");
  const data: { date: string; mentions: number; sentiment: number }[] = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Volume ramps in the final week — the narrative is building.
    const ramp = i < 7 ? (7 - i) * (baseVolume * 0.18) : 0;
    const variance = rand() * volatility - volatility / 2;
    data.push({
      date: date.toISOString().split("T")[0],
      mentions: Math.max(4, Math.round(baseVolume + ramp + variance)),
      sentiment: Math.round((rand() * 60 - 45) - (i < 7 ? 12 : 0)),
    });
  }
  return data;
};

interface DemoProfile {
  threatLevel: DemoCompany["threatLevel"];
  threatScore: number;
  sentiment: { positive: number; neutral: number; negative: number };
  shortTermSentiment: number;
  longTermSentiment: number;
  previousSentiment: number;
  trendIcon: DemoCompany["trendIcon"];
  baseVolume: number;
  keywords: string[];
  narratives: {
    type: "disinformation" | "misinformation" | "malinformation";
    description: string;
    severity: "moderate" | "high" | "critical";
    frequency: number;
    keywords: string[];
  }[];
  predictions: {
    narrative: string;
    confidence: number;
    trajectory: string;
    signals: string[];
    recommendedAction: string;
  }[];
  mentions: { text: string; source: string; hoursAgo: number; author?: string; outlet?: string; title?: string; engagement?: number; score?: number }[];
  stories: { headline: string; outlet: string; hoursAgo: number; sentiment: number; reach: number; type: string }[];
  entities: string[];
  locations: { name: string; count: number; lat: number; lon: number }[];
  themes: { name: string; count: number }[];
  sources: { name: string; count: number; country?: string }[];
  risingQueries: { query: string; value: number }[];
}

const PROFILES: Record<string, DemoProfile> = {
  "ashworth-reilly": {
    threatLevel: "elevated",
    threatScore: 61,
    sentiment: { positive: 17, neutral: 47, negative: 36 },
    shortTermSentiment: -21,
    longTermSentiment: 6,
    previousSentiment: 9,
    trendIcon: "down",
    baseVolume: 22,
    keywords: [
      "cold chain", "Doncaster hub", "batch recall", "MHRA", "pharmacist forum",
      "supply shortage", "oncology medicines", "contamination", "NHS supply", "Priya Reilly",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "Anonymous pharmacist-forum posts claim a Doncaster hub batch caused adverse patient reactions, timed to ride an unrelated national shortage story.",
        severity: "high",
        frequency: 41,
        keywords: ["contamination", "batch", "adverse reactions", "Doncaster"],
      },
      {
        type: "disinformation",
        description:
          "A convincingly formatted PDF styled as an MHRA field safety notice naming the company is circulating in closed pharmacist messaging groups.",
        severity: "critical",
        frequency: 33,
        keywords: ["MHRA", "field safety notice", "fake document", "recall"],
      },
      {
        type: "malinformation",
        description:
          "The genuine, fully resolved 2023 short-dated antibiotic issue is being recirculated without dates as evidence of a pattern of failure.",
        severity: "moderate",
        frequency: 26,
        keywords: ["2023", "short-dated stock", "pattern", "history"],
      },
      {
        type: "misinformation",
        description:
          "A cloned LinkedIn profile in the name of the Director of Regulatory & Quality Affairs posts 'insider concerns' about quality control.",
        severity: "high",
        frequency: 19,
        keywords: ["impersonation", "LinkedIn", "insider", "quality control"],
      },
    ],
    predictions: [
      {
        narrative: "Fabricated shortage claims escalate from trade forums into consumer health coverage",
        confidence: 74,
        trajectory: "accelerating",
        signals: [
          "Forum threads reposted to consumer health groups",
          "Two regional outlets have made contact with community pharmacists",
          "Search interest in 'medicine shortage' rising in the same region",
        ],
        recommendedAction:
          "Pre-position a verified batch-provenance statement and a named regulatory spokesperson before the first press call.",
      },
      {
        narrative: "'Foreign-controlled NHS supply chain' framing draws political attention",
        confidence: 58,
        trajectory: "emerging",
        signals: [
          "Critical-infrastructure accounts amplifying supplier ownership claims",
          "Reused framing from earlier unrelated logistics campaigns",
        ],
        recommendedAction:
          "Prepare a plain-language ownership and supplier-assurance briefing for trade bodies and constituency offices.",
      },
    ],
    mentions: [
      {
        text: "Heard from two colleagues that a Doncaster batch is being pulled. Nothing official yet — anyone else seeing this?",
        source: "reddit",
        hoursAgo: 3,
        author: "u/communitypharmacist_uk",
        score: 412,
      },
      {
        text: "This 'MHRA notice' doing the rounds in the pharmacy WhatsApp groups does not appear on the MHRA site. Treat with caution.",
        source: "bluesky",
        hoursAgo: 6,
        author: "@rxverify",
        engagement: 2100,
      },
      {
        text: "Pharmacists Report Delivery Concerns Amid National Shortage Pressure",
        source: "news",
        hoursAgo: 14,
        title: "Pharmacists Report Delivery Concerns",
        outlet: "Pharmacy Trade Weekly",
      },
      {
        text: "Reminder that this wholesaler had a stock problem back in 2023 too. Draw your own conclusions.",
        source: "forum",
        hoursAgo: 20,
        author: "anon_dispenser",
        score: 188,
      },
      {
        text: "Cold-Chain Hub Reaches Full Capacity as Biologics Demand Grows",
        source: "news",
        hoursAgo: 46,
        title: "Cold-Chain Hub Reaches Full Capacity",
        outlet: "The Distribution Ledger",
      },
    ],
    stories: [
      {
        headline: "Unverified 'Safety Notice' Circulates Among Community Pharmacists",
        outlet: "Pharmacy Trade Weekly",
        hoursAgo: 9,
        sentiment: -0.7,
        reach: 84000,
        type: "news",
      },
      {
        headline: "Shortage Anxiety Spreads as Wholesaler Rumours Go Unanswered",
        outlet: "Midlands Business Post",
        hoursAgo: 26,
        sentiment: -0.5,
        reach: 121000,
        type: "feature",
      },
    ],
    entities: ["Julian Ashworth", "Priya Reilly", "Frank Ashworth", "MHRA", "NHS Supply Chain", "Colston Bridge Capital"],
    locations: [
      { name: "Wolverhampton", count: 21, lat: 52.5862, lon: -2.1288 },
      { name: "Doncaster", count: 18, lat: 53.5228, lon: -1.1285 },
      { name: "London", count: 11, lat: 51.5072, lon: -0.1276 },
      { name: "Livingston", count: 6, lat: 55.8834, lon: -3.5203 },
      { name: "Bristol", count: 5, lat: 51.4545, lon: -2.5879 },
    ],
    themes: [
      { name: "MEDICAL_SUPPLY", count: 27 },
      { name: "REGULATORY_ACTION", count: 19 },
      { name: "PUBLIC_HEALTH", count: 16 },
      { name: "MANUFACTURING_QUALITY", count: 12 },
      { name: "CRITICAL_INFRASTRUCTURE", count: 9 },
    ],
    sources: [
      { name: "Pharmacist forums", count: 24 },
      { name: "Reddit", count: 17 },
      { name: "Bluesky", count: 12 },
      { name: "Google News", count: 11, country: "UK" },
      { name: "GDELT (UK)", count: 8, country: "UK" },
      { name: "Trade press", count: 6 },
    ],
    risingQueries: [
      { query: "ashworth reilly recall", value: 3900 },
      { query: "mhra field safety notice pharmacy", value: 2600 },
      { query: "doncaster cold chain batch", value: 1800 },
      { query: "medicine shortage midlands", value: 1450 },
      { query: "pharmacy wholesaler delivery problems", value: 980 },
    ],
  },

  "meridian-vale": {
    threatLevel: "high",
    threatScore: 72,
    sentiment: { positive: 14, neutral: 39, negative: 47 },
    shortTermSentiment: -34,
    longTermSentiment: -4,
    previousSentiment: -8,
    trendIcon: "down",
    baseVolume: 38,
    keywords: [
      "claims refused", "algorithm", "flood cover", "vulnerable customers", "FCA",
      "settlement delays", "policy wording", "class action", "whistleblower", "underwriting",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "Claims that an internal scoring model is used to automatically decline claims from lower-income postcodes, illustrated with fabricated screenshots.",
        severity: "critical",
        frequency: 58,
        keywords: ["algorithm", "postcode", "auto-decline", "screenshots"],
      },
      {
        type: "misinformation",
        description:
          "Viral consumer-group posts misread standard policy wording as a blanket exclusion for flood damage, driving cancellation advice.",
        severity: "high",
        frequency: 44,
        keywords: ["flood", "exclusion", "policy wording", "cancel"],
      },
      {
        type: "malinformation",
        description:
          "Real but historic complaint-handling figures are being presented as current performance in campaign material.",
        severity: "high",
        frequency: 31,
        keywords: ["complaints", "historic data", "out of context", "FCA"],
      },
      {
        type: "disinformation",
        description:
          "An account posing as a former claims handler alleges a deliberate 'delay-to-deter' policy for vulnerable claimants.",
        severity: "high",
        frequency: 27,
        keywords: ["whistleblower", "delay", "vulnerable customers", "insider"],
      },
    ],
    predictions: [
      {
        narrative: "Consumer-group campaign consolidates into coordinated regulatory complaint",
        confidence: 81,
        trajectory: "accelerating",
        signals: [
          "Template complaint text being shared across forums",
          "Claims-management firms amplifying the algorithm claim",
          "Rising search interest in escalation routes",
        ],
        recommendedAction:
          "Publish a verified, plain-English explanation of how claims decisions are made, with an independent audit reference point.",
      },
      {
        narrative: "Broadcast consumer segment builds around individual claimant case studies",
        confidence: 66,
        trajectory: "building",
        signals: [
          "Producers soliciting case studies in affected regions",
          "Fabricated screenshots now circulating with claimant names attached",
        ],
        recommendedAction:
          "Establish rapid case-review triage so genuine cases are resolved before they become illustrative examples.",
      },
    ],
    mentions: [
      {
        text: "So their system just quietly declines you if you live in the wrong postcode? Screenshot below. Absolute disgrace.",
        source: "twitter",
        hoursAgo: 2,
        author: "@claimsjustice",
        engagement: 41000,
      },
      {
        text: "Insurer Faces Questions Over Automated Claims Decisions",
        source: "news",
        hoursAgo: 8,
        title: "Insurer Faces Questions Over Automated Claims Decisions",
        outlet: "Consumer Finance Review",
      },
      {
        text: "Read your flood cover section before you renew. Thread on what we think it actually means. 1/14",
        source: "reddit",
        hoursAgo: 12,
        author: "u/UKPersonalFinanceMod",
        score: 5400,
      },
      {
        text: "I handled claims there for four years. The delays were not accidental.",
        source: "bluesky",
        hoursAgo: 18,
        author: "@ex_handler_anon",
        engagement: 9800,
      },
      {
        text: "Complaint Volumes Cited in Campaign Date From 2021, Records Show",
        source: "news",
        hoursAgo: 30,
        title: "Complaint Volumes Cited in Campaign Date From 2021",
        outlet: "Insurance Journal Daily",
      },
    ],
    stories: [
      {
        headline: "Claimants Say Decisions Were Made Before Anyone Read Their File",
        outlet: "Consumer Finance Review",
        hoursAgo: 7,
        sentiment: -0.8,
        reach: 640000,
        type: "investigative",
      },
      {
        headline: "Flood Cover Confusion Prompts Wave of Cancellation Advice",
        outlet: "Money Matters Weekly",
        hoursAgo: 22,
        sentiment: -0.6,
        reach: 310000,
        type: "news",
      },
    ],
    entities: ["Thomas Vale", "Sarah Meridian-Osei", "Robert Iyanu", "Financial Conduct Authority", "Financial Ombudsman Service"],
    locations: [
      { name: "London", count: 34, lat: 51.5072, lon: -0.1276 },
      { name: "Manchester", count: 17, lat: 53.4808, lon: -2.2426 },
      { name: "Leeds", count: 12, lat: 53.8008, lon: -1.5491 },
      { name: "Cardiff", count: 8, lat: 51.4816, lon: -3.1791 },
      { name: "Glasgow", count: 6, lat: 55.8642, lon: -4.2518 },
    ],
    themes: [
      { name: "CONSUMER_PROTECTION", count: 33 },
      { name: "FINANCIAL_REGULATION", count: 24 },
      { name: "ALGORITHMIC_DECISIONS", count: 21 },
      { name: "FLOOD_RISK", count: 14 },
      { name: "CORPORATE_GOVERNANCE", count: 11 },
    ],
    sources: [
      { name: "Twitter/X", count: 41 },
      { name: "Reddit", count: 28 },
      { name: "Google News", count: 19, country: "UK" },
      { name: "Bluesky", count: 14 },
      { name: "GDELT (UK)", count: 11, country: "UK" },
      { name: "Consumer forums", count: 9 },
    ],
    risingQueries: [
      { query: "meridian vale claim refused", value: 6100 },
      { query: "insurance postcode algorithm", value: 4700 },
      { query: "flood cover exclusion meaning", value: 3300 },
      { query: "how to complain to the ombudsman", value: 2500 },
      { query: "meridian vale class action", value: 1600 },
    ],
  },

  "bristow-calder": {
    threatLevel: "critical",
    threatScore: 84,
    sentiment: { positive: 11, neutral: 31, negative: 58 },
    shortTermSentiment: -47,
    longTermSentiment: -9,
    previousSentiment: -12,
    trendIcon: "down",
    baseVolume: 64,
    keywords: [
      "liquidity", "deposits", "withdrawals", "capital position", "regulator",
      "deepfake", "leaked memo", "bank run", "counterparty", "credit rating",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "A fabricated internal treasury memo claiming an emergency liquidity facility is circulating with a synthetic executive voice note attached.",
        severity: "critical",
        frequency: 96,
        keywords: ["liquidity", "leaked memo", "deepfake audio", "emergency facility"],
      },
      {
        type: "disinformation",
        description:
          "Coordinated accounts urge depositors to move funds 'before Friday', framed as friendly warning rather than attack.",
        severity: "critical",
        frequency: 88,
        keywords: ["withdraw", "deadline", "coordinated", "deposits"],
      },
      {
        type: "misinformation",
        description:
          "A misread regulatory filing is being presented as evidence of a failed capital test, spreading through retail investor channels.",
        severity: "high",
        frequency: 52,
        keywords: ["capital", "filing", "stress test", "misread"],
      },
      {
        type: "malinformation",
        description:
          "Genuine historic branch-closure and IT-outage coverage is recirculated undated to imply an ongoing operational collapse.",
        severity: "high",
        frequency: 37,
        keywords: ["IT outage", "branch closures", "undated", "recirculated"],
      },
    ],
    predictions: [
      {
        narrative: "Synthetic audio of a named executive is released to broadcast media",
        confidence: 79,
        trajectory: "accelerating",
        signals: [
          "Voice clone already circulating in investor chat groups",
          "Accounts trailing 'more to come tomorrow'",
          "Rising search interest in the executive's name alongside 'audio'",
        ],
        recommendedAction:
          "Stand up provenance verification with a trusted third party and a pre-cleared broadcast rebuttal within the hour.",
      },
      {
        narrative: "Retail withdrawal narrative crosses into mainstream news cycle",
        confidence: 71,
        trajectory: "accelerating",
        signals: [
          "Branch queue imagery being reused from unrelated events",
          "Consumer forums coordinating withdrawal timing",
        ],
        recommendedAction:
          "Coordinate a single verified statement with the regulator and publish real-time service status to remove the information vacuum.",
      },
    ],
    mentions: [
      {
        text: "Leaked treasury memo attached. If this is real, get your money out before Friday.",
        source: "twitter",
        hoursAgo: 1,
        author: "@marketwhispers",
        engagement: 128000,
      },
      {
        text: "The 'audio' of the CFO is almost certainly synthetic — the room reverb does not match the claimed call.",
        source: "bluesky",
        hoursAgo: 3,
        author: "@osint_audio",
        engagement: 22000,
      },
      {
        text: "Bank Denies Liquidity Rumours as Unverified Memo Spreads Online",
        source: "news",
        hoursAgo: 5,
        title: "Bank Denies Liquidity Rumours",
        outlet: "Financial Wire",
      },
      {
        text: "Queues outside two branches this morning. Photos in comments. Is this real or is it last year's outage again?",
        source: "reddit",
        hoursAgo: 7,
        author: "u/uk_investing",
        score: 11200,
      },
      {
        text: "Regulator Says It Is Monitoring Online Claims About Lender's Capital Position",
        source: "news",
        hoursAgo: 11,
        title: "Regulator Monitoring Online Claims",
        outlet: "City Business Daily",
      },
    ],
    stories: [
      {
        headline: "Unverified Memo and Synthetic Audio Drive Deposit Panic",
        outlet: "Financial Wire",
        hoursAgo: 4,
        sentiment: -0.9,
        reach: 1900000,
        type: "investigative",
      },
      {
        headline: "Branch Queue Images Circulating Are From an Unrelated 2024 Outage",
        outlet: "Fact Check Bureau",
        hoursAgo: 10,
        sentiment: 0.2,
        reach: 420000,
        type: "fact-check",
      },
    ],
    entities: ["Alex Bryce", "Naomi Calder", "David Okafor", "Bank of England", "Financial Conduct Authority", "Ratings agencies"],
    locations: [
      { name: "London", count: 58, lat: 51.5072, lon: -0.1276 },
      { name: "Edinburgh", count: 19, lat: 55.9533, lon: -3.1883 },
      { name: "Birmingham", count: 14, lat: 52.4862, lon: -1.8904 },
      { name: "Frankfurt", count: 9, lat: 50.1109, lon: 8.6821 },
      { name: "New York", count: 7, lat: 40.7128, lon: -74.006 },
    ],
    themes: [
      { name: "BANK_LIQUIDITY", count: 47 },
      { name: "SYNTHETIC_MEDIA", count: 33 },
      { name: "FINANCIAL_REGULATION", count: 28 },
      { name: "MARKET_CONFIDENCE", count: 22 },
      { name: "CRITICAL_INFRASTRUCTURE", count: 13 },
    ],
    sources: [
      { name: "Twitter/X", count: 66 },
      { name: "Reddit", count: 38 },
      { name: "Google News", count: 27, country: "UK" },
      { name: "Bluesky", count: 21 },
      { name: "GDELT (UK)", count: 16, country: "UK" },
      { name: "Investor chat groups", count: 12 },
    ],
    risingQueries: [
      { query: "bristow calder liquidity", value: 12400 },
      { query: "is my money safe bristow calder", value: 9800 },
      { query: "cfo audio leak bank", value: 7200 },
      { query: "fscs deposit protection limit", value: 5100 },
      { query: "bristow calder branch queues", value: 3600 },
    ],
  },
};

const buildDemoCompany = (company: SimulationCompany, profile: DemoProfile): DemoCompany => {
  const rand = seeded(company.id + "profile");
  const ago = (hours: number) => new Date(Date.now() - hours * 3600000);

  const people = company.people.map((person, index) => ({
    id: `${company.id}-p${index}`,
    person_name: person.name,
    person_role: person.role,
  }));

  const personMentions: Record<string, any> = {};
  const personNarratives: Record<string, any[]> = {};
  company.people.forEach((person, index) => {
    const id = `${company.id}-p${index}`;
    const total = Math.round(14 + rand() * 40 + (index === 0 ? 20 : 0));
    const negative = Math.round(total * (0.35 + rand() * 0.3));
    const positive = Math.round((total - negative) * 0.4);
    personMentions[id] = {
      mention_count: total,
      sentiment_score: Math.round(((positive - negative) / Math.max(1, total)) * 100),
      positive_count: positive,
      negative_count: negative,
      neutral_count: Math.max(0, total - negative - positive),
    };
    personNarratives[id] = [
      {
        narrative_type: index === 1 ? "misinformation" : "disinformation",
        narrative_description: `${person.name} (${person.role}) — ${person.vulnerability}`,
        severity: index === 0 ? "high" : "moderate",
        frequency: Math.round(9 + rand() * 30),
      },
    ];
  });

  return {
    name: company.name,
    description: `${company.industry} — ${company.headquarters.split(",")[0]}`,
    industry: company.sector,
    threatLevel: profile.threatLevel,
    threatScore: profile.threatScore,
    sentimentDistribution: [
      { name: "Positive", value: profile.sentiment.positive, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: profile.sentiment.neutral, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: profile.sentiment.negative, color: "hsl(var(--chart-2))" },
    ],
    shortTermSentiment: profile.shortTermSentiment,
    longTermSentiment: profile.longTermSentiment,
    trendIcon: profile.trendIcon,
    previousSentiment: profile.previousSentiment,
    keywords: profile.keywords.map((word, i) => ({
      word,
      count: Math.max(4, Math.round(profile.baseVolume * (1 - i * 0.08) * 0.5)),
    })),
    timeline: buildTimeline(company.id, 30, profile.baseVolume, profile.baseVolume * 0.6),
    mdmNarratives: profile.narratives.map((n, i) => ({
      id: `${company.id}-mdm-${i + 1}`,
      narrative_type: n.type,
      narrative_description: n.description,
      severity: n.severity,
      frequency: n.frequency,
      keywords: n.keywords,
      detected_at: ago(2 + i * 5).toISOString(),
    })),
    emergingPredictions: profile.predictions.map((p, i) => ({
      id: `${company.id}-pred-${i + 1}`,
      ...p,
    })),
    alerts: profile.narratives.slice(0, 2).map((n, i) => ({
      id: `${company.id}-alert-${i + 1}`,
      alert_type: i === 0 ? "surge" : "new_narrative",
      narrative_id: `${company.id}-mdm-${i + 1}`,
      narrative_description: n.description,
      severity: n.severity,
      current_frequency: n.frequency,
      previous_frequency: Math.max(1, Math.round(n.frequency / 4)),
      frequency_change_percent: 300,
      is_read: false,
      created_at: ago(1 + i * 3).toISOString(),
    })),
    mentions: profile.mentions.map((m) => ({
      text: m.text,
      source: m.source,
      date: ago(m.hoursAgo),
      author: m.author,
      outlet: m.outlet,
      title: m.title,
      engagement: m.engagement,
      score: m.score,
    })),
    trendsData: {
      interest_over_time: {
        timeline_data: buildTimeline(company.id + "trend", 30, profile.baseVolume, profile.baseVolume * 0.5).map((d) => ({
          date: d.date,
          values: [{ value: Math.max(8, Math.round(d.mentions * 1.4)) }],
        })),
      },
      related_queries: { rising: profile.risingQueries },
    },
    gdeltEntities: profile.entities.map((name, i) => ({
      name,
      count: Math.max(3, Math.round(profile.baseVolume * 0.6 - i * 3)),
    })),
    gdeltLocations: profile.locations,
    gdeltThemes: profile.themes,
    sources: profile.sources,
    people,
    personMentions,
    personNarratives,
    trackedStories: profile.stories.map((s, i) => ({
      id: `${company.id}-story-${i + 1}`,
      headline: s.headline,
      outlet: s.outlet,
      published: ago(s.hoursAgo).toISOString(),
      sentiment: s.sentiment,
      reach: s.reach,
      type: s.type,
      screenshot: false,
    })),
  };
};

/** Demo datasets keyed by full company name. */
export const SIMULATION_DEMO_COMPANIES: Record<string, DemoCompany> = Object.fromEntries(
  SIMULATION_COMPANIES.filter((c) => PROFILES[c.id]).map((c) => [c.name, buildDemoCompany(c, PROFILES[c.id])])
);

/** Names available in the public GreyScan demo, in tier order. */
export const SIMULATION_DEMO_NAMES = SIMULATION_COMPANIES.filter((c) => PROFILES[c.id]).map((c) => ({
  name: c.name,
  difficulty: c.difficulty,
  sector: c.sector,
}));
