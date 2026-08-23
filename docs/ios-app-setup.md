# METROPOL TOURS iOS-App

Die iOS-App nutzt das lokal gebaute React-Bundle aus `dist` und lädt **nicht** die Website als Remote-Webseite. Das bestehende Lovable-Cloud-Backend, Auth, Buchungen, Zahlungen, Tickets und Rechnungen bleiben unverändert die zentrale Datenquelle.

## Lokal vorbereiten

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode anschließend ein Apple-Developer-Team auswählen und auf einem echten iPhone starten.

## Bundle und Links

- Bundle Identifier: `app.lovable.a97d4e9208ce43758235171e4e8e16a2`
- App-Name: `METROPOL TOURS`
- URL-Schema: `metropoltours://app`
- Associated Domains: `app.metours.de`, `www.metours.de`

Für vollständig verifizierte Universal Links muss vor dem App-Store-Build eine `apple-app-site-association` mit der echten Apple Team ID auf beiden Domains bereitgestellt werden.

## Native Funktionen

- Safe Areas und Dynamic-Island-Abstände
- native Status Bar und Keyboard-Resize
- iOS-Keychain für Gastzugang und Offline-Tickets
- App-Lifecycle-Refresh und Deep-Link-Weiterleitung
- Haptik, native Share-Funktion und Pull-to-Refresh
- bestehender Apple-Wallet-Pass-Flow
- Push-Plugin und APNs-Delegate vorbereitet

Native Push-Zustellung benötigt später die bereits geplante, separat freizugebende Geräte-Token-Registrierung im Backend sowie das produktive APNs-Profil. Diese Umsetzung verändert keine Produktionsdaten und fordert noch keine Push-Berechtigung an.