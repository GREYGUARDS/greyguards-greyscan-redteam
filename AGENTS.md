# Architecture rules

- Hosted video generation uses server-authorised asynchronous jobs with private storage and durable inject references; this keeps paid generation host-only and playback session-scoped.
- Publish video injects only after host review through the video endpoint; this prevents incomplete footage from starting participant response timers.
- Hosted social and website artefacts use structured AI output rendered as text, never executable HTML, and are sent through the same session inject feed; this keeps previews safe and delivery consistent.- Hosted observers join as team_type "observer" (one row per user) and are read-only, enforced by the response insert policy; this keeps watchers from affecting scores.
- Red team adds text-only injects and fires them via the red_fire_inject RPC; visuals go through red_visual_requests and only the host's reviewed "Return to Red" creates the media inject, so Red never triggers paid generation or unreviewed media.
