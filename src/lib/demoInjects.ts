/**
 * Scripted, phone-first injects for the three public demo scenarios.
 * Scripted copy: 10 short injects per demo across Tweets, TikTok, Community pages, Reddit, Telegram, reviews, radio phone-ins and news. Fictional only.
 */
import type { Inject, ResponseOption } from "@/pages/RedTeam";
import type { VideoOverlay } from "@/components/redteam/InjectOverlay";
import pharmacoreVideo from "@/assets/demo_video_pharmacore.mp4.asset.json";
import trustinsureVideo from "@/assets/demo_video_trustinsure.mp4.asset.json";
import newsTonightVideo from "@/assets/demo_reporter_news_tonight.mp4.asset.json";
import cbbnVideo from "@/assets/demo_reporter_cbbn.mp4.asset.json";
import newsTonightVoVideo from "@/assets/news_tonight_pharmacore_broll.mp4.asset.json";
import womanAvatar from "@/assets/avatar_pharma_woman.jpg";
import youngMumAvatar from "@/assets/avatar_young_mum.jpg";
import pigeebankVideo from "@/assets/demo_video_pigeebank.mp4.asset.json";

type Opt = [label: string, description: string, type: ResponseOption["type"], effectiveness: number, risk: ResponseOption["riskLevel"], time: number];
type Spec = {
  t: number; type: Inject["type"]; source: string; reach: number;
  sentiment: Inject["sentiment"]; content: string; options: Opt[];
  video?: { url: string; overlay: VideoOverlay };
  visual?: Inject["visual"];
  reply?: Inject["reply"];
  hideCaption?: boolean;
};

const build = (prefix: string, specs: Spec[]): Inject[] =>
  [...specs].sort((a, b) => a.t - b.t).map((s, i) => ({
    id: `${prefix}-${i + 1}`,
    timestamp: s.t,
    type: s.type,
    source: s.source,
    reach: s.reach,
    sentiment: s.sentiment,
    content: s.content,
    requiresResponse: true,
    ...(s.video ? { demoVideo: s.video } : {}),
    ...(s.visual ? { visual: s.visual } : {}),
    ...(s.reply ? { reply: s.reply } : {}),
    ...(s.hideCaption ? { hideCaption: true } : {}),
    isAggressive: s.sentiment === "hostile",
    responseOptions: s.options.map(([label, description, type, effectiveness, riskLevel, timeToExecute], j) => ({
      id: `${prefix}-${i + 1}${"abc"[j]}`, label, description, type, effectiveness, riskLevel, timeToExecute,
    })),
  }));

const DEMO_INJECTS: Record<string, Inject[]> = {
  "ashworth-reilly": build("pc", [
    { t: 75, type: "social_post", source: "Sheffield Parents Network · Community page", reach: 22000, sentiment: "hostile",
      visual: { template: "facebook", label: "Community page · 22k members", data: { pageName: "Sheffield Parents Network", groupLabel: "Private group · 22K members", author: "Kerry Walsh", avatarUrl: youngMumAvatar, timestamp: "18m", body: "PLEASE SHARE 🙏 My friend's a nurse at the Children's and says they've had 3 kids in with reactions to Pharmacore amoxicillin. Check your bottles!!", reactions: "1.4K", comments: "612", shares: "2.3K", topComment: { author: "Dan R", text: "Just binned ours. Not risking it." } } },
      content: "A local parents' group post claiming nurses have seen reactions to Pharmacore amoxicillin is being shared thousands of times.",
      options: [
        ["Ask admins to pin facts", "Send group admins the verified batch checker and GP advice to pin.", "social_response", 82, "low", 30],
        ["Paid local ads", "Run geo-targeted 'check the facts' ads in Sheffield.", "social_response", 60, "medium", 30],
        ["Report group to the platform", "Ask the platform to remove the post as health misinformation.", "internal_action", 40, "medium", 15],
      ] },
    { t: 195, type: "amplification", source: "Network analysis · Tweets & Community pages", reach: 95000, sentiment: "hostile",
      content: "320 new accounts posted the same 'Pharmacore knew' wording in 40 minutes. Most were created this month.",
      options: [
        ["Publish the pattern", "Share evidence of the coordinated accounts with health journalists.", "media_outreach", 82, "medium", 45],
        ["Report to platforms", "Send the account list to the platforms' trust & safety teams.", "internal_action", 75, "low", 20],
        ["Reply to every account", "Get the social team to answer each post individually.", "social_response", 20, "high", 30],
      ] },
    { t: 345, type: "social_post", source: "r/NHS · Reddit", reach: 41000, sentiment: "confused",
      visual: { template: "forum", label: "Reddit thread", data: { subreddit: "r/NHS", title: "Anyone actually seen this MHRA amoxicillin recall?", author: "u/ward_pharm_22", flair: "Pharmacy", score: "2.8k", body: "Getting calls all morning. Can't find it on the MHRA site. Is this real or another WhatsApp hoax?", topComment: { author: "u/locum_gp", text: "Not on the MHRA alerts page. Looks fake but patients are panicking.", score: "1.1k" } } },
      content: "Pharmacy staff on Reddit are asking whether the recall is real — a chance to point them to official sources.",
      options: [
        ["Join with verified account", "Post a clear reply linking the real MHRA alerts page.", "social_response", 85, "low", 20],
        ["Brief pharmacy bodies", "Ask the pharmacy trade body to post a confirmation.", "media_outreach", 80, "low", 30],
        ["Stay out of Reddit", "Leave the thread alone.", "internal_action", 30, "medium", 10],
      ] },
    { t: 495, type: "social_post", source: "Health commentator · LinkedIn", reach: 60000, sentiment: "confused",
      visual: { template: "professional", label: "LinkedIn post", data: { name: "Dr Martin Hale", title: "Former NHS medicines adviser", timestamp: "35m", body: "Whatever the truth about Pharmacore, the silence is the story. Distributors must publish cold-chain data within hours, not days.", reactions: "3,204", comments: "418", reposts: "260" } },
      content: "A respected former NHS adviser says Pharmacore's silence is the story.",
      options: [
        ["Share the data with him", "Send him the full cold-chain logs and invite a follow-up post.", "media_outreach", 85, "low", 30],
        ["Comment publicly", "Reply under his post with the data link.", "social_response", 72, "low", 15],
        ["Ask him to delete", "Message him saying the post is damaging.", "legal", 20, "high", 10],
      ] },
    { t: 30, type: "social_post", source: "@UK_PharmaWatch (3.2k followers) · Tweets", reach: 3200, sentiment: "hostile",
      reply: { template: "social-dark", label: "Reply", data: { displayName: "TruthUKAlliance", handle: "@TruthUKAlliance", timestamp: "4m", body: "UNVERIFIED: Pharmacore's Doncaster hub had a cold-chain breach and still shipped amoxicillin. Three children in Sheffield hospital. Why no MHRA alert? #DrugSafety #pharmacoreknew", comments: "12", reposts: "27", likes: "367", bookmarks: "9" } },
      content: "UNVERIFIED: Pharmacore's Doncaster hub had a cold-chain breach and still shipped amoxicillin. Three children in Sheffield hospital. Why no MHRA alert? #DrugSafety #pharmacoreknew",
      options: [
        ["Truth-sandwich holding line", "Share unbroken 2–8°C hub logs, say you're monitoring, give chemists a contact line.", "statement", 85, "low", 30],
        ["Brief pharmacy network", "Batch-verification memo to community pharmacies before consumer press picks it up.", "internal_action", 80, "low", 45],
        ["Flat denial + legal warning", "Reply in Tweets: '100% false and malicious, lawyers are watching.'", "legal", 30, "high", 15],
      ] },
    { t: 120, type: "influencer", source: "Parent creator · TikTok · 180k views #RecallTheMeds", reach: 180000, sentiment: "hostile",
      video: { url: pharmacoreVideo.url, overlay: { platform: "tiktok", handle: "@sheffieldmum_jo", caption: "Pharmacore knew. Check your kids' meds 😡 #RecallTheMeds", likes: "24.6K", comments: "3.1K", shares: "8.9K", views: "180K", channel: "", headline: "", ticker: "" } },
      hideCaption: true,
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
    { t: 420, type: "news_article", source: "News Tonight · Breaking alert", reach: 2000000, sentiment: "confused",
      hideCaption: true,
      video: { url: newsTonightVoVideo.url, overlay: { platform: "news", handle: "", caption: "", likes: "", comments: "", shares: "", views: "", channel: "NEWS TONIGHT", headline: "Pharmacore antibiotic contamination claims", ticker: "Regulator yet to confirm any recall · Parents urged to check official sources" } },
      content: "BREAKING: Health officials investigate distribution giant Pharmacore after nationwide antibiotic contamination reports.",
      options: [
        ["Live broadcast interview", "Put Priya Khatri (Regulatory Director) on News Tonight within 15 minutes.", "media_outreach", 80, "high", 60],
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
    { t: 390, type: "news_article", source: "TalkUK · Live radio phone-in", reach: 650000, sentiment: "hostile",
      hideCaption: true,
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "The Midday Debate", presenter: "Marcus Vance", intro: "Lines are jammed this lunchtime. Pharmacore says its antibiotics are safe, but parents aren't buying it. Is this a cover-up? Let's go to the phones.", callers: [
          { name: "Kerry", location: "Sheffield", text: "I've binned my daughter's medicine. Nobody from Pharmacore has told us a thing. Why are they hiding?" },
          { name: "Dave", location: "Doncaster", text: "My cousin works at that depot. He says the fridges went off for hours. They knew!" },
          { name: "Linda", location: "Leeds", text: "If it was safe, why is everyone online saying it isn't? Somebody should go to prison for this." },
      ] } },
      content: "TalkUK phone-in: The Midday Debate. Angry callers repeat the claims live on air.",
      options: [
        ["Put a spokesperson on air", "Priya Khatri calls in live with the batch checker and MHRA position.", "media_outreach", 82, "medium", 30],
        ["Send the producer facts", "Email TalkUK's producer a short verified factsheet to read out.", "statement", 72, "low", 20],
        ["Complain to the station", "Ask TalkUK to stop taking calls on the story.", "legal", 15, "high", 15],
      ] },
  ]),
  "meridian-vale": build("ti", [
    { t: 90, type: "social_post", source: "Flood Victims UK · Community page", reach: 48000, sentiment: "hostile",
      visual: { template: "facebook", label: "Community page · 48k followers", data: { pageName: "Flood Victims UK", groupLabel: "Community page", author: "Flood Victims UK", timestamp: "1h", body: "Their CEO SAID IT. 'People will simply have to wait.' 6 months on, still no payout for our members. Share if TrustInsureUK let you down 👇", reactions: "5.2K", comments: "1.9K", shares: "3.4K", topComment: { author: "Mel Jones", text: "Same here, still waiting since March." } } },
      content: "A flood victims' page is sharing the cut CEO clip and collecting complaints.",
      options: [
        ["Offer a direct case line", "Post a named contact for anyone waiting on a flood claim.", "social_response", 85, "low", 30],
        ["Share the full clip", "Comment with the unedited footage and context.", "social_response", 75, "low", 15],
        ["Report the page", "Ask the platform to remove the clip as manipulated media.", "internal_action", 40, "medium", 15],
      ] },
    { t: 225, type: "social_post", source: "Trustpilot · review spike", reach: 30000, sentiment: "hostile",
      visual: { template: "reviews", label: "Trustpilot · last hour", data: { businessName: "TrustInsureUK PLC", overallRating: 1.6, totalReviews: "4,118", reviews: [ { author: "J. Patel", date: "12 min ago", rating: 1, text: "Watched the CEO video. Cancelling today." }, { author: "Sam K", date: "20 min ago", rating: 1, text: "Never had a claim but not waiting to find out." }, { author: "R. Ellis", date: "31 min ago", rating: 1, text: "Disgusting attitude to customers." } ] } },
      content: "Dozens of 1-star reviews mention the video — most from people who have never claimed.",
      options: [
        ["Reply with real payout data", "Respond publicly with verified claims stats and a helpline.", "social_response", 80, "low", 30],
        ["Flag review spike", "Ask Trustpilot to review the unusual surge.", "internal_action", 70, "low", 15],
        ["Offer vouchers", "Offer reviewers a discount to remove reviews.", "statement", 10, "high", 20],
      ] },
    { t: 375, type: "news_article", source: "News Tonight · Online", reach: 300000, sentiment: "confused",
      visual: { template: "news-comments", label: "News Tonight · reader comments", data: { headline: "TrustInsureUK boss in 'claims can wait' row — insurer says clip was edited", commentCount: "842", comments: [ { username: "sceptic_steve", timestamp: "5m", text: "Edited or not, they all delay payouts." }, { username: "clare_m", timestamp: "9m", text: "Has anyone actually seen the full video?" } ] } },
      content: "A consumer news site has run the story — readers are split on whether the clip was edited.",
      options: [
        ["Give the full clip to the editor", "Ask for the unedited footage to be embedded in the article.", "media_outreach", 85, "low", 30],
        ["Request a correction", "Ask the outlet to add 'clip was edited' to the headline.", "media_outreach", 72, "low", 20],
        ["Ignore the comments", "Let the debate run its course.", "internal_action", 30, "medium", 10],
      ] },
    { t: 520, type: "social_post", source: "Insurance Staff Chat · WhatsApp", reach: 900, sentiment: "confused",
      visual: { template: "messaging", label: "Staff WhatsApp · leaked", data: { groupName: "Claims Team Leeds 🏠", messages: [ { sender: "Becky", text: "Customers asking if the FCA letter is real?? What do we say", timestamp: "10:42", color: "#c2185b" }, { sender: "Tom", text: "No idea, nobody's told us anything", timestamp: "10:43", color: "#1565c0" } ] } },
      content: "Your own claims staff don't know what to tell customers.",
      options: [
        ["Staff briefing now", "Send a short Q&A to all front-line teams within 10 minutes.", "internal_action", 88, "low", 20],
        ["Manager huddles", "Ask team leaders to brief staff verbally.", "internal_action", 70, "low", 30],
        ["Ban phones on the floor", "Stop staff discussing it in chats.", "internal_action", 15, "high", 10],
      ] },
    { t: 30, type: "social_post", source: "Tweets / Reddit · 12k reposts", reach: 120000, sentiment: "hostile",
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
    { t: 400, type: "news_article", source: "TalkUK · Live radio phone-in", reach: 650000, sentiment: "hostile",
      hideCaption: true,
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "Your Money, Your Say", presenter: "Gemma Hollis", intro: "TalkUK lines are open. A clip is going round of TrustInsureUK's boss apparently laughing about rejecting claims. Is your insurer on your side? Call us.", callers: [
          { name: "Gary", location: "Bolton", text: "I've paid them twelve years. After that video I'm cancelling today." },
          { name: "Asha", location: "Croydon", text: "My claim was refused last month. Now I know why. It's a policy to say no!" },
          { name: "Pete", location: "Cardiff", text: "They should have to show the full video. If they won't, it's true." },
      ] } },
      content: "TalkUK phone-in: Your Money, Your Say. Angry callers repeat the claims live on air.",
      options: [
        ["Share the full unedited clip", "Give TalkUK the original recording showing the edit.", "media_outreach", 84, "low", 30],
        ["CEO calls in live", "Thomas Reeve goes on air to answer callers directly.", "media_outreach", 70, "high", 30],
        ["Say nothing", "Wait for the phone-in to end.", "internal_action", 15, "high", 10],
      ] },
  ]),
  "bristow-calder": build("pb", [
    { t: 90, type: "social_post", source: "Telegram · UK Money Moves (18k)", reach: 18000, sentiment: "hostile",
      visual: { template: "messaging", label: "Telegram channel", data: { groupName: "UK Money Moves 💷 · 18,204 subscribers", messages: [ { sender: "Admin", text: "⚠️ PigeeBank withdrawals limited from tonight. Move savings NOW. Forward to family.", timestamp: "21:04", color: "#c62828" }, { sender: "Jas", text: "Just tried, took ages. It's happening 😱", timestamp: "21:06", color: "#2e7d32" } ] } },
      content: "A money-tips Telegram channel is telling people to move their savings tonight.",
      options: [
        ["In-app confirmation", "Show every customer a banner: withdrawals are working normally.", "social_response", 85, "low", 20],
        ["Report the channel", "Report the channel to Telegram as financial scam content.", "internal_action", 55, "low", 15],
        ["Raise withdrawal limits", "Temporarily increase limits to 'prove' money is there.", "internal_action", 35, "high", 20],
      ] },
    { t: 225, type: "social_post", source: "Savers Club UK · Community page", reach: 64000, sentiment: "hostile",
      visual: { template: "facebook", label: "Community page · 64k members", data: { pageName: "Savers Club UK", groupLabel: "Public group · 64K members", author: "Gary Whitfield", timestamp: "22m", body: "Moved my £12k out of PigeeBank this morning. Better safe than sorry with this IPO stuff. Anyone else?", reactions: "2.1K", comments: "940", shares: "780", topComment: { author: "Linda P", text: "Doing mine now. FSCS takes months to pay out." } } },
      content: "A big savers' group is swapping stories about pulling money out — and a false claim that FSCS is slow.",
      options: [
        ["Explain FSCS clearly", "Post a plain guide: £85k protected, paid in days not months.", "social_response", 85, "low", 30],
        ["Ask a money expert", "Get a trusted personal-finance voice to post the facts.", "media_outreach", 82, "low", 45],
        ["Message group admin", "Ask the admin to delete the thread.", "internal_action", 25, "medium", 15],
      ] },
    { t: 375, type: "social_post", source: "App Store reviews · last 2 hours", reach: 25000, sentiment: "hostile",
      visual: { template: "reviews", label: "App Store · last 2 hours", data: { businessName: "PigeeBank! — Mobile Banking", overallRating: 2.1, totalReviews: "9,560", reviews: [ { author: "harry_b", date: "30 min ago", rating: 1, text: "Heard they're freezing accounts. Deleting." }, { author: "nadia.k", date: "1 hr ago", rating: 1, text: "Transfer slow tonight, scary timing." } ] } },
      content: "App ratings are dropping as panic spreads — some reviews mention slow transfers.",
      options: [
        ["Reply with live status", "Respond with the live payments status page.", "social_response", 80, "low", 20],
        ["Prioritise support", "Move staff to clear the transfer queue fast.", "internal_action", 82, "low", 30],
        ["Hide reviews", "Ask Apple to remove 'unfair' reviews.", "internal_action", 20, "high", 15],
      ] },
    { t: 520, type: "social_post", source: "Fintech journalist · Tweets", reach: 150000, sentiment: "confused",
      visual: { template: "social-dark", label: "Tweets", data: { displayName: "Ellie Marsh", handle: "@elliemarsh_fin", verified: true, timestamp: "14m", body: "I've seen no evidence PigeeBank is restricting withdrawals. But the bank needs to publish numbers, not vibes. Asked them for data.", comments: "312", reposts: "1.2K", likes: "4.8K", bookmarks: "290" } },
      content: "A respected fintech journalist sees no evidence of a problem — but wants numbers.",
      options: [
        ["Send her the data", "Give her live withdrawal and deposit figures on the record.", "media_outreach", 88, "low", 30],
        ["Founder replies", "Alex Bryce quote-posts with a short reassurance.", "social_response", 65, "medium", 15],
        ["Decline to comment", "Say the bank won't comment on rumours.", "statement", 20, "high", 10],
      ] },
    { t: 30, type: "social_post", source: "Reddit r/UKPersonalFinance & Tweets", reach: 80000, sentiment: "hostile",
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
    { t: 450, type: "news_article", source: "CBBN · Live business desk", reach: 900000, sentiment: "confused",
      video: { url: cbbnVideo.url, overlay: { platform: "news", handle: "", caption: "", likes: "", comments: "", shares: "", views: "", channel: "CBBN", headline: "PigeeBank IPO under pressure", ticker: "Withdrawal rumours spread on Telegram · Bank yet to publish outflow data" } },
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
    { t: 400, type: "news_article", source: "TalkUK · Live radio phone-in", reach: 650000, sentiment: "hostile",
      hideCaption: true,
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "Drive Time Phones", presenter: "Rob Keane", intro: "Talk of a run on PigeeBank this evening. People say they can't get their money out. Is your money safe? Phone lines are open.", callers: [
          { name: "Jade", location: "Manchester", text: "My mate's transfer bounced so I've moved everything out. Not waiting to find out." },
          { name: "Simon", location: "Reading", text: "No proper bank has to keep saying it's fine. That's what Northern Rock said." },
          { name: "Mo", location: "Glasgow", text: "I'm queuing on the app now. Everyone I know is doing the same." },
      ] } },
      content: "TalkUK phone-in: Drive Time Phones. Angry callers repeat the claims live on air.",
      options: [
        ["Explain FSCS on air", "A spokesperson explains the £85,000 protection and live payment data.", "media_outreach", 84, "low", 30],
        ["Push a calm app alert", "Message customers with how to check payments are working.", "social_response", 76, "low", 20],
        ["Raise withdrawal limits", "Announce limits to slow outflows.", "internal_action", 10, "high", 15],
      ] },
  ]),
};

export function getDemoInjects(companyId?: string): Inject[] | undefined {
  const list = companyId ? DEMO_INJECTS[companyId] : undefined;
  return list?.map((i) => ({ ...i, responseOptions: i.responseOptions?.map((o) => ({ ...o })) }));
}
