import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3.23.8'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const schema = z.union([
  z.object({ kind: z.literal('access_request'), requestId: z.string().uuid(), product: z.enum(['GreyScan', 'Red Team']) }),
  z.object({ kind: z.literal('signup'), email: z.string().email().max(255), product: z.enum(['GreyScan', 'Red Team']) }),
])
const FRESH_MS = 15 * 60 * 1000
const reply = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

// Only ever emails the fixed admin inbox, and only for records created in the last 15 minutes.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  try {
    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return reply({ error: 'Invalid request' }, 400)
    const input = parsed.data
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    if (input.kind === 'access_request') {
      const { data: r } = await admin.from('platform_access_requests').select('*').eq('id', input.requestId).maybeSingle()
      if (!r || Date.now() - new Date(r.created_at).getTime() > FRESH_MS) return reply({ ok: true })
      await sendTemplateEmail('admin-notification', 'info@greyguards.com', {
        idempotencyKey: `admin-notification-request-${r.id}`,
        replyTo: r.email,
        templateData: { kind: 'access_request', product: input.product, name: r.full_name, organisation: r.organisation, brand: r.brand_name, email: r.email, useCase: r.use_case ?? '', createdAt: new Date(r.created_at).toUTCString() },
      })
      return reply({ ok: true })
    }

    const email = input.email.toLowerCase()
    const { data: users } = await admin.rpc('find_recent_signup', { _email: email })
    const u = Array.isArray(users) ? users[0] : users
    if (!u || Date.now() - new Date(u.created_at).getTime() > FRESH_MS) return reply({ ok: true })
    await sendTemplateEmail('admin-notification', 'info@greyguards.com', {
      idempotencyKey: `admin-notification-signup-${u.id}`,
      templateData: { kind: 'signup', product: input.product, email, createdAt: new Date(u.created_at).toUTCString() },
    })
    return reply({ ok: true })
  } catch (e) {
    console.error('notify-admin failed', e)
    return reply({ ok: false }, 200)
  }
})
