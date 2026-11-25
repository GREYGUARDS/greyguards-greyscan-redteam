export const MAX_PAUSE_MS = 30 * 60_000;
export const MAX_CONTEXT_MS = 10 * 60_000;
export const ROOM_SAMPLE_MS = 15_000;
export const ROOM_REQUEST_LIMIT = 10;
// Gateway diagnostic bodies retained fictional test speech despite provider store:false.
// Keep disabled until end-to-end no-payload retention is independently verified.
export const FORWARD_READ_PRIVACY_VERIFIED = false;

export function forwardReadAllowed(session: { status: string; room_audio_enabled: boolean; forward_read_agreed_at: string | null; forward_read_paused_at: string | null }, now = Date.now(), privacyVerified: boolean = FORWARD_READ_PRIVACY_VERIFIED) {
  if (!privacyVerified) return false;
  if (!session.room_audio_enabled || !session.forward_read_agreed_at) return false;
  if (session.status === 'active') return true;
  return session.status === 'paused' && !!session.forward_read_paused_at && now - Date.parse(session.forward_read_paused_at) < MAX_PAUSE_MS;
}

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
/** Fail closed if any generated field contains a substantial verbatim room phrase. */
export function containsRoomQuote(value: string, room: string) {
  const output = ` ${words(value).join(' ')} `;
  const tokens = words(room);
  const width = Math.min(5, tokens.length);
  if (width < 3) return true;
  for (let i = 0; i <= tokens.length - width; i++) {
    if (output.includes(` ${tokens.slice(i, i + width).join(' ')} `)) return true;
  }
  return false;
}

export const roomFocusLabels = {
  legal: 'Room was weighing legal advice',
  timing: 'Room was weighing when to respond',
  evidence: 'Room was discussing evidence checks',
  messaging: 'Room was discussing public messaging',
  stakeholders: 'Room was discussing stakeholder concerns',
  disagreement: 'Room was weighing different approaches',
  other: 'Room was discussing its next response',
} as const;