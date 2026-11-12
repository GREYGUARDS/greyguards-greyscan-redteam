# Architecture rules

- The read-only Master Inject Sandbox is shared by host library and session dashboards, combining canonical demo scripts with owner-scoped durable inject reads and existing participant media renderers; browsing never generates or sends; only an explicit host "Fire live" on an unsent inject in an active session sends via host_fire_prepared_inject, matching the sandpit shelf.
- Public demo playback checkpoints its scenario and progress in sessionStorage, suppresses scroll chaining, and advances canonical scripted injects immediately after decisions; refresh recovery must not restart scoring or trigger AI generation.

- Hosted participant debriefs read durable session decision logs, sent injects and team-keyed responses through existing access controls; shared playbook mapping labels interpretations and never treats host branches as measured causal outcomes.

- Photo generation streams through a host-authorised endpoint and persists completed images in private session-scoped storage; only host-reviewed durable photo references attach to unsent injects, with fictional labels and sent-only participant reads.
- Real-board photo mode snapshots host-recorded session consent on each job and rechecks it before generation or attachment; approved imagery is neutral and permanently labelled, while unapproved jobs use fictional stand-ins.

- Real-company Red Team generation scans a bounded set of GreyScan source feeds server-side, retains citation snapshots, and validates board names and roles against exact excerpts; fictional attack claims remain separate from sourced background and saved sessions retain the research.
- Hosted scenario requests share one builder for named-company research and custom outlines; custom themes use the existing outline API rather than inventing a provider category.

- Host preparation reuses durable exercise sessions in a non-joinable preparing state; completed host-reviewed media is saved as unsent injects and fired through an admin-and-owner-checked RPC so preparation never starts response timers.
- Host direct start reuses the existing session lifecycle, saves the scenario and prepares unsent injects before activating; canonical demos and saved cases can bypass the sandpit without bypassing host review of generated media.
- Private preparation notes live in owner-and-admin-scoped host_session_preparations, not participant-readable session rows; the saved-session library retrieves durable sessions independently of the participant join window.

- Hosted video generation uses server-authorised asynchronous jobs with private storage and durable inject references; this keeps paid generation host-only and playback session-scoped.
- Publish video injects only after host review through the video endpoint; this prevents incomplete footage from starting participant response timers.
- Board-video disclosures are burned into the reviewed clip with a same-origin FFmpeg worker; permanent labelling remains visible outside the app player.
- Hosted social and website artefacts use structured AI output rendered as text, never executable HTML, and are sent through the same session inject feed; this keeps previews safe and delivery consistent.
- Hosted observers join as team_type "observer" with a partial unique index per session/user; blue/red retain one seat per session/type and the response insert policy keeps observers read-only.
- Red team adds text-only injects and fires them via the red_fire_inject RPC; visuals go through red_visual_requests and only the host's reviewed "Return to Red" creates the media inject, so Red never triggers paid generation or unreviewed media.
- Blue vs Red leaderboard scores only fired Red Team injects (Blue earns best response effectiveness, Red the remainder) via one shared scorer so host, Blue and Red always see the same numbers.
- Clients join only the Blue Team by code (enforced server-side); hosts can lock a finished session, which revokes the code and cuts participant read access via is_session_participant.
- Code-only joining uses anonymous auth exclusively for the Red Team participant route; guest profiles never claim brands or host privileges, and seat identity is protected server-side to keep guest access isolated.
- Host AI reaction suggestions read recent team responses server-side via a host-and-owner-checked function and only prefill the Custom draft; nothing is sent without the host.
- Live room intercepts are opt-in per session (host_set_room_audio), require per-device Blue consent, transcribe clips server-side and discard audio; only host-readable text feeds AI suggestions.
