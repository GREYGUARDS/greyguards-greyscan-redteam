// Comprehensive demo data for fictional companies
// Each company has unique narratives, threats, and intelligence data

export interface DemoCompany {
  name: string;
  description: string;
  industry: string;
  threatLevel: "low" | "moderate" | "elevated" | "high" | "critical";
  threatScore: number;
  sentimentDistribution: { name: string; value: number; color: string }[];
  shortTermSentiment: number;
  longTermSentiment: number;
  trendIcon: "up" | "down" | "stable";
  previousSentiment: number;
  keywords: { word: string; count: number }[];
  timeline: { date: string; mentions: number; sentiment: number }[];
  mdmNarratives: any[];
  emergingPredictions: any[];
  alerts: any[];
  mentions: any[];
  trendsData: any;
  gdeltEntities: { name: string; count: number }[];
  gdeltLocations: { name: string; count: number; lat?: number; lon?: number }[];
  gdeltThemes: { name: string; count: number }[];
  sources: { name: string; count: number; country?: string }[];
  people: any[];
  personMentions: Record<string, any>;
  personNarratives: Record<string, any[]>;
  trackedStories: any[];
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
      sentiment: Math.round(Math.random() * 100 - 50)
    });
  }
  return data;
};

export const DEMO_COMPANIES: Record<string, DemoCompany> = {
  "Stark Industries": {
    name: "Stark Industries",
    description: "Global defence technology and clean energy conglomerate",
    industry: "Defence & Technology",
    threatLevel: "elevated",
    threatScore: 68,
    sentimentDistribution: [
      { name: "Positive", value: 28, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 39, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 23, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -12,
    longTermSentiment: 8,
    trendIcon: "down",
    previousSentiment: 15,
    keywords: [
      { word: "weapons", count: 19 },
      { word: "arc reactor", count: 15 },
      { word: "military contracts", count: 13 },
      { word: "Tony Stark", count: 12 },
      { word: "clean energy", count: 10 },
      { word: "AI systems", count: 9 },
      { word: "defence spending", count: 8 },
      { word: "government", count: 7 },
      { word: "innovation", count: 6 },
      { word: "controversy", count: 5 }
    ],
    timeline: generateTimelineData(30, 45, 30),
    mdmNarratives: [
      {
        id: "stark-001",
        narrative_type: "disinformation",
        narrative_description: "Claims that Stark Industries weapons were sold to hostile nations through shell companies",
        severity: "high",
        frequency: 47,
        keywords: ["weapons", "illegal sales", "shell companies", "hostile nations"],
        detected_at: new Date().toISOString()
      },
      {
        id: "stark-002",
        narrative_type: "misinformation",
        narrative_description: "Viral posts claiming arc reactor technology causes radiation poisoning in nearby communities",
        severity: "high",
        frequency: 38,
        keywords: ["radiation", "arc reactor", "health risk", "coverup"],
        detected_at: new Date().toISOString()
      },
      {
        id: "stark-003",
        narrative_type: "malinformation",
        narrative_description: "Leaked internal memos about past safety violations being amplified out of context",
        severity: "moderate",
        frequency: 29,
        keywords: ["safety violations", "leaked", "cover-up", "negligence"],
        detected_at: new Date().toISOString()
      },
      {
        id: "stark-004",
        narrative_type: "disinformation",
        narrative_description: "Fabricated claims that AI defence systems have autonomous kill capabilities",
        severity: "critical",
        frequency: 52,
        keywords: ["AI", "autonomous weapons", "killer robots", "no oversight"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-stark-001",
        narrative: "Growing narrative linking Stark Industries to surveillance state programs",
        confidence: 78,
        trajectory: "accelerating",
        signals: ["Increased social media activity", "Coordination patterns detected", "State actor involvement suspected"],
        recommendedAction: "Prepare transparent disclosure about data handling policies"
      },
      {
        id: "pred-stark-002",
        narrative: "Environmental groups preparing campaign against new facility construction",
        confidence: 65,
        trajectory: "emerging",
        signals: ["NGO communications intercepted", "Protest permits filed", "Media briefings scheduled"],
        recommendedAction: "Proactive community engagement and environmental impact transparency"
      }
    ],
    alerts: [
      {
        id: "alert-stark-001",
        alert_type: "surge",
        narrative_id: "stark-004",
        narrative_description: "AI weapons narrative experiencing 340% surge in mentions",
        severity: "critical",
        current_frequency: 52,
        previous_frequency: 12,
        frequency_change_percent: 333,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-stark-002",
        alert_type: "new_narrative",
        narrative_id: "stark-005",
        narrative_description: "New coordinated campaign claiming Stark technology being used for mass surveillance",
        severity: "high",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    mentions: [
      {
        text: "BREAKING: Leaked documents suggest Stark Industries violated export controls on advanced weapons systems. Pentagon launches investigation. #StarkScandal",
        source: "twitter",
        date: new Date(),
        author: "@DefenseWatch",
        engagement: 45000
      },
      {
        text: "Stark Industries' new Arc Reactor facility approved despite community health concerns. Local residents report increased cancer rates - coincidence?",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/TruthSeeker2024",
        score: 2340
      },
      {
        text: "INVESTIGATION: How Stark Industries' AI Defence Systems Could Operate Without Human Oversight",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "The Dark Side of Stark Tech",
        outlet: "Global Defence Weekly"
      },
      {
        text: "Stark Industries announces $50B clean energy initiative. Critics call it 'greenwashing' to distract from weapons contracts.",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "Stark's Green Pivot",
        outlet: "Tech Chronicle"
      },
      {
        text: "Thread: I worked at Stark Industries for 5 years. Here's what they don't want you to know about their 'humanitarian' projects... 🧵1/23",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@WhistleblowerAnon",
        engagement: 89000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 60, 25).map(d => ({
          date: d.date,
          values: [{ value: Math.max(10, Math.round(d.mentions * 1.5)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Stark Industries weapons scandal", value: 4500 },
          { query: "arc reactor radiation", value: 3200 },
          { query: "Tony Stark controversy", value: 2800 },
          { query: "Stark AI weapons", value: 2100 },
          { query: "Stark Industries stock", value: 1800 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Tony Stark", count: 19 },
      { name: "Pepper Potts", count: 12 },
      { name: "US Department of Defense", count: 11 },
      { name: "Stark Industries", count: 37 },
      { name: "Congress", count: 7 },
      { name: "UN Security Council", count: 5 }
    ],
    gdeltLocations: [
      { name: "New York", count: 19, lat: 40.7128, lon: -74.006 },
      { name: "Washington D.C.", count: 15, lat: 38.9072, lon: -77.0369 },
      { name: "Los Angeles", count: 12, lat: 34.0522, lon: -118.2437 },
      { name: "Geneva", count: 6, lat: 46.2044, lon: 6.1432 },
      { name: "Beijing", count: 4, lat: 39.9042, lon: 116.4074 }
    ],
    gdeltThemes: [
      { name: "MILITARY_TECHNOLOGY", count: 28 },
      { name: "WEAPONS_PROLIFERATION", count: 19 },
      { name: "CORPORATE_GOVERNANCE", count: 15 },
      { name: "ENVIRONMENTAL_IMPACT", count: 13 },
      { name: "ARTIFICIAL_INTELLIGENCE", count: 11 },
      { name: "GOVERNMENT_CONTRACTS", count: 9 }
    ],
    sources: [
      { name: "Twitter/X", count: 37 },
      { name: "Reddit", count: 19 },
      { name: "NewsAPI", count: 15 },
      { name: "GDELT (US)", count: 12 },
      { name: "Mastodon", count: 5 },
      { name: "Hacker News", count: 4 },
      { name: "BBC News", count: 3 },
      { name: "Reuters", count: 2 },
      { name: "GDELT (UK)", count: 2 }
    ],
    people: [
      { id: "stark-ceo", person_name: "Tony Stark", person_role: "CEO & Founder" },
      { id: "stark-coo", person_name: "Pepper Potts", person_role: "COO" },
      { id: "stark-cto", person_name: "James Rhodes", person_role: "Defence Liaison" },
      { id: "stark-cfo", person_name: "Harold Hogan", person_role: "Head of Security" }
    ],
    personMentions: {
      "stark-ceo": {
        mention_count: 46,
        sentiment_score: -18,
        positive_count: 12,
        negative_count: 19,
        neutral_count: 15
      },
      "stark-coo": {
        mention_count: 19,
        sentiment_score: 24,
        positive_count: 9,
        negative_count: 4,
        neutral_count: 6
      },
      "stark-cto": {
        mention_count: 15,
        sentiment_score: 8,
        positive_count: 6,
        negative_count: 4,
        neutral_count: 5
      }
    },
    personNarratives: {
      "stark-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Claims Tony Stark personally approved illegal weapons sales",
          severity: "critical",
          frequency: 89
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Old footage of factory accident being recirculated as recent",
          severity: "high",
          frequency: 45
        }
      ],
      "stark-coo": [
        {
          narrative_type: "misinformation",
          narrative_description: "False rumours about company financial irregularities",
          severity: "moderate",
          frequency: 23
        }
      ]
    },
    trackedStories: [
      {
        id: "story-stark-001",
        headline: "EXCLUSIVE: Stark Industries Weapons Found in Conflict Zone",
        outlet: "Global Defence Weekly",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.8,
        reach: 2400000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop"
      },
      {
        id: "story-stark-002",
        headline: "Community Groups Demand Answers on Arc Reactor Health Impacts",
        outlet: "Environmental News Network",
        published: new Date(Date.now() - 172800000).toISOString(),
        sentiment: -0.6,
        reach: 890000,
        type: "feature",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop"
      }
    ]
  },

  "Wayne Enterprises": {
    name: "Wayne Enterprises",
    description: "Diversified conglomerate with holdings in technology, finance, and real estate",
    industry: "Diversified Holdings",
    threatLevel: "high",
    threatScore: 76,
    sentimentDistribution: [
      { name: "Positive", value: 18, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 29, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 31, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -28,
    longTermSentiment: 5,
    trendIcon: "down",
    previousSentiment: 12,
    keywords: [
      { word: "Bruce Wayne", count: 24 },
      { word: "Gotham", count: 21 },
      { word: "philanthropy", count: 16 },
      { word: "corruption", count: 15 },
      { word: "real estate", count: 12 },
      { word: "Wayne Foundation", count: 11 },
      { word: "crime", count: 10 },
      { word: "investment", count: 8 },
      { word: "development", count: 7 },
      { word: "scandal", count: 6 }
    ],
    timeline: generateTimelineData(30, 55, 35),
    mdmNarratives: [
      {
        id: "wayne-001",
        narrative_type: "disinformation",
        narrative_description: "Coordinated campaign claiming Wayne Enterprises launders money for organised crime",
        severity: "critical",
        frequency: 67,
        keywords: ["money laundering", "organised crime", "corruption", "Gotham underworld"],
        detected_at: new Date().toISOString()
      },
      {
        id: "wayne-002",
        narrative_type: "malinformation",
        narrative_description: "True reports of past business disputes being weaponized and amplified disproportionately",
        severity: "high",
        frequency: 45,
        keywords: ["lawsuits", "disputes", "former employees", "settlements"],
        detected_at: new Date().toISOString()
      },
      {
        id: "wayne-003",
        narrative_type: "misinformation",
        narrative_description: "False claims that Wayne Foundation charities are tax evasion schemes",
        severity: "high",
        frequency: 52,
        keywords: ["tax evasion", "charity fraud", "shell organisations", "offshore"],
        detected_at: new Date().toISOString()
      },
      {
        id: "wayne-004",
        narrative_type: "disinformation",
        narrative_description: "Fabricated documents alleging Bruce Wayne's secret involvement in Gotham's criminal enterprises",
        severity: "critical",
        frequency: 78,
        keywords: ["secret identity", "criminal ties", "double life", "conspiracy"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-wayne-001",
        narrative: "Documentary film crew gathering material for exposé on Wayne family history",
        confidence: 82,
        trajectory: "accelerating",
        signals: ["Production company inquiries", "Former employee interviews", "FOIA requests filed"],
        recommendedAction: "Prepare comprehensive response package and consider proactive media engagement"
      },
      {
        id: "pred-wayne-002",
        narrative: "Political opponents planning to use Wayne Enterprises ties in upcoming campaign",
        confidence: 71,
        trajectory: "emerging",
        signals: ["Opposition research detected", "PAC communications intercepted", "Test messaging identified"],
        recommendedAction: "Document charitable contributions and community impact for rapid response"
      }
    ],
    alerts: [
      {
        id: "alert-wayne-001",
        alert_type: "surge",
        narrative_id: "wayne-004",
        narrative_description: "Criminal conspiracy narrative experiencing viral spread - 520% increase",
        severity: "critical",
        current_frequency: 78,
        previous_frequency: 12,
        frequency_change_percent: 520,
        is_read: false,
        created_at: new Date().toISOString()
      }
    ],
    mentions: [
      {
        text: "EXPOSED: How Wayne Enterprises Really Made Its Billions - A Thread You Won't Believe 🧵",
        source: "twitter",
        date: new Date(),
        author: "@GothamTruth",
        engagement: 127000
      },
      {
        text: "My grandfather worked in the Wayne Enterprises mines in the 1950s. The stories he told about working conditions would make your blood run cold.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/GothamHistorian",
        score: 4560
      },
      {
        text: "Wayne Foundation announces $2B pledge for Gotham schools. Critics question timing amid corruption allegations.",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "Wayne's Convenient Charity",
        outlet: "Gotham Gazette"
      },
      {
        text: "Bruce Wayne spotted at charity gala while Gotham crime rates hit 10-year high. Priorities?",
        source: "twitter",
        date: new Date(Date.now() - 259200000),
        author: "@GothamWatch",
        engagement: 45000
      },
      {
        text: "Wayne Enterprises stock drops 8% amid corruption probe rumours. Investors nervous.",
        source: "news",
        date: new Date(Date.now() - 345600000),
        title: "Wayne Stock Tumbles",
        outlet: "Financial Times"
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 65, 30).map(d => ({
          date: d.date,
          values: [{ value: Math.max(10, Math.round(d.mentions * 1.4)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Wayne Enterprises corruption", value: 6200 },
          { query: "Bruce Wayne scandal", value: 5100 },
          { query: "Wayne Foundation fraud", value: 4300 },
          { query: "Gotham crime Wayne", value: 3800 },
          { query: "Wayne Enterprises stock crash", value: 2900 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Bruce Wayne", count: 31 },
      { name: "Wayne Enterprises", count: 45 },
      { name: "Wayne Foundation", count: 19 },
      { name: "Gotham City", count: 28 },
      { name: "Lucius Fox", count: 14 }
    ],
    gdeltLocations: [
      { name: "Gotham City", count: 42, lat: 40.7128, lon: -74.006 },
      { name: "New York", count: 18, lat: 40.7128, lon: -74.006 },
      { name: "Washington D.C.", count: 12, lat: 38.9072, lon: -77.0369 },
      { name: "London", count: 8, lat: 51.5074, lon: -0.1278 }
    ],
    gdeltThemes: [
      { name: "CORPORATE_GOVERNANCE", count: 32 },
      { name: "FINANCIAL_CRIME", count: 28 },
      { name: "PHILANTHROPY", count: 21 },
      { name: "REAL_ESTATE", count: 18 },
      { name: "POLITICAL_INFLUENCE", count: 15 }
    ],
    sources: [
      { name: "Twitter/X", count: 42 },
      { name: "Reddit", count: 28 },
      { name: "NewsAPI", count: 19 },
      { name: "GDELT (US)", count: 15 },
      { name: "Gotham Gazette", count: 11 },
      { name: "Financial Times", count: 7 }
    ],
    people: [
      { id: "wayne-ceo", person_name: "Bruce Wayne", person_role: "CEO & Chairman" },
      { id: "wayne-cto", person_name: "Lucius Fox", person_role: "CTO & President" },
      { id: "wayne-cfo", person_name: "Alfred Pennyworth", person_role: "Board Advisor" }
    ],
    personMentions: {
      "wayne-ceo": {
        mention_count: 89,
        sentiment_score: -32,
        positive_count: 18,
        negative_count: 45,
        neutral_count: 26
      },
      "wayne-cto": {
        mention_count: 34,
        sentiment_score: 15,
        positive_count: 14,
        negative_count: 8,
        neutral_count: 12
      }
    },
    personNarratives: {
      "wayne-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Fabricated evidence linking Bruce Wayne to organised crime figures",
          severity: "critical",
          frequency: 112
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Old party photos being weaponized to portray irresponsible leadership",
          severity: "high",
          frequency: 67
        }
      ],
      "wayne-cto": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims about technology patents being stolen",
          severity: "moderate",
          frequency: 28
        }
      ]
    },
    trackedStories: [
      {
        id: "story-wayne-001",
        headline: "Inside Wayne Enterprises: A History of Controversy",
        outlet: "Gotham Gazette",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.7,
        reach: 3200000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
      },
      {
        id: "story-wayne-002",
        headline: "Wayne Foundation: Philanthropy or Tax Shelter?",
        outlet: "Financial Investigator",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.6,
        reach: 1800000,
        type: "analysis",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop"
      }
    ]
  },

  "Anon Financial Services": {
    name: "Anon Financial Services",
    description: "Global investment bank and wealth management firm",
    industry: "Financial Services",
    threatLevel: "critical",
    threatScore: 89,
    sentimentDistribution: [
      { name: "Positive", value: 12, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 23, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 65, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -45,
    longTermSentiment: -12,
    trendIcon: "down",
    previousSentiment: -8,
    keywords: [
      { word: "market manipulation", count: 34 },
      { word: "insider trading", count: 28 },
      { word: "fraud", count: 25 },
      { word: "pension funds", count: 22 },
      { word: "bailout", count: 19 },
      { word: "executive bonuses", count: 17 },
      { word: "regulatory failure", count: 15 },
      { word: "retail investors", count: 13 },
      { word: "hidden fees", count: 11 },
      { word: "whistleblower", count: 9 }
    ],
    timeline: generateTimelineData(30, 85, 45),
    mdmNarratives: [
      {
        id: "afs-001",
        narrative_type: "disinformation",
        narrative_description: "Coordinated campaign claiming Anon Financial deliberately crashed pension fund investments to profit from short positions",
        severity: "critical",
        frequency: 124,
        keywords: ["pension fraud", "market manipulation", "short selling", "retirement theft"],
        detected_at: new Date().toISOString()
      },
      {
        id: "afs-002",
        narrative_type: "malinformation",
        narrative_description: "Authentic 2008 crisis documents being recirculated as evidence of ongoing criminal activity",
        severity: "critical",
        frequency: 98,
        keywords: ["financial crisis", "bailout", "taxpayer money", "criminal executives"],
        detected_at: new Date().toISOString()
      },
      {
        id: "afs-003",
        narrative_type: "misinformation",
        narrative_description: "Viral claims that Anon Financial is laundering money for sanctioned nations through crypto shell companies",
        severity: "critical",
        frequency: 87,
        keywords: ["money laundering", "sanctions evasion", "cryptocurrency", "shell companies"],
        detected_at: new Date().toISOString()
      },
      {
        id: "afs-004",
        narrative_type: "disinformation",
        narrative_description: "Fabricated internal emails showing executives mocking retail investors as 'dumb money'",
        severity: "high",
        frequency: 76,
        keywords: ["retail investors", "elite contempt", "rigged system", "wealth inequality"],
        detected_at: new Date().toISOString()
      },
      {
        id: "afs-005",
        narrative_type: "misinformation",
        narrative_description: "False reports that Anon Financial is facing imminent insolvency and FDIC intervention",
        severity: "critical",
        frequency: 112,
        keywords: ["bank run", "insolvency", "FDIC", "deposit safety"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-afs-001",
        narrative: "Coordinated 'bank run' campaign scheduled across social platforms targeting retail depositors",
        confidence: 91,
        trajectory: "accelerating",
        signals: ["Telegram coordination detected", "Scheduled post patterns identified", "Influencer recruitment observed"],
        recommendedAction: "Immediate coordination with regulators and prepare customer reassurance campaign"
      },
      {
        id: "pred-afs-002",
        narrative: "Documentary production alleging systematic fraud against middle-class investors",
        confidence: 78,
        trajectory: "accelerating",
        signals: ["Former employee interviews confirmed", "FOIA requests for regulatory documents", "Media partnerships forming"],
        recommendedAction: "Proactive legal review and prepare comprehensive factual response"
      }
    ],
    alerts: [
      {
        id: "alert-afs-001",
        alert_type: "surge",
        narrative_id: "afs-005",
        narrative_description: "Bank run narrative experiencing 780% surge - coordinated attack detected",
        severity: "critical",
        current_frequency: 112,
        previous_frequency: 13,
        frequency_change_percent: 762,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-afs-002",
        alert_type: "new_narrative",
        narrative_id: "afs-006",
        narrative_description: "New deepfake video circulating showing fake CEO confession to fraud",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ],
    mentions: [
      {
        text: "🚨 BREAKING: Former Anon Financial trader reveals how they manipulated markets while regulators looked away. Thread 🧵1/47",
        source: "twitter",
        date: new Date(),
        author: "@WallStreetLeaks",
        engagement: 234000
      },
      {
        text: "My parents lost their entire retirement because of Anon Financial's 'advice'. Now executives are getting $50M bonuses. This system is broken.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/RetirementRuined",
        score: 12400
      },
      {
        text: "Anon Financial faces new regulatory investigation amid market manipulation allegations. Stock drops 12%.",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "Another Crisis for Anon Financial?",
        outlet: "Financial Times"
      },
      {
        text: "EXPOSED: How Anon Financial hides fees that cost average investors $4,000/year. The documents they don't want you to see.",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "The Hidden Cost of Wall Street",
        outlet: "Consumer Finance Watch"
      },
      {
        text: "Just withdrew everything from Anon Financial. Not taking any chances after what I'm reading. Who else is moving their money?",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@SmartMoney2024",
        engagement: 45000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 95, 50).map(d => ({
          date: d.date,
          values: [{ value: Math.max(20, Math.round(d.mentions * 1.8)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Anon Financial fraud", value: 12500 },
          { query: "Anon Financial bank run", value: 9800 },
          { query: "withdraw money Anon Financial", value: 8400 },
          { query: "Anon Financial investigation", value: 7200 },
          { query: "Anon Financial class action", value: 5600 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Anon Financial Services", count: 89 },
      { name: "SEC", count: 45 },
      { name: "Federal Reserve", count: 34 },
      { name: "Department of Justice", count: 28 },
      { name: "FDIC", count: 22 }
    ],
    gdeltLocations: [
      { name: "New York", count: 67, lat: 40.7128, lon: -74.006 },
      { name: "Washington D.C.", count: 45, lat: 38.9072, lon: -77.0369 },
      { name: "London", count: 34, lat: 51.5074, lon: -0.1278 },
      { name: "Hong Kong", count: 23, lat: 22.3193, lon: 114.1694 },
      { name: "Singapore", count: 18, lat: 1.3521, lon: 103.8198 }
    ],
    gdeltThemes: [
      { name: "FINANCIAL_CRIME", count: 78 },
      { name: "MARKET_MANIPULATION", count: 56 },
      { name: "REGULATORY_ACTION", count: 45 },
      { name: "CONSUMER_PROTECTION", count: 34 },
      { name: "CORPORATE_FRAUD", count: 29 }
    ],
    sources: [
      { name: "Twitter/X", count: 89 },
      { name: "Reddit", count: 67 },
      { name: "Financial Times", count: 34 },
      { name: "Bloomberg", count: 28 },
      { name: "Reuters", count: 23 },
      { name: "GDELT (US)", count: 19 }
    ],
    people: [
      { id: "afs-ceo", person_name: "Mr A Financial", person_role: "CEO" },
      { id: "afs-cfo", person_name: "Mrs B Financial", person_role: "CFO" },
      { id: "afs-cro", person_name: "Mr C Financial", person_role: "Chief Risk Officer" },
      { id: "afs-gc", person_name: "Mrs D Financial", person_role: "General Counsel" }
    ],
    personMentions: {
      "afs-ceo": {
        mention_count: 156,
        sentiment_score: -67,
        positive_count: 12,
        negative_count: 98,
        neutral_count: 46
      },
      "afs-cfo": {
        mention_count: 89,
        sentiment_score: -45,
        positive_count: 8,
        negative_count: 56,
        neutral_count: 25
      },
      "afs-cro": {
        mention_count: 67,
        sentiment_score: -52,
        positive_count: 5,
        negative_count: 48,
        neutral_count: 14
      }
    },
    personNarratives: {
      "afs-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Deepfake video showing fabricated confession to market manipulation",
          severity: "critical",
          frequency: 234
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Out-of-context quotes from decade-old interviews used to portray contempt for customers",
          severity: "high",
          frequency: 145
        }
      ],
      "afs-cfo": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims about personal offshore accounts hiding company losses",
          severity: "critical",
          frequency: 98
        }
      ]
    },
    trackedStories: [
      {
        id: "story-afs-001",
        headline: "Inside Anon Financial: How Wall Street Rigged the Game",
        outlet: "Financial Investigator",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.9,
        reach: 5600000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop"
      },
      {
        id: "story-afs-002",
        headline: "Pension Fund Losses: Anon Financial Under Fire",
        outlet: "Bloomberg",
        published: new Date(Date.now() - 172800000).toISOString(),
        sentiment: -0.8,
        reach: 4200000,
        type: "analysis",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=300&fit=crop"
      }
    ]
  },

  "Anon Defence & Aerospace": {
    name: "Anon Defence & Aerospace",
    description: "Major defence contractor and aerospace manufacturer",
    industry: "Defence & Aerospace",
    threatLevel: "critical",
    threatScore: 92,
    sentimentDistribution: [
      { name: "Positive", value: 8, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 19, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 73, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -58,
    longTermSentiment: -15,
    trendIcon: "down",
    previousSentiment: -10,
    keywords: [
      { word: "civilian casualties", count: 42 },
      { word: "weapons exports", count: 38 },
      { word: "war profiteering", count: 35 },
      { word: "classified leaks", count: 31 },
      { word: "contractor fraud", count: 28 },
      { word: "foreign sales", count: 24 },
      { word: "autonomous weapons", count: 21 },
      { word: "cost overruns", count: 18 },
      { word: "safety failures", count: 15 },
      { word: "lobbying", count: 12 }
    ],
    timeline: generateTimelineData(30, 92, 55),
    mdmNarratives: [
      {
        id: "ada-001",
        narrative_type: "disinformation",
        narrative_description: "State-sponsored campaign claiming Anon Defence weapons directly responsible for war crimes in multiple conflict zones",
        severity: "critical",
        frequency: 167,
        keywords: ["war crimes", "civilian deaths", "international law", "weapons accountability"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ada-002",
        narrative_type: "malinformation",
        narrative_description: "Authentic classified documents leaked and weaponized to maximum reputational damage",
        severity: "critical",
        frequency: 134,
        keywords: ["classified leak", "intelligence breach", "national security", "espionage"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ada-003",
        narrative_type: "disinformation",
        narrative_description: "Fabricated evidence of illegal arms sales to sanctioned regimes through intermediaries",
        severity: "critical",
        frequency: 112,
        keywords: ["sanctions violation", "illegal exports", "arms trafficking", "rogue states"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ada-004",
        narrative_type: "misinformation",
        narrative_description: "False claims that new fighter jet has critical design flaws causing pilot deaths",
        severity: "critical",
        frequency: 98,
        keywords: ["pilot safety", "design flaw", "cover-up", "military procurement"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ada-005",
        narrative_type: "disinformation",
        narrative_description: "Coordinated narrative that autonomous weapons systems operate without human oversight",
        severity: "critical",
        frequency: 145,
        keywords: ["killer robots", "AI weapons", "autonomous targeting", "no human control"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-ada-001",
        narrative: "Foreign intelligence service preparing major document release ahead of defence contract vote",
        confidence: 94,
        trajectory: "accelerating",
        signals: ["Diplomatic chatter intercepted", "Dark web activity increase", "Known APT group active"],
        recommendedAction: "Coordinate with national security agencies and prepare incident response"
      },
      {
        id: "pred-ada-002",
        narrative: "Anti-war coalition planning sustained protest campaign targeting shareholders and employees",
        confidence: 86,
        trajectory: "accelerating",
        signals: ["Activist coordination detected", "Employee doxing attempts", "Shareholder list acquisition"],
        recommendedAction: "Enhanced security protocols and employee protection measures"
      }
    ],
    alerts: [
      {
        id: "alert-ada-001",
        alert_type: "surge",
        narrative_id: "ada-001",
        narrative_description: "War crimes narrative surging 890% - state actor coordination confirmed",
        severity: "critical",
        current_frequency: 167,
        previous_frequency: 17,
        frequency_change_percent: 882,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-ada-002",
        alert_type: "new_narrative",
        narrative_id: "ada-006",
        narrative_description: "New classified documents appearing on leak sites - authenticity unconfirmed",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ],
    mentions: [
      {
        text: "BREAKING: Leaked Anon Defence documents reveal company knew weapons were being used against civilians. Full thread with evidence 🧵",
        source: "twitter",
        date: new Date(),
        author: "@WarCrimesWatch",
        engagement: 456000
      },
      {
        text: "My brother served 3 tours. He says Anon Defence equipment failures cost lives. But Congress keeps giving them contracts. Follow the lobbying money.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/VeteranVoice",
        score: 18900
      },
      {
        text: "Anon Defence awarded $45B contract despite ongoing fraud investigation. Defence analysts question decision.",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "Controversial Contract Award",
        outlet: "Defense News"
      },
      {
        text: "INVESTIGATION: The Anon Defence Autonomous Weapons Program They Don't Want You to Know About",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "Killer Robots: The Hidden Program",
        outlet: "The Intercept"
      },
      {
        text: "Every Anon Defence shareholder is complicit in war crimes. Divest now. #BoycottAnonDefence #StopTheWarMachine",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@PeaceAction",
        engagement: 89000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 105, 60).map(d => ({
          date: d.date,
          values: [{ value: Math.max(25, Math.round(d.mentions * 1.9)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Anon Defence war crimes", value: 18900 },
          { query: "Anon Defence leaked documents", value: 15600 },
          { query: "Anon Defence sanctions violation", value: 12400 },
          { query: "Anon Defence autonomous weapons", value: 9800 },
          { query: "boycott Anon Defence", value: 7600 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Anon Defence & Aerospace", count: 134 },
      { name: "Pentagon", count: 89 },
      { name: "Congress", count: 67 },
      { name: "United Nations", count: 56 },
      { name: "Amnesty International", count: 45 }
    ],
    gdeltLocations: [
      { name: "Washington D.C.", count: 89, lat: 38.9072, lon: -77.0369 },
      { name: "Geneva", count: 56, lat: 46.2044, lon: 6.1432 },
      { name: "London", count: 45, lat: 51.5074, lon: -0.1278 },
      { name: "Brussels", count: 34, lat: 50.8503, lon: 4.3517 },
      { name: "Tel Aviv", count: 28, lat: 32.0853, lon: 34.7818 }
    ],
    gdeltThemes: [
      { name: "WEAPONS_PROLIFERATION", count: 112 },
      { name: "WAR_CRIMES", count: 89 },
      { name: "MILITARY_CONTRACTS", count: 67 },
      { name: "AUTONOMOUS_WEAPONS", count: 56 },
      { name: "SANCTIONS", count: 45 }
    ],
    sources: [
      { name: "Twitter/X", count: 134 },
      { name: "Reddit", count: 89 },
      { name: "Defense News", count: 56 },
      { name: "The Intercept", count: 45 },
      { name: "Reuters", count: 34 },
      { name: "GDELT (US)", count: 28 }
    ],
    people: [
      { id: "ada-ceo", person_name: "Mr A Defence", person_role: "CEO" },
      { id: "ada-coo", person_name: "Mrs B Defence", person_role: "COO" },
      { id: "ada-evp", person_name: "Mr C Defence", person_role: "EVP Defence Systems" },
      { id: "ada-gc", person_name: "Mrs D Defence", person_role: "General Counsel" }
    ],
    personMentions: {
      "ada-ceo": {
        mention_count: 234,
        sentiment_score: -78,
        positive_count: 8,
        negative_count: 178,
        neutral_count: 48
      },
      "ada-coo": {
        mention_count: 112,
        sentiment_score: -56,
        positive_count: 12,
        negative_count: 78,
        neutral_count: 22
      },
      "ada-evp": {
        mention_count: 89,
        sentiment_score: -68,
        positive_count: 5,
        negative_count: 72,
        neutral_count: 12
      }
    },
    personNarratives: {
      "ada-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Fabricated audio recording of CEO approving sales to sanctioned regime",
          severity: "critical",
          frequency: 312
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Congressional testimony clips edited to appear as admission of wrongdoing",
          severity: "critical",
          frequency: 189
        }
      ],
      "ada-evp": [
        {
          narrative_type: "disinformation",
          narrative_description: "False claims about personal involvement in covering up equipment failures",
          severity: "critical",
          frequency: 156
        }
      ]
    },
    trackedStories: [
      {
        id: "story-ada-001",
        headline: "Blood Money: Inside Anon Defence's Global Weapons Empire",
        outlet: "The Intercept",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.95,
        reach: 8900000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1569982175971-d92b01cf8694?w=400&h=300&fit=crop"
      },
      {
        id: "story-ada-002",
        headline: "Pentagon Audit Reveals Massive Anon Defence Cost Overruns",
        outlet: "Defense News",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.7,
        reach: 3400000,
        type: "analysis",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1580752300992-559f8e60b1e8?w=400&h=300&fit=crop"
      }
    ]
  },

  "Anon Energy": {
    name: "Anon Energy",
    description: "Multinational oil, gas, and renewable energy corporation",
    industry: "Energy",
    threatLevel: "critical",
    threatScore: 91,
    sentimentDistribution: [
      { name: "Positive", value: 9, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 21, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 70, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -52,
    longTermSentiment: -18,
    trendIcon: "down",
    previousSentiment: -12,
    keywords: [
      { word: "climate denial", count: 45 },
      { word: "oil spill", count: 38 },
      { word: "greenwashing", count: 34 },
      { word: "carbon emissions", count: 31 },
      { word: "indigenous rights", count: 28 },
      { word: "pipeline", count: 24 },
      { word: "lobbying", count: 21 },
      { word: "renewable fraud", count: 18 },
      { word: "community health", count: 15 },
      { word: "ecosystem destruction", count: 12 }
    ],
    timeline: generateTimelineData(30, 88, 50),
    mdmNarratives: [
      {
        id: "ae-001",
        narrative_type: "malinformation",
        narrative_description: "Authentic internal documents from 1980s showing company knew about climate change being weaponized in coordinated campaign",
        severity: "critical",
        frequency: 156,
        keywords: ["climate coverup", "internal memos", "knew for decades", "deliberate deception"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ae-002",
        narrative_type: "disinformation",
        narrative_description: "Fabricated reports of unreported oil spills and toxic dumping at multiple sites",
        severity: "critical",
        frequency: 134,
        keywords: ["secret spill", "toxic waste", "environmental crime", "coverup"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ae-003",
        narrative_type: "misinformation",
        narrative_description: "False claims that renewable energy investments are purely PR with no actual transition plans",
        severity: "high",
        frequency: 112,
        keywords: ["greenwashing", "fake green", "PR stunt", "no real change"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ae-004",
        narrative_type: "disinformation",
        narrative_description: "State-backed narrative claiming Anon Energy responsible for indigenous community cancer clusters",
        severity: "critical",
        frequency: 145,
        keywords: ["cancer cluster", "indigenous genocide", "poisoned water", "community destruction"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ae-005",
        narrative_type: "misinformation",
        narrative_description: "Viral claims linking Anon Energy to political corruption and regulatory capture",
        severity: "high",
        frequency: 98,
        keywords: ["bribery", "regulatory capture", "political corruption", "lobbying scandal"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-ae-001",
        narrative: "Climate activist coalition planning coordinated global protest targeting all Anon Energy facilities",
        confidence: 92,
        trajectory: "accelerating",
        signals: ["Extinction Rebellion coordination", "Friday For Future partnerships", "Direct action training detected"],
        recommendedAction: "Enhanced facility security and proactive community engagement"
      },
      {
        id: "pred-ae-002",
        narrative: "Major documentary release scheduled linking Anon Energy to 40 years of climate disinformation",
        confidence: 88,
        trajectory: "accelerating",
        signals: ["Netflix production confirmed", "Former scientist interviews", "Archive document requests"],
        recommendedAction: "Prepare comprehensive historical response and transparency initiative"
      }
    ],
    alerts: [
      {
        id: "alert-ae-001",
        alert_type: "surge",
        narrative_id: "ae-004",
        narrative_description: "Indigenous health narrative experiencing 650% surge - coordinated amplification detected",
        severity: "critical",
        current_frequency: 145,
        previous_frequency: 19,
        frequency_change_percent: 663,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-ae-002",
        alert_type: "new_narrative",
        narrative_id: "ae-006",
        narrative_description: "New narrative connecting Anon Energy to political assassination in Latin America",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    mentions: [
      {
        text: "Anon Energy knew about climate change in 1978. They chose to fund denial instead. Now we all pay the price. Thread with receipts 🧵",
        source: "twitter",
        date: new Date(),
        author: "@ClimateJustice",
        engagement: 567000
      },
      {
        text: "My grandmother's village was next to an Anon Energy facility. Cancer rates 400% above average. But they say there's no connection. Documentary evidence inside.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/CommunitySurvivor",
        score: 23400
      },
      {
        text: "Anon Energy announces $10B 'green transition' plan. Environmental groups call it 'greenwashing on a massive scale.'",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "Green or Greed? Anon Energy's Climate Pivot",
        outlet: "The Guardian"
      },
      {
        text: "LEAKED: Anon Energy lobbying documents show campaign to weaken emissions regulations across 30 countries",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "The Lobbying Machine",
        outlet: "ProPublica"
      },
      {
        text: "Indigenous leaders call for international sanctions on Anon Energy after new health study results. #AnonEnergyKills",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@IndigenousRights",
        engagement: 178000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 98, 55).map(d => ({
          date: d.date,
          values: [{ value: Math.max(22, Math.round(d.mentions * 1.7)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Anon Energy climate coverup", value: 16700 },
          { query: "Anon Energy cancer", value: 14200 },
          { query: "Anon Energy greenwashing", value: 11800 },
          { query: "boycott Anon Energy", value: 9400 },
          { query: "Anon Energy indigenous rights", value: 7800 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Anon Energy", count: 145 },
      { name: "Greenpeace", count: 78 },
      { name: "UN Climate Panel", count: 67 },
      { name: "EPA", count: 56 },
      { name: "Indigenous Peoples Council", count: 45 }
    ],
    gdeltLocations: [
      { name: "Houston", count: 89, lat: 29.7604, lon: -95.3698 },
      { name: "London", count: 67, lat: 51.5074, lon: -0.1278 },
      { name: "Lagos", count: 56, lat: 6.5244, lon: 3.3792 },
      { name: "Calgary", count: 45, lat: 51.0447, lon: -114.0719 },
      { name: "Sydney", count: 34, lat: -33.8688, lon: 151.2093 }
    ],
    gdeltThemes: [
      { name: "CLIMATE_CHANGE", count: 134 },
      { name: "ENVIRONMENTAL_DAMAGE", count: 112 },
      { name: "INDIGENOUS_RIGHTS", count: 89 },
      { name: "CORPORATE_LOBBYING", count: 67 },
      { name: "HEALTH_CRISIS", count: 56 }
    ],
    sources: [
      { name: "Twitter/X", count: 156 },
      { name: "Reddit", count: 112 },
      { name: "The Guardian", count: 67 },
      { name: "ProPublica", count: 45 },
      { name: "Reuters", count: 34 },
      { name: "GDELT (Global)", count: 28 }
    ],
    people: [
      { id: "ae-ceo", person_name: "Mr A Energy", person_role: "CEO" },
      { id: "ae-cfo", person_name: "Mrs B Energy", person_role: "CFO" },
      { id: "ae-cso", person_name: "Mr C Energy", person_role: "Chief Sustainability Officer" },
      { id: "ae-evp", person_name: "Mrs D Energy", person_role: "EVP Operations" }
    ],
    personMentions: {
      "ae-ceo": {
        mention_count: 267,
        sentiment_score: -72,
        positive_count: 15,
        negative_count: 198,
        neutral_count: 54
      },
      "ae-cso": {
        mention_count: 134,
        sentiment_score: -58,
        positive_count: 18,
        negative_count: 89,
        neutral_count: 27
      },
      "ae-evp": {
        mention_count: 89,
        sentiment_score: -62,
        positive_count: 8,
        negative_count: 67,
        neutral_count: 14
      }
    },
    personNarratives: {
      "ae-ceo": [
        {
          narrative_type: "malinformation",
          narrative_description: "Congressional testimony clips about climate science edited to appear dismissive",
          severity: "critical",
          frequency: 289
        },
        {
          narrative_type: "disinformation",
          narrative_description: "Fabricated quotes about indigenous communities being 'acceptable collateral damage'",
          severity: "critical",
          frequency: 198
        }
      ],
      "ae-cso": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims that sustainability role is purely PR with no real authority",
          severity: "high",
          frequency: 134
        }
      ]
    },
    trackedStories: [
      {
        id: "story-ae-001",
        headline: "The 50-Year Lie: How Anon Energy Buried Climate Science",
        outlet: "The Guardian",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.95,
        reach: 12400000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&h=300&fit=crop"
      },
      {
        id: "story-ae-002",
        headline: "Indigenous Communities Sue Anon Energy for Environmental Genocide",
        outlet: "ProPublica",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.9,
        reach: 5600000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=400&h=300&fit=crop"
      }
    ]
  },

  "Anon Tech": {
    name: "Anon Tech",
    description: "Global technology conglomerate specialising in AI, cloud computing, and social platforms",
    industry: "Technology",
    threatLevel: "critical",
    threatScore: 88,
    sentimentDistribution: [
      { name: "Positive", value: 14, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 24, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 62, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -48,
    longTermSentiment: -14,
    trendIcon: "down",
    previousSentiment: -8,
    keywords: [
      { word: "data harvesting", count: 42 },
      { word: "surveillance", count: 38 },
      { word: "AI bias", count: 35 },
      { word: "privacy violation", count: 32 },
      { word: "monopoly", count: 28 },
      { word: "content moderation", count: 25 },
      { word: "election interference", count: 22 },
      { word: "child safety", count: 19 },
      { word: "worker exploitation", count: 16 },
      { word: "tax avoidance", count: 13 }
    ],
    timeline: generateTimelineData(30, 82, 48),
    mdmNarratives: [
      {
        id: "at-001",
        narrative_type: "disinformation",
        narrative_description: "Coordinated campaign claiming Anon Tech AI systems are being used for mass government surveillance worldwide",
        severity: "critical",
        frequency: 145,
        keywords: ["mass surveillance", "government contracts", "privacy death", "Orwellian"],
        detected_at: new Date().toISOString()
      },
      {
        id: "at-002",
        narrative_type: "malinformation",
        narrative_description: "Internal research documents about social media mental health impacts being amplified with inflammatory framing",
        severity: "critical",
        frequency: 134,
        keywords: ["teen depression", "mental health crisis", "knew and ignored", "profit over children"],
        detected_at: new Date().toISOString()
      },
      {
        id: "at-003",
        narrative_type: "misinformation",
        narrative_description: "False claims that Anon Tech AI hiring systems systematically discriminate against protected groups",
        severity: "high",
        frequency: 98,
        keywords: ["AI discrimination", "hiring bias", "algorithmic racism", "digital redlining"],
        detected_at: new Date().toISOString()
      },
      {
        id: "at-004",
        narrative_type: "disinformation",
        narrative_description: "State-sponsored narrative that Anon Tech actively manipulates elections through algorithmic suppression",
        severity: "critical",
        frequency: 167,
        keywords: ["election manipulation", "algorithm bias", "shadow banning", "political censorship"],
        detected_at: new Date().toISOString()
      },
      {
        id: "at-005",
        narrative_type: "misinformation",
        narrative_description: "Viral claims that Anon Tech sells user data directly to foreign governments",
        severity: "critical",
        frequency: 123,
        keywords: ["data selling", "foreign access", "national security", "user betrayal"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-at-001",
        narrative: "Whistleblower preparing major disclosure about internal AI safety concerns",
        confidence: 89,
        trajectory: "accelerating",
        signals: ["Legal counsel engaged", "Congressional outreach detected", "60 Minutes contact confirmed"],
        recommendedAction: "Internal audit of AI safety protocols and prepare comprehensive response"
      },
      {
        id: "pred-at-002",
        narrative: "Multi-state antitrust action coordinating for simultaneous filing",
        confidence: 85,
        trajectory: "accelerating",
        signals: ["AG office communications", "Expert witness recruitment", "Economic analysis commissioned"],
        recommendedAction: "Legal preparation and proactive regulatory engagement"
      }
    ],
    alerts: [
      {
        id: "alert-at-001",
        alert_type: "surge",
        narrative_id: "at-004",
        narrative_description: "Election manipulation narrative surging 720% ahead of election season",
        severity: "critical",
        current_frequency: 167,
        previous_frequency: 20,
        frequency_change_percent: 735,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-at-002",
        alert_type: "new_narrative",
        narrative_id: "at-006",
        narrative_description: "New narrative claiming Anon Tech AI caused wrongful arrests through facial recognition errors",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 5400000).toISOString()
      }
    ],
    mentions: [
      {
        text: "THREAD: I was an Anon Tech AI ethics researcher. What I saw made me quit. Here's what they don't want you to know 🧵1/34",
        source: "twitter",
        date: new Date(),
        author: "@TechWhistle",
        engagement: 389000
      },
      {
        text: "My daughter spent 6 months in treatment for anxiety and depression. Her therapist traced it directly to Anon Tech social algorithms. They know what they're doing.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/ConcernedParent2024",
        score: 15600
      },
      {
        text: "Anon Tech faces record $4.2B antitrust fine in EU. Company vows to appeal.",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "Record Fine for Tech Giant",
        outlet: "Wall Street Journal"
      },
      {
        text: "INVESTIGATION: How Anon Tech's Algorithm Radicalized My Brother",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "The Radicalization Machine",
        outlet: "The Atlantic"
      },
      {
        text: "Anon Tech shareholders revolt against exec compensation amid layoffs. #TechAccountability",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@TechWorkers",
        engagement: 67000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 92, 52).map(d => ({
          date: d.date,
          values: [{ value: Math.max(20, Math.round(d.mentions * 1.6)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Anon Tech privacy violation", value: 14500 },
          { query: "Anon Tech election interference", value: 12300 },
          { query: "delete Anon Tech account", value: 10800 },
          { query: "Anon Tech antitrust", value: 8900 },
          { query: "Anon Tech AI bias lawsuit", value: 7200 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Anon Tech", count: 167 },
      { name: "FTC", count: 89 },
      { name: "European Commission", count: 78 },
      { name: "US Congress", count: 67 },
      { name: "Electronic Frontier Foundation", count: 45 }
    ],
    gdeltLocations: [
      { name: "San Francisco", count: 112, lat: 37.7749, lon: -122.4194 },
      { name: "Washington D.C.", count: 89, lat: 38.9072, lon: -77.0369 },
      { name: "Brussels", count: 67, lat: 50.8503, lon: 4.3517 },
      { name: "London", count: 56, lat: 51.5074, lon: -0.1278 },
      { name: "Beijing", count: 45, lat: 39.9042, lon: 116.4074 }
    ],
    gdeltThemes: [
      { name: "DATA_PRIVACY", count: 145 },
      { name: "ARTIFICIAL_INTELLIGENCE", count: 123 },
      { name: "ANTITRUST", count: 98 },
      { name: "ELECTION_INTEGRITY", count: 89 },
      { name: "CHILD_SAFETY", count: 67 }
    ],
    sources: [
      { name: "Twitter/X", count: 167 },
      { name: "Reddit", count: 134 },
      { name: "The Verge", count: 78 },
      { name: "Wall Street Journal", count: 56 },
      { name: "TechCrunch", count: 45 },
      { name: "GDELT (US)", count: 34 }
    ],
    people: [
      { id: "at-ceo", person_name: "Mr A Tech", person_role: "CEO" },
      { id: "at-cto", person_name: "Mrs B Tech", person_role: "CTO" },
      { id: "at-cpo", person_name: "Mr C Tech", person_role: "Chief Privacy Officer" },
      { id: "at-cai", person_name: "Mrs D Tech", person_role: "Chief AI Officer" }
    ],
    personMentions: {
      "at-ceo": {
        mention_count: 234,
        sentiment_score: -65,
        positive_count: 23,
        negative_count: 167,
        neutral_count: 44
      },
      "at-cto": {
        mention_count: 123,
        sentiment_score: -48,
        positive_count: 18,
        negative_count: 78,
        neutral_count: 27
      },
      "at-cai": {
        mention_count: 98,
        sentiment_score: -52,
        positive_count: 12,
        negative_count: 67,
        neutral_count: 19
      }
    },
    personNarratives: {
      "at-ceo": [
        {
          narrative_type: "malinformation",
          narrative_description: "Senate testimony clips edited to appear evasive and dismissive about child safety",
          severity: "critical",
          frequency: 267
        },
        {
          narrative_type: "disinformation",
          narrative_description: "Fabricated internal email showing CEO prioritising growth over user safety",
          severity: "critical",
          frequency: 178
        }
      ],
      "at-cai": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims about deliberately hiding AI bias research from regulators",
          severity: "high",
          frequency: 112
        }
      ]
    },
    trackedStories: [
      {
        id: "story-at-001",
        headline: "The Surveillance Machine: How Anon Tech Watches Everything",
        outlet: "The Atlantic",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.9,
        reach: 7800000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop"
      },
      {
        id: "story-at-002",
        headline: "Teen Mental Health Crisis: Anon Tech's Internal Research Revealed",
        outlet: "Wall Street Journal",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.85,
        reach: 5400000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"
      }
    ]
  },

  "Anon Healthcare & Pharmaceutical": {
    name: "Anon Healthcare & Pharmaceutical",
    description: "Global pharmaceutical and healthcare services corporation",
    industry: "Healthcare & Pharmaceutical",
    threatLevel: "critical",
    threatScore: 94,
    sentimentDistribution: [
      { name: "Positive", value: 7, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 18, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 75, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -62,
    longTermSentiment: -22,
    trendIcon: "down",
    previousSentiment: -15,
    keywords: [
      { word: "drug pricing", count: 48 },
      { word: "opioid crisis", count: 42 },
      { word: "clinical trial fraud", count: 38 },
      { word: "side effects coverup", count: 34 },
      { word: "vaccine injury", count: 31 },
      { word: "FDA corruption", count: 27 },
      { word: "patent abuse", count: 24 },
      { word: "drug shortage", count: 21 },
      { word: "kickbacks", count: 18 },
      { word: "death toll", count: 15 }
    ],
    timeline: generateTimelineData(30, 95, 58),
    mdmNarratives: [
      {
        id: "ahp-001",
        narrative_type: "malinformation",
        narrative_description: "Authentic opioid marketing documents being used to claim company deliberately caused addiction crisis",
        severity: "critical",
        frequency: 189,
        keywords: ["opioid epidemic", "addiction", "deliberate harm", "profit over lives"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ahp-002",
        narrative_type: "disinformation",
        narrative_description: "Fabricated clinical trial data claiming company hid serious side effects of best-selling drug",
        severity: "critical",
        frequency: 167,
        keywords: ["hidden side effects", "trial fraud", "patient deaths", "FDA complicity"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ahp-003",
        narrative_type: "misinformation",
        narrative_description: "Anti-vaccine movement targeting Anon Healthcare vaccines with fabricated injury claims",
        severity: "critical",
        frequency: 234,
        keywords: ["vaccine injury", "autism", "microchips", "depopulation"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ahp-004",
        narrative_type: "disinformation",
        narrative_description: "State-sponsored narrative claiming company tested drugs on populations without consent",
        severity: "critical",
        frequency: 145,
        keywords: ["human experimentation", "developing countries", "unethical trials", "medical colonialism"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ahp-005",
        narrative_type: "malinformation",
        narrative_description: "Price gouging instances being amplified to portray company as killing patients for profit",
        severity: "critical",
        frequency: 178,
        keywords: ["price gouging", "life-saving drugs", "corporate greed", "preventable deaths"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-ahp-001",
        narrative: "Class action lawsuit coordination targeting multiple drugs simultaneously",
        confidence: 96,
        trajectory: "accelerating",
        signals: ["Law firm partnerships forming", "Victim outreach campaigns", "Expert witness recruitment"],
        recommendedAction: "Legal war room activation and plaintiff outreach strategy"
      },
      {
        id: "pred-ahp-002",
        narrative: "Congressional investigation into drug pricing practices with subpoena authority",
        confidence: 91,
        trajectory: "accelerating",
        signals: ["Committee staff inquiries", "Document preservation notices", "Witness list circulating"],
        recommendedAction: "Government affairs mobilization and document review"
      }
    ],
    alerts: [
      {
        id: "alert-ahp-001",
        alert_type: "surge",
        narrative_id: "ahp-003",
        narrative_description: "Vaccine injury narrative experiencing 920% surge - coordinated by anti-vax network",
        severity: "critical",
        current_frequency: 234,
        previous_frequency: 23,
        frequency_change_percent: 917,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-ahp-002",
        alert_type: "new_narrative",
        narrative_id: "ahp-006",
        narrative_description: "New narrative claiming Anon Healthcare CEO personally ordered destruction of adverse event data",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 2700000).toISOString()
      }
    ],
    mentions: [
      {
        text: "🚨EXPOSED: Anon Healthcare knew their painkiller was addictive in 1996. They pushed it anyway. 500,000 Americans dead. Where is the justice? Thread 🧵",
        source: "twitter",
        date: new Date(),
        author: "@OpioidJustice",
        engagement: 678000
      },
      {
        text: "My son was prescribed Anon Healthcare's drug for 6 months. Now he needs a liver transplant. They knew. THEY KNEW. And they did nothing.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/PharmVictim",
        score: 28700
      },
      {
        text: "Anon Healthcare raises insulin price by 400% while CEO compensation increases 1200%. Congress demands answers.",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "The Price of Life",
        outlet: "Washington Post"
      },
      {
        text: "INVESTIGATION: Inside Anon Healthcare's Campaign to Discredit Scientists Who Questioned Drug Safety",
        source: "news",
        date: new Date(Date.now() - 259200000),
        title: "Silencing the Skeptics",
        outlet: "STAT News"
      },
      {
        text: "Anon Healthcare vaccine caused my daughter's autoimmune disease. They deny everything. Join our support group. #PharmaVictims",
        source: "twitter",
        date: new Date(Date.now() - 345600000),
        author: "@VaccineInjured",
        engagement: 156000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 108, 62).map(d => ({
          date: d.date,
          values: [{ value: Math.max(28, Math.round(d.mentions * 2.0)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Anon Healthcare opioid lawsuit", value: 21400 },
          { query: "Anon Healthcare vaccine injury", value: 18900 },
          { query: "Anon Healthcare price gouging", value: 15600 },
          { query: "Anon Healthcare class action", value: 13200 },
          { query: "Anon Healthcare CEO criminal", value: 10800 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Anon Healthcare & Pharmaceutical", count: 189 },
      { name: "FDA", count: 134 },
      { name: "US Congress", count: 112 },
      { name: "WHO", count: 89 },
      { name: "CDC", count: 78 }
    ],
    gdeltLocations: [
      { name: "Washington D.C.", count: 134, lat: 38.9072, lon: -77.0369 },
      { name: "New York", count: 112, lat: 40.7128, lon: -74.006 },
      { name: "Boston", count: 78, lat: 42.3601, lon: -71.0589 },
      { name: "Geneva", count: 56, lat: 46.2044, lon: 6.1432 },
      { name: "Mumbai", count: 45, lat: 19.076, lon: 72.8777 }
    ],
    gdeltThemes: [
      { name: "PUBLIC_HEALTH", count: 167 },
      { name: "DRUG_PRICING", count: 145 },
      { name: "OPIOID_CRISIS", count: 134 },
      { name: "VACCINE_SAFETY", count: 112 },
      { name: "CLINICAL_TRIALS", count: 89 }
    ],
    sources: [
      { name: "Twitter/X", count: 189 },
      { name: "Reddit", count: 156 },
      { name: "STAT News", count: 89 },
      { name: "Washington Post", count: 67 },
      { name: "Reuters Health", count: 56 },
      { name: "GDELT (US)", count: 45 }
    ],
    people: [
      { id: "ahp-ceo", person_name: "Mr A Pharma", person_role: "CEO" },
      { id: "ahp-cmo", person_name: "Mrs B Pharma", person_role: "Chief Medical Officer" },
      { id: "ahp-cso", person_name: "Mr C Pharma", person_role: "Chief Scientific Officer" },
      { id: "ahp-gc", person_name: "Mrs D Pharma", person_role: "General Counsel" }
    ],
    personMentions: {
      "ahp-ceo": {
        mention_count: 312,
        sentiment_score: -82,
        positive_count: 8,
        negative_count: 256,
        neutral_count: 48
      },
      "ahp-cmo": {
        mention_count: 167,
        sentiment_score: -68,
        positive_count: 12,
        negative_count: 123,
        neutral_count: 32
      },
      "ahp-cso": {
        mention_count: 112,
        sentiment_score: -58,
        positive_count: 15,
        negative_count: 78,
        neutral_count: 19
      }
    },
    personNarratives: {
      "ahp-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Fabricated video showing CEO celebrating opioid sales targets",
          severity: "critical",
          frequency: 378
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Compensation figures weaponized alongside patient death statistics",
          severity: "critical",
          frequency: 267
        }
      ],
      "ahp-cmo": [
        {
          narrative_type: "disinformation",
          narrative_description: "False claims about personally suppressing adverse event reports",
          severity: "critical",
          frequency: 189
        }
      ]
    },
    trackedStories: [
      {
        id: "story-ahp-001",
        headline: "The Opioid Files: How Anon Healthcare Fueled America's Deadliest Epidemic",
        outlet: "Washington Post",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.98,
        reach: 15600000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop"
      },
      {
        id: "story-ahp-002",
        headline: "Insulin at Any Cost: Inside Anon Healthcare's Pricing Machine",
        outlet: "STAT News",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.9,
        reach: 4800000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop"
      }
    ]
  }
};

export const DEMO_COMPANY_LIST = Object.keys(DEMO_COMPANIES);
