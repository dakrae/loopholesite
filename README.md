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

**Wie der Wechsel zu «Past shows» passiert:** Die Aufteilung entsteht beim
Bauen der Seite — die Seite ist statisch ausgeliefertes HTML. Damit ein
Konzert trotzdem am Tag danach von selbst nach unten wandert, prüft
`src/scripts/shows.js` die Daten beim Aufruf im Browser nochmals nach und
verschiebt abgelaufene Einträge; auch die «Next show»-Zeile im Hero zieht
dabei mit. Es braucht dafür also **kein** neues Deployment.

Was ein Deployment trotzdem braucht: die Konzertdaten für Google & Co.
(`MusicEvent`-Daten im HTML). Damit auch die nachziehen, stösst
`.github/workflows/rebuild.yml` jede Nacht um 04:20 UTC einen Build an.
Das ist optional und braucht einmalig:

1. In Netlify unter *Site configuration → Build & deploy → Build hooks* einen
   Hook anlegen und die URL kopieren.
2. Auf GitHub unter *Settings → Secrets and variables → Actions* ein Secret
   namens `NETLIFY_BUILD_HOOK` mit dieser URL anlegen.

Achtung: GitHub schaltet geplante Abläufe ab, wenn 60 Tage lang nichts ins
Repo gepusht wurde (es kommt vorher eine E-Mail). Nach einer längeren Pause
also im Reiter *Actions* nachsehen und gegebenenfalls wieder aktivieren.

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

Fast alles liegt im Repo unter `public/`:

| Was | Wo |
|---|---|
| Hintergrundfoto Hauptseite | `public/images/bg.jpg` |
| Banner Booking-Seite | `public/images/booking-hero.jpg` |
| Pressefotos | `public/images/press/` |
| Bandfotos | `public/images/band/` |
| Album-Cover | `public/covers/` |
| Presskit-PDFs | `public/downloads/` |

Die beiden ZIP-Downloads der Booking-Seite werden bei **jedem Build automatisch**
aus diesen Dateien erzeugt (`scripts/make-zips.mjs`) — ein neues Pressefoto in
`public/images/press/` landet also von selbst im ZIP. Sie sind deshalb bewusst
nicht eingecheckt.

Die Seite hängt damit **nicht mehr vom alten Wix-Hosting ab** — es kann jederzeit
abgeschaltet werden. Einzige Ausnahme: das Vorschaubild des Videos holt
`scripts/fetch-assets.mjs` beim Build von YouTube. Wer das auch lokal will, legt
einfach eine eigene Datei unter `public/images/video-doom.jpg` ab.

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
