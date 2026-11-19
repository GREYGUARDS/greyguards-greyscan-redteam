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
      "amoxicillin", "Doncaster depot", "recall waiver", "MHRA", "cold-chain log",
      "children's medicine", "contamination", "batch recall", "PharmacoreKnew", "Priya Khatri",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "A deceptive TikTok presents a forged Doncaster depot log to claim Pharmacore knowingly shipped unsafe children's amoxicillin after a fridge failure.",
        severity: "critical",
        frequency: 41,
        keywords: ["forged depot log", "amoxicillin", "fridge failure", "Doncaster"],
      },
      {
        type: "disinformation",
        description:
          "A forged MHRA notice claims a Class 1 recall on all Pharmacore amoxicillin and tells pharmacies to stop dispensing it.",
        severity: "critical",
        frequency: 33,
        keywords: ["MHRA", "Class 1 recall", "fake notice", "stop dispensing"],
      },
      {
        type: "disinformation",
        description:
          "Coordinated accounts repost the opening clip under #PharmacoreKnew, adding false claims that three children are in hospital.",
        severity: "high",
        frequency: 26,
        keywords: ["PharmacoreKnew", "coordinated reposts", "children", "hospital"],
      },
      {
        type: "misinformation",
        description:
          "Worried parents and pharmacy staff repeat the unverified recall claim, with some parents throwing away prescribed medicine.",
        severity: "high",
        frequency: 19,
        keywords: ["parents", "binning medicine", "pharmacy", "unverified recall"],
      },
    ],
    predictions: [
      {
        narrative: "Parent anxiety turns the fabricated recall into a consumer-health story",
        confidence: 74,
        trajectory: "accelerating",
        signals: [
          "A Sheffield mum's reaction video is spreading beyond local parent groups",
          "Pharmacy staff on Reddit are asking whether the recall is genuine",
          "News Tonight is preparing a contamination report",
        ],
        recommendedAction:
          "Publish a verified batch checker and put Priya Khatri forward with clear advice for parents and pharmacists.",
      },
      {
        narrative: "The forged recall notice triggers NHS procurement pressure",
        confidence: 68,
        trajectory: "building",
        signals: [
          "Three ICBs are demanding an executive warranty",
          "TalkUK callers are repeating the hospital and cold-chain claims",
          "Search interest in Pharmacore recalls is accelerating",
        ],
        recommendedAction:
          "Share batch-provenance evidence with the MHRA and NHS procurement leads, supported by independent laboratory results.",
      },
    ],
    mentions: [
      {
        text: "This depot log says Pharmacore shipped children's amoxicillin after a fridge failure. Demand an MHRA recall now. #PharmacoreKnew",
        source: "tiktok",
        hoursAgo: 3,
        author: "@PharmaExposedUK",
        engagement: 30000,
      },
      {
        text: "My four-year-old was prescribed the amoxicillin they say is recalled. Why did nobody warn us?",
        source: "tiktok",
        hoursAgo: 6,
        author: "@sheffieldmum_jo",
        engagement: 48000,
      },
      {
        text: "This 'MHRA notice' doing the rounds in pharmacy WhatsApp groups does not appear on the MHRA site. Treat with caution.",
        source: "bluesky",
        hoursAgo: 9,
        author: "@rxverify",
        engagement: 2100,
      },
      {
        text: "Anyone actually seen this MHRA amoxicillin recall? Patients are asking and I cannot find it on the official alerts page.",
        source: "reddit",
        hoursAgo: 12,
        author: "u/ward_pharm_22",
        score: 2800,
      },
      {
        text: "Health Officials Investigate Pharmacore After Antibiotic Contamination Claims",
        source: "news",
        hoursAgo: 18,
        title: "Pharmacore Antibiotic Contamination Claims",
        outlet: "News Tonight",
      },
    ],
    stories: [
      {
        headline: "Forged Depot Log Drives False Pharmacore Recall Claims",
        outlet: "Pharmacy Trade Weekly",
        hoursAgo: 9,
        sentiment: -0.7,
        reach: 84000,
        type: "news",
      },
      {
        headline: "Parents Bin Antibiotics as Unverified Recall Spreads Online",
        outlet: "Midlands Business Post",
        hoursAgo: 26,
        sentiment: -0.5,
        reach: 121000,
        type: "feature",
      },
    ],
    entities: ["Julian Mercer", "Priya Khatri", "Frank Mercer", "MHRA", "NHS Supply Chain", "Colston Bridge Capital"],
    locations: [
      { name: "Sheffield", count: 24, lat: 53.3811, lon: -1.4701 },
      { name: "Doncaster", count: 18, lat: 53.5228, lon: -1.1285 },
      { name: "Wolverhampton", count: 14, lat: 52.5862, lon: -2.1288 },
      { name: "Leeds", count: 8, lat: 53.8008, lon: -1.5491 },
      { name: "London", count: 6, lat: 51.5072, lon: -0.1276 },
    ],
    themes: [
      { name: "MEDICAL_SUPPLY", count: 27 },
      { name: "REGULATORY_ACTION", count: 19 },
      { name: "PUBLIC_HEALTH", count: 16 },
      { name: "FABRICATED_DOCUMENTS", count: 12 },
      { name: "CONSUMER_PANIC", count: 9 },
    ],
    sources: [
      { name: "TikTok", count: 24 },
      { name: "Parent communities", count: 17 },
      { name: "Reddit", count: 12 },
      { name: "Google News", count: 11, country: "UK" },
      { name: "TalkUK", count: 8, country: "UK" },
      { name: "Trade press", count: 6 },
    ],
    risingQueries: [
      { query: "pharmacore amoxicillin recall", value: 3900 },
      { query: "pharmacore doncaster depot log", value: 2600 },
      { query: "mhra amoxicillin recall notice", value: 1800 },
      { query: "is pharmacore medicine safe", value: 1450 },
      { query: "pharmacore batch checker", value: 980 },
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
      "edited CEO clip", "flood payouts", "claims freeze", "Thomas Reeve", "renewals",
      "cancel insurance", "TrustInsureScandal", "claims backlog", "FCA", "comparison sites",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "A paid TikTok creator uses a maliciously cut Thomas Reeve clip and a fake claims-freeze matrix to claim TrustInsureUK has stopped flood payouts.",
        severity: "critical",
        frequency: 58,
        keywords: ["edited CEO clip", "claims-freeze matrix", "flood payouts", "Thomas Reeve"],
      },
      {
        type: "disinformation",
        description:
          "Coordinated reposts urge customers to cancel before renewal, repeating the edited quote 'People will simply have to wait'.",
        severity: "high",
        frequency: 44,
        keywords: ["renewals", "cancel", "coordinated reposts", "TrustInsureScandal"],
      },
      {
        type: "malinformation",
        description:
          "The genuine post-merger claims backlog is being used as proof of a fabricated blanket freeze on valid flood claims.",
        severity: "high",
        frequency: 31,
        keywords: ["claims backlog", "post-merger", "genuine grievance", "blanket freeze"],
      },
      {
        type: "misinformation",
        description:
          "A local firefighter and anxious customers repeat the false freeze claim, giving it credibility in flood-hit communities.",
        severity: "high",
        frequency: 27,
        keywords: ["firefighter", "community reaction", "flood-hit", "false freeze"],
      },
    ],
    predictions: [
      {
        narrative: "Community reaction carries the edited CEO clip into broadcast coverage",
        confidence: 81,
        trajectory: "accelerating",
        signals: [
          "A firefighter's reaction video is spreading in flood-hit communities",
          "TalkUK callers are citing the clip as a reason to cancel",
          "News Tonight is covering the flood-claims backlash",
        ],
        recommendedAction:
          "Release the unedited clip with verified payout figures and offer a direct case line for customers still waiting.",
      },
      {
        narrative: "Renewal anxiety spreads to comparison sites and claims staff",
        confidence: 66,
        trajectory: "building",
        signals: [
          "One-star reviews mention the manipulated video",
          "Front-line staff say they do not know how to answer customers",
          "Two comparison sites are considering pausing quotes",
        ],
        recommendedAction:
          "Brief front-line teams and brokers with the same verified claims position, payout data and escalation contacts.",
      },
    ],
    mentions: [
      {
        text: "TrustInsureUK's CEO said people will have to wait. Their own matrix says flood claims are frozen. Switch before renewal. #TrustInsureScandal",
        source: "tiktok",
        hoursAgo: 2,
        author: "@moneyrights_dan",
        engagement: 32000,
      },
      {
        text: "I've been pumping out homes all week. Now people are telling me their flood payouts have been frozen — including my mum's.",
        source: "tiktok",
        hoursAgo: 5,
        author: "@firefighter_matt",
        engagement: 41000,
      },
      {
        text: "TrustInsureUK Boss in 'Claims Can Wait' Row — Insurer Says Clip Was Edited",
        source: "news",
        hoursAgo: 8,
        title: "TrustInsureUK Boss in 'Claims Can Wait' Row",
        outlet: "News Tonight",
      },
      {
        text: "Their CEO said it. Six months on, still no payout for our members. Share if TrustInsureUK let you down.",
        source: "forum",
        hoursAgo: 12,
        author: "Flood Victims UK",
        score: 5200,
      },
      {
        text: "I watched the CEO video this morning and cancelled. Twelve years of payments and I do not trust them any more.",
        source: "bluesky",
        hoursAgo: 18,
        author: "Gary in Bolton",
        engagement: 9800,
      },
    ],
    stories: [
      {
        headline: "Insurer Says Viral CEO Clip Was Edited as Flood-Claims Rumour Spreads",
        outlet: "Consumer Finance Review",
        hoursAgo: 7,
        sentiment: -0.8,
        reach: 640000,
        type: "investigative",
      },
      {
        headline: "Firefighter's Video Pushes False Flood-Payout Freeze into Communities",
        outlet: "Money Matters Weekly",
        hoursAgo: 22,
        sentiment: -0.6,
        reach: 310000,
        type: "news",
      },
    ],
    entities: ["Thomas Reeve", "Sarah Osei", "Robert Iyanu", "Financial Conduct Authority", "Financial Ombudsman Service"],
    locations: [
      { name: "Bristol", count: 34, lat: 51.4545, lon: -2.5879 },
      { name: "Leeds", count: 17, lat: 53.8008, lon: -1.5491 },
      { name: "Bolton", count: 12, lat: 53.5769, lon: -2.4282 },
      { name: "Croydon", count: 8, lat: 51.3762, lon: -0.0982 },
      { name: "Cardiff", count: 6, lat: 51.4816, lon: -3.1791 },
    ],
    themes: [
      { name: "CONSUMER_PROTECTION", count: 33 },
      { name: "MANIPULATED_MEDIA", count: 24 },
      { name: "FLOOD_CLAIMS", count: 21 },
      { name: "RENEWAL_CONFIDENCE", count: 14 },
      { name: "CORPORATE_GOVERNANCE", count: 11 },
    ],
    sources: [
      { name: "TikTok", count: 41 },
      { name: "Consumer forums", count: 28 },
      { name: "Google News", count: 19, country: "UK" },
      { name: "TalkUK", count: 14 },
      { name: "Trustpilot", count: 11, country: "UK" },
      { name: "Broker portals", count: 9 },
    ],
    risingQueries: [
      { query: "trustinsureuk ceo edited clip", value: 6100 },
      { query: "trustinsureuk flood claims frozen", value: 4700 },
      { query: "people will simply have to wait", value: 3300 },
      { query: "cancel trustinsureuk renewal", value: 2500 },
      { query: "trustinsureuk flood payout", value: 1600 },
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
      "withdrawals", "£40m liquidity hole", "treasury spreadsheet", "IPO", "Faster Payments",
      "rent payment", "PigeeBank", "deposit flight", "FSCS", "bank run",
    ],
    narratives: [
      {
        type: "disinformation",
        description:
          "A deceptive TikTok 'whistleblower' presents a doctored £40m treasury spreadsheet to claim PigeeBank is throttling withdrawals before its IPO.",
        severity: "critical",
        frequency: 96,
        keywords: ["doctored spreadsheet", "£40m", "liquidity hole", "IPO"],
      },
      {
        type: "disinformation",
        description:
          "Coordinated accounts spread the clip into Telegram and investor groups, urging customers to withdraw before the stock market launch.",
        severity: "critical",
        frequency: 88,
        keywords: ["Telegram", "withdraw", "stock market launch", "coordinated"],
      },
      {
        type: "misinformation",
        description:
          "A young renter and other customers treat a failed rent payment and slow transfers as proof of the false withdrawal restriction.",
        severity: "high",
        frequency: 52,
        keywords: ["rent payment", "failed transfer", "customer reaction", "withdrawals"],
      },
      {
        type: "disinformation",
        description:
          "Amplifiers claim Faster Payments are being throttled and FSCS protection takes months to pay out, intensifying deposit-flight fears.",
        severity: "high",
        frequency: 37,
        keywords: ["Faster Payments", "FSCS", "deposit flight", "false protection claim"],
      },
    ],
    predictions: [
      {
        narrative: "Everyday payment fears turn the fabricated liquidity claim into deposit panic",
        confidence: 79,
        trajectory: "accelerating",
        signals: [
          "A renter's failed-payment video is being treated as evidence",
          "Telegram groups are urging immediate withdrawals",
          "App Store reviews mention slow transfers and frozen accounts",
        ],
        recommendedAction:
          "Publish live Faster Payments status and resolve visible customer cases quickly with their permission.",
      },
      {
        narrative: "Withdrawal rumours place the IPO roadshow and underwriting under pressure",
        confidence: 71,
        trajectory: "accelerating",
        signals: [
          "CBBN is questioning the IPO timetable",
          "Fintech journalists are requesting verified outflow data",
          "A cornerstone fund is threatening to withdraw its allocation",
        ],
        recommendedAction:
          "Give investors and journalists verified deposit-retention figures alongside a plain-English FSCS explanation.",
      },
    ],
    mentions: [
      {
        text: "This treasury spreadsheet shows a £40m hole. PigeeBank is throttling withdrawals before the IPO — move your money now.",
        source: "tiktok",
        hoursAgo: 1,
        author: "@fintech_sam",
        engagement: 29000,
      },
      {
        text: "My rent payment bounced and my landlord is fuming. If PigeeBank is blocking withdrawals, get your money out first.",
        source: "tiktok",
        hoursAgo: 3,
        author: "@chloe.rents",
        engagement: 37000,
      },
      {
        text: "PigeeBank IPO Under Pressure as Withdrawal Rumours Spread",
        source: "news",
        hoursAgo: 5,
        title: "PigeeBank IPO Under Pressure",
        outlet: "CBBN",
      },
      {
        text: "PigeeBank withdrawals limited from tonight. Move savings now and forward this to family.",
        source: "forum",
        hoursAgo: 7,
        author: "UK Money Moves · Telegram",
        score: 11200,
      },
      {
        text: "I've seen no evidence PigeeBank is restricting withdrawals. But the bank needs to publish numbers, not vibes.",
        source: "twitter",
        hoursAgo: 11,
        author: "@elliemarsh_fin",
        engagement: 4800,
      },
    ],
    stories: [
      {
        headline: "Doctored Treasury Spreadsheet Drives False PigeeBank Withdrawal Claims",
        outlet: "Financial Wire",
        hoursAgo: 4,
        sentiment: -0.9,
        reach: 1900000,
        type: "investigative",
      },
      {
        headline: "Renter's Failed-Payment Video Adds to Pre-IPO Deposit Anxiety",
        outlet: "City Business Daily",
        hoursAgo: 10,
        sentiment: -0.4,
        reach: 420000,
        type: "news",
      },
    ],
    entities: ["Alex Bryce", "Naomi Hart", "David Okafor", "Bank of England", "Financial Conduct Authority", "Ratings agencies"],
    locations: [
      { name: "London", count: 58, lat: 51.5072, lon: -0.1276 },
      { name: "Leeds", count: 19, lat: 53.8008, lon: -1.5491 },
      { name: "Manchester", count: 14, lat: 53.4808, lon: -2.2426 },
      { name: "Reading", count: 9, lat: 51.4543, lon: -0.9781 },
      { name: "Glasgow", count: 7, lat: 55.8642, lon: -4.2518 },
    ],
    themes: [
      { name: "BANK_LIQUIDITY", count: 47 },
      { name: "FABRICATED_DOCUMENTS", count: 33 },
      { name: "PAYMENT_CONFIDENCE", count: 28 },
      { name: "MARKET_CONFIDENCE", count: 22 },
      { name: "DEPOSIT_PROTECTION", count: 13 },
    ],
    sources: [
      { name: "TikTok", count: 66 },
      { name: "Telegram", count: 38 },
      { name: "Google News", count: 27, country: "UK" },
      { name: "Twitter/X", count: 21 },
      { name: "App Store reviews", count: 16, country: "UK" },
      { name: "Investor chat groups", count: 12 },
    ],
    risingQueries: [
      { query: "pigeebank withdrawals restricted", value: 12400 },
      { query: "is my money safe pigeebank", value: 9800 },
      { query: "pigeebank £40m treasury spreadsheet", value: 7200 },
      { query: "pigeebank rent payment failed", value: 5100 },
      { query: "pigeebank ipo withdrawal rumours", value: 3600 },
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
      { name: "Positive", value: profile.sentiment.positive, color: "hsl(var(--chart-4))" },
      { name: "Neutral", value: profile.sentiment.neutral, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: profile.sentiment.negative, color: "hsl(var(--chart-1))" },
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
