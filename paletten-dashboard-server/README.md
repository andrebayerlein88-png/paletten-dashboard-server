# Paletten-Dashboard V3.9.3 — Backend-Grundgeruest (TEST)

**Status: NICHT produktionsbereit.** Dieses Paket erstellt einen Node.js-Web-Service und eine PostgreSQL-Tabelle fuer einen zentralen JSON-Testdatenbestand. Es ist **noch keine vollstaendige Migration** des Dashboards.

## Enthalten
- `src/server.js`: HTTPS-faehiger Render-Web-Service (TLS wird von Render bereitgestellt)
- `sql/001_init.sql`: automatische Initialisierung einer Testtabelle
- `GET /health`: Datenbankverbindung pruefen
- `GET /api/state`: Testdatenstand lesen
- `PUT /api/state`: Testdatenstand mit Revisionspruefung speichern (409 bei Konflikt)
- `test/validation.test.js`: Basistests

## Noch NICHT enthalten
- Keine Anbindung der bestehenden Netlify-HTML-Datei; diese bleibt unveraendert.
- Keine serverseitige Anmeldung fuer Mitarbeiter/Admins, keine Rollen-/Buchungs-APIs.
- Keine fachlichen Transaktionen fuer Paletten, Verladung, Kanban, TDS, Wareneingang.
- Kein automatisches Zusammenfuehren gleichzeitiger Buchungen. Die Revision verhindert lediglich unbemerkte Ueberschreibungen.
- Kein Import von Produktivdaten. Keine Freigabe fuer produktive Nutzung.

**Sicherheit:** `API_TEST_TOKEN` ist nur ein technischer Testschluessel und darf niemals in einer oeffentlich erreichbaren HTML-/JavaScript-Datei stehen. Den Endpunkt nicht direkt aus der oeffentlichen Netlify-Seite mit diesem Token aufrufen. Die API ist vor einer echten Nutzung durch serverseitige Benutzeranmeldung und Rollenpruefung zu ersetzen.

## GitHub-Upload
1. ZIP herunterladen und lokal entpacken.
2. Im privaten Repository `paletten-dashboard-server` > `Add file` > `Upload files`.
3. **Die Inhalte des entpackten Ordners** hochladen (nicht die ZIP-Datei): `package.json`, `.gitignore`, `.env.example`, `README.md` sowie die Ordner `src`, `sql`, `test` mit ihren Dateien. Bei Bedarf `.gitignore` und `README.md` durch die Paketversion ersetzen.
4. `Commit changes` ausfuehren. Keine Passwoerter oder Datenbank-URLs hochladen.

## Render-Web-Service (erst nach IT-Freigabe fuer diesen Test)
1. Render > New > Web Service > GitHub-Repository `paletten-dashboard-server` waehlen.
2. Region: Frankfurt (dieselbe Region wie PostgreSQL).
3. Runtime: Node; Build Command: `npm install`; Start Command: `npm start`.
4. Unter Environment **nur in Render** setzen:
   - `DATABASE_URL`: **Internal Database URL** der bestehenden PostgreSQL-Datenbank; niemals in GitHub ablegen.
   - `API_TEST_TOKEN`: zufaelliges Geheimnis mit mindestens 32 Zeichen; nur fuer geschuetzte technische Tests.
   - `ALLOWED_ORIGIN`: HTTPS-Adresse einer separaten Testseite (nicht die produktive Netlify-Seite).
   - `NODE_ENV`: `production`.
5. Tarif/Kosten pruefen, bevor der Service erstellt wird.
6. Nach dem Deploy `https://DEIN-SERVICE.onrender.com/health` oeffnen; erwartet wird `{"status":"ok","database":"connected"}`.
7. Ohne den API-Testschluessel gibt `/api/state` korrekt HTTP 401 zurueck.

## Nächste Entwicklungsphase
Die HTML-V3.9.3 verwendet `localStorage`, Browser-Adminpruefung und synchrones `save()`. Ein produktives Mehrbenutzersystem erfordert fachliche Server-Endpunkte mit Authentifizierung, Autorisierung, Transaktionen, Tests und eine separate angepasste Frontend-Testkopie. **Nicht** einfach `save()` durch ein ungeschuetztes PUT ersetzen. Erst nach End-to-End-Tests und ausdruecklicher Freigabe umstellen.

## Datenschutz
Die originale `index (1).html` enthaelt Mitarbeiterstammdaten und Passwortpruefwerte. Sie wurde deshalb absichtlich **nicht** in dieses Serverpaket aufgenommen. Bitte keine echten Daten oder Admin-Passwoerter in GitHub oder die Testdatenbank hochladen.
