

## Sicherungsschein-Tab in der Buchungsdetailseite

### Was wird gemacht
Der bestehende kleine Versicherungs-Abschnitt im "Intern"-Tab der Buchungsdetailseite (`AdminBookingDetail.tsx`) wird durch einen eigenen **"Versicherung"**-Tab ersetzt. Dieser neue Tab zeigt alle Versicherungsdaten umfassend an und erlaubt direkte Bearbeitung.

### Aktueller Stand
- Die Buchungsdetailseite hat bereits 9 Tabs (Übersicht, Reisende, Zahlungen, etc.)
- Insurance-Daten werden schon geladen (`tour_booking_insurance` Tabelle)
- `saveInsurance()` Funktion existiert bereits
- Im "Intern"-Tab gibt es eine kleine Versicherungs-SectionCard (Zeile 806-825) -- nur Anzeige von Provider, Produkt, Policennr., Preis, Status

### Änderungen in `AdminBookingDetail.tsx`

**1. Neuen Tab "Versicherung" hinzufügen** (mit Shield-Icon, zwischen "Kommunikation" und "Check-in"):
```
{ value: "insurance", icon: Shield, label: "Versicherung" }
```

**2. Neuer TabsContent mit folgenden Bereichen:**
- **Status-Banner**: Farbig je nach `policy_status` (not_requested / pending / active / denied)
- **Formular-Karte**: Provider, Produkt, Policennummer, Preis -- alles inline editierbar mit Speichern-Button
- **Status-Dropdown**: `not_requested` → `pending` → `active` / `denied` per Select-Dropdown
- **Versicherte Personen**: Liste aus `insured_persons` JSON (Name, Geburtsdatum)
- **PDF-Upload/Download**: Button zum Hochladen einer Police-PDF in `tour-documents` Bucket, Download-Link wenn vorhanden
- **Notizen**: Textfeld für interne Notizen zur Versicherung
- **Dokument senden**: Button um die Police per E-Mail an den Kunden zu schicken (nutzt bestehende `send-booking-confirmation` Edge Function)

**3. Alte Versicherungs-SectionCard aus dem "Intern"-Tab entfernen** (Zeilen 806-825)

### Kein DB-Change nötig
Die `tour_booking_insurance` Tabelle hat bereits alle Felder: `provider`, `product`, `policy_number`, `policy_status`, `price`, `is_active`, `insured_persons`, `policy_pdf_url`, `notes`. Storage Bucket `tour-documents` existiert.

