// Generate fallback demo data when all APIs fail
// This ensures the dashboard remains functional even without API connectivity

import { type AnalysisResult } from "./sentiment";

export interface FallbackData {
  mentions: any[];
  trendsData: any;
  sources: { name: string; count: number; country?: string }[];
  gdeltEntities: { name: string; count: number }[];
  gdeltLocations: { name: string; count: number; lat?: number; lon?: number }[];
  gdeltThemes: { name: string; count: number }[];
  analysis: AnalysisResult;
  mdmNarratives: any[];
  emergingPredictions: any[];
}

const generateTimelineData = (days: number, baseVolume: number, volatility: number) => {
  const data = [];
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = Math.random() * volatility - volatility / 2;
    data.push({
      date: date.toISOString().split('T')[0],
      mentions: Math.max(5, Math.round(baseVolume + variance)),
      sentiment: Math.round(Math.random() * 60 - 20) // Slightly negative bias for realistic data
    });
  }
  return data;
};

/**
 * Generates realistic fallback data for any brand name when APIs are unavailable.
 * This allows the dashboard to demonstrate functionality without live API data.
 */
export function generateFallbackData(brandName: string): FallbackData {
  const now = new Date();
  
  // Generate synthetic mentions based on brand name
  const mentions = [
    {
      text: `${brandName} announces new strategic initiative for Q1 2025, focusing on sustainable growth.`,
      source: "news",
      date: new Date(now.getTime() - 86400000),
    },
    {
      text: `Investors react positively to ${brandName}'s latest earnings report, stock up 3%.`,
      source: "news",
      date: new Date(now.getTime() - 172800000),
    },
    {
      text: `Community discussion: What do you think about ${brandName}'s recent changes? Mixed feelings here.`,
      source: "reddit",
      date: new Date(now.getTime() - 259200000),
      score: 156,
    },
    {
      text: `${brandName} faces criticism over new pricing model. Customers expressing frustration online.`,
      source: "twitter",
      date: new Date(now.getTime() - 345600000),
    },
    {
      text: `Industry analysis: ${brandName} positioned well for market expansion despite challenges.`,
      source: "news",
      date: new Date(now.getTime() - 432000000),
    },
    {
      text: `${brandName} partners with leading tech firms for innovation initiative.`,
      source: "news",
      date: new Date(now.getTime() - 518400000),
    },
    {
      text: `Interesting thread on ${brandName}'s competitive positioning in the current market landscape.`,
      source: "hackernews",
      date: new Date(now.getTime() - 604800000),
      score: 89,
    },
    {
      text: `${brandName} CEO speaks at industry conference about future of the sector.`,
      source: "news",
      date: new Date(now.getTime() - 691200000),
    },
  ];

  const sources = [
    { name: "News APIs", count: 4 },
    { name: "Reddit", count: 1 },
    { name: "Twitter/X", count: 1 },
    { name: "Hacker News", count: 1 },
    { name: "RSS Feeds", count: 1 },
  ];

  const gdeltEntities = [
    { name: brandName, count: 15 },
    { name: "Industry Analysts", count: 8 },
    { name: "Investors", count: 6 },
    { name: "Competitors", count: 4 },
    { name: "Regulators", count: 3 },
  ];

  const gdeltLocations = [
    { name: "United States", count: 12, lat: 39.8283, lon: -98.5795 },
    { name: "United Kingdom", count: 6, lat: 55.3781, lon: -3.436 },
    { name: "Germany", count: 4, lat: 51.1657, lon: 10.4515 },
    { name: "Japan", count: 3, lat: 36.2048, lon: 138.2529 },
    { name: "Australia", count: 2, lat: -25.2744, lon: 133.7751 },
  ];

  const gdeltThemes = [
    { name: "BUSINESS_STRATEGY", count: 10 },
    { name: "MARKET_ANALYSIS", count: 8 },
    { name: "CORPORATE_NEWS", count: 7 },
    { name: "INNOVATION", count: 5 },
    { name: "COMPETITION", count: 4 },
    { name: "REGULATION", count: 3 },
  ];

  const trendsData = {
    interest_over_time: {
      timeline_data: generateTimelineData(30, 50, 20).map(d => ({
        date: d.date,
        values: [{ value: Math.max(10, Math.round(d.mentions * 1.2)) }]
      }))
    },
    related_queries: {
      rising: [
        { query: `${brandName} news`, value: 2500 },
        { query: `${brandName} stock`, value: 1800 },
        { query: `${brandName} reviews`, value: 1200 },
        { query: `${brandName} competitors`, value: 900 },
        { query: `${brandName} CEO`, value: 600 },
      ]
    }
  };

  const timeline = generateTimelineData(30, 8, 5);
  
  // Calculate sentiment from generated mentions (slightly positive bias with some negative)
  const analysis: AnalysisResult = {
    sentimentDistribution: [
      { name: "Positive", value: 35, fill: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 40, fill: "hsl(var(--chart-3))" },
      { name: "Negative", value: 25, fill: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: 8,
    longTermSentiment: 12,
    trendIcon: "stable" as const,
    previousSentiment: 10,
    keywords: [
      { word: brandName.toLowerCase(), count: 15 },
      { word: "strategy", count: 8 },
      { word: "growth", count: 7 },
      { word: "market", count: 6 },
      { word: "innovation", count: 5 },
      { word: "investors", count: 4 },
      { word: "customers", count: 4 },
      { word: "industry", count: 3 },
    ],
    timeline,
    threatLevel: "low" as const,
    threatScore: 28,
  };

  const mdmNarratives = [
    {
      id: `fallback-mdm-001`,
      narrative_type: "misinformation",
      narrative_description: `Unverified claims circulating about ${brandName}'s business practices require monitoring`,
      severity: "moderate",
      frequency: 12,
      keywords: [brandName.toLowerCase(), "rumours", "unverified", "claims"],
      detected_at: new Date().toISOString()
    },
    {
      id: `fallback-mdm-002`,
      narrative_type: "malinformation",
      narrative_description: `Old news about ${brandName} being recirculated without proper context`,
      severity: "low",
      frequency: 8,
      keywords: [brandName.toLowerCase(), "outdated", "context", "history"],
      detected_at: new Date().toISOString()
    }
  ];

  const emergingPredictions = [
    {
      id: `fallback-pred-001`,
      narrative: `Potential increase in media coverage of ${brandName} market positioning expected`,
      confidence: 65,
      trajectory: "emerging",
      signals: ["Increased search interest", "Industry analyst activity", "Competitor announcements"],
      recommendedAction: "Monitor media mentions and prepare responsive messaging"
    }
  ];

  return {
    mentions,
    trendsData,
    sources,
    gdeltEntities,
    gdeltLocations,
    gdeltThemes,
    analysis,
    mdmNarratives,
    emergingPredictions,
  };
}
