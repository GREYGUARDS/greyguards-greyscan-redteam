import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { canHostVideo } from '../_shared/hosted-inject-rules.ts';
import { generateHostSuggestions, SuggestionFailure } from '../_shared/host-suggestions.ts';

const schema = z.object({ sessionId: z.string().uuid() });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
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
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return reply({ error: 'Check your request fields.' }, 400);
    const { data: session } = await service.from('exercise_sessions').select('id, brand_name, scenario_narrative, created_by_user_id, status').eq('id', parsed.data.sessionId).maybeSingle();
    const { data: admin } = await service.rpc('is_admin', { _uid: auth.user.id });
    if (!session || !canHostVideo(admin === true, auth.user.id, session.created_by_user_id)) return reply({ error: 'Only the host of this session can get suggestions.' }, 403);
    const { data: responses } = await service.from('exercise_responses').select('inject_id, response_label, custom_response, created_at').eq('session_id', session.id).order('created_at', { ascending: false }).limit(6);
    if (!responses?.length) return reply({ suggestions: [], message: 'No team responses yet. Forward Read suggestions arrive live while it is on.' });
    const ids = [...new Set(responses.map(r => r.inject_id).filter(Boolean))];
    const { data: injects } = await service.from('exercise_injects').select('id, content, source').in('id', ids);
    const byId = new Map((injects ?? []).map(i => [i.id, i]));
    const log = responses.reverse().map((r, n) => `${n + 1}. Inject: ${(byId.get(r.inject_id)?.content ?? 'unknown').slice(0, 300)}\nTeam response: ${(r.custom_response || r.response_label || '').slice(0, 500)}`).join('\n');
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) return reply({ error: 'AI is not configured.' }, 500);
    return reply({ suggestions: await generateHostSuggestions({ apiKey, brand: session.brand_name, scenario: session.scenario_narrative ?? '', log, signal: req.signal }) });
  } catch (e) {
    const status = e instanceof SuggestionFailure ? e.status : 500;
    return reply({ error: status === 402 ? 'AI credits have run out for this workspace.' : status === 403 ? 'AI access is unavailable.' : status === 429 ? 'Too many requests — try again later.' : 'Suggestions could not be generated.' }, status);
  }
});
