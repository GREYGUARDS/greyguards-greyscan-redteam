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
    description: "Global defense technology and clean energy conglomerate",
    industry: "Defense & Technology",
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
      { word: "defense spending", count: 8 },
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
        narrative_description: "Fabricated claims that AI defense systems have autonomous kill capabilities",
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
        text: "INVESTIGATION: How Stark Industries' AI Defense Systems Could Operate Without Human Oversight",
        source: "news",
        date: new Date(Date.now() - 172800000),
        title: "The Dark Side of Stark Tech",
        outlet: "Global Defense Weekly"
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
      { id: "stark-cto", person_name: "James Rhodes", person_role: "Defense Liaison" },
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
          narrative_description: "False rumors about company financial irregularities",
          severity: "moderate",
          frequency: 23
        }
      ]
    },
    trackedStories: [
      {
        id: "story-stark-001",
        headline: "EXCLUSIVE: Stark Industries Weapons Found in Conflict Zone",
        outlet: "Global Defense Weekly",
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
        narrative_description: "Coordinated campaign claiming Wayne Enterprises launders money for organized crime",
        severity: "critical",
        frequency: 67,
        keywords: ["money laundering", "organized crime", "corruption", "Gotham underworld"],
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
        keywords: ["tax evasion", "charity fraud", "shell organizations", "offshore"],
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
        text: "Wayne Enterprises stock drops 8% amid corruption probe rumors. Investors nervous.",
        source: "news",
        date: new Date(Date.now() - 345600000),
        title: "Wayne Stock Tumbles",
        outlet: "Financial Times"
      },
      {
        text: "The Wayne family has been profiting off Gotham's misery for generations. Time for accountability.",
        source: "reddit",
        date: new Date(Date.now() - 432000000),
        author: "u/GothamActivist",
        score: 3200
      },
      {
        text: "Lucius Fox defends Wayne Enterprises' new green initiative. 'We're committed to Gotham's future.'",
        source: "news",
        date: new Date(Date.now() - 518400000),
        title: "Wayne Goes Green",
        outlet: "Gotham Gazette"
      },
      {
        text: "Wayne Foundation donating $500M to rebuild Crime Alley neighborhood. PR stunt or genuine change?",
        source: "twitter",
        date: new Date(Date.now() - 604800000),
        author: "@GothamNews",
        engagement: 89000
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 70, 30).map(d => ({
          date: d.date,
          values: [{ value: Math.max(15, Math.round(d.mentions * 1.3)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Wayne Enterprises corruption", value: 5600 },
          { query: "Bruce Wayne scandal", value: 4200 },
          { query: "Wayne Foundation fraud", value: 3100 },
          { query: "Gotham crime Wayne", value: 2400 },
          { query: "Wayne Enterprises investigation", value: 1900 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Bruce Wayne", count: 24 },
      { name: "Wayne Enterprises", count: 38 },
      { name: "Wayne Foundation", count: 18 },
      { name: "Gotham City", count: 45 },
      { name: "Alfred Pennyworth", count: 7 },
      { name: "Lucius Fox", count: 12 }
    ],
    gdeltLocations: [
      { name: "Gotham City", count: 35, lat: 40.7128, lon: -74.006 },
      { name: "Metropolis", count: 10, lat: 38.9072, lon: -77.0369 },
      { name: "London", count: 7, lat: 51.5074, lon: -0.1278 },
      { name: "Hong Kong", count: 5, lat: 22.3193, lon: 114.1694 }
    ],
    gdeltThemes: [
      { name: "CORPORATE_CORRUPTION", count: 33 },
      { name: "PHILANTHROPY", count: 22 },
      { name: "REAL_ESTATE", count: 18 },
      { name: "ORGANIZED_CRIME", count: 15 },
      { name: "URBAN_DEVELOPMENT", count: 13 },
      { name: "FINANCIAL_CRIME", count: 11 }
    ],
    sources: [
      { name: "Twitter/X", count: 28 },
      { name: "Reddit", count: 18 },
      { name: "NewsAPI", count: 14 },
      { name: "GDELT (US)", count: 11 },
      { name: "Mastodon", count: 5 },
      { name: "Gotham Gazette", count: 4 },
      { name: "Daily Planet", count: 3 }
    ],
    people: [
      { id: "wayne-ceo", person_name: "Bruce Wayne", person_role: "CEO & Chairman" },
      { id: "wayne-cto", person_name: "Lucius Fox", person_role: "CTO" },
      { id: "wayne-foundation", person_name: "Alfred Pennyworth", person_role: "Foundation Director" }
    ],
    personMentions: {
      "wayne-ceo": {
        mention_count: 58,
        sentiment_score: -32,
        positive_count: 12,
        negative_count: 31,
        neutral_count: 15
      },
      "wayne-cto": {
        mention_count: 12,
        sentiment_score: 18,
        positive_count: 5,
        negative_count: 3,
        neutral_count: 4
      }
    },
    personNarratives: {
      "wayne-ceo": [
        {
          narrative_type: "disinformation",
          narrative_description: "Claims Bruce Wayne leads a secret double life connected to vigilantism",
          severity: "critical",
          frequency: 156
        },
        {
          narrative_type: "malinformation",
          narrative_description: "Playboy lifestyle coverage being used to question leadership competence",
          severity: "moderate",
          frequency: 78
        }
      ]
    },
    trackedStories: [
      {
        id: "story-wayne-001",
        headline: "Inside Wayne Enterprises: A Culture of Secrecy",
        outlet: "Gotham Gazette",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.7,
        reach: 3200000,
        type: "investigative",
        screenshot: true,
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=300&fit=crop"
      }
    ]
  },

  "Wonka Industries": {
    name: "Wonka Industries",
    description: "Global confectionery and food innovation company",
    industry: "Food & Beverage",
    threatLevel: "moderate",
    threatScore: 45,
    sentimentDistribution: [
      { name: "Positive", value: 42, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 31, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 16, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: 8,
    longTermSentiment: 22,
    trendIcon: "stable",
    previousSentiment: 18,
    keywords: [
      { word: "chocolate", count: 37 },
      { word: "factory", count: 25 },
      { word: "Willy Wonka", count: 23 },
      { word: "labor", count: 15 },
      { word: "Oompa Loompa", count: 13 },
      { word: "candy", count: 12 },
      { word: "workers rights", count: 11 },
      { word: "golden ticket", count: 9 },
      { word: "innovation", count: 8 },
      { word: "secret recipe", count: 7 }
    ],
    timeline: generateTimelineData(30, 40, 20),
    mdmNarratives: [
      {
        id: "wonka-001",
        narrative_type: "malinformation",
        narrative_description: "Labor activists amplifying historical worker treatment concerns",
        severity: "moderate",
        frequency: 34,
        keywords: ["Oompa Loompa", "labor exploitation", "working conditions", "immigrant workers"],
        detected_at: new Date().toISOString()
      },
      {
        id: "wonka-002",
        narrative_type: "misinformation",
        narrative_description: "False claims about dangerous chemicals in chocolate products",
        severity: "high",
        frequency: 28,
        keywords: ["chemicals", "food safety", "recalls", "contamination"],
        detected_at: new Date().toISOString()
      },
      {
        id: "wonka-003",
        narrative_type: "disinformation",
        narrative_description: "Fabricated story about child safety incidents during factory tours",
        severity: "moderate",
        frequency: 19,
        keywords: ["factory tours", "child safety", "accidents", "cover-up"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-wonka-001",
        narrative: "Documentary about confectionery industry labor practices in production",
        confidence: 58,
        trajectory: "emerging",
        signals: ["Film crew inquiries", "Industry-wide scope", "Labor union involvement"],
        recommendedAction: "Prepare workforce testimonials and third-party labor audits"
      }
    ],
    alerts: [],
    mentions: [
      {
        text: "Anyone else concerned about what's really in those Wonka bars? Friend of a friend works there and the stories...",
        source: "reddit",
        date: new Date(),
        author: "u/HealthySkeptic",
        score: 1234
      },
      {
        text: "Wonka Industries opens new sustainable cocoa sourcing facility in Ghana. Major step for ethical chocolate production!",
        source: "news",
        date: new Date(Date.now() - 86400000),
        title: "Sweet Progress",
        outlet: "Food Industry Weekly"
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 45, 15).map(d => ({
          date: d.date,
          values: [{ value: Math.max(10, Math.round(d.mentions * 1.2)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Wonka chocolate ingredients", value: 2100 },
          { query: "Oompa Loompa workers", value: 1800 },
          { query: "Wonka factory tour", value: 1500 },
          { query: "Wonka ethical sourcing", value: 1200 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Willy Wonka", count: 23 },
      { name: "Wonka Industries", count: 37 },
      { name: "Charlie Bucket", count: 5 }
    ],
    gdeltLocations: [
      { name: "London", count: 19, lat: 51.5074, lon: -0.1278 },
      { name: "Ghana", count: 12, lat: 7.9465, lon: -1.0232 },
      { name: "Belgium", count: 7, lat: 50.8503, lon: 4.3517 }
    ],
    gdeltThemes: [
      { name: "FOOD_INDUSTRY", count: 28 },
      { name: "LABOR_PRACTICES", count: 19 },
      { name: "SUSTAINABILITY", count: 15 },
      { name: "CORPORATE_SOCIAL_RESPONSIBILITY", count: 12 }
    ],
    sources: [
      { name: "Twitter/X", count: 28 },
      { name: "Reddit", count: 19 },
      { name: "NewsAPI", count: 13 },
      { name: "GDELT (UK)", count: 10 }
    ],
    people: [
      { id: "wonka-founder", person_name: "Willy Wonka", person_role: "Founder & Chief Imagineer" },
      { id: "wonka-heir", person_name: "Charlie Bucket", person_role: "Heir Apparent" }
    ],
    personMentions: {
      "wonka-founder": {
        mention_count: 28,
        sentiment_score: 12,
        positive_count: 13,
        negative_count: 7,
        neutral_count: 8
      }
    },
    personNarratives: {
      "wonka-founder": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims about reclusive behavior hiding something sinister",
          severity: "low",
          frequency: 23
        }
      ]
    },
    trackedStories: []
  },

  "Universal Exports": {
    name: "Universal Exports",
    description: "International trading company with diverse global operations",
    industry: "International Trade",
    threatLevel: "critical",
    threatScore: 89,
    sentimentDistribution: [
      { name: "Positive", value: 10, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 19, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 46, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -45,
    longTermSentiment: -12,
    trendIcon: "down",
    previousSentiment: -8,
    keywords: [
      { word: "intelligence", count: 37 },
      { word: "espionage", count: 31 },
      { word: "government", count: 25 },
      { word: "front company", count: 23 },
      { word: "MI6", count: 19 },
      { word: "classified", count: 16 },
      { word: "operations", count: 13 },
      { word: "secret", count: 12 },
      { word: "London", count: 11 },
      { word: "agents", count: 9 }
    ],
    timeline: generateTimelineData(30, 35, 25),
    mdmNarratives: [
      {
        id: "ue-001",
        narrative_type: "malinformation",
        narrative_description: "Accurate information about government connections being used to delegitimize all business operations",
        severity: "critical",
        frequency: 89,
        keywords: ["front company", "MI6", "government ties", "intelligence operations"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ue-002",
        narrative_type: "disinformation",
        narrative_description: "Foreign state actors fabricating documents about illegal surveillance activities",
        severity: "critical",
        frequency: 78,
        keywords: ["surveillance", "privacy violations", "illegal wiretapping", "citizen tracking"],
        detected_at: new Date().toISOString()
      },
      {
        id: "ue-003",
        narrative_type: "disinformation",
        narrative_description: "Coordinated campaign linking company to election interference in multiple countries",
        severity: "critical",
        frequency: 67,
        keywords: ["election interference", "foreign influence", "political manipulation"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-ue-001",
        narrative: "Parliamentary inquiry being organized to investigate government contracts",
        confidence: 91,
        trajectory: "accelerating",
        signals: ["MP communications", "FOIA requests", "Journalist investigations coordinating"],
        recommendedAction: "Prepare legal counsel and stakeholder communications immediately"
      }
    ],
    alerts: [
      {
        id: "alert-ue-001",
        alert_type: "surge",
        narrative_id: "ue-001",
        narrative_description: "Government front company narrative reaching critical mass",
        severity: "critical",
        current_frequency: 89,
        previous_frequency: 23,
        frequency_change_percent: 287,
        is_read: false,
        created_at: new Date().toISOString()
      },
      {
        id: "alert-ue-002",
        alert_type: "new_narrative",
        narrative_id: "ue-004",
        narrative_description: "New WikiLeaks-style document dump claiming to expose operations",
        severity: "critical",
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    mentions: [
      {
        text: "BREAKING: Leaked cables confirm Universal Exports is an MI6 front. How deep does the rabbit hole go? 🕳️",
        source: "twitter",
        date: new Date(),
        author: "@LeaksAnon",
        engagement: 234000
      },
      {
        text: "Why is no one talking about Universal Exports' role in [REDACTED]? The evidence is right there in the Panama Papers.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/DeepStateWatcher",
        score: 8900
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 50, 35).map(d => ({
          date: d.date,
          values: [{ value: Math.max(20, Math.round(d.mentions * 1.4)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Universal Exports MI6", value: 8900 },
          { query: "Universal Exports espionage", value: 6700 },
          { query: "Universal Exports leaked documents", value: 5400 },
          { query: "Universal Exports front company proof", value: 4200 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Universal Exports", count: 46 },
      { name: "MI6", count: 37 },
      { name: "British Government", count: 28 },
      { name: "Foreign Office", count: 19 }
    ],
    gdeltLocations: [
      { name: "London", count: 37, lat: 51.5074, lon: -0.1278 },
      { name: "Moscow", count: 19, lat: 55.7558, lon: 37.6173 },
      { name: "Washington D.C.", count: 15, lat: 38.9072, lon: -77.0369 },
      { name: "Beijing", count: 12, lat: 39.9042, lon: 116.4074 }
    ],
    gdeltThemes: [
      { name: "INTELLIGENCE_SERVICES", count: 46 },
      { name: "ESPIONAGE", count: 37 },
      { name: "GOVERNMENT_SECRECY", count: 28 },
      { name: "FOREIGN_RELATIONS", count: 19 },
      { name: "POLITICAL_SCANDAL", count: 15 }
    ],
    sources: [
      { name: "Twitter/X", count: 28 },
      { name: "Reddit", count: 19 },
      { name: "GDELT (UK)", count: 14 },
      { name: "WikiLeaks Archive", count: 9 },
      { name: "The Guardian", count: 5 }
    ],
    people: [
      { id: "ue-director", person_name: "M", person_role: "Director" },
      { id: "ue-agent", person_name: "James Bond", person_role: "Senior Field Consultant" }
    ],
    personMentions: {
      "ue-agent": {
        mention_count: 37,
        sentiment_score: -28,
        positive_count: 7,
        negative_count: 19,
        neutral_count: 11
      }
    },
    personNarratives: {
      "ue-agent": [
        {
          narrative_type: "malinformation",
          narrative_description: "Actual operational history being weaponized in information warfare",
          severity: "critical",
          frequency: 234
        }
      ]
    },
    trackedStories: [
      {
        id: "story-ue-001",
        headline: "The Universal Exports Files: What We Know",
        outlet: "The Guardian",
        published: new Date(Date.now() - 86400000).toISOString(),
        sentiment: -0.9,
        reach: 5600000,
        type: "investigative",
        screenshot: true
      }
    ]
  },

  "Gekko & Co.": {
    name: "Gekko & Co.",
    description: "Investment banking and financial services firm",
    industry: "Financial Services",
    threatLevel: "high",
    threatScore: 72,
    sentimentDistribution: [
      { name: "Positive", value: 15, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 28, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 39, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -35,
    longTermSentiment: -18,
    trendIcon: "down",
    previousSentiment: -12,
    keywords: [
      { word: "Gordon Gekko", count: 31 },
      { word: "Wall Street", count: 25 },
      { word: "insider trading", count: 22 },
      { word: "greed", count: 19 },
      { word: "manipulation", count: 16 },
      { word: "SEC", count: 13 },
      { word: "hostile takeover", count: 12 },
      { word: "corporate raider", count: 11 },
      { word: "stocks", count: 9 },
      { word: "fraud", count: 8 }
    ],
    timeline: generateTimelineData(30, 50, 30),
    mdmNarratives: [
      {
        id: "gekko-001",
        narrative_type: "malinformation",
        narrative_description: "Historical insider trading conviction being relitigated in social media",
        severity: "high",
        frequency: 56,
        keywords: ["insider trading", "conviction", "prison", "repeat offender"],
        detected_at: new Date().toISOString()
      },
      {
        id: "gekko-002",
        narrative_type: "disinformation",
        narrative_description: "False claims of current SEC investigation into market manipulation",
        severity: "high",
        frequency: 67,
        keywords: ["SEC investigation", "market manipulation", "pump and dump", "fraud"],
        detected_at: new Date().toISOString()
      },
      {
        id: "gekko-003",
        narrative_type: "misinformation",
        narrative_description: "Viral posts incorrectly linking firm to recent market volatility",
        severity: "moderate",
        frequency: 45,
        keywords: ["market crash", "volatility", "short selling", "manipulation"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-gekko-001",
        narrative: "Retail investor groups coordinating campaign against 'Wall Street villains'",
        confidence: 76,
        trajectory: "accelerating",
        signals: ["Reddit coordination", "TikTok financial influencers", "Meme stock communities"],
        recommendedAction: "Prepare retail investor relations strategy and transparent communications"
      }
    ],
    alerts: [
      {
        id: "alert-gekko-001",
        alert_type: "surge",
        narrative_id: "gekko-002",
        narrative_description: "SEC investigation rumors spreading rapidly across financial media",
        severity: "high",
        current_frequency: 67,
        previous_frequency: 15,
        frequency_change_percent: 347,
        is_read: false,
        created_at: new Date().toISOString()
      }
    ],
    mentions: [
      {
        text: "Greed is NOT good. Time to hold Gekko & Co. accountable. Who's with me? 💎🙌 #WallStreetVillains",
        source: "twitter",
        date: new Date(),
        author: "@RetailRevolt",
        engagement: 67000
      },
      {
        text: "My dad lost his pension because of Gekko's 1987 schemes. They're back at it again. Same playbook, new decade.",
        source: "reddit",
        date: new Date(Date.now() - 86400000),
        author: "u/PensionVictim",
        score: 5600
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 55, 25).map(d => ({
          date: d.date,
          values: [{ value: Math.max(15, Math.round(d.mentions * 1.3)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Gekko SEC investigation", value: 5400 },
          { query: "Gordon Gekko fraud", value: 4100 },
          { query: "Gekko insider trading", value: 3200 },
          { query: "Wall Street villains", value: 2800 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Gordon Gekko", count: 31 },
      { name: "Gekko & Co.", count: 37 },
      { name: "SEC", count: 19 },
      { name: "Wall Street", count: 28 }
    ],
    gdeltLocations: [
      { name: "New York", count: 37, lat: 40.7128, lon: -74.006 },
      { name: "Washington D.C.", count: 15, lat: 38.9072, lon: -77.0369 },
      { name: "Chicago", count: 10, lat: 41.8781, lon: -87.6298 }
    ],
    gdeltThemes: [
      { name: "FINANCIAL_CRIME", count: 37 },
      { name: "STOCK_MARKET", count: 28 },
      { name: "CORPORATE_GREED", count: 23 },
      { name: "REGULATORY_INVESTIGATION", count: 19 }
    ],
    sources: [
      { name: "Twitter/X", count: 37 },
      { name: "Reddit - WallStreetBets", count: 28 },
      { name: "Bloomberg", count: 19 },
      { name: "CNBC", count: 15 },
      { name: "Financial Times", count: 12 }
    ],
    people: [
      { id: "gekko-ceo", person_name: "Gordon Gekko", person_role: "Founder & Managing Partner" },
      { id: "gekko-partner", person_name: "Bud Fox", person_role: "Senior Partner" }
    ],
    personMentions: {
      "gekko-ceo": {
        mention_count: 46,
        sentiment_score: -45,
        positive_count: 6,
        negative_count: 29,
        neutral_count: 11
      }
    },
    personNarratives: {
      "gekko-ceo": [
        {
          narrative_type: "malinformation",
          narrative_description: "'Greed is good' speech being used as proof of ongoing unethical practices",
          severity: "high",
          frequency: 234
        }
      ]
    },
    trackedStories: [
      {
        id: "story-gekko-001",
        headline: "Is Gordon Gekko Back? New Allegations Surface",
        outlet: "Wall Street Journal",
        published: new Date(Date.now() - 172800000).toISOString(),
        sentiment: -0.8,
        reach: 4200000,
        type: "investigative",
        screenshot: true
      }
    ]
  },

  "Nakatomi Corporation": {
    name: "Nakatomi Corporation",
    description: "Japanese multinational conglomerate with US operations",
    industry: "Diversified Manufacturing & Real Estate",
    threatLevel: "moderate",
    threatScore: 52,
    sentimentDistribution: [
      { name: "Positive", value: 28, color: "hsl(var(--chart-1))" },
      { name: "Neutral", value: 37, color: "hsl(var(--chart-3))" },
      { name: "Negative", value: 22, color: "hsl(var(--chart-2))" }
    ],
    shortTermSentiment: -8,
    longTermSentiment: 15,
    trendIcon: "stable",
    previousSentiment: 12,
    keywords: [
      { word: "Nakatomi Plaza", count: 25 },
      { word: "Los Angeles", count: 21 },
      { word: "security", count: 19 },
      { word: "terrorism", count: 16 },
      { word: "Japanese investment", count: 13 },
      { word: "real estate", count: 12 },
      { word: "corporate security", count: 11 },
      { word: "hostage", count: 9 },
      { word: "1988", count: 8 },
      { word: "Christmas Eve", count: 7 }
    ],
    timeline: generateTimelineData(30, 38, 18),
    mdmNarratives: [
      {
        id: "nak-001",
        narrative_type: "malinformation",
        narrative_description: "1988 terrorist incident being used to question current security protocols",
        severity: "moderate",
        frequency: 34,
        keywords: ["1988 incident", "security failure", "terrorism", "hostage situation"],
        detected_at: new Date().toISOString()
      },
      {
        id: "nak-002",
        narrative_type: "misinformation",
        narrative_description: "False rumors about new security threats to Nakatomi properties",
        severity: "moderate",
        frequency: 28,
        keywords: ["threat", "security alert", "evacuation", "copycat"],
        detected_at: new Date().toISOString()
      },
      {
        id: "nak-003",
        narrative_type: "disinformation",
        narrative_description: "Foreign competitors spreading false information about financial instability",
        severity: "high",
        frequency: 42,
        keywords: ["bankruptcy", "debt crisis", "Japanese economy", "asset sale"],
        detected_at: new Date().toISOString()
      }
    ],
    emergingPredictions: [
      {
        id: "pred-nak-001",
        narrative: "Documentary commemorating 1988 incident in production",
        confidence: 62,
        trajectory: "emerging",
        signals: ["Production inquiries", "Archive footage requests", "Survivor interviews"],
        recommendedAction: "Develop official narrative and security improvement communications"
      }
    ],
    alerts: [],
    mentions: [
      {
        text: "Every Christmas I think about Nakatomi Plaza. How has their security actually improved since 1988? Anyone done research on this?",
        source: "reddit",
        date: new Date(),
        author: "u/SecurityNerd88",
        score: 2340
      },
      {
        text: "Nakatomi Corporation announces major expansion in sustainable manufacturing. New LA facility to create 2,000 jobs.",
        source: "news",
        date: new Date(Date.now() - 86400000),
        title: "Nakatomi's Green Future",
        outlet: "LA Times"
      }
    ],
    trendsData: {
      interest_over_time: {
        timeline_data: generateTimelineData(30, 42, 15).map(d => ({
          date: d.date,
          values: [{ value: Math.max(10, Math.round(d.mentions * 1.1)) }]
        }))
      },
      related_queries: {
        rising: [
          { query: "Nakatomi Plaza 1988", value: 2800 },
          { query: "Nakatomi security", value: 1900 },
          { query: "Nakatomi Corporation stock", value: 1500 },
          { query: "Nakatomi LA expansion", value: 1200 }
        ]
      }
    },
    gdeltEntities: [
      { name: "Nakatomi Corporation", count: 28 },
      { name: "Joseph Takagi", count: 13 },
      { name: "Nakatomi Plaza", count: 19 }
    ],
    gdeltLocations: [
      { name: "Los Angeles", count: 28, lat: 34.0522, lon: -118.2437 },
      { name: "Tokyo", count: 19, lat: 35.6762, lon: 139.6503 },
      { name: "New York", count: 10, lat: 40.7128, lon: -74.006 }
    ],
    gdeltThemes: [
      { name: "CORPORATE_SECURITY", count: 28 },
      { name: "REAL_ESTATE", count: 21 },
      { name: "FOREIGN_INVESTMENT", count: 16 },
      { name: "TERRORISM_HISTORY", count: 13 }
    ],
    sources: [
      { name: "Twitter/X", count: 28 },
      { name: "Reddit", count: 19 },
      { name: "NewsAPI", count: 15 },
      { name: "GDELT (US)", count: 12 },
      { name: "LA Times", count: 7 }
    ],
    people: [
      { id: "nak-ceo", person_name: "Joseph Takagi", person_role: "CEO (Memorial)" },
      { id: "nak-vp", person_name: "Holly Gennero", person_role: "VP Operations" }
    ],
    personMentions: {
      "nak-vp": {
        mention_count: 15,
        sentiment_score: 22,
        positive_count: 7,
        negative_count: 3,
        neutral_count: 5
      }
    },
    personNarratives: {
      "nak-vp": [
        {
          narrative_type: "misinformation",
          narrative_description: "False claims about departure from company",
          severity: "low",
          frequency: 12
        }
      ]
    },
    trackedStories: [
      {
        id: "story-nak-001",
        headline: "Nakatomi Plaza: 35 Years Later",
        outlet: "LA Times",
        published: new Date(Date.now() - 259200000).toISOString(),
        sentiment: -0.3,
        reach: 1800000,
        type: "feature",
        screenshot: true
      }
    ]
  }
};

export const DEMO_COMPANY_LIST = Object.keys(DEMO_COMPANIES);
