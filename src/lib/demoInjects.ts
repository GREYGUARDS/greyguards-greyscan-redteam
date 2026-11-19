/**
 * Scripted, phone-first injects for the three public demo scenarios.
 * Scripted copy: 10 short injects per demo across Tweets, TikTok, Community pages, Reddit, Telegram, reviews, radio phone-ins and news. Fictional only.
 */
import type { Inject, ResponseOption } from "@/pages/RedTeam";
import type { VideoOverlay } from "@/components/redteam/InjectOverlay";
import mumCarVideo from "@/assets/demo_video_pharmacore.mp4.asset.json";
import fireVideo from "@/assets/trustinsure_firefighter_reaction.mp4.asset.json";
import rentVideo from "@/assets/pigeebank_rent_street_reaction.mp4.asset.json";
import pharmacoreVideo from "@/assets/pharmacore_greenscreen_opening.mp4.asset.json";
import trustinsureVideo from "@/assets/trustinsure_truth_desk_opening.mp4.asset.json";
import newsTonightVideo from "@/assets/demo_reporter_news_tonight.mp4.asset.json";
import cbbnVideo from "@/assets/demo_reporter_cbbn.mp4.asset.json";
import newsTonightVoVideo from "@/assets/news_tonight_pharmacore_uk.mp4.asset.json";
import newsTonightTrustVideo from "@/assets/news_tonight_trustinsure_uk.mp4.asset.json";
import womanAvatar from "@/assets/avatar_pharma_woman.jpg";
import youngMumAvatar from "@/assets/avatar_young_mum.jpg";
import cbbnPigeeVo from "@/assets/cbbn_pigeebank_female_uk.mp4.asset.json";
import radioPigeebank from "@/assets/radio_pigeebank.mp3.asset.json";
import radioTrustinsure from "@/assets/radio_trustinsure.mp3.asset.json";
import radioPharmacoreUk from "@/assets/radio_pharmacore_british.mp3.asset.json";
import whisperImage from "@/assets/pb_whisper_silhouette.jpg";
import suitManAvatar from "@/assets/avatar_suit_man.jpg";
import floodedDoorImage from "@/assets/ti_flooded_front_door.jpg";
import pigeebankVideo from "@/assets/pigeebank_dim_studio_opening.mp4.asset.json";

type Opt = [label: string, description: string, type: ResponseOption["type"], effectiveness: number, risk: ResponseOption["riskLevel"], time: number];
type Spec = {
  t: number; type: Inject["type"]; source: string; reach: number;
  sentiment: Inject["sentiment"]; content: string; options: Opt[];
  video?: { url: string; overlay: VideoOverlay };
  visual?: Inject["visual"];
  reply?: Inject["reply"];
  image?: Inject["image"];
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
    ...(s.image ? { image: s.image } : {}),
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
    { t: 195, type: "influencer", source: "@sheffieldmum_jo · TikTok · 48K views", reach: 48000, sentiment: "hostile",
      video: { url: mumCarVideo.url, overlay: { platform: "tiktok", handle: "@sheffieldmum_jo", caption: "Pharmacore knew. Check your kids' meds 😢 #PharmacoreKnew", likes: "3.9K", comments: "720", shares: "1.1K", views: "48K", channel: "", headline: "", ticker: "" } },
      content: "GROWING CONCERN: A Sheffield mum says her four-year-old was prescribed the 'recalled' amoxicillin and accuses Pharmacore of hiding it. The false claim is now driving real parents to bin medicine.",
      options: [
        ["Rapid video response", "Julian Mercer (MD) speaks to parents directly with a batch-checker link.", "social_response", 85, "medium", 60],
        ["Pharmacy talking points", "Give chemists a script for anxious parents collecting prescriptions.", "internal_action", 80, "low", 30],
        ["Legal takedown request", "Send defamation notices to get the video removed.", "legal", 25, "high", 15],
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
    { t: 60, type: "social_post", source: "@UK_PharmaWatch (3.2k followers) · Tweets", reach: 3200, sentiment: "hostile",
      reply: { template: "social-dark", label: "Reply", data: { displayName: "TruthUKAlliance", handle: "@TruthUKAlliance", timestamp: "4m", body: "UNVERIFIED: Pharmacore's Doncaster hub had a cold-chain breach and still shipped amoxicillin. Three children in Sheffield hospital. Why no MHRA alert? #DrugSafety #pharmacoreknew", comments: "12", reposts: "27", likes: "367", bookmarks: "9" } },
      content: "Coordinated accounts repost the opening video's forged depot log: 'Pharmacore knew. They shipped children's amoxicillin anyway.' The same crop spreads into parent groups under #PharmacoreKnew.",
      options: [
        ["Truth-sandwich holding line", "Share unbroken 2–8°C hub logs, say you're monitoring, give chemists a contact line.", "statement", 85, "low", 30],
        ["Brief pharmacy network", "Batch-verification memo to community pharmacies before consumer press picks it up.", "internal_action", 80, "low", 45],
        ["Flat denial + legal warning", "Reply in Tweets: '100% false and malicious, lawyers are watching.'", "legal", 30, "high", 15],
      ] },
    { t: 15, type: "influencer", source: "@PharmaExposedUK · TikTok green-screen · 30K views · new sock-puppet account", reach: 30000, sentiment: "hostile",
      video: { url: pharmacoreVideo.url, overlay: { platform: "tiktok", handle: "@PharmaExposedUK", caption: "MHRA = the UK medicines regulator. #PharmacoreKnew", likes: "2.4K", comments: "380", shares: "650", views: "30K", channel: "", headline: "", ticker: "" } },
      content: "DELIBERATE DISINFORMATION: A viral TikTok claims Pharmacore knowingly shipped children's amoxicillin from its Doncaster depot after a fridge failure. It uses a forged 'RECALL WAIVER' depot log and tags the MHRA (the UK medicines regulator) to demand a recall.",
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
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "The Midday Debate", audioUrl: radioPharmacoreUk.url, script: [{"who": -1, "start": 0.0, "text": "Good afternoon, it's twelve minutes past one, this is The Midday Debate on TalkUK, I'm Geoff Pennington. Now, the lines have been jammed all morning. Pharmacore says its children's antibiotics are perfectly safe. A lot of you aren't buying it. Cover-up, or something else? Sharon's in Sheffield. Sharon, go ahead."}, {"who": 0, "start": 21.49, "text": "Geoff, I've binned it. My daughter's medicine, straight in the bin. Nobody from Pharmacore has told us a single thing. Not a word. Why are they hiding?"}, {"who": -1, "start": 33.66, "text": "Sharon, have you spoken to your pharmacist? Did they say there's an actual recall?"}, {"who": 0, "start": 39.83, "text": "They said they've not heard anything official. But that's the point, isn't it? It's all over my feed. Three kids in hospital. You don't make that up."}, {"who": -1, "start": 50.2, "text": "Thank you Sharon. Barry in Doncaster, you say you've got inside information?"}, {"who": 1, "start": 56.81, "text": "Aye, my cousin works at that depot. He reckons the fridges went off for hours. Hours, Geoff. And they still sent the stuff out. They knew."}, {"who": -1, "start": 67.74, "text": "Barry, has your cousin actually seen that himself, or is that what he's heard?"}, {"who": 1, "start": 72.99, "text": "Well, it's what everyone's saying down there. No smoke without fire, is there?"}, {"who": -1, "start": 78.68, "text": "Maureen in Leeds, quickly Maureen."}, {"who": 2, "start": 81.89, "text": "If it was safe, Geoff, why is everyone online saying it isn't? Somebody should go to prison for this. Where's the boss? Why isn't he on your show?"}, {"who": -1, "start": 93.58, "text": "That's the question, isn't it. Pharmacore, if you're listening, the lines are open. Stay with us, more after the news."}], presenter: "Geoff Pennington", intro: "Lines are jammed this lunchtime. Pharmacore says its antibiotics are safe, but parents aren't buying it. Is this a cover-up? Let's go to the phones.", callers: [
          { name: "Sharon", location: "Sheffield", text: "I've binned my daughter's medicine. Nobody from Pharmacore has told us a thing. Why are they hiding?" },
          { name: "Barry", location: "Doncaster", text: "My cousin works at that depot. He says the fridges went off for hours. They knew!" },
          { name: "Maureen", location: "Leeds", text: "If it was safe, why is everyone online saying it isn't? Somebody should go to prison for this." },
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
      image: { url: floodedDoorImage, alt: "Flooded front door of a terraced house (fictional illustration)" },
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
    { t: 60, type: "amplification", source: "Tweets / Reddit · 12k reposts in 1 hour", reach: 120000, sentiment: "hostile",
      content: "Coordinated accounts repost the opening video's manipulated Thomas Reeve clip and fake claims-freeze matrix: 'People will simply have to wait.' Identical cancellation messages flood review sites before renewal week.",
      options: [
        ["Post the unedited footage", "Side-by-side video proving the quote was cut mid-sentence.", "social_response", 88, "low", 30],
        ["Executive clarification", "Written statement explaining the full context.", "statement", 62, "low", 30],
        ["Demand platform takedown", "File an immediate copyright notice against the account.", "legal", 30, "high", 15],
      ] },
    { t: 15, type: "influencer", source: "@moneyrights_dan · TikTok · 32K views", reach: 32000, sentiment: "hostile",
      video: { url: trustinsureVideo.url, overlay: { platform: "tiktok", handle: "@moneyrights_dan", caption: "Switch NOW before renewals ⚠️ #TrustInsureScandal", likes: "2.8K", comments: "420", shares: "790", views: "32K", channel: "", headline: "", ticker: "" } },
      content: "DELIBERATE DISINFORMATION: A viral video claims TrustInsureUK has frozen all flood payouts before renewals. It spreads a maliciously cut clip of CEO Thomas Reeve saying 'People will simply have to wait' and urges customers to cancel.",
      options: [
        ["Brief the advocate directly", "Share verified claim audit data with the consumer champion.", "media_outreach", 85, "low", 60],
        ["Renewal reassurance email", "Guarantee to everyone renewing this week.", "statement", 78, "low", 30],
        ["Threaten defamation", "Legal warning letter to the influencer's agency.", "legal", 15, "high", 20],
      ] },
    { t: 300, type: "influencer", source: "@firefighter_matt · TikTok · 41K views", reach: 41000, sentiment: "hostile",
      video: { url: fireVideo.url, overlay: { platform: "tiktok", handle: "@firefighter_matt", caption: "Pumping out homes all week. Now this?? #TrustInsureScandal", likes: "3.4K", comments: "610", shares: "980", views: "41K", channel: "", headline: "", ticker: "" } },
      content: "GROWING CONCERN: A trusted local firefighter repeats the false claim that TrustInsureUK has frozen all flood payouts, citing his own mum's claim. His credibility is pushing the story into flood-hit communities.",
      options: [
        ["Fast-track named claims", "Contact him directly and resolve his family's claim with a public update.", "social_response", 85, "low", 30],
        ["Community claims clinic", "Send claims staff to flood-hit streets with live payout data.", "internal_action", 80, "low", 45],
        ["Ask TikTok to remove it", "Report the video as misleading.", "internal_action", 20, "high", 15],
      ] },
    { t: 450, type: "news_article", source: "News Tonight · Breaking report", reach: 1500000, sentiment: "confused",
      hideCaption: true,
      video: { url: newsTonightTrustVideo.url, overlay: { platform: "news", handle: "", caption: "", likes: "", comments: "", shares: "", views: "", channel: "NEWS TONIGHT", headline: "TrustInsureUK flood claims backlash", ticker: "Insurer says viral CEO clip was edited · Claims still being paid" } },
      content: "BREAKING: National TV picks up the edited CEO clip, reporting that TrustInsureUK is delaying flood claims. The insurer says the video was cut and claims are being paid.",
      options: [
        ["Release the full clip to the newsroom", "Give News Tonight the unedited recording and a claims spokesperson.", "media_outreach", 86, "low", 30],
        ["Written statement", "Short verified statement with payout figures to the news desk.", "statement", 74, "low", 20],
        ["Decline to comment", "Wait until the internal review is complete.", "internal_action", 15, "high", 10],
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
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "Your Money, Your Say", audioUrl: radioTrustinsure.url, script: [{"who": -1, "start": 0, "text": "You're listening to Your Money, Your Say on TalkUK, I'm Gemma Hollis. Now, if you've been online today you'll have seen it. A clip of TrustInsureUK's boss, apparently saying flood claims will simply have to wait. Is your insurer on your side? Gary's in Bolton. Gary."}, {"who": 0, "start": 22.11, "text": "Gemma, twelve years I've paid them. Twelve years. Never missed a payment. I saw that video this morning and I rang up and cancelled. Done."}, {"who": -1, "start": 33.18, "text": "Gary, the company says that clip was edited. Have you seen the full version?"}, {"who": 0, "start": 39.69, "text": "Well they would say that, wouldn't they? It's his face, it's his voice. What more do you want?"}, {"who": -1, "start": 46.04, "text": "Thanks Gary. Asha in Croydon, you had a claim turned down?"}, {"who": 1, "start": 51.83, "text": "Last month. Water came right through my front door, ruined the whole downstairs. They said no. And now I watch this and I think, right, so it's a policy. It's a policy to say no."}, {"who": -1, "start": 63.86, "text": "I'm really sorry to hear that Asha. Did they give you a reason at the time?"}, {"who": 1, "start": 69.89, "text": "Something about the small print. Nobody reads the small print, Gemma. That's the whole point, isn't it?"}, {"who": -1, "start": 76.44, "text": "Pete in Cardiff, you think this is all a bit of a stitch up?"}, {"who": 2, "start": 81.23, "text": "No, no, I'm saying, if it's edited, prove it. Put the full video out. Today. If they won't, then as far as I'm concerned it's true."}, {"who": -1, "start": 92.22, "text": "And that's a challenge for TrustInsureUK. The lines are open, the floor is yours. Back after this."}], presenter: "Gemma Hollis", intro: "TalkUK lines are open. A clip is going round of TrustInsureUK's boss apparently laughing about rejecting claims. Is your insurer on your side? Call us.", callers: [
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
      visual: { template: "facebook", label: "Community page · 64k members", data: { pageName: "Savers Club UK", groupLabel: "Public group · 64K members", author: "Gary Whitfield", avatarUrl: suitManAvatar, timestamp: "22m", body: "Moved my £12k out of PigeeBank this morning. Better safe than sorry with this IPO stuff. Anyone else?", reactions: "2.1K", comments: "940", shares: "780", topComment: { author: "Linda P", text: "Doing mine now. FSCS takes months to pay out." } } },
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
    { t: 60, type: "amplification", source: "Reddit r/UKPersonalFinance & Tweets · coordinated reposts", reach: 80000, sentiment: "hostile",
      image: { url: whisperImage, alt: "Silhouetted figure whispering a rumour (fictional illustration)" },
      content: "Coordinated accounts repost the opening video's doctored £40m treasury spreadsheet into investor forums: 'PigeeBank is throttling payments. Get your cash out before the stock market launch.'",
      options: [
        ["Live status dashboard", "Post the live payments dashboard showing 99.98% processing.", "social_response", 88, "low", 30],
        ["Founder personal post", "Alex Bryce debunks the rumour from his verified account.", "social_response", 65, "medium", 30],
        ["Delete panic posts", "Hide and report posts on the official subreddit.", "internal_action", 20, "high", 15],
      ] },
    { t: 15, type: "influencer", source: "@fintech_sam · TikTok · 29K views", reach: 29000, sentiment: "hostile",
      video: { url: pigeebankVideo.url, overlay: { platform: "tiktok", handle: "@fintech_sam", caption: "PigeeBank blocking withdrawals?? Move your money 🚨 #PigeeBank", likes: "2.1K", comments: "310", shares: "540", views: "29K", channel: "", headline: "", ticker: "" } },
      content: "DELIBERATE DISINFORMATION: A viral TikTok claims PigeeBank is throttling withdrawals to hide a £40m liquidity hole. It uses a doctored treasury spreadsheet and urges savers to pull deposits before the IPO.",
      options: [
        ["Reply with live payments data", "Stitch the video with the live Faster Payments dashboard and a founder clip.", "social_response", 85, "low", 30],
        ["Report coordinated financial harm", "Ask TikTok for urgent review under its financial-scam policy.", "internal_action", 70, "low", 20],
        ["Demand he deletes it", "Legal letter to the creator threatening defamation.", "legal", 15, "high", 15],
      ] },
    { t: 300, type: "influencer", source: "@chloe.rents · TikTok · 37K views", reach: 37000, sentiment: "hostile",
      video: { url: rentVideo.url, overlay: { platform: "tiktok", handle: "@chloe.rents", caption: "Rent bounced. Landlord fuming. Get your money out 😤 #PigeeBank", likes: "2.9K", comments: "540", shares: "860", views: "37K", channel: "", headline: "", ticker: "" } },
      content: "GROWING CONCERN: A young renter blames PigeeBank for a failed rent payment and repeats the false claim that it is blocking withdrawals. Ordinary customers now see the rumour as proof.",
      options: [
        ["Resolve and confirm", "Trace her payment, fix it and confirm publicly with her permission.", "social_response", 85, "low", 30],
        ["Landlord payment guarantee", "Offer written proof-of-transfer to any customer's landlord.", "statement", 80, "low", 30],
        ["Cite her terms", "Reply that delays are covered in the account terms.", "statement", 15, "high", 10],
      ] },
    { t: 450, type: "news_article", source: "CBBN · Live business desk", reach: 900000, sentiment: "confused",
      hideCaption: true,
      video: { url: cbbnPigeeVo.url, overlay: { platform: "news", handle: "", caption: "", likes: "", comments: "", shares: "", views: "", channel: "CBBN", headline: "PigeeBank IPO under pressure", ticker: "Withdrawal rumours spread on Telegram · Bank yet to publish outflow data" } },
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
      visual: { template: "radio", label: "TalkUK · Live phone-in", data: { station: "TalkUK", show: "Drive Time Phones", audioUrl: radioPigeebank.url, script: [{"who": -1, "start": 0, "text": "Good evening, it's ten past six, this is Drive Time Phones on TalkUK with me, Rob Keane. Now, all afternoon my inbox has been full of one name. PigeeBank. People saying they can't get their money out. Is your money safe? Lines are open. Jade's in Manchester. Jade, go ahead."}, {"who": 0, "start": 21.83, "text": "Hiya Rob. Look, my mate tried to send her rent this afternoon and it just bounced. Bounced! So I've moved everything out. Every penny. I'm not waiting around to find out."}, {"who": -1, "start": 34.42, "text": "But Jade, did the bank actually tell her anything? Could it just have been a glitch?"}, {"who": 0, "start": 40.41, "text": "A glitch? The week before their big stock market launch? Come on, Rob. Nobody believes that."}, {"who": -1, "start": 48.24, "text": "Okay, thank you Jade. Simon in Reading, you've been holding. Simon."}, {"who": 1, "start": 54.31, "text": "Rob, I'm old enough to remember Northern Rock. Proper banks don't have to keep going on social media saying, it's fine, it's fine. That is exactly what they said back then."}, {"who": -1, "start": 65.34, "text": "To be fair Simon, your savings are protected up to eighty five thousand pounds. Doesn't that reassure you?"}, {"who": 1, "start": 73.29, "text": "And how long does that take to pay out? Months! I can't wait months for my own money. Somebody needs to tell us the actual numbers."}, {"who": -1, "start": 81.32, "text": "Well that's a fair point, and we have asked PigeeBank to come on. Mo, in Glasgow. Quickly Mo."}, {"who": 2, "start": 88.47, "text": "Aye Rob, I'm sat in the app right now trying to move it. Everyone at my work's doing the same. If it's all fine, where are they? Why are they not on your show?"}, {"who": -1, "start": 97.94, "text": "That's the question, isn't it. PigeeBank, if you're listening, the phone lines are open. We'll be right back after the news."}], presenter: "Rob Keane", intro: "Talk of a run on PigeeBank this evening. People say they can't get their money out. Is your money safe? Phone lines are open.", callers: [
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
