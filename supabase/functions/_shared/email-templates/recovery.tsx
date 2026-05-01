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

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ confirmationUrl }: RecoveryEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Setze dein Passwort für METROPOL TOURS zurück</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>METROPOL TOURS</Heading>
        </Section>
        <Section style={content}>
          <Heading style={h1}>Passwort zurücksetzen 🔐</Heading>
          <Text style={text}>
            Wir haben eine Anfrage zum Zurücksetzen deines Passworts erhalten. Klicke auf den Button unten, um ein neues Passwort zu wählen.
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={confirmationUrl}>
              Passwort zurücksetzen
            </Button>
          </Section>
          <Text style={footer}>
            Falls du keine Passwort-Zurücksetzung angefordert hast, kannst du diese E-Mail ignorieren. Dein Passwort bleibt unverändert.
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
            <Link href="mailto:kundenservice@metours.de" style={footerLink}>kundenservice@metours.de</Link>
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

export default RecoveryEmail

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
