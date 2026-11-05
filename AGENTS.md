# Architecture rules

- Hosted video generation uses server-authorised asynchronous jobs with private storage and durable inject references; this keeps paid generation host-only and playback session-scoped.
- Publish video injects only after host review through the video endpoint; this prevents incomplete footage from starting participant response timers.