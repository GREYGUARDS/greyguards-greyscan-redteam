# Hosted Red Team: AI video injects

## Result
Add a **Generate Video** option to Consultant Hosted sessions, so the host can create a fictional influencer speaking to camera without leaving Red Team or uploading files manually.

## Host experience
- Enter the claim or short script and a description of the fictional speaker; use the session's brand and scenario as context.
- Generate one short portrait clip per explicit click, with spoken audio. Start with 8-second clips; these suit a short social-media claim, not a long speech.
- Show generation progress and a clear failure message. Generation typically takes 1–3 minutes, so it must not block the exercise or its clock.
- Preview the completed clip, then select **Send Inject** to deliver it directly to participants. Do not automatically broadcast unreviewed footage.
- Mark footage as fictional exercise material; do not impersonate real influencers or people.

## Cost and limitations
- Each generated clip uses paid AI credits; show a cost notice before generation. No automatic generation or repeated paid attempts.
- Generated dialogue may not reproduce every word perfectly. The host reviews it before sending.
- This feature is for admin hosts only, not public demos or participants.

## Technical details
- Use the available default video model, `google/gemini-omni-1.1-flash`, through server-side AI Gateway job creation and polling.
- Validate inputs and check admin status and session ownership server-side for creation, polling and delivery. Limit clip creation, not routine status polling.
- Store generated MP4s in private Cloud storage immediately on completion. Keep durable storage references on injects and issue authorised playback links for session participants.
- Extend hosted inject creation and participant rendering to support video, while preserving existing text injects and scoring.
- Make completion storage idempotent; expose terminal errors and never silently replace a failed video with a different paid generation.

## Verification
- Test host-only access and session ownership restrictions.
- Generate one short fictional clip, preview it, send it to a hosted session, and confirm a participant can play the stored video with sound.
- Check progress, failure and mobile playback states, and ensure the exercise continues while generation runs.