import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { generateHostSuggestions, SuggestionFailure } from '../_shared/host-suggestions.ts';
import { forwardReadAllowed, MAX_CONTEXT_MS, FORWARD_READ_PRIVACY_VERIFIED } from '../_shared/forward-read-rules.ts';

const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const fields = z.object({ sessionId: z.string().uuid(), teamId: z.string().uuid(), version: z.string().uuid() });
const MAX_BYTES = 4 * 1024 * 1024;
const sessionFields = 'status, room_audio_enabled, forward_read_agreed_at, forward_read_paused_at, forward_read_version, brand_name, scenario_narrative';

// Request-local only: no cross-request room buffer, durable transcript or raw-text logging.
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return reply({ error: 'Use POST.' }, 405);
  if (!FORWARD_READ_PRIVACY_VERIFIED) return reply({ error: 'Forward Read is unavailable while zero-retention processing is being verified.' }, 503);
  let text = '';
  let poll: ReturnType<typeof setInterval> | undefined;
  const controller = new AbortController();
  const abort = () => controller.abort();
  req.signal.addEventListener('abort', abort, { once: true });
  try {
    const authorization = req.headers.get('Authorization') ?? '';
    if (!authorization.startsWith('Bearer ')) return reply({ error: 'Sign in to continue.' }, 401);
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: auth } = await createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '').auth.getUser(authorization.slice(7));
    if (!auth?.user) return reply({ error: 'Sign in to continue.' }, 401);
    const form = await req.formData().catch(() => null);
    if (!form) return reply({ error: 'Send audio as form data.' }, 400);
    const parsed = fields.safeParse({ sessionId: form.get('sessionId'), teamId: form.get('teamId'), version: form.get('version') });
    const file = form.get('file');
    if (!parsed.success || !(file instanceof File)) return reply({ error: 'Check your request fields.' }, 400);
    if (!file.size || file.size > MAX_BYTES || !file.type.startsWith('audio/')) return reply({ error: 'Invalid audio clip.' }, 400);
    const { sessionId, teamId, version } = parsed.data;
    const { data: team } = await service.from('exercise_teams').select('session_id, team_type, user_id').eq('id', teamId).maybeSingle();
    if (!team || team.session_id !== sessionId || team.team_type !== 'blue' || team.user_id !== auth.user.id) return reply({ error: 'Not your team seat.' }, 403);
    const load = async () => {
      const { data } = await service.from('exercise_sessions').select(sessionFields).eq('id', sessionId).maybeSingle();
      return data && data.forward_read_version === version && forwardReadAllowed(data) ? data : null;
    };
    const session = await load();
    if (!session) return reply({ error: 'Forward Read is off.' }, 403);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || auth.user.id;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`));
    const ipHash = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
    const { data: allowed, error: limitError } = await service.rpc('claim_forward_read_request', { _ip_hash: ipHash });
    if (limitError || allowed !== true) return reply({ error: 'Forward Read has reached its ten requests per hour limit.' }, 429);
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return reply({ error: 'AI is not configured.' }, 500);
    const started = Date.now();
    poll = setInterval(() => {
      void load().then(s => { if (!s || Date.now() - started >= MAX_CONTEXT_MS) { text = ''; controller.abort(); } }).catch(() => { text = ''; controller.abort(); });
    }, 1000);
    const body = new FormData();
    body.append('model', 'openai/gpt-transcribe');
    body.append('file', file, 'room.webm');
    body.append('response_format', 'json');
    body.append('language', 'en');
    const r = await fetch('https://ai.gateway.lovable.dev/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, body, signal: controller.signal });
    if (!r.ok) {
      if (r.status === 402 || r.status === 403) await service.rpc('stop_forward_read_request', { _session_id: sessionId, _version: version });
      return reply({ error: r.status === 402 ? 'AI credits have run out. Forward Read is off.' : r.status === 403 ? 'AI access is unavailable. Forward Read is off.' : 'Forward Read could not process this sample.' }, r.status);
    }
    text = String((await r.json())?.text ?? '').trim().slice(0, 4000);
    if (text.length < 3 || controller.signal.aborted || !(await load())) return reply({ discarded: true });
    let suggestions;
    try {
      suggestions = await generateHostSuggestions({ apiKey, brand: session.brand_name, scenario: session.scenario_narrative ?? '', log: '', room: text, signal: controller.signal });
    } catch (e) {
      if (e instanceof SuggestionFailure && (e.status === 402 || e.status === 403)) await service.rpc('stop_forward_read_request', { _session_id: sessionId, _version: version });
      throw e;
    } finally { text = ''; }
    if (controller.signal.aborted || !(await load())) return reply({ discarded: true });
    // HTTP Realtime broadcast is transient, not realtime.send/database-backed messaging.
    await service.realtime.setAuth(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const channel = service.channel(`forward-read:${sessionId}`, { config: { private: true } });
    try {
      const delivered = await channel.httpSend('suggestions', { suggestions, version, createdAt: Date.now() });
      if (!delivered.success) return reply({ error: 'Live suggestions could not reach the host.' }, 502);
    } finally { await service.removeChannel(channel); }
    return reply({ delivered: true, stored: false });
  } catch (e) {
    const status = controller.signal.aborted ? 499 : e instanceof SuggestionFailure ? e.status : 500;
    return reply({ error: status === 402 ? 'AI credits have run out. Forward Read is off.' : status === 403 ? 'AI access is unavailable. Forward Read is off.' : 'Forward Read could not process this sample.' }, status);
  } finally {
    text = '';
    clearInterval(poll);
    controller.abort();
    req.signal.removeEventListener('abort', abort);
  }
});
