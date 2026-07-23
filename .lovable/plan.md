# METOURS Copilot – Aktiver KI-Assistent im Backend

Ein interner Chat-Assistent im Admin-Cockpit, der über Tool-Calling echte Aktionen im System ausführt – abgesichert durch die bestehende Rollen- und RLS-Struktur und vollständig im Audit-Log protokolliert.

## Ziel

Mitarbeitende schreiben natürliche Sätze („Verschiebe die Tour auf Freitag", „Zeige alle offenen Rechnungen"), die KI plant die passenden Schritte, ruft interne Tools auf und antwortet mit Bestätigung oder Fehler.

## Architektur

```text
┌──────────────────────────────────────────────┐
│ Admin-Cockpit → /admin/copilot (Chat-UI)     │
│   • useChat (AI SDK UI) + Streaming           │
│   • Message parts (text, tool-call, result)   │
└───────────────┬──────────────────────────────┘
                │ Authorization: Bearer <user JWT>
                ▼
┌──────────────────────────────────────────────┐
│ Edge Function: copilot-chat                   │
│   1. JWT verifizieren → user_id + Rollen      │
│   2. streamText (AI SDK, Lovable Gateway)     │
│      • System-Prompt (Rolle, Sprache DE)      │
│      • Tools nach Rolle gefiltert             │
│   3. Für jeden Tool-Call:                     │
│      • Permission-Check (has_role)            │
│      • Server-seitige Ausführung (RLS-Client) │
│      • copilot_audit_log Eintrag              │
│   4. UI-Stream zurückgeben                    │
└───────────────┬──────────────────────────────┘
                ▼
┌──────────────────────────────────────────────┐
│ Supabase                                      │
│   • bestehende Tabellen mit RLS               │
│   • copilot_audit_log (neu)                   │
│   • copilot_conversations, copilot_messages   │
└──────────────────────────────────────────────┘
```

Der Copilot ruft **niemals** direkt SQL auf. Alle Aktionen laufen über typisierte Tools mit Zod-Validierung → RLS wird als zweite Schutzschicht behalten.

## Tools (Erste Auslieferung)

Jedes Tool hat: Name, Zod-Schema, benötigte Rolle(n), `readOnly`/`destructive`-Flag, optional `needsApproval`.

**Lesen (alle Staff-Rollen)**
- `search_bookings` – Filter nach Status, Datum, Kunde
- `search_customers`
- `list_trips` / `list_tours` – kommende Fahrten
- `list_invoices` – offene/bezahlte Rechnungen
- `list_drivers`, `list_vehicles`
- `get_statistics` – KPIs (Auslastung, Umsatz)

**Schreiben (admin/office)**
- `create_booking`, `update_booking_status`, `reschedule_tour`
- `assign_driver_to_trip`, `assign_vehicle_to_trip`
- `create_invoice_from_booking`, `mark_invoice_paid`
- `create_customer`, `add_customer_note`
- `create_shift`, `update_shift`

**Sensibel (admin only, needsApproval=true)**
- `delete_booking`, `refund_payment`, `create_driver_account`

Rollen: `admin` = alles, `office` = Buchungen/Rechnungen/Dispo, `agent` = read + create_booking, `driver` = nur eigene Read-Tools.

## Datenbank (Migration)

Neue Tabellen (mit GRANT + RLS nach Projekt-Standard):
- `copilot_conversations` (id, user_id, title, created_at)
- `copilot_messages` (id, conversation_id, role, parts jsonb, created_at)
- `copilot_audit_log` (id, user_id, conversation_id, tool_name, input jsonb, output jsonb, status, error, duration_ms, created_at)

RLS: Nutzer sehen nur eigene Conversations/Messages; Audit-Log nur für `admin` lesbar, Einträge nur via `service_role` (Edge Function).

## Edge Function `copilot-chat`

- `verify_jwt = true`
- Nutzt `createLovableAiGatewayProvider` (bestehender Shared-Helper)
- Modell: `google/gemini-3.6-flash` (schnell, tool-fähig, günstig)
- `streamText` mit `stopWhen: stepCountIs(50)`
- Tool-`execute` erstellt bei jedem Aufruf einen `copilot_audit_log`-Eintrag (start → complete/error) und nutzt einen Supabase-Client, der das User-JWT weiterreicht (RLS als zweite Schutzschicht)
- System-Prompt: Deutsch, Kontext (aktueller User, Rolle, heutiges Datum), Verhalten (fragt nach bei Mehrdeutigkeit, bestätigt Aktionen kurz)
- Fehlerbehandlung: strukturierte Fehler pro Tool + 402/429 vom Gateway sauber an UI

## UI

- Neue Seite `src/pages/AdminCopilot.tsx` (Route `/admin/copilot`)
- Sidebar-Eintrag „Copilot" (Sparkles-Icon) unter „Cockpit"
- Chat mit `useChat`, rendert `message.parts` inkl. Tool-Aufrufe (Name, Input-Zusammenfassung, Ergebnis-Badge ✓/✗)
- Conversation-Historie (linke Spalte), neue Chats, Löschen
- Freeze-Confirm-Dialog für `needsApproval`-Tools
- Chips mit Beispielprompts („Zeige alle offenen Rechnungen", „Fahrer für morgen 08:00 zuweisen")

## Sicherheit

- Nur `hasAnyStaffRole` darf die Seite/Edge Function nutzen (Route-Guard + Server-Check)
- Server prüft **pro Tool** die Rolle – der Prompt allein reicht nie
- Alle Inputs Zod-validiert, alle Outputs kompakt
- Tokens/Secrets nie an das Modell
- Audit-Log: unveränderlich (`GRANT INSERT` nur service_role, kein UPDATE/DELETE)
- Neue Admin-Seite `/admin/copilot-audit` zum Durchsuchen der KI-Aktionen

## Erweiterbarkeit

Neue Tools werden als eigene Datei in `supabase/functions/copilot-chat/tools/` abgelegt und in der Tool-Registry mit Rolle registriert – kein Prompt-Umbau nötig. Modell/Prompt/Rollen-Mapping sind konfigurierbar.

## Umsetzung in Etappen

1. **DB-Migration** – 3 Tabellen + RLS + GRANTs
2. **Edge Function** `copilot-chat` mit Tool-Registry, Read-Only-Tools zuerst
3. **UI** `/admin/copilot` + Sidebar-Eintrag
4. **Write-Tools** (Buchungen, Rechnungen, Dispo) freischalten
5. **Audit-Log-Viewer** `/admin/copilot-audit`
6. **Approval-Flow** für destruktive Tools

Soll ich so starten? Wenn ja, lege ich direkt mit Etappe 1+2 (DB + Edge Function + Basis-UI mit Read-Tools) los; Write-Tools folgen danach, damit du sie einzeln freigeben kannst.
