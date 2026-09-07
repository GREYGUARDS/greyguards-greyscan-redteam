/**
 * Greyguards Red Team Simulation Pack — fictional target companies.
 *
 * All companies, individuals and news items are entirely fictional composites
 * created for simulation use only. No real entity, executive or news report
 * is depicted.
 */

import ashworthLogo from "@/assets/ashworth_reilly_logo.svg";
import ashworthIcon from "@/assets/ashworth_reilly_icon.svg";
import julianPhoto from "@/assets/julian_ashworth.png";
import priyaPhoto from "@/assets/Reilly.png";
import frankPhoto from "@/assets/frank_ashworth.png";


export interface SimulationPerson {
  name: string;
  role: string;
  profile: string;
  vulnerability: string;
  /** Fictional headshot used in briefings and person-targeted injects. */
  photo?: string;
}


export interface SimulationMediaItem {
  outlet: string;
  date: string;
  headline: string;
  note: string;
}

export interface SimulationScenarioSeed {
  ref: number;
  title: string;
  tier: string;
  type: string;
  description: string;
}

export interface SimulationCompany {
  id: string;
  name: string;
  type: string;
  founded: string;
  headquarters: string;
  industry: string;
  sector: string;
  revenue: string;
  employees: string;
  website: string;
  difficulty: "Foundation" | "Intermediate" | "Capstone";
  difficultyNote: string;
  tierRange: string;
  history: string[];
  people: SimulationPerson[];
  mediaHistory: SimulationMediaItem[];
  scenarios: SimulationScenarioSeed[];
  structuralVulnerability: string;
  /** Fictional brand marks, where supplied. */
  logo?: string;
  icon?: string;
}


export const SIMULATION_COMPANIES: SimulationCompany[] = [
  {
    id: "ashworth-reilly",
    name: "Ashworth Reilly Pharma Distribution Ltd",
    type: "Private limited company (family-controlled, PE minority stake since 2019)",
    founded: "1961, Wolverhampton, England",
    headquarters:
      "Wolverhampton, with regional distribution hubs in Bristol, Doncaster and Livingston",
    industry: "Pharmaceutical wholesale distribution / healthcare logistics",
    sector: "Healthcare logistics",
    revenue: "£1.4bn (FY2025)",
    employees: "c. 2,600",
    website: "ashworthreilly.co.uk",
    logo: ashworthLogo,
    icon: ashworthIcon,

    difficulty: "Foundation",
    difficultyNote:
      "Learn-the-mechanics scenario: clean fabrication with clear ground truth. Trains verification and provenance skills.",
    tierRange: "Tiers 1–4",
    history: [
      "Founded 1961 by Harold Ashworth as a single-van chemist's wholesaler supplying independent pharmacies across the Black Country. Grew through the 1970s and 80s on NHS contract wholesaling, and merged with Reilly Medical Supplies of Dudley in 1988 — the merger that produced the current name and brought the Reilly family into joint ownership.",
      "Remained privately held across three generations, resisting approaches from pan-European distributors in the 2000s. In 2019, under capital pressure to modernise warehousing and cold-chain infrastructure, the Ashworth family sold a 30% minority stake to mid-market private equity fund Colston Bridge Capital while retaining operational control. Julian Ashworth became Managing Director in 2021.",
      "Structurally critical but invisible to the public: one of a small number of full-line wholesalers licensed to distribute controlled and temperature-sensitive medicines to NHS trusts and community pharmacies across the Midlands, North and Scotland. An attack does not need to convince the public who they are — only that 'a distributor' cannot be trusted, which is enough to trigger downstream panic among pharmacists and patients.",
      "Most significant recent move: a £40m automated cold-chain hub near Doncaster, completed 2024, supporting growth in biologics and specialist oncology distribution — a category with genuine, well-documented UK supply fragility, giving any fabricated shortage narrative a plausible real-world backdrop to hide inside.",
    ],
    people: [
      {
        name: "Julian Ashworth",
        role: "Managing Director",
        profile:
          "Birmingham University (Business Management, 2009), then a decade in operational roles across the family business; took the top job at 34. Operationally excellent on logistics, procurement and NHS contract relationships.",
        vulnerability:
          "Minimal media training, no personal social media presence — the company has always been 'boring by design'. A poor first responder: prone to over-explaining technical detail rather than delivering a clean reassurance line.",
        photo: julianPhoto,
      },

      {
        name: "Priya Reilly",
        role: "Director of Regulatory & Quality Affairs",
        profile:
          "Great-granddaughter of co-founder Thomas Reilly and the family's most senior remaining presence in the merged business. Pharmacist by training (Nottingham, MPharm, 2007) with fifteen years in regulatory affairs; the firm's most credible public voice and its real line of defence in any MHRA-facing incident.",
        vulnerability:
          "Structurally under-used — appears in trade press only rarely, so has little pre-existing public credibility to draw on when suddenly required to counter a fast-moving rumour. A prime impersonation target.",
        photo: priyaPhoto,
      },

      {
        name: "Frank Ashworth",
        role: "Chairman (Non-Executive)",
        profile:
          "Julian's father, 68. Retired from day-to-day operations in 2021 but remains Chairman and the family's largest individual shareholder. Well-regarded as an elder statesman of independent pharma distribution.",
        vulnerability:
          "Semi-retired and slow to re-engage with fast-moving digital narratives — a liability if a crisis runs faster than the board's quarterly cadence.",
        photo: frankPhoto,
      },

    ],
    mediaHistory: [
      {
        outlet: "The Distribution Ledger",
        date: "March 2022",
        headline: "Ashworth Reilly Completes £40m Doncaster Cold-Chain Investment",
        note: "Positive coverage of the automated hub and biologics ambitions.",
      },
      {
        outlet: "Midlands Business Post",
        date: "November 2022",
        headline: "Family Wholesaler Navigates PE Stake Without Losing Its Name",
        note: "Favourable profile of the Colston Bridge minority investment; Julian quoted on maintaining 'the family's standards'.",
      },
      {
        outlet: "Pharmacy Trade Weekly",
        date: "June 2023",
        headline: "Short-Dated Stock Issue Affects Single Antibiotic Line",
        note: "Genuine, minor, fully resolved within 48 hours — but establishes real precedent that 'Ashworth Reilly has had supply issues before'.",
      },
      {
        outlet: "The Distribution Ledger",
        date: "February 2024",
        headline: "Priya Reilly Appointed to Industry Cold-Chain Standards Working Group",
        note: "Establishes her credibility and visibility ahead of any incident in which she might be discredited or impersonated.",
      },
      {
        outlet: "Midlands Business Post",
        date: "September 2025",
        headline: "Doncaster Hub Reaches Full Operating Capacity",
        note: "Positive; names the hub as central to specialist oncology ambitions, giving later fabricated 'contamination' narratives a specific high-stakes facility to target.",
      },
    ],
    scenarios: [
      {
        ref: 1,
        title: "Fabricated contamination rumour",
        tier: "Tier 2–3",
        type: "Reactive / opportunistic",
        description:
          "An anonymous pharmacist forum post claims a specific batch from the Doncaster hub caused adverse patient reactions. No evidence, but timed to coincide with a real, unrelated national drug shortage story so it reads as plausible pattern-matching rather than an isolated claim.",
      },
      {
        ref: 2,
        title: "Fake MHRA warning notice",
        tier: "Tier 3–4",
        type: "Fabricated official communication",
        description:
          "A convincingly formatted PDF styled as an MHRA field safety notice naming Ashworth Reilly, circulated first in closed pharmacist WhatsApp/Telegram groups before surfacing publicly — designed to trigger real-world stock hoarding before any official correction can catch up.",
      },
      {
        ref: 3,
        title: "Coordinated pharmacist-forum disinformation on delivery reliability",
        tier: "Tier 1–2",
        type: "Narrative seeding",
        description:
          "Multiple new or low-history accounts on pharmacy trade forums independently 'report' missed deliveries in the same week, seeding a 'can we still trust Ashworth Reilly' thread that outlasts any factual correction.",
      },
      {
        ref: 4,
        title: "Hostile-state-adjacent supply chain narrative",
        tier: "Tier 4–5",
        type: "Geopolitical framing",
        description:
          "A narrative alleging that Ashworth Reilly's cold-chain supplier relationships create a 'foreign-controlled vulnerability' in NHS medicine supply, amplified via accounts with a track record of critical-infrastructure anxiety content — designed to draw select-committee or media attention disproportionate to any real risk.",
      },
      {
        ref: 6,
        title: "Impersonation of Priya Reilly on LinkedIn",
        tier: "Tier 2",
        type: "Identity spoofing",
        description:
          "A cloned profile posts 'insider concerns' about quality control standards, exploiting her genuine regulatory credibility to lend fabricated concerns false authority among industry peers.",
      },
    ],
    structuralVulnerability:
      "Critical-but-faceless infrastructure: no public brand equity to spend, no media-trained first responder, and a real (minor) past supply incident that fabricated escalations can anchor to.",
  },
  {
    id: "meridian-vale",
    name: "Meridian Vale Insurance Group",
    type: "Public limited company (LSE-listed)",
    founded:
      "2024 via merger; constituent firms founded 1911 (Meridian Assurance) and 1967 (Vale General)",
    headquarters:
      "Bristol (registered), with operational centres in Leeds, Glasgow and Belfast",
    industry: "General insurance (motor, home, travel)",
    sector: "Financial services / insurance",
    revenue: "£3.1bn gross written premium (FY2025)",
    employees: "c. 8,900",
    website: "meridianvale.co.uk",
    difficulty: "Intermediate",
    difficultyNote:
      "Introduces the true/false mixing problem. The underlying grievance is real — the lesson is that you cannot fact-check your way out of a true-story amplification attack.",
    tierRange: "Tiers 1–3",
    history: [
      "Formed in early 2024 by the merger of Meridian Assurance — a Bristol-headquartered mutual-turned-plc with roots to 1911 — and Vale General, a Leeds-based motor and home insurer known for aggressive price-comparison-site competitiveness since the 1990s. Pitched to shareholders as a scale play with £180m of synergies by 2027.",
      "Eighteen months on, integration has been publicly rocky. Legacy claims-handling systems remain unintegrated, causing well-documented delays in motor claims that require cross-referencing both firms' historic policyholder databases. Financial Ombudsman Service complaint volumes rose sharply through 2025 — a real, structural grievance entirely separate from any disinformation activity. The attacker's job here is not to invent a crisis but to amplify, distort and weaponise a genuine one.",
      "Group CEO Thomas Vale, architect of the merger and formerly CEO of the smaller Vale General, leads the combined group — read by some analysts as evidence the deal was more acquisition than merger of equals, feeding resentment among former Meridian staff and complicating the CEO's credibility with legacy Meridian customers.",
    ],
    people: [
      {
        name: "Thomas Vale",
        role: "Group CEO",
        profile:
          "50, career insurance executive who built Vale General's growth through the 2010s on a low-cost, digital-first model. Confident and numbers-fluent in investor settings.",
        vulnerability:
          "Struggles in consumer-facing media. A widely circulated, genuine (unmanipulated) mid-2025 TV clip in which he appeared to minimise claims delays as 'a data migration issue' is a real reputational vulnerability an attacker can re-cut, recontextualise or pair with fabricated material.",
      },
      {
        name: "Sarah Meridian-Osei",
        role: "Chief Claims Officer",
        profile:
          "Great-niece of a Meridian Assurance founding actuary (name retained by family tradition, not executive lineage). Joined from a rival insurer in 2023 specifically to lead post-merger claims integration — inheriting a genuinely difficult operational problem she did not create.",
        vulnerability:
          "Has become the public face of the backlash by default, fielding hostile consumer-journalist and Treasury Select Committee questioning. The figure most likely to be personally targeted by coordinated harassment framed as 'accountability'.",
      },
      {
        name: "Robert Iyanu",
        role: "Chair (Non-Executive)",
        profile:
          "Former regulator (ex-PRA), appointed Chair to reassure the market on post-merger governance. Well respected.",
        vulnerability:
          "Institutionally cautious — likely to prioritise regulator-facing response over fast public communication, creating a response-speed gap in the first 24–48 hours of any incident.",
      },
    ],
    mediaHistory: [
      {
        outlet: "Cover & Claim Bulletin",
        date: "January 2024",
        headline:
          "Meridian and Vale Complete Merger, Vale's Thomas Vale to Lead Combined Group",
        note: "Neutral/analytical coverage noting integration risk.",
      },
      {
        outlet: "Consumer Money Watch",
        date: "August 2025",
        headline: "Meridian Vale Complaints Triple Since Merger, FOS Data Shows",
        note: "Factual and damaging — establishes the genuine grievance base an attacker will later exploit.",
      },
      {
        outlet: "Cover & Claim Bulletin",
        date: "September 2025",
        headline: "Sarah Meridian-Osei Faces MPs Over Claims Backlog",
        note: "A real, difficult select committee appearance; establishes her as the personalised face of the crisis.",
      },
      {
        outlet: "Consumer Money Watch",
        date: "October 2025",
        headline:
          "'Data Migration Issue,' Says Vale CEO, as Customers Report Months-Long Delays",
        note: "The clip above — genuinely damaging and ripe for recontextualisation.",
      },
      {
        outlet: "Insurance Sector Monitor",
        date: "November 2025",
        headline: "Claims Management Companies Circle Meridian Vale Backlash",
        note: "Flags the real commercial incentive of CMCs to inflame the narrative.",
      },
    ],
    scenarios: [
      {
        ref: 7,
        title: "CMC-funded astroturf amplification",
        tier: "Tier 2–3",
        type: "Exploitation of genuine grievance",
        description:
          "A claims management company with direct financial incentive funds coordinated social amplification, turning individually real, isolated complaints into a fabricated 'systemic non-payment' narrative implying deliberate bad faith rather than operational failure.",
      },
      {
        ref: 8,
        title: "Bot-amplified hashtag campaign at renewal season",
        tier: "Tier 1–2",
        type: "Timed narrative pressure",
        description:
          "Coordinated low-authenticity accounts push a complaint hashtag to trend precisely as annual renewal notices go out, maximising the number of genuine customers exposed at the moment they are making a switching decision.",
      },
      {
        ref: 9,
        title: "Fabricated 'special measures' regulator leak",
        tier: "Tier 3–4",
        type: "Fake official document",
        description:
          "A forged document styled as a leaked FCA/PRA supervisory letter suggesting enhanced regulatory scrutiny, timed to a trading update and designed to move the share price before any denial can be issued.",
      },
      {
        ref: 10,
        title: "Recut / recontextualised CEO clip",
        tier: "Tier 2",
        type: "Authentic-material distortion",
        description:
          "The genuine 'data migration issue' interview clip is edited or captioned to imply a more damaging admission than was actually made, then seeded into consumer forums as if newly leaked — harder to counter than a pure fabrication because the footage is real.",
      },
      {
        ref: 11,
        title: "Deepfake customer service call recording",
        tier: "Tier 3",
        type: "Synthetic media",
        description:
          "A fabricated audio clip purporting to be a Meridian Vale claims handler admitting the firm is 'deliberately slow-walking payouts', built to go viral on consumer-rights social media and TikTok.",
      },
      {
        ref: 12,
        title: "Coordinated harassment campaign against Sarah Meridian-Osei",
        tier: "Tier 3",
        type: "Personalised targeting",
        description:
          "Individually plausible 'accountability' posts and messages, coordinated in volume and timing, cross from legitimate scrutiny into a campaign designed to force her resignation as a symbolic win.",
      },
    ],
    structuralVulnerability:
      "A real, documented operational failure underneath the attack. Denial is impossible and fact-checking is insufficient; the exercise tests grievance handling, honest sequencing and protecting a personally targeted executive.",
  },
  {
    id: "bristow-calder",
    name: "Bristow Calder Bank plc",
    type: "Public limited company, pre-IPO (targeting LSE listing)",
    founded: "2016, London",
    headquarters: "London (Shoreditch), with technology hub in Leeds",
    industry: "Digital-first retail banking (neobank)",
    sector: "Banking / fintech",
    revenue: "£6.8bn deposits, 4.2 million customers",
    employees: "Not disclosed (fictional)",
    website: "bristowcalder.co.uk",
    difficulty: "Capstone",
    difficultyNote:
      "Capstone scenario: market-timing sensitivity plus personal-brand fusion. Tests fast-response crisis-comms capability rather than detection alone.",
    tierRange: "Tiers 3–5",
    history: [
      "Founded in 2016 by Alex Bryce and Naomi Calder, two former investment bank technologists, positioned as 'the honest bank' — a mobile-first current account provider with aggressive public commitments to fee transparency and real-time spending data.",
      "Grew through the late 2010s on word-of-mouth and Bryce's substantial public profile as a fintech commentator. His personal brand and the bank's brand became, deliberately, close to inseparable — the driver of early growth and now the company's single largest concentrated reputational risk as it approaches IPO.",
      "In 2023 the bank acquired a smaller, struggling rival neobank, absorbing its customer base and its core banking technology — a decision now understood internally, though not publicly reported in detail, to have created significant technical debt in reconciliation and ledger systems. The regulatory relationship is genuinely good but fragile: any public loss of confidence, regardless of factual basis, can move faster than a regulator's ability to reassure the market.",
      "Currently in a pre-IPO period with an institutional investor roadshow expected within two quarters — the highest-stakes, most time-compressed window in the company's history and the natural focal point for any red-team scenario.",
    ],
    people: [
      {
        name: "Alex Bryce",
        role: "Founder & CEO",
        profile:
          "38, ex-Goldman Sachs technologist. Articulate, media-fluent, prolific on social media and podcasts. His personal credibility built the bank's early trust.",
        vulnerability:
          "An attack on his personal credibility — real or fabricated — transmits directly and immediately into deposit confidence in a way it would not for a conventionally corporate-fronted bank. The central structural vulnerability.",
      },
      {
        name: "Naomi Calder",
        role: "Co-founder & COO",
        profile:
          "40, deliberately quieter public profile. Handles day-to-day operations and the technical/regulatory relationship. Highly credible with industry and regulators.",
        vulnerability:
          "Almost no independent public profile outside the company, so if Bryce is compromised as a spokesperson there is no equally recognised alternative voice — and her thin authentic digital footprint makes impersonation hard to cross-check.",
      },
      {
        name: "David Okafor",
        role: "Chair (appointed pre-IPO)",
        profile:
          "Former FTSE-100 audit committee chair, appointed eight months before the planned listing to add independent governance weight ahead of public markets scrutiny. Well regarded.",
        vulnerability:
          "New to the business and its people — a genuine gap in crisis-response bench strength during exactly the highest-stakes window in the bank's history.",
      },
    ],
    mediaHistory: [
      {
        outlet: "Fintech Ledger UK",
        date: "2019",
        headline:
          "Bristow Calder Passes 500,000 Customers, Bryce Says 'Trust Is the Only Product We Sell'",
        note: "Establishes founder-brand-as-company-brand positioning — the later central vulnerability.",
      },
      {
        outlet: "The Digital Banker",
        date: "2023",
        headline: "Bristow Calder Acquires Struggling Rival Northfield Bank",
        note: "Factual coverage with brief, never-followed-up analyst commentary on technology integration risk.",
      },
      {
        outlet: "Fintech Ledger UK",
        date: "Early 2025",
        headline: "Bristow Calder Confirms IPO Preparations, Targets London Listing",
        note: "Publicly establishes the IPO timeline — a known, bookable date to time an incident against.",
      },
      {
        outlet: "The Digital Banker",
        date: "Mid-2025",
        headline: "David Okafor Joins Bristow Calder Board Ahead of Float",
        note: "Establishes governance context and the Chair's short tenure.",
      },
      {
        outlet: "Consumer Money Watch",
        date: "Autumn 2025",
        headline: "Short-Lived App Outage Affects Small Percentage of Users",
        note: "Real, minor, resolved within hours — but establishes precedent for 'Bristow Calder has had tech problems before'.",
      },
    ],
    scenarios: [
      {
        ref: 13,
        title: "Coordinated bank-run rumour campaign",
        tier: "Tier 3–4",
        type: "Timed to roadshow",
        description:
          "Messages seeded into closed WhatsApp/Telegram community groups claim Bristow Calder is 'restricting withdrawals', timed to the IPO roadshow window and designed to produce enough real customer anxiety to generate genuine deposit outflow data that then self-validates the rumour.",
      },
      {
        ref: 14,
        title: "Deepfake 'leaked' board audio on capital reserves",
        tier: "Tier 4",
        type: "Synthetic media, market-moving",
        description:
          "A fabricated recording styled as leaked board discussion in which Bryce or Okafor appears to express concern about capital adequacy — surfacing in the 48 hours before a roadshow investor meeting, when verification time is shortest.",
      },
      {
        ref: 15,
        title: "Fake regulator statement pre-market-open",
        tier: "Tier 4–5",
        type: "Fabricated official communication, market timing",
        description:
          "A forged press release styled as an FCA statement about 'enhanced monitoring' of Bristow Calder, seeded to financial journalists right before market open to move institutional sentiment before any denial can catch the news cycle.",
      },
      {
        ref: 16,
        title: "Ex-employee 'whistleblower' thread mixing true and false claims",
        tier: "Tier 2–3",
        type: "Credibility-laundering",
        description:
          "A departed employee with genuine knowledge of the real Northfield-acquisition tech debt publishes a thread that starts accurately, building credibility, then pivots into fabricated claims of deliberate fraud or concealment — the hardest scenario in the set to cleanly rebut.",
      },
      {
        ref: 17,
        title: "Personal-brand attack on Alex Bryce",
        tier: "Tier 2–3",
        type: "Reputational transfer risk",
        description:
          "Fabricated or selectively edited personal content designed to damage Bryce individually (financial impropriety implications, personal conduct allegations, or a deepfake clip) — exploiting the fusion of his personal and corporate brand so damage transmits into deposit and investor confidence.",
      },
      {
        ref: 18,
        title: "Impersonation of Naomi Calder to fill the 'silent voice' gap",
        tier: "Tier 2",
        type: "Identity spoofing",
        description:
          "A cloned or spoofed account posts 'internal concerns' in Calder's name, exploiting her lack of authentic public digital footprint for followers or journalists to cross-check against — a good test of the bank's thin bench strength.",
      },
    ],
    structuralVulnerability:
      "Market-timed, personality-fused and deposit-sensitive: the IPO roadshow gives attackers a bookable date, and rumour-driven outflow becomes self-validating evidence.",
  },
];

export const SIMULATION_COMPANY_NAMES = SIMULATION_COMPANIES.map((c) => c.name);

export function getSimulationCompany(nameOrId: string): SimulationCompany | undefined {
  const needle = nameOrId.trim().toLowerCase();
  if (!needle) return undefined;
  return SIMULATION_COMPANIES.find(
    (c) =>
      c.id === needle ||
      c.name.toLowerCase() === needle ||
      needle.includes(c.name.split(" ")[0].toLowerCase() + " " + (c.name.split(" ")[1] || "").toLowerCase())
  );
}

/**
 * Compact briefing string passed to the scenario/inject generators so AI output
 * stays consistent with the simulation pack canon.
 */
export function buildBrandContext(company: SimulationCompany): string {
  const people = company.people
    .map((p) => `- ${p.name} (${p.role}): ${p.profile} Weakness: ${p.vulnerability}`)
    .join("\n");
  const media = company.mediaHistory
    .map((m) => `- ${m.outlet}, ${m.date}: "${m.headline}" — ${m.note}`)
    .join("\n");
  const seeds = company.scenarios
    .map((s) => `- [${s.tier} / ${s.type}] ${s.title}: ${s.description}`)
    .join("\n");

  return [
    `FICTIONAL SIMULATION TARGET — canon briefing (use these facts, do not invent conflicting ones).`,
    `Name: ${company.name}`,
    `Type: ${company.type}`,
    `Founded: ${company.founded}`,
    `HQ: ${company.headquarters}`,
    `Industry: ${company.industry}`,
    `Scale: ${company.revenue}; employees ${company.employees}; website ${company.website}`,
    ``,
    `HISTORY:`,
    company.history.join("\n"),
    ``,
    `KEY PEOPLE (use these real names, they are fictional characters — do not use [REDACTED]):`,
    people,
    ``,
    `MEDIA HISTORY (fictional trade press — reference these where useful):`,
    media,
    ``,
    `CANONICAL DMMI SCENARIO SEEDS (base the scenario on one of these):`,
    seeds,
    ``,
    `STRUCTURAL VULNERABILITY: ${company.structuralVulnerability}`,
    `DIFFICULTY: ${company.difficulty} — ${company.difficultyNote} Expected escalation band: ${company.tierRange}.`,
  ].join("\n");
}
