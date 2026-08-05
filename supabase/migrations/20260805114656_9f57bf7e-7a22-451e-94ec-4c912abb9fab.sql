
ALTER TABLE public.employment_contracts
  ADD COLUMN IF NOT EXISTS personnel_number text,
  ADD COLUMN IF NOT EXISTS birth_place text,
  ADD COLUMN IF NOT EXISTS health_insurance text,
  ADD COLUMN IF NOT EXISTS license_classes text,
  ADD COLUMN IF NOT EXISTS driver_qualification_95 boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS driver_card boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS license_expiry date,
  ADD COLUMN IF NOT EXISTS code95_expiry date,
  ADD COLUMN IF NOT EXISTS driver_card_expiry date,
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'vollzeit',
  ADD COLUMN IF NOT EXISTS hourly_wage numeric(10,2),
  ADD COLUMN IF NOT EXISTS supplements text,
  ADD COLUMN IF NOT EXISTS work_time_model text,
  ADD COLUMN IF NOT EXISTS special_payments text,
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'de';

ALTER TABLE public.contract_templates
  ADD COLUMN IF NOT EXISTS contract_type text NOT NULL DEFAULT 'vollzeit',
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'de';

CREATE UNIQUE INDEX IF NOT EXISTS employment_contracts_personnel_number_key
  ON public.employment_contracts (personnel_number) WHERE personnel_number IS NOT NULL;

CREATE OR REPLACE FUNCTION public.generate_personnel_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n TEXT; s TEXT;
BEGIN
  LOOP
    s := LPAD(FLOOR(RANDOM()*100000)::TEXT, 5, '0');
    n := 'MT-P-' || s;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.employment_contracts WHERE personnel_number = n);
  END LOOP;
  RETURN n;
END $$;

WITH parts AS (
  SELECT
'# Arbeitsvertrag

Zwischen

**{{firma_name}}**, {{firma_anschrift}}
vertreten durch den Geschäftsführer {{firma_geschaeftsfuehrer}}
– nachfolgend „Arbeitgeber" –

und

**{{vorname}} {{nachname}}**, geboren am {{geburtsdatum}} in {{geburtsort}}
wohnhaft {{anschrift}}
Personalnummer: {{personalnummer}}
– nachfolgend „Arbeitnehmer" –

wird folgender Arbeitsvertrag geschlossen:

## § 1 Beginn und Dauer des Arbeitsverhältnisses

Das Arbeitsverhältnis beginnt am {{arbeitsbeginn}}. {{befristung_text}}
Die ersten {{probezeit}} Monate gelten als Probezeit. Während der Probezeit kann das Arbeitsverhältnis beidseitig mit einer Frist von zwei Wochen gekündigt werden.

## § 2 Tätigkeit und Arbeitsort

Der Arbeitnehmer wird als **{{position}}** in der Abteilung {{abteilung}} eingestellt. Arbeitsort ist {{arbeitsort}}. Der Arbeitgeber behält sich vor, dem Arbeitnehmer eine andere, gleichwertige und zumutbare Tätigkeit zuzuweisen.

## § 3 Arbeitszeit

Die regelmäßige wöchentliche Arbeitszeit beträgt {{wochenarbeitszeit}} Stunden. Arbeitszeitmodell: {{arbeitszeitmodell}}. {{arbeitszeiten}}

## § 4 Vergütung

Der Arbeitnehmer erhält ein monatliches Bruttogehalt von {{gehalt}}. Stundensatz: {{stundenlohn}}. Zuschläge: {{zuschlaege}}
{{bonus_text}}
Sonderzahlungen: {{sonderzahlungen}}
Die Zahlung erfolgt bargeldlos auf das Konto IBAN {{iban}} (BIC {{bic}}).
'::text AS head,
'
## § 90 Urlaub

Der Arbeitnehmer hat Anspruch auf {{urlaubstage}} Arbeitstage bezahlten Erholungsurlaub pro Kalenderjahr.

## § 91 Krankheit und Arbeitsverhinderung

Der Arbeitnehmer ist verpflichtet, jede Arbeitsverhinderung unverzüglich anzuzeigen. Eine ärztliche Bescheinigung ist spätestens am dritten Kalendertag vorzulegen.

## § 92 Verschwiegenheit und Datenschutz

Der Arbeitnehmer verpflichtet sich, über alle betrieblichen Angelegenheiten sowie personenbezogene Daten von Kunden und Beschäftigten Stillschweigen zu bewahren – auch nach Beendigung des Arbeitsverhältnisses (Art. 5, 32 DSGVO, § 53 BDSG).

## § 93 Kündigung

Die Kündigungsfrist beträgt {{kuendigungsfrist}}. Die Kündigung bedarf der Schriftform.

## § 94 Sonstige Vereinbarungen

{{sonstige_vereinbarungen}}

## § 95 Schlussbestimmungen

Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.

{{ort_datum}}
'::text AS tail
)
INSERT INTO public.contract_templates (name, description, contract_type, language, body, is_active, is_default)
SELECT v.name, v.descr, v.ctype, 'de', p.head || v.mid || p.tail, true, false
FROM parts p, (VALUES
('Busfahrer / Fahrpersonal', 'Arbeitsvertrag für Bus- und Reisebusfahrer inkl. Lenk- und Ruhezeiten', 'fahrer',
'
## § 5 Fahrerlaubnis und Qualifikation

Der Arbeitnehmer besitzt die Fahrerlaubnisklassen **{{fuehrerscheinklassen}}** (gültig bis {{fuehrerschein_ablauf}}) sowie die Grundqualifikation bzw. Weiterbildung nach BKrFQG (Schlüsselzahl 95): {{qualifikation_95}} (gültig bis {{code95_ablauf}}). Fahrerkarte vorhanden: {{fahrerkarte}} (gültig bis {{fahrerkarte_ablauf}}).
Der Arbeitnehmer ist verpflichtet, den Verlust, den Entzug oder das Auslaufen einer dieser Berechtigungen unverzüglich zu melden. Der Verlust der Fahrerlaubnis berechtigt den Arbeitgeber zur außerordentlichen Kündigung.

## § 6 Lenk- und Ruhezeiten

Der Arbeitnehmer verpflichtet sich zur strikten Einhaltung der Lenk- und Ruhezeiten gemäß VO (EG) 561/2006, des Fahrpersonalgesetzes sowie des Arbeitszeitgesetzes. Manipulationen am digitalen Fahrtenschreiber sind untersagt und stellen einen schwerwiegenden Pflichtverstoß dar.

## § 7 Fahrzeugkontrolle, Pflege und Schadensmeldung

Der Arbeitnehmer führt vor jeder Fahrt die vorgeschriebene Abfahrtkontrolle durch und dokumentiert diese im Fahrerinformationssystem. Er sorgt für Sauberkeit und Pflege des Fahrzeugs. Schäden, Unfälle und Betriebsstörungen sind unverzüglich der Disposition zu melden.

## § 8 Fahrgäste und Auftreten

Der Arbeitnehmer begegnet Fahrgästen höflich, hilfsbereit und deeskalierend. Die vom Arbeitgeber gestellte Arbeitskleidung ist im Dienst zu tragen und gepflegt zu halten.

## § 9 Einsatzbereitschaft

Der Arbeitnehmer erklärt sich zu Einsätzen im Linien-, Reise- und Shuttleverkehr sowie zu Wochenend-, Nacht- und Feiertagsdiensten bereit. Mehrtägige Reisen mit auswärtiger Übernachtung sind Bestandteil der Tätigkeit.
'),
('Bürokraft / Verwaltung', 'Arbeitsvertrag für Büro- und Verwaltungskräfte', 'buerokraft',
'
## § 5 Aufgabenbereich

Zu den Aufgaben gehören allgemeine Verwaltungstätigkeiten, Bearbeitung von Telefon- und E-Mail-Anfragen, Buchungs- und Rechnungsvorgänge, Terminkoordination sowie die Pflege der Stammdaten im CRM.

## § 6 Datenschutz und Kundendaten

Der Arbeitnehmer wird auf das Datengeheimnis nach DSGVO verpflichtet. Kundendaten dürfen ausschließlich zweckgebunden im Rahmen der Aufgabenerfüllung verarbeitet werden. Eine Weitergabe an Dritte ist untersagt.

## § 7 Arbeitsplatz und Homeoffice

Der Arbeitsplatz befindet sich in den Geschäftsräumen des Arbeitgebers. Mobiles Arbeiten (Homeoffice) kann im Einzelfall nach vorheriger Absprache gestattet werden; ein Anspruch besteht nicht.
'),
('Geschäftsführer', 'Geschäftsführer-Dienstvertrag mit Wettbewerbsverbot und Bonusregelung', 'geschaeftsfuehrer',
'
## § 5 Befugnisse und Vertretung

Der Geschäftsführer führt die Geschäfte der Gesellschaft mit der Sorgfalt eines ordentlichen Kaufmanns nach Maßgabe der Gesetze, des Gesellschaftsvertrages und der Beschlüsse der Gesellschafterversammlung. Er ist zur Vertretung der Gesellschaft berechtigt; Umfang und Befreiung von § 181 BGB richten sich nach dem Handelsregistereintrag.

## § 6 Wettbewerbsverbot

Während der Dauer des Vertrages ist dem Geschäftsführer jede Tätigkeit für ein Konkurrenzunternehmen sowie jede unmittelbare oder mittelbare Beteiligung daran untersagt.

## § 7 Verschwiegenheit

Der Geschäftsführer verpflichtet sich, über alle Geschäfts- und Betriebsgeheimnisse zeitlich unbegrenzt Stillschweigen zu bewahren.

## § 8 Tantieme und Gewinnbeteiligung

Zusätzlich zur Festvergütung kann eine erfolgsabhängige Tantieme bzw. Gewinnbeteiligung gewährt werden: {{bonus}}

## § 9 Firmenwagen und Arbeitsmittel

Dem Geschäftsführer werden ein Dienstwagen (auch zur privaten Nutzung, Versteuerung nach 1 %-Regelung), ein Diensthandy sowie ein Laptop zur Verfügung gestellt. Reisekosten und Spesen werden nach den steuerlichen Höchstsätzen erstattet.
'),
('Disponent / Disposition', 'Arbeitsvertrag für Disponenten im Fahrbetrieb', 'disponent',
'
## § 5 Aufgabenbereich

Der Arbeitnehmer verantwortet die Einsatz- und Tourenplanung, die Fahrer- und Fahrzeugdisposition, die Überwachung der Lenk- und Ruhezeiten, die Bearbeitung von Störungen sowie die Kommunikation mit Fahrpersonal und Kunden.

## § 6 Erreichbarkeit und Rufbereitschaft

Aufgrund des Betriebsablaufs erklärt sich der Arbeitnehmer zu Schicht-, Wochenend- und Feiertagsdiensten sowie zu Rufbereitschaft nach Dienstplan bereit. Rufbereitschaft wird gesondert vergütet.

## § 7 Datenschutz

Der Arbeitnehmer wird auf das Datengeheimnis nach DSGVO verpflichtet; dies gilt insbesondere für Fahrer-, Fahrgast- und Telematikdaten.
'),
('Reinigungskraft', 'Arbeitsvertrag für Reinigungspersonal (Fahrzeug- und Gebäudereinigung)', 'reinigungskraft',
'
## § 5 Aufgabenbereich

Zu den Aufgaben gehören die Innen- und Außenreinigung der Fahrzeuge, die Reinigung der Betriebs- und Sozialräume sowie die Entsorgung von Abfällen nach den betrieblichen Vorgaben.

## § 6 Arbeitssicherheit und Gefahrstoffe

Der Arbeitnehmer verpflichtet sich zur Einhaltung der Arbeitsschutz- und Hygienevorschriften, zum Tragen der gestellten Schutzkleidung sowie zum bestimmungsgemäßen Umgang mit Reinigungs- und Gefahrstoffen gemäß Betriebsanweisung.
'),
('Werkstudent', 'Werkstudentenvertrag (max. 20 Wochenstunden während der Vorlesungszeit)', 'werkstudent',
'
## § 5 Werkstudentenstatus

Der Arbeitnehmer ist an einer Hochschule immatrikuliert und legt jeweils zu Semesterbeginn eine aktuelle Immatrikulationsbescheinigung vor. Die Beschäftigung erfolgt als Werkstudent im Sinne des § 6 Abs. 1 Nr. 3 SGB V (Werkstudentenprivileg). Während der Vorlesungszeit beträgt die Arbeitszeit höchstens 20 Stunden pro Woche.

## § 6 Wegfall der Voraussetzungen

Der Arbeitnehmer meldet die Exmatrikulation, einen Fachwechsel oder das Überschreiten der Regelstudienzeit unverzüglich, da hiervon die Sozialversicherungspflicht abhängt.
'),
('Minijob (geringfügige Beschäftigung)', 'Arbeitsvertrag für geringfügig Beschäftigte nach § 8 SGB IV', 'minijob',
'
## § 5 Geringfügige Beschäftigung

Es handelt sich um eine geringfügige Beschäftigung nach § 8 Abs. 1 Nr. 1 SGB IV. Das monatliche Arbeitsentgelt überschreitet die jeweils geltende Geringfügigkeitsgrenze nicht. Der Arbeitnehmer versichert, keine weiteren geringfügigen Beschäftigungen auszuüben, die zur Überschreitung führen, und zeigt Änderungen unverzüglich an.

## § 6 Rentenversicherung

Der Arbeitnehmer wurde über die Rentenversicherungspflicht und die Möglichkeit der Befreiung nach § 6 Abs. 1b SGB VI belehrt.
'),
('Teilzeit', 'Teilzeit-Arbeitsvertrag nach TzBfG', 'teilzeit',
'
## § 5 Teilzeitbeschäftigung

Das Arbeitsverhältnis wird in Teilzeit nach dem Teilzeit- und Befristungsgesetz (TzBfG) begründet. Die Lage der Arbeitszeit wird nach betrieblichen Erfordernissen im Dienstplan festgelegt und rechtzeitig bekannt gegeben. Mehrarbeit ist nur nach vorheriger Absprache zulässig.
'),
('Vollzeit (Standard)', 'Allgemeiner unbefristeter Vollzeit-Arbeitsvertrag', 'vollzeit',
'
## § 5 Nebentätigkeit

Die Aufnahme einer entgeltlichen Nebentätigkeit bedarf der vorherigen schriftlichen Zustimmung des Arbeitgebers. Die Zustimmung wird erteilt, sofern betriebliche Interessen nicht beeinträchtigt werden.

## § 6 Mehrarbeit

Der Arbeitnehmer erklärt sich bereit, im betrieblich erforderlichen Umfang Mehrarbeit zu leisten. Die Abgeltung erfolgt vorrangig durch Freizeitausgleich.
'),
('Ausbildungsvertrag', 'Berufsausbildungsvertrag nach BBiG', 'ausbildung',
'
## § 5 Ausbildungsverhältnis

Der Arbeitgeber bildet den Auszubildenden nach der geltenden Ausbildungsordnung im Beruf {{position}} aus. Das Ausbildungsverhältnis richtet sich nach dem Berufsbildungsgesetz (BBiG). Die Probezeit beträgt {{probezeit}} Monate.

## § 6 Pflichten des Auszubildenden

Der Auszubildende ist verpflichtet, die Berufsschule regelmäßig zu besuchen, den schriftlichen Ausbildungsnachweis zu führen, an vorgeschriebenen Prüfungen teilzunehmen und die Weisungen der Ausbilder zu befolgen.

## § 7 Ausbildungsvergütung

Die monatliche Ausbildungsvergütung beträgt {{gehalt}} und steigt nach den jeweils geltenden Regelungen mit jedem Ausbildungsjahr.
'),
('Praktikumsvertrag', 'Vertrag für Pflicht- und freiwillige Praktika', 'praktikum',
'
## § 5 Zweck des Praktikums

Das Praktikum dient dem Erwerb praktischer Kenntnisse und Erfahrungen im Bereich {{position}}. Es handelt sich nicht um ein reguläres Arbeitsverhältnis; ein Anspruch auf Übernahme besteht nicht.

## § 6 Betreuung und Zeugnis

Der Praktikant wird von einer fachkundigen Person betreut. Nach Beendigung erhält der Praktikant eine Bescheinigung bzw. ein qualifiziertes Zeugnis über Inhalt, Dauer und Ziel des Praktikums.

## § 7 Mindestlohn

Die Vergütung richtet sich nach den Vorgaben des Mindestlohngesetzes; bei Pflichtpraktika im Rahmen einer Ausbildung oder eines Studiums besteht kein Mindestlohnanspruch.
')
) AS v(name, descr, ctype, mid)
WHERE NOT EXISTS (SELECT 1 FROM public.contract_templates ct WHERE ct.name = v.name);
