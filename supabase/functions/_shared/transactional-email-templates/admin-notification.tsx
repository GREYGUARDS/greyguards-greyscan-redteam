import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  kind?: 'signup' | 'access_request'
  product?: string
  name?: string
  organisation?: string
  brand?: string
  email?: string
  useCase?: string
  createdAt?: string
}

const Email = ({ kind = 'access_request', product, name, organisation, brand, email, useCase, createdAt }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{kind === 'signup' ? `New account sign-up: ${email ?? ''}` : `Access request from ${organisation ?? 'a new client'}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={eyebrow}>GREYGUARDS · ADMIN NOTICE</Text>
        <Heading style={h1}>{kind === 'signup' ? 'New account sign-up' : 'New platform access request'}</Heading>
        {product && <Text style={text}><b>Product:</b> {product}</Text>}
        {name && <Text style={text}><b>Name:</b> {name}</Text>}
        {organisation && <Text style={text}><b>Organisation:</b> {organisation}</Text>}
        {brand && <Text style={text}><b>Brand:</b> {brand}</Text>}
        <Text style={text}><b>Email:</b> {email ?? 'unknown'}</Text>
        {useCase && <Text style={text}><b>Use case:</b> {useCase}</Text>}
        {createdAt && <Text style={muted}>Received {createdAt}</Text>}
        <Hr style={hr} />
        <Text style={muted}>
          {kind === 'signup'
            ? 'This account has no data access until you approve a matching request on the Admin Requests page.'
            : 'Review and approve or reject this request on the Admin Requests page.'}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => d.kind === 'signup'
    ? `New sign-up: ${d.email ?? 'unknown'}`
    : `Access request — ${d.organisation ?? 'new client'} (${d.brand ?? ''})`,
  displayName: 'Admin notification',
  to: 'info@greyguards.com',
  previewData: { kind: 'access_request', product: 'Red Team', name: 'Jane Doe', organisation: 'Acme Ltd', brand: 'Acme', email: 'jane@acme.com', useCase: 'Board crisis exercise' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }
const container = { padding: '24px 28px', borderTop: '4px solid #6B1E1E' }
const eyebrow = { fontSize: '11px', letterSpacing: '2px', color: '#6B1E1E', margin: '0 0 8px' }
const h1 = { fontSize: '22px', color: '#1F2A24', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#2C2E33', margin: '4px 0' }
const muted = { fontSize: '12px', color: '#6f6a62', margin: '8px 0' }
const hr = { borderColor: '#d8d2c5', margin: '16px 0' }
