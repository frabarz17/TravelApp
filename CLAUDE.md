# CLAUDE.md — TravelApp

Contesto per Claude Code. Leggere prima di qualsiasi modifica.

## Cos'è questo progetto

PWA multi-viaggio (HTML/CSS/JS puro, zero framework, zero build step). Un motore generico riutilizzabile per qualsiasi viaggio futuro. Deployato su Vercel con auto-deploy su ogni push a `main`.

Il contenuto di ogni viaggio è separato dalla logica dell'app: tutto sta in `trips/<id>/trip.json`.

## Deployment

- **GitHub:** https://github.com/frabarz17/TravelApp  ← da creare
- **Vercel:** da collegare al repo GitHub
- **Workflow deploy:** `git add` → `git commit` → `git push` → Vercel deploya in automatico (~30s)
- **Non serve nessun build step.** Vercel serve i file statici così com'è.

## Struttura file

```
TravelApp/
├── index.html              ← PWA shell generica (rendering dinamico da trip.json)
├── sw.js                   ← Service worker (caching data-driven)
├── manifest.json           ← Generico; nome/colore aggiornati dall'admin al set-active
├── admin/
│   └── index.html          ← Admin SPA (Alpine.js + GitHub API)
├── trips/
│   ├── _active.json        ← { "id": "london-2026" } — viaggio attivo
│   ├── index.json          ← Elenco tutti i viaggi (per trip selector)
│   └── london-2026/
│       ├── trip.json       ← Tutti i dati del viaggio
│       └── tickets/        ← PDF biglietti (9 file)
├── icons/
│   ├── icon-180x180.png
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── vercel.json
```

## Schema trip.json

Ogni viaggio è descritto da un singolo `trip.json`. Campi principali:

| Sezione | Contenuto |
|---|---|
| `meta` | nome, date, viaggiatori, tema colori, valute |
| `hotel` | nome, indirizzo, zone, landmark con distanze |
| `flights.outbound/return` | numero volo, orari, aeroporti+terminal, checklist, note |
| `map` | Google My Maps ID, URL mappa metro |
| `practicalInfo.items` | card informative (trasporti, hotel, budget, meteo) |
| `markets[]` | supermercati vicini con OSM embed URL e Maps directions |
| `oyster` | info Oyster Card (body, punti, tip) |
| `bookingChecklist[]` | cose da prenotare con stato done/not-done |
| `days[]` | 9+ giorni con eventi, trasporti, badge, note |
| `tickets[]` | biglietti PDF con dayN, dayLabel, pdfPath, isVip |

### Tipi di evento (`event.type`)

| Tipo | Dot CSS | Descrizione |
|---|---|---|
| `"logistics"` | `.tl-dot.star` | Transfer, check-in, voli |
| `"visit"` | `.tl-dot` (blue) | Attrazioni, passeggiate |
| `"meal"` | `.tl-dot.gold` | Pranzi, cene |
| `"booked"` | `.tl-dot.red` | Prenotazioni confermate |

Per eventi con dot rosso ma **senza** badge "✓ Prenotato": usare `"type": "booked", "showBookingBadge": false`.

### Stile giorno (`day.style`)

| Valore | Colore numero |
|---|---|
| `"default"` | Blue (#012169) |
| `"special"` | Red (#C8102E) |
| `"gold"` | Gold (#C5A028) |
| `"last"` | Dark grey (#444) |

## Admin interface

**URL:** `/admin` (serve `/admin/index.html`)

**Auth:** GitHub Personal Access Token in `localStorage`. Non multi-utente.

**Come funziona:** L'admin legge e scrive `trips/<id>/trip.json` direttamente via GitHub REST API. Ogni salvataggio triggera un Vercel redeploy (~30s). Il token PAT deve avere scope `repo` (read+write su contenuti).

**Funzionalità:**
- Lista viaggi (da `trips/index.json`)
- Crea/modifica/elimina viaggio
- Set viaggio attivo (scrive `trips/_active.json` + `manifest.json`)
- Editor a tab: Meta, Hotel, Voli, Giorni & Eventi, Biglietti, Info Locale, Mappe
- Upload PDF biglietti (drag & drop → base64 → GitHub API)
- Tasto "Testa Guidami" → apre Google Maps con il valore placeGuide

**TRAP importante:** `btoa()` crasha su caratteri non-ASCII. Usare sempre:
```javascript
const encoded = btoa(unescape(encodeURIComponent(content)));
const decoded = decodeURIComponent(escape(atob(encoded)));
```

## PWA (index.html)

**Sequenza di caricamento:**
1. Fetch `trips/_active.json` → ottieni trip ID
2. Fetch `trips/<id>/trip.json` → dati completo
3. `applyTheme()` → CSS variables da `meta.theme`
4. Render dinamico di tutti i componenti
5. `initNavigation()` → bottom-nav, day tabs, info pills
6. `selectTodayOrFirst()` → auto-seleziona giorno corrente se nel range viaggio

**Sezioni:** itinerario (day cards) · mappa · metro · info (cambio/voli/supermercati/pratiche/altro) · biglietti

**IMPORTANTE — bug iOS PWA (nav che "sale"):** in modalità PWA standalone, `mappa-section` e `metro-section` usano `position: fixed` e non scrollano → il nav si posiziona più in alto. Il JS forza `document.body.style.minHeight = '200vh'` quando si apre mappa/metro. **Non rimuovere questo toggle.**

**Caching PDF:** dopo load del trip, il PWA manda un messaggio al SW:
```javascript
navigator.serviceWorker.controller?.postMessage({
  type: 'CACHE_TRIP',
  tripId: trip.meta.id,
  assets: trip.tickets.map(t => `/trips/${trip.meta.id}/${t.pdfPath}`)
});
```

## Design system

```css
--blue:  (da meta.theme.primary)   /* default #012169 Royal blue */
--red:   (da meta.theme.accent)    /* default #C8102E British red */
--gold:  (da meta.theme.gold)      /* default #C5A028 Gold */
--cream: #FAF7F2                   /* Background — fisso */
--ink:   #1A1A1A                   /* Text principale — fisso */
--muted: #6B6B6B                   /* Text secondario — fisso */
--light: #F0EDE8                   /* Superfici chiare — fisso */
```

Font: `Playfair Display` (titoli) · `DM Sans` (corpo) · `DM Mono` (codici/etichette)

## Git

```bash
# Workflow standard
git add trips/ index.html sw.js admin/
git commit -m "descrizione"
git push   # → Vercel auto-deploya

# Nuovo viaggio: aggiungere trips/<id>/ e aggiornare trips/index.json
```

## Riferimento storico

Il viaggio originale London2026 è conservato intatto in `~/claude/London2026/` come archivio di riferimento.
