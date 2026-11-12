import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
const fields = z.object({ sessionId: z.string().uuid(), teamId: z.string().uuid() });
const MAX_BYTES = 4 * 1024 * 1024;

// Blue Team room audio: consented, opt-in per session. Raw audio is transcribed and discarded; only text is kept for the host.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
  try {
    const authorization = req.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return reply({ error: 'Sign in to continue.' }, 401);
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: auth } = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '').auth.getUser(authorization.slice(7));
    if (!auth?.user) return reply({ error: 'Sign in to continue.' }, 401);
    const form = await req.formData().catch(() => null);
    if (!form) return reply({ error: 'Send audio as form data.' }, 400);
    const parsed = fields.safeParse({ sessionId: form.get('sessionId'), teamId: form.get('teamId') });
    const file = form.get('file');
    if (!parsed.success || !(file instanceof File)) return reply({ error: 'Check your request fields.' }, 400);
    if (!file.size || file.size > MAX_BYTES || !file.type.startsWith('audio/')) return reply({ error: 'Invalid audio clip.' }, 400);
    const { data: team } = await service.from('exercise_teams').select('id, session_id, team_type, user_id').eq('id', parsed.data.teamId).maybeSingle();
    if (!team || team.session_id !== parsed.data.sessionId || team.team_type !== 'blue' || team.user_id !== auth.user.id) return reply({ error: 'Not your team seat.' }, 403);
    const { data: session } = await service.from('exercise_sessions').select('status, room_audio_enabled').eq('id', team.session_id).maybeSingle();
    if (!session?.room_audio_enabled) return reply({ error: 'Room audio is off for this session.' }, 403);
    if (!['active', 'paused'].includes(session.status)) return reply({ skipped: true });
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return reply({ error: 'AI is not configured.' }, 500);
    const body = new FormData();
    body.append('model', 'openai/gpt-transcribe');
    body.append('file', file, file.name || 'room.webm');
    body.append('response_format', 'json');
    body.append('language', 'en');
    const r = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body });
    if (!r.ok) {
      console.error('transcription failed', r.status, (await r.text()).slice(0, 300));
      if (r.status === 402) return reply({ error: 'AI credits have run out.', paused: true }, 402);
      if (r.status === 403) return reply({ error: 'Transcription is not available.', paused: true }, 403);
      return reply({ error: 'Transcription failed.' }, r.status === 429 ? 429 : 502);
    }
    const text = String((await r.json())?.text ?? '').trim().slice(0, 4000);
    if (text.length < 3) return reply({ stored: false });
    await service.from('exercise_room_transcripts').insert({ session_id: team.session_id, team_id: team.id, user_id: auth.user.id, transcript: text });
    return reply({ stored: true });
  } catch (e) {
    console.error('room-audio-transcribe failed', e);
    return reply({ error: 'Transcription failed.' }, 500);
  }
});
