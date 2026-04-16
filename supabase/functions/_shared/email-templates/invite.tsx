/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ confirmationUrl }: InviteEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Du wurdest zu METROPOL TOURS eingeladen</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>METROPOL TOURS</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Du bist eingeladen! 🎉</Heading>
          <Text style={text}>
            Du wurdest eingeladen, dem Team von <strong>METROPOL TOURS</strong> beizutreten. Klicke auf den Button unten, um die Einladung anzunehmen und dein Konto zu erstellen.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Einladung annehmen
            </Button>
          </Section>
          <Text style={footer}>
            Falls du diese Einladung nicht erwartest, kannst du diese E-Mail ignorieren.
          </Text>
        </Section>
        <Section style={brandFooter}>
          <Text style={brandFooterStrong}>METROPOL TOURS</Text>
          <Text style={brandFooterText}>Premium Reisebusunternehmen aus Hannover</Text>
          <Text style={brandFooterText}>
            Hauptbahnhof Hannover · 30159 Hannover · Deutschland
          </Text>
          <Text style={brandFooterText}>
            <Link href="tel:+4951112345678" style={footerLink}>+49 511 1234 5678</Link>
            {' · '}
            <Link href="mailto:info@metours.de" style={footerLink}>info@metours.de</Link>
          </Text>
          <Text style={brandFooterLinks}>
            <Link href="https://www.metours.de" style={footerLink}>Website</Link>
            {' · '}
            <Link href="https://www.metours.de/impressum" style={footerLink}>Impressum</Link>
            {' · '}
            <Link href="https://www.metours.de/datenschutz" style={footerLink}>Datenschutz</Link>
            {' · '}
            <Link href="https://www.metours.de/agb" style={footerLink}>AGB</Link>
          </Text>
          <Text style={brandFooterCopy}>
            © {new Date().getFullYear()} METROPOL TOURS. Alle Rechte vorbehalten.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: '"DM Sans", -apple-system, BlinkMacSystemFont, sans-serif', margin: 0, padding: '40px 20px' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden', border: '1px solid hsl(145, 15%, 90%)' }
const header = { background: 'linear-gradient(135deg, hsl(145, 100%, 40%) 0%, hsl(145, 85%, 50%) 100%)', padding: '28px 32px', textAlign: 'center' as const }
const brand = { color: '#ffffff', fontSize: '20px', fontWeight: 'bold' as const, letterSpacing: '2px', margin: 0 }
const content = { padding: '32px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: 'hsl(220, 20%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '15px', color: 'hsl(220, 10%, 30%)', lineHeight: '1.6', margin: '0 0 20px' }
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' }
const button = { backgroundColor: 'hsl(145, 100%, 40%)', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 32px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: 'hsl(220, 10%, 45%)', margin: '24px 0 0', lineHeight: '1.5' }
const brandFooter = { borderTop: '1px solid hsl(145, 15%, 92%)', padding: '24px 32px', textAlign: 'center' as const, backgroundColor: 'hsl(150, 10%, 98%)' }
const brandFooterStrong = { fontSize: '13px', fontWeight: 'bold' as const, color: 'hsl(145, 100%, 30%)', letterSpacing: '1px', margin: '0 0 6px' }
const brandFooterText = { fontSize: '12px', color: 'hsl(220, 10%, 45%)', margin: '0 0 4px', lineHeight: '1.5' }
const brandFooterLinks = { fontSize: '12px', color: 'hsl(220, 10%, 45%)', margin: '12px 0 8px' }
const brandFooterCopy = { fontSize: '11px', color: 'hsl(220, 10%, 55%)', margin: '8px 0 0' }
const footerLink = { color: 'hsl(145, 100%, 35%)', textDecoration: 'none' }
