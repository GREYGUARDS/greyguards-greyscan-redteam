/**
 * Scripted, phone-first injects for the three public demo scenarios.
 * Approved copy: 5 short injects, 3 one-line choices each. Fictional only.
 */
import type { Inject, ResponseOption } from "@/pages/RedTeam";
import type { VideoOverlay } from "@/components/redteam/InjectOverlay";
import pharmacoreVideo from "@/assets/demo_video_pharmacore.mp4.asset.json";
import trustinsureVideo from "@/assets/demo_video_trustinsure.mp4.asset.json";
import pigeebankVideo from "@/assets/demo_video_pigeebank.mp4.asset.json";

type Opt = [label: string, description: string, type: ResponseOption["type"], effectiveness: number, risk: ResponseOption["riskLevel"], time: number];
type Spec = {
  t: number; type: Inject["type"]; source: string; reach: number;
  sentiment: Inject["sentiment"]; content: string; options: Opt[];
  video?: { url: string; overlay: VideoOverlay };
};

const build = (prefix: string, specs: Spec[]): Inject[] =>
  specs.map((s, i) => ({
    id: `${prefix}-${i + 1}`,
    timestamp: s.t,
    type: s.type,
    source: s.source,
    reach: s.reach,
    sentiment: s.sentiment,
    content: s.content,
    requiresResponse: true,
    ...(s.video ? { demoVideo: s.video } : {}),
    isAggressive: s.sentiment === "hostile",
    responseOptions: s.options.map(([label, description, type, effectiveness, riskLevel, timeToExecute], j) => ({
      id: `${prefix}-${i + 1}${"abc"[j]}`, label, description, type, effectiveness, riskLevel, timeToExecute,
    })),
  }));

const DEMO_INJECTS: Record<string, Inject[]> = {
  "ashworth-reilly": build("pc", [
    { t: 30, type: "social_post", source: "@UK_PharmaWatch (3.2k followers) · X", reach: 3200, sentiment: "hostile",
      content: "UNVERIFIED: Pharmacore's Doncaster hub had a cold-chain breach and still shipped amoxicillin. Three children in Sheffield hospital. Why no MHRA alert? #DrugSafety",
      options: [
        ["Truth-sandwich holding line", "Share unbroken 2–8°C hub logs, say you're monitoring, give chemists a contact line.", "statement", 85, "low", 30],
        ["Brief pharmacy network", "Batch-verification memo to community pharmacies before consumer press picks it up.", "internal_action", 80, "low", 45],
        ["Flat denial + legal warning", "Reply on X: '100% false and malicious, lawyers are watching.'", "legal", 30, "high", 15],
      ] },
    { t: 120, type: "influencer", source: "Parent creator · TikTok · 180k views #RecallTheMeds", reach: 180000, sentiment: "hostile",
      video: { url: pharmacoreVideo.url, overlay: { platform: "tiktok", handle: "@sheffieldmum_jo", caption: "Pharmacore knew. Check your kids' meds 😡 #RecallTheMeds", likes: "24.6K", comments: "3.1K", shares: "8.9K", views: "180K", channel: "", headline: "", ticker: "" } },
      content: "Crying to camera: 'Pharmacore knew since Tuesday. My 4-year-old was prescribed this exact bottle. Why is nobody talking about it?'",
      options: [
        ["Rapid video response", "Julian Mercer (MD) speaks to parents directly with a batch-checker link.", "social_response", 85, "medium", 60],
        ["Pharmacy talking points", "Give chemists a script for anxious parents collecting prescriptions.", "internal_action", 80, "low", 30],
        ["Legal takedown request", "Send defamation notices to get the video removed.", "legal", 25, "high", 15],
      ] },
    { t: 270, type: "leak", source: "WhatsApp · Forwarded many times", reach: 12000, sentiment: "confused",
      content: "FORGED MHRA NOTICE: 'Class 1 recall on ALL amoxicillin from Pharmacore Doncaster. Contaminated. Stop dispensing, tell parents to return bottles.'",
      options: [
        ["Regulator statement", "MHRA posts a joint alert debunking the fake notice.", "statement", 88, "low", 45],
        ["Trade-only bulletin", "Urgent alert to chemists: stock is verified clear.", "internal_action", 65, "low", 30],
        ["Precautionary freeze", "Pause amoxicillin shipments while verifying batches.", "internal_action", 25, "high", 20],
      ] },
    { t: 420, type: "news_article", source: "BBC / Sky · Breaking alert", reach: 2000000, sentiment: "confused",
      content: "BREAKING: Health officials investigate distribution giant Pharmacore after nationwide antibiotic contamination reports.",
      options: [
        ["Live broadcast interview", "Put Priya Khatri (Regulatory Director) on BBC News within 15 minutes.", "media_outreach", 80, "high", 60],
        ["Written wire statement", "Verifiable factsheet to PA Media and health editors.", "statement", 78, "low", 30],
        ["No comment", "Wait for the internal audit to finish tomorrow morning.", "internal_action", 15, "high", 15],
      ] },
    { t: 570, type: "official_response", source: "NHS Procurement Lead · Email", reach: 500, sentiment: "hostile",
      content: "3 ICBs will switch amoxicillin contracts to another supplier unless you provide an executive warranty within 30 minutes.",
      options: [
        ["CEO emergency warranty", "Signed director warranty backed by independent lab assays.", "statement", 88, "low", 45],
        ["Clinical briefing", "Live webinar now for hospital chief pharmacists.", "media_outreach", 82, "low", 60],
        ["Threaten penalty clauses", "Warn ICBs they'll breach contract if they switch.", "legal", 15, "high", 15],
      ] },
  ]),
  "meridian-vale": build("ti", [
    { t: 30, type: "social_post", source: "X / Reddit · 12k reposts", reach: 120000, sentiment: "hostile",
      content: "Recut 12s clip: TrustInsureUK CEO Thomas Reeve 'admits' they stall flood claims — 'People will simply have to wait; claims aren't our priority.'",
      options: [
        ["Post the unedited footage", "Side-by-side video proving the quote was cut mid-sentence.", "social_response", 88, "low", 30],
        ["Executive clarification", "Written statement explaining the full context.", "statement", 62, "low", 30],
        ["Demand platform takedown", "File an immediate copyright notice against the account.", "legal", 30, "high", 15],
      ] },
    { t: 150, type: "influencer", source: "Consumer champion · TikTok Live · 500k followers", reach: 500000, sentiment: "hostile",
      video: { url: trustinsureVideo.url, overlay: { platform: "tiktok", handle: "@moneyrights_dan", caption: "Switch NOW before renewals ⚠️ #TrustInsureScandal", likes: "61.2K", comments: "7.4K", shares: "15K", views: "1.2M", channel: "", headline: "", ticker: "" } },
      content: "'Don't renew with TrustInsureUK. Switch your motor and home policy today before they freeze your payouts.'",
      options: [
        ["Brief the advocate directly", "Share verified claim audit data with the consumer champion.", "media_outreach", 85, "low", 60],
        ["Renewal reassurance email", "Guarantee to everyone renewing this week.", "statement", 78, "low", 30],
        ["Threaten defamation", "Legal warning letter to the influencer's agency.", "legal", 15, "high", 20],
      ] },
    { t: 300, type: "amplification", source: "Glassdoor / Trustpilot · 140 posts in 1 hour", reach: 60000, sentiment: "hostile",
      content: "Coordinated 1-star reviews: 'Claims handlers forced to hit 40% rejection targets. Management celebrating denied payouts.'",
      options: [
        ["Claims transparency note", "Sarah Osei (CCO) shares verified payout stats (92% settled).", "statement", 85, "low", 45],
        ["Flag to review platforms", "Report the coordinated attack to Trustpilot for a temporary freeze.", "internal_action", 65, "low", 30],
        ["Ignore the reviews", "Treat it as anonymous noise that will blow over.", "internal_action", 20, "high", 15],
      ] },
    { t: 450, type: "leak", source: "Telegram / LinkedIn · Insurance Industry Leaks", reach: 40000, sentiment: "confused",
      content: "FORGED FCA LETTER: 'TrustInsureUK placed into urgent Special Measures for systemic claims denial. Policyholders should seek ombudsman review.'",
      options: [
        ["Joint denial with regulator", "Coordinate a joint line with the FCA press office.", "statement", 88, "low", 45],
        ["Policyholder app banner", "In-app alert reassuring customers directly.", "social_response", 75, "low", 30],
        ["Staff gag order", "Tell call centres to redirect every question to press office.", "internal_action", 30, "high", 20],
      ] },
    { t: 570, type: "official_response", source: "UK Broker Network · Portal alert", reach: 5000, sentiment: "confused",
      content: "Two major comparison sites are pausing TrustInsureUK quotes pending regulatory clarification on claims solvency.",
      options: [
        ["Executive broker hotline", "Thomas Reeve hosts a dial-in for the top 20 broker principals.", "media_outreach", 85, "low", 45],
        ["Aggregator compliance pack", "Send audited solvency and payout certificates to aggregator legal teams.", "internal_action", 82, "low", 30],
        ["20% direct discount", "Discount direct renewals to bypass aggregators.", "statement", 25, "high", 20],
      ] },
  ]),
  "bristow-calder": build("pb", [
    { t: 30, type: "social_post", source: "Reddit r/UKPersonalFinance & X", reach: 80000, sentiment: "hostile",
      content: "'PigeeBank app has frozen all Faster Payments right before their IPO. Exit scam? Get your cash out now.' (re-shared maintenance screenshot)",
      options: [
        ["Live status dashboard", "Post the live payments dashboard showing 99.98% processing.", "social_response", 88, "low", 30],
        ["Founder personal post", "Alex Bryce debunks the rumour from his verified account.", "social_response", 65, "medium", 30],
        ["Delete panic posts", "Hide and report posts on the official subreddit.", "internal_action", 20, "high", 15],
      ] },
    { t: 150, type: "influencer", source: "@fintech_sam (240k followers) · TikTok", reach: 240000, sentiment: "hostile",
      video: { url: pigeebankVideo.url, overlay: { platform: "tiktok", handle: "@fintech_sam", caption: "PigeeBank blocking withdrawals?? Move your money 🚨 #PigeeBank", likes: "42.5K", comments: "3.8K", shares: "11K", views: "890K", channel: "", headline: "", ticker: "" } },
      content: "Creator to camera: 'PigeeBank is blocking withdrawals before their IPO. My rent transfer just failed. Get your money out now.'",
      options: [
        ["Reply with live payments data", "Stitch the video with the live Faster Payments dashboard and a founder clip.", "social_response", 85, "low", 30],
        ["Report coordinated financial harm", "Ask TikTok for urgent review under its financial-scam policy.", "internal_action", 70, "low", 20],
        ["Demand she deletes it", "Legal letter to the creator threatening defamation.", "legal", 15, "high", 15],
      ] },
    { t: 300, type: "leak", source: "Telegram fintech channel · 35k members", reach: 35000, sentiment: "hostile",
      content: "Fake 'whistleblower' Slack screenshot: 'We have a £40m liquidity gap. BoE discount window refused.'",
      options: [
        ["Confirm FSCS protection", "App push confirming £85,000 FSCS deposit protection.", "statement", 85, "low", 30],
        ["Clearing partner confirmation", "Banking partner issues a joint routing confirmation.", "statement", 82, "low", 45],
        ["Threaten the leaker", "Warn of criminal action against fake leakers.", "legal", 20, "high", 20],
      ] },
    { t: 450, type: "news_article", source: "Bloomberg / Sifted · Push alert", reach: 900000, sentiment: "confused",
      content: "BREAKING: PigeeBank IPO roadshow in jeopardy as deposit outflows surge amid weekend social panic.",
      options: [
        ["On-the-record briefing", "CFO and Naomi Hart (COO) give verified deposit retention figures.", "media_outreach", 85, "medium", 45],
        ["Private investor note", "Reassure anchor investors through a City advisory note.", "statement", 75, "low", 30],
        ["Cancel the roadshow", "Delay listing until social media calms down.", "internal_action", 15, "high", 30],
      ] },
    { t: 570, type: "official_response", source: "Lead Underwriter · Signal message", reach: 50, sentiment: "hostile",
      content: "Cornerstone fund will pull its £50m IPO allocation unless net deposit outflows stabilise by midday.",
      options: [
        ["Publish deposit audit", "Release audited balance showing 98.4% deposit retention.", "statement", 88, "low", 45],
        ["Announce bank backstop", "Confirm a pre-arranged committed credit facility.", "statement", 82, "low", 30],
        ["Bonus interest rate", "Offer a temporary 1% deposit bonus to stem withdrawals.", "statement", 25, "high", 20],
      ] },
  ]),
};

export function getDemoInjects(companyId?: string): Inject[] | undefined {
  const list = companyId ? DEMO_INJECTS[companyId] : undefined;
  return list?.map((i) => ({ ...i, responseOptions: i.responseOptions?.map((o) => ({ ...o })) }));
}
