# loophole — Website

Die Website von **loophole** (Zürich): [Hauptseite](https://www.loophole.ch) mit dem adaptiven
Farb-Effekt und eine [Booking-Seite](https://www.loophole.ch/booking/) für Veranstalter:innen.

Gebaut mit [Astro](https://astro.build), statisch gehostet auf Netlify.

## Inhalte pflegen (ohne Code)

Alle Inhalte liegen als JSON-Dateien in `src/data/` und können direkt auf GitHub
bearbeitet werden (Datei öffnen → Bleistift-Symbol → ändern → «Commit changes»).
Nach jedem Commit deployt Netlify die Seite automatisch neu.

### Konzerte — `src/data/shows.json`

Ein Eintrag pro Konzert, **eine** Liste für alles. Die Seite teilt selbst in
«Upcoming» und «Past shows» auf (nach Datum):

```json
{ "date": "16.10.2026", "venue": "Art der Kultur", "city": "Dresden DE", "ticketUrl": null }
```

- `date`: Format `TT.MM.JJJJ`
- `ticketUrl`: Link zum Vorverkauf — oder `null`, dann steht «Soon»

### Releases — `src/data/releases.json`

Neuester Release **zuoberst** — der erste Eintrag wird gross als «Latest release»
angezeigt (mit dem `meta`-Text). Cover-Bild nach `public/covers/` hochladen und im
`cover`-Feld den Pfad eintragen (z.B. `/covers/mein-album.jpg`). Fehlt das Bild,
zeigt die Seite automatisch eine Text-Kachel.

### Band & Presskit

- `src/data/members.json` — Bandmitglieder (Foto nach `public/images/band/`)
- `src/data/presskit.json` — Download-Liste und Pressefotos der Booking-Seite
  (Dateien nach `public/downloads/` bzw. `public/images/press/`)

## Bilder & Dateien

Beim Build lädt `scripts/fetch-assets.mjs` alle noch fehlenden Fotos/PDFs vom alten
Wix-CDN herunter. **Wichtig:** Sobald das alte Wix-Hosting gekündigt wird, funktioniert
das nicht mehr — die Originaldateien sollten deshalb einmalig nach `public/` committet
werden (dann überspringt das Skript den Download).

Noch offen:

- [ ] Die 11 Album-Cover aus dem Design-Handoff nach `public/covers/` committen
      (Dateinamen siehe `releases.json`)
- [ ] Original-Fotos (Band, Presse, Hintergrund) committen statt Wix-Download
- [ ] Presskit-PDFs/ZIPs committen

## Entwicklung

```bash
npm install
npm run dev        # Entwicklungs-Server auf localhost:4321
npm run build      # Statischer Build nach dist/
```

## Netlify

Konfiguration liegt in `netlify.toml` (Build: `npm run build`, Publish: `dist`).
Setup: Auf [netlify.com](https://www.netlify.com) → «Add new site» → «Import an
existing project» → GitHub → dieses Repo wählen — die Einstellungen werden
automatisch aus `netlify.toml` übernommen.

## Technische Hinweise

- Der **adaptive Farb-Effekt** der Hauptseite liegt in `src/scripts/adapt.js`.
  Die Zahlenwerte darin (Schwellwert 0.44, 20 % Schleier, Kontrast-Untergrenze)
  sind bewusst so getunt — nicht beiläufig ändern.
- Das Hintergrundfoto muss **same-origin** ausgeliefert werden (der Effekt liest es
  in ein Canvas; bei fremden Domains ohne CORS schaltet er sich still ab).
- Schrift (Poppins) und Icons (Simple Icons) sind lokal gebündelt, keine externen CDNs.
- Design-Referenz: siehe Design-Handoff (`design_handoff_loophole_site`).

Fotos: Thomas Zeller
