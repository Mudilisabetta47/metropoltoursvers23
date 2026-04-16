/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Dein Bestätigungscode</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>METROPOL TOURS</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Identität bestätigen 🔒</Heading>
          <Text style={text}>Verwende den folgenden Code, um deine Identität zu bestätigen:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Text style={footer}>
            Dieser Code läuft in Kürze ab. Falls du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
          </Text>
        </Section>
        <Section style={brandFooter}>
          <Text style={brandFooterText}>
            METROPOL TOURS · Premium Reisebusunternehmen aus Hannover
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', margin: 0, padding: '40px 20px' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid hsl(145, 15%, 90%)' }
const header = { background: 'linear-gradient(135deg, hsl(145, 100%, 40%) 0%, hsl(145, 85%, 50%) 100%)', padding: '28px 32px', textAlign: 'center' as const }
const brand = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: 0 }
const content = { padding: '32px', textAlign: 'center' as const }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 30%)', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: 'hsl(145, 100%, 35%)',
  letterSpacing: '8px',
  backgroundColor: 'hsl(150, 10%, 96%)',
  padding: '20px',
  borderRadius: '12px',
  margin: '24px 0',
}
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 45%)', margin: '24px 0 0', lineHeight: '1.5' }
const brandFooter = { borderTop: '1px solid hsl(145, 15%, 92%)', padding: '20px 32px', textAlign: 'center' as const, backgroundColor: 'hsl(150, 10%, 98%)' }
const brandFooterText = { fontSize: '12px', color: 'hsl(220, 10%, 45%)', margin: 0 }
