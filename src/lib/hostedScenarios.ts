/**
 * Hosted Red Team — pre-planned scenario packs and the inject menu.
 *
 * Each pack is a storyline of timed beats with pre-prepared inject options,
 * host instructions and decision-tree branches. Pharmacore International is
 * the fully fleshed-out pack; the other two are lighter starter packs.
 *
 * All content is fictional exercise material.
 */

export type InjectCategory =
  | "public_reaction"
  | "press"
  | "misinformation"
  | "disinformation"
  | "malinformation";

export const INJECT_CATEGORY_LABELS: Record<InjectCategory, string> = {
  public_reaction: "Public Reaction",
  press: "Press Coverage",
  misinformation: "Misinformation",
  disinformation: "Disinformation",
  malinformation: "Malinformation",
};

export type HostedInjectType =
  | "social_post"
  | "news_article"
  | "influencer"
  | "official_response"
  | "leak"
  | "amplification";

export interface StorylineInjectOption {
  label: string;
  category: InjectCategory;
  type: HostedInjectType;
  content: string;
  source: string;
  channel: string;
  reach: number;
}

export interface StorylineBeat {
  id: string;
  /** Minutes into the session (on a 60-minute baseline; scaled to session length). */
  offsetMinutes: number;
  title: string;
  /** Host-facing storyline note — what is happening in the narrative. */
  narrative: string;
  /** What the host should do at this beat. */
  instruction: string;
  injects: StorylineInjectOption[];
  /** Decision-tree routes depending on what participants do. */
  branches: { condition: string; route: string }[];
}

export interface HostedScenarioPack {
  companyId: string;
  title: string;
  narrative: string;
  severity: "moderate" | "severe" | "critical";
  beats: StorylineBeat[];
}

export const HOSTED_SCENARIO_PACKS: HostedScenarioPack[] = [
  {
    companyId: "ashworth-reilly",
    title: "Operation Cold Chain — Pharmacore International",
    narrative:
      "A fabricated contamination rumour against Pharmacore International escalates from an anonymous forum post to a forged regulator notice and an executive impersonation, testing verification, spokesperson readiness and sequencing under pressure.",
    severity: "severe",
    beats: [
      {
        id: "pc-1",
        offsetMinutes: 0,
        title: "First Signal",
        narrative:
          "An anonymous pharmacist-forum post claims a Doncaster hub batch caused adverse patient reactions, timed to ride a real, unrelated national shortage story.",
        instruction:
          "Let the rumour breathe. Send one public-reaction inject and watch whether Blue verifies before reacting.",
        injects: [
          {
            label: "Pharmacist forum post",
            category: "public_reaction",
            type: "social_post",
            content:
              "Heard from two colleagues that a Pharmacore International batch from the Doncaster hub is being pulled. Nothing official yet — anyone else seeing this?",
            source: "u/communitypharmacist_uk",
            channel: "Reddit",
            reach: 400,
          },
          {
            label: "X post — concerned dispenser",
            category: "public_reaction",
            type: "social_post",
            content:
              "Two pharmacies in the Midlands telling me a Pharmacore batch is being quietly pulled. No notice anywhere. What's going on?",
            source: "@dispenser_diaries",
            channel: "X",
            reach: 1900,
          },
        ],
        branches: [
          {
            condition: "Blue issues an immediate flat denial",
            route: "Jump to Beat 3 early — the forged notice now reads as a 'cover-up' and lands harder.",
          },
          {
            condition: "Blue monitors and verifies quietly",
            route: "Continue to Beat 2 as planned.",
          },
        ],
      },
      {
        id: "pc-2",
        offsetMinutes: 10,
        title: "Pattern Emerges",
        narrative:
          "The genuine, fully resolved 2023 short-dated stock issue is recirculated undated, manufacturing a 'pattern of failure' around the new claim.",
        instruction:
          "Send the misinformation inject. Note whether Blue spots that the underlying incident is real but old.",
        injects: [
          {
            label: "Undated 2023 incident resurfaces",
            category: "misinformation",
            type: "social_post",
            content:
              "Reminder that this wholesaler had a stock problem back in 2023 too. Draw your own conclusions.",
            source: "anon_dispenser",
            channel: "Pharmacist forum",
            reach: 800,
          },
          {
            label: "Trade forum 'pattern' thread",
            category: "misinformation",
            type: "social_post",
            content:
              "Third time I've heard Pharmacore's name attached to a supply issue this year. Starting a thread — post what you've seen.",
            source: "Pharmacy trade forum",
            channel: "Website",
            reach: 2400,
          },
        ],
        branches: [
          {
            condition: "Blue openly acknowledges and dates the 2023 incident",
            route: "The malinformation route weakens — skip ahead to Beat 4 and note the strong response.",
          },
          {
            condition: "Blue stays silent or dismisses everything as fake",
            route: "Continue to Beat 3 — the forged notice now meets an information vacuum.",
          },
        ],
      },
      {
        id: "pc-3",
        offsetMinutes: 20,
        title: "The Forged Notice",
        narrative:
          "A convincingly formatted PDF styled as an MHRA field safety notice naming Pharmacore circulates in closed pharmacist WhatsApp and Telegram groups before surfacing publicly.",
        instruction:
          "Send the disinformation inject. This is the escalation point — watch for hoarding behaviour and whether Blue checks the regulator's actual channels.",
        injects: [
          {
            label: "Fake MHRA field safety notice",
            category: "disinformation",
            type: "leak",
            content:
              "A PDF styled as an MHRA field safety notice naming Pharmacore International is circulating in closed pharmacist WhatsApp groups. It does not appear on any official channel.",
            source: "Closed WhatsApp/Telegram groups",
            channel: "WhatsApp",
            reach: 5000,
          },
          {
            label: "Telegram channel amplification",
            category: "disinformation",
            type: "amplification",
            content:
              "A Telegram channel with 12,000 pharmacist subscribers reposts the 'notice' with the caption: 'Why is nobody reporting this?'",
            source: "Pharma Supply Alerts (Telegram)",
            channel: "Telegram",
            reach: 12000,
          },
        ],
        branches: [
          {
            condition: "Blue contacts/verifies with the regulator before communicating",
            route: "Strong play — offer the press pickup in Beat 4 with a lower reach, reflecting contained spread.",
          },
          {
            condition: "Blue publicly denies without verification",
            route: "Send the press pickup at full reach — the denial without official backing fuels the story.",
          },
        ],
      },
      {
        id: "pc-4",
        offsetMinutes: 30,
        title: "Mainstream Pickup",
        narrative:
          "Trade press and then a national outlet pick up the story. Journalists begin calling pharmacies for comment.",
        instruction:
          "Send a press inject. This is where spokesperson readiness decides the exercise.",
        injects: [
          {
            label: "Trade press story",
            category: "press",
            type: "news_article",
            content:
              "Pharmacy Trade Weekly: 'Unverified Safety Notice Circulates Among Community Pharmacists' — names Pharmacore, notes the company has not responded.",
            source: "Pharmacy Trade Weekly",
            channel: "Website",
            reach: 84000,
          },
          {
            label: "National broadcast query",
            category: "press",
            type: "news_article",
            content:
              "A national broadcaster's health desk emails: 'We are running a story on the Pharmacore safety notice at 6pm. Does the company wish to comment?'",
            source: "National broadcaster — health desk",
            channel: "Press wire",
            reach: 1200000,
          },
        ],
        branches: [
          {
            condition: "Blue has a named, credible spokesperson ready (e.g. Priya Khatri)",
            route: "Go to Beat 5 but flag the impersonation inject as the counter-move to their strongest asset.",
          },
          {
            condition: "Blue has no spokesperson or sends an untrained executive",
            route: "Go to Beat 5 at full strength — the impersonation exploits the vacuum.",
          },
        ],
      },
      {
        id: "pc-5",
        offsetMinutes: 40,
        title: "Personalisation",
        narrative:
          "The attack personalises: a cloned LinkedIn profile in Priya Khatri's name posts 'insider concerns', exploiting her genuine regulatory credibility.",
        instruction:
          "Send the impersonation inject. If Blue quoted any real statement earlier, use the malinformation option to recut it.",
        injects: [
          {
            label: "Cloned executive profile",
            category: "disinformation",
            type: "social_post",
            content:
              "A cloned LinkedIn profile in the name of Priya Khatri posts: 'I have raised concerns internally about quality control at the Doncaster hub. I can no longer stay silent.'",
            source: "LinkedIn (cloned profile)",
            channel: "LinkedIn",
            reach: 15000,
          },
          {
            label: "Recut genuine quote",
            category: "malinformation",
            type: "news_article",
            content:
              "A genuine 2024 quote from Priya Khatri about 'continuous improvement in cold-chain standards' is recirculated captioned as an admission of current failures.",
            source: "Adversary account network",
            channel: "X",
            reach: 30000,
          },
        ],
        branches: [
          {
            condition: "Blue has already established Khatri as a verified, visible spokesperson",
            route: "The clone is easier to debunk — send Beat 6 resolution options early.",
          },
          {
            condition: "Blue never used Khatri",
            route: "The clone lands as credible — hold Beat 6 and let the pressure build.",
          },
        ],
      },
      {
        id: "pc-6",
        offsetMinutes: 50,
        title: "Resolution Window",
        narrative:
          "Verification behaviour pays off: independent pharmacists and fact-checkers begin debunking the notice, and official channels can close the story down.",
        instruction:
          "Close the loop. Send whichever resolution injects match the ground Blue has earned, then end the exercise and debrief.",
        injects: [
          {
            label: "Community debunk",
            category: "public_reaction",
            type: "social_post",
            content:
              "This 'MHRA notice' doing the rounds in the pharmacy WhatsApp groups does not appear on the MHRA site. Treat with caution.",
            source: "@rxverify",
            channel: "Bluesky",
            reach: 2100,
          },
          {
            label: "Regulator clarification",
            category: "press",
            type: "official_response",
            content:
              "The regulator confirms no field safety notice naming Pharmacore International has been issued and refers the forged document to the appropriate authorities.",
            source: "Official regulator statement",
            channel: "Press wire",
            reach: 900000,
          },
        ],
        branches: [
          {
            condition: "Blue verified before communicating throughout",
            route: "Award strong narrative control — the debrief should focus on speed, not accuracy.",
          },
          {
            condition: "Blue denied without verifying or stayed silent",
            route: "Debrief the verification gap and the spokesperson vacuum.",
          },
        ],
      },
    ],
  },
  {
    companyId: "meridian-vale",
    title: "Renewal Season — TrustInsureUK PLC",
    narrative:
      "A claims management company funds coordinated amplification of TrustInsureUK's genuine post-merger claims backlog, timed to renewal season, escalating from a trending hashtag to fabricated algorithm screenshots.",
    severity: "severe",
    beats: [
      {
        id: "ti-1",
        offsetMinutes: 0,
        title: "Hashtag Ignition",
        narrative:
          "Coordinated low-authenticity accounts push a complaint hashtag as annual renewal notices land.",
        instruction: "Send the public-reaction injects and watch whether Blue spots the coordination pattern.",
        injects: [
          {
            label: "Complaint hashtag trends",
            category: "public_reaction",
            type: "social_post",
            content: "#TrustInsureUKFails is trending as renewal notices land. Hundreds of near-identical posts cite months-long claims delays.",
            source: "X trending",
            channel: "X",
            reach: 41000,
          },
          {
            label: "Consumer forum mega-thread",
            category: "public_reaction",
            type: "social_post",
            content: "Renewal letter arrived today. After my claim took 7 months, I'm switching. Thread on your options. 1/14",
            source: "u/UKPersonalFinanceMod",
            channel: "Reddit",
            reach: 5400,
          },
        ],
        branches: [
          { condition: "Blue acknowledges the genuine backlog honestly", route: "The fabricated screenshots in Beat 2 lose force — note the strong play." },
          { condition: "Blue denies or stays silent", route: "Continue at full strength — denial against a real grievance reads as bad faith." },
        ],
      },
      {
        id: "ti-2",
        offsetMinutes: 15,
        title: "Fabricated Evidence",
        narrative:
          "Fabricated screenshots claim an internal scoring model auto-declines claims from lower-income postcodes.",
        instruction: "Send the disinformation inject — the pivot from true grievance to fabricated mechanism.",
        injects: [
          {
            label: "Fake algorithm screenshots",
            category: "disinformation",
            type: "leak",
            content: "Screenshots purporting to show TrustInsureUK's claims system 'auto-declining' lower-income postcodes circulate with claimant names attached.",
            source: "@claimsjustice",
            channel: "X",
            reach: 64000,
          },
          {
            label: "'Whistleblower' handler post",
            category: "disinformation",
            type: "social_post",
            content: "An account posing as a former claims handler alleges a deliberate 'delay-to-deter' policy for vulnerable claimants.",
            source: "@ex_handler_anon",
            channel: "Bluesky",
            reach: 9800,
          },
        ],
        branches: [
          { condition: "Blue publishes a plain-English explanation of how claims decisions are made", route: "Move to Beat 3 at reduced reach." },
          { condition: "Blue threatens legal action against posters", route: "Beat 3 lands harder — legal threats against genuine claimants become the story." },
        ],
      },
      {
        id: "ti-3",
        offsetMinutes: 30,
        title: "Historic Data as Current",
        narrative:
          "Real but historic complaint-handling figures are presented as current performance in campaign material.",
        instruction: "Send the malinformation inject. If Blue has published any statement, offer the recut-quote option referencing it.",
        injects: [
          {
            label: "Undated FOS figures",
            category: "malinformation",
            type: "news_article",
            content: "Campaign material cites Financial Ombudsman complaint volumes from 2021 as TrustInsureUK's current performance.",
            source: "Consumer campaign group",
            channel: "Facebook",
            reach: 31000,
          },
          {
            label: "Recut CEO clip",
            category: "malinformation",
            type: "influencer",
            content: "The genuine 'data migration issue' interview clip is recut to imply the CEO admitted claims are deliberately delayed.",
            source: "Consumer-rights video account",
            channel: "YouTube",
            reach: 120000,
          },
        ],
        branches: [
          { condition: "Blue dates and contextualises the historic figures", route: "Move to resolution." },
          { condition: "Blue ignores it", route: "Send the press pickup and hold pressure." },
        ],
      },
      {
        id: "ti-4",
        offsetMinutes: 45,
        title: "Resolution Window",
        narrative: "FOS data is independently reported with correct dates; the CMC funding link surfaces.",
        instruction: "Close the loop with press resolution injects matched to Blue's performance, then debrief.",
        injects: [
          {
            label: "Press: dates corrected",
            category: "press",
            type: "news_article",
            content: "Insurance Journal Daily: 'Complaint Volumes Cited in Campaign Date From 2021, Records Show.'",
            source: "Insurance Journal Daily",
            channel: "Website",
            reach: 88000,
          },
          {
            label: "CMC funding exposed",
            category: "press",
            type: "news_article",
            content: "A trade outlet reports that a claims management company funded the amplification campaign — commercial incentive, not grassroots anger.",
            source: "Insurance Sector Monitor",
            channel: "Website",
            reach: 64000,
          },
        ],
        branches: [
          { condition: "Blue combined honesty about the backlog with fast fabrication takedowns", route: "Strong result — debrief sequencing." },
          { condition: "Blue treated everything as fake", route: "Debrief the true/false mixing problem." },
        ],
      },
    ],
  },
  {
    companyId: "bristow-calder",
    title: "Roadshow Week — PigeeBank!.com",
    narrative:
      "A coordinated bank-run rumour campaign targets PigeeBank! during its pre-IPO roadshow window, escalating from closed-group WhatsApp messages to a fabricated treasury memo with synthetic audio.",
    severity: "critical",
    beats: [
      {
        id: "pb-1",
        offsetMinutes: 0,
        title: "Closed-Group Seeding",
        narrative: "Messages in closed WhatsApp and Telegram community groups claim PigeeBank! is 'restricting withdrawals'.",
        instruction: "Send the disinformation inject. Watch whether Blue monitors closed-channel chatter at all.",
        injects: [
          {
            label: "WhatsApp withdrawal rumour",
            category: "disinformation",
            type: "social_post",
            content: "Forwarded message in community WhatsApp groups: 'PigeeBank! is restricting withdrawals from Friday. Move your money now.'",
            source: "Closed WhatsApp groups",
            channel: "WhatsApp",
            reach: 8000,
          },
          {
            label: "Telegram investor channel",
            category: "disinformation",
            type: "amplification",
            content: "A fintech investor Telegram channel reposts the claim with 'hearing the same from two sources'.",
            source: "Fintech Signals (Telegram)",
            channel: "Telegram",
            reach: 22000,
          },
        ],
        branches: [
          { condition: "Blue publishes real-time service status immediately", route: "The rumour loses its information vacuum — reduce Beat 2 reach." },
          { condition: "Blue waits for formal verification", route: "Continue at full strength." },
        ],
      },
      {
        id: "pb-2",
        offsetMinutes: 15,
        title: "The Forged Memo",
        narrative: "A fabricated internal treasury memo claiming an emergency liquidity facility circulates with a synthetic executive voice note.",
        instruction: "Send the leak inject — the market-moving escalation.",
        injects: [
          {
            label: "Leaked treasury memo",
            category: "disinformation",
            type: "leak",
            content: "A fabricated internal treasury memo claiming PigeeBank! has drawn an emergency liquidity facility circulates with a synthetic voice note attached.",
            source: "@marketwhispers",
            channel: "X",
            reach: 128000,
          },
          {
            label: "Synthetic executive audio",
            category: "disinformation",
            type: "influencer",
            content: "A voice note purporting to be a PigeeBank! executive discussing 'capital adequacy concerns' spreads in investor chat groups.",
            source: "Investor chat groups",
            channel: "Telegram",
            reach: 45000,
          },
        ],
        branches: [
          { condition: "Blue coordinates a verified statement with the regulator", route: "Strong play — move to Beat 3 reduced." },
          { condition: "Blue issues a bare denial", route: "Denial without regulator backing fuels the story — full strength." },
        ],
      },
      {
        id: "pb-3",
        offsetMinutes: 30,
        title: "Self-Validating Panic",
        narrative: "Genuine queue and outage imagery from unrelated events is recirculated as evidence of a bank run.",
        instruction: "Send the malinformation inject — real images, false context.",
        injects: [
          {
            label: "Recycled queue photos",
            category: "malinformation",
            type: "social_post",
            content: "Photos of queues from an unrelated 2024 outage are recirculated as 'PigeeBank! branches this morning'.",
            source: "u/uk_investing",
            channel: "Reddit",
            reach: 11200,
          },
          {
            label: "Undated outage coverage",
            category: "malinformation",
            type: "news_article",
            content: "Genuine historic app-outage coverage is reposted undated, implying an ongoing operational collapse.",
            source: "Adversary account network",
            channel: "Facebook",
            reach: 37000,
          },
        ],
        branches: [
          { condition: "Blue reverse-image-searches and debunks with dates", route: "Move to resolution." },
          { condition: "Blue ignores the imagery", route: "Send the press pickup and hold pressure." },
        ],
      },
      {
        id: "pb-4",
        offsetMinutes: 45,
        title: "Resolution Window",
        narrative: "The regulator confirms monitoring and the bank's coordinated response closes the information vacuum.",
        instruction: "Close the loop with resolution injects matched to Blue's performance, then debrief.",
        injects: [
          {
            label: "Regulator monitoring statement",
            category: "press",
            type: "official_response",
            content: "The regulator says it is monitoring online claims about the lender's capital position and confirms no enforcement action.",
            source: "City Business Daily",
            channel: "Press wire",
            reach: 640000,
          },
          {
            label: "Fact-check: images dated",
            category: "press",
            type: "news_article",
            content: "Fact Check Bureau: 'Branch Queue Images Circulating Are From an Unrelated 2024 Outage.'",
            source: "Fact Check Bureau",
            channel: "Website",
            reach: 420000,
          },
        ],
        branches: [
          { condition: "Blue filled the information vacuum fast with verifiable status", route: "Strong result — debrief speed." },
          { condition: "Blue relied on denials", route: "Debrief the self-validating rumour problem." },
        ],
      },
    ],
  },
];

export const getHostedScenarioPack = (companyId?: string): HostedScenarioPack | undefined =>
  companyId ? HOSTED_SCENARIO_PACKS.find((p) => p.companyId === companyId) : undefined;

/* ------------------------------------------------------------------ */
/* Inject menu — categorised quick injects for the host dashboard      */
/* ------------------------------------------------------------------ */

export interface InjectMenuItem {
  label: string;
  category: InjectCategory;
  type: HostedInjectType;
  content: string;
  reach: number;
  /** Selectable sources for the source dropdown. */
  sources: string[];
  /** Selectable channels for the channel dropdown. */
  channels: string[];
}

export const INJECT_MENU: InjectMenuItem[] = [
  // Public reaction — genuine, organic voices
  {
    label: "News Report",
    category: "public_reaction",
    type: "news_article",
    content: "A news outlet reports the developing story, noting the company has not yet commented.",
    reach: 200000,
    sources: ["National broadcaster", "National newspaper", "Local news site", "Trade press", "Online news aggregator"],
    channels: ["Website", "TV", "Press wire"],
  },
  {
    label: "X Post",
    category: "public_reaction",
    type: "social_post",
    content: "A member of the public posts about the story; replies are starting to pile up.",
    reach: 5000,
    sources: ["Verified journalist", "Community account", "Concerned customer", "Industry commentator"],
    channels: ["X"],
  },
  {
    label: "Facebook Page Post",
    category: "public_reaction",
    type: "social_post",
    content: "A community Facebook page shares the story with a worried comment thread.",
    reach: 12000,
    sources: ["Community group", "Local interest page", "Consumer advice page"],
    channels: ["Facebook"],
  },
  {
    label: "Website Story",
    category: "public_reaction",
    type: "news_article",
    content: "An independent website publishes a write-up aggregating what is known so far.",
    reach: 45000,
    sources: ["Trade press", "Independent blog", "Consumer advice site"],
    channels: ["Website"],
  },
  {
    label: "Telegram Channel Post",
    category: "public_reaction",
    type: "social_post",
    content: "A public Telegram channel discusses the story with a mix of concern and speculation.",
    reach: 9000,
    sources: ["Industry channel", "Local community channel", "Consumer rights channel"],
    channels: ["Telegram"],
  },
  {
    label: "Influencer Commentary",
    category: "public_reaction",
    type: "influencer",
    content: "A mid-size influencer shares the story and adds their own take to camera.",
    reach: 500000,
    sources: ["Lifestyle influencer", "Finance commentator", "Consumer rights creator"],
    channels: ["YouTube", "TikTok", "Instagram"],
  },
  {
    label: "Meme",
    category: "public_reaction",
    type: "social_post",
    content: "A mocking meme about the brand starts circulating — low information, high spread.",
    reach: 150000,
    sources: ["Meme page", "Anonymous account"],
    channels: ["X", "Instagram", "Reddit"],
  },
  // Disinformation — adversary fabrications
  {
    label: "Fake Document Leak",
    category: "disinformation",
    type: "leak",
    content: "A forged internal document surfaces, claiming to prove the allegations.",
    reach: 100000,
    sources: ["Anonymous paste site", "Closed Telegram channel", "Sock-puppet account"],
    channels: ["Telegram", "X", "Website"],
  },
  {
    label: "Bot Amplification",
    category: "disinformation",
    type: "amplification",
    content: "Coordinated inauthentic behaviour detected — 100+ accounts amplifying the narrative in the same hour.",
    reach: 300000,
    sources: ["Bot network", "Coordinated account cluster"],
    channels: ["X", "Facebook", "Reddit"],
  },
  {
    label: "Synthetic Audio / Video",
    category: "disinformation",
    type: "influencer",
    content: "A fabricated clip purporting to be a company executive surfaces in closed groups.",
    reach: 80000,
    sources: ["Anonymous account", "Closed chat group"],
    channels: ["WhatsApp", "Telegram", "YouTube"],
  },
  {
    label: "Executive Impersonation",
    category: "disinformation",
    type: "social_post",
    content: "A cloned profile in a named executive's name posts fabricated 'insider concerns'.",
    reach: 15000,
    sources: ["Cloned LinkedIn profile", "Spoofed X account"],
    channels: ["LinkedIn", "X"],
  },
  {
    label: "Fabricated Official Notice",
    category: "disinformation",
    type: "leak",
    content: "A convincing fake regulator or official notice naming the brand circulates in closed groups.",
    reach: 60000,
    sources: ["Closed WhatsApp group", "Anonymous paste site"],
    channels: ["WhatsApp", "Telegram"],
  },
  // Malinformation — genuine material, weaponised
  {
    label: "Press Release Quoted Out of Context",
    category: "malinformation",
    type: "news_article",
    content: "A genuine company statement is quoted selectively so it reads as an admission of guilt.",
    reach: 70000,
    sources: ["Adversary account network", "Partisan commentary site"],
    channels: ["X", "Facebook", "Website"],
  },
  {
    label: "Recut Genuine Clip",
    category: "malinformation",
    type: "influencer",
    content: "A real interview clip is edited or captioned to imply a more damaging admission than was made.",
    reach: 120000,
    sources: ["Commentary channel", "Anonymous video account"],
    channels: ["YouTube", "TikTok", "X"],
  },
  {
    label: "Historic Data as Current",
    category: "malinformation",
    type: "news_article",
    content: "Real but dated figures or incidents are recirculated undated as evidence of a current pattern.",
    reach: 40000,
    sources: ["Campaign group", "Forum account"],
    channels: ["Facebook", "Reddit", "Website"],
  },
];
