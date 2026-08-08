# CLAUDE.md — TravelApp

Istruzioni per Claude Code. Leggere prima di qualsiasi modifica.

## Cos'è questo progetto

PWA multi-viaggio (HTML/CSS/JS puro, zero framework, zero build step). Un motore generico riutilizzabile per qualsiasi viaggio futuro. Deployato su Vercel con auto-deploy su ogni push a `main`.

Il contenuto di ogni viaggio è separato dalla logica: tutto sta in `trips/<id>/trip.json`.  
L'admin (`/admin`) legge e scrive via GitHub REST API senza bisogno di toccare il codice.

## Stato implementazione

| Fase | Descrizione | Stato |
|---|---|---|
| 1 | Schema trip.json + estrazione dati London2026 | ✅ Completata |
| 2 | PWA shell generica con rendering dinamico | ✅ Completata |
| 3 | Admin interface (Alpine.js + GitHub API) | ✅ Completata |
| 4 | Multi-trip selector (trip switcher nella PWA) | ⏳ Da fare |

## Deployment

- **GitHub:** https://github.com/frabarz17/TravelApp
- **Vercel:** da collegare al repo GitHub dopo il primo push
- **Workflow deploy:** `git add` → `git commit` → `git push` → Vercel deploya in ~30s
- **Non serve nessun build step.** Vercel serve i file statici così com'è.

## Struttura file

```
TravelApp/
├── index.html              ← PWA shell (1338 righe: CSS + JS rendering engine)
├── sw.js                   ← Service worker data-driven (82 righe)
├── manifest.json           ← PWA manifest (aggiornabile dall'admin al set-active)
├── vercel.json             ← cleanUrls + rewrite /admin → /admin/index.html
├── admin/
│   └── index.html          ← Admin SPA Alpine.js + GitHub API (1018 righe)
├── trips/
│   ├── _active.json        ← { "id": "london-2026" } — viaggio attivo
│   ├── index.json          ← Array di tutti i viaggi (per trip selector)
│   └── london-2026/
│       ├── trip.json       ← Tutti i dati del viaggio (~500 righe JSON)
│       └── tickets/        ← 9 PDF biglietti
├── icons/
│   ├── icon-180x180.png
│   ├── icon-192x192.png
│   └── icon-512x512.png
└── CLAUDE.md
```

## Architettura PWA (index.html)

**Sequenza di caricamento:**
1. `main()` → fetch `trips/_active.json` → ottieni trip ID
2. fetch `trips/<id>/trip.json` → oggetto trip completo
3. `applyTheme(theme)` → CSS variables da `meta.theme`
4. `renderHeader(meta)` → title, meta tags
5. `renderDayTabs(days)` / `renderDays(days)` → day cards
6. `renderMapSection` / `renderTickets` / `renderInfoSection` → altre sezioni
7. `initNavigation()` / `initInfoPills()` / `initCurrencyConverter()` / `initSearch()` → interattività
8. `selectTodayOrFirst(trip)` → auto-seleziona giorno corrente

**Funzioni JS principali (index.html):**

| Funzione | Scopo |
|---|---|
| `renderDay(day)` | HTML stringa per una day card |
| `renderEvent(ev)` | HTML stringa per un timeline item |
| `renderFlightCard(leg, isReturn)` | HTML per un volo con checklist |
| `renderMarkets(markets)` | HTML per le card supermercati |
| `renderTickets(tickets, tripId)` | HTML biglietti con link PDF |
| `renderCurrencyConverter(currency)` | HTML del convertitore |
| `initCurrencyConverter(currency)` | Logica FX interattiva |
| `initNavigation()` | Section switcher + iOS fix |
| `initSearch(days)` | Full-text search DOM-based |
| `selectDay(idx)` | Attiva la day card e il tab |
| `selectTodayOrFirst(trip)` | Auto-selezione giorno corrente |
| `cacheTripAssets(trip)` | Manda PDF al service worker |

## Schema trip.json (campi principali)

| Sezione | Contenuto |
|---|---|
| `meta` | id, name, subtitle, destination, flag, startDate/endDate, travelers, theme, currency |
| `hotel` | name, address, zone, landmarks[] |
| `flights.outbound/return` | flightNumber, airline, date, from/to (iata+terminal+time), duration, trackingUrl, checklist[], checklistTitle, note |
| `map` | googleMyMapsId, metroMapUrl |
| `practicalInfo.items[]` | label, value, sub — card info griglia |
| `markets[]` | name, logoLetter, logoColor, address, tag, tagStyle, description, hours, osmEmbedUrl, mapsDirectionsUrl |
| `oyster` | body[], points[], tip |
| `bookingChecklist[]` | name, done, url, note |
| `days[]` | n, date, dateLabel, title, subtitle, style, zone, transportSummary[], badges[], events[] |
| `tickets[]` | name, dayN, dayLabel, pdfPath, isVip |

### Tipi evento (`event.type`)

| Tipo | Dot CSS | Logica admin |
|---|---|---|
| `"visit"` | `.tl-dot` (blue) | Default |
| `"booked"` | `.tl-dot.red` + badge "✓ Prenotato" | `showBookingBadge: false` per dot rosso senza badge |
| `"meal"` | `.tl-dot.gold` | |
| `"logistics"` | `.tl-dot.star` | Transfer, voli, check-in |

### Stile giorno (`day.style`)

| Valore | Colore numero |
|---|---|
| `"default"` | Blue (#012169) |
| `"special"` | Red (#C8102E) — giorni con prenotazioni VIP |
| `"gold"` | Gold (#C5A028) |
| `"last"` | Dark grey (#444) — ultimo giorno |

## Regole critiche — NON TOCCARE

### 1. Fix iOS PWA nav
In `initNavigation()` in index.html:
```javascript
document.body.style.minHeight = (sec === 'mappa' || sec === 'metro') ? '200vh' : '';
```
**Non rimuovere.** Senza questo, in modalità PWA standalone su iOS il nav `position:fixed;bottom:0` fluttua sopra il fondo reale quando il body non è scrollabile (mappa/metro sono `position:fixed` → niente contenuto in flusso).

### 2. UTF-8 safe base64 per GitHub API
```javascript
// Scrittura (testo con emoji/accenti):
const encoded = btoa(unescape(encodeURIComponent(content)));
// Lettura:
const text = decodeURIComponent(escape(atob(r.content.replace(/\s/g, ''))));
```
`btoa()` da solo crasha su caratteri non-ASCII. Usare sempre queste forme.

### 3. PDF upload binario
Per file binari (PDF), usare `FileReader.readAsDataURL` e togliere il prefisso `data:…;base64,`:
```javascript
const base64 = await fileToBase64(file); // già strip del prefisso
await writeFileBinary(path, base64, message); // NON encodeURIComponent
```

## Admin interface

**URL:** `/admin` → `/admin/index.html` (rewrite in vercel.json)

**Auth:** PAT GitHub in `localStorage` (`travelapp_auth`). Scope richiesto: `repo`.

**Come funziona:** Alpine.js legge/scrive via GitHub REST API. Ogni salvataggio triggera Vercel redeploy (~30s). Il viaggio attivo si imposta con il tasto "Imposta attivo" → scrive `trips/_active.json`.

**Tab editor:** Meta & Tema · Hotel · Voli · Giorni & Eventi · Biglietti · Info Locale · Mappe

**Funzionalità speciali:**
- Tasto **🗺️ Testa** su ogni evento → apre Google Maps per verificare la destinazione Guidami
- Tasto **Genera mappa** sui supermercati → geocodifica l'indirizzo via Nominatim e costruisce l'OSM embed URL
- Upload PDF drag&drop → base64 → GitHub API → il path viene aggiornato nel ticket
- Estrattore ID Google My Maps da URL di condivisione

## Service Worker (sw.js)

**Strategia:** cache-first per asset statici; stale-while-revalidate per `trip.json` e `_active.json`; network-only per l'API Frankfurter.

**CACHE_TRIP message:** dopo il caricamento del trip, la PWA manda un messaggio al SW:
```javascript
navigator.serviceWorker.controller.postMessage({
  type: 'CACHE_TRIP',
  tripId: trip.meta.id,
  assets: trip.tickets.map(t => `/trips/${trip.meta.id}/${t.pdfPath}`)
});
```

**Cache key:** `travelapp-v1` — incrementare se si aggiungono nuovi asset statici critici.

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

La proprietà `.info-card::before` usa `var(--accent, var(--blue))` per permettere override per singola card (es. hotel con `--accent: var(--red)`).

## Fase 4 — Da implementare

**Multi-trip selector:** quando `_active.json` non ha un ID valido (o non esiste), la PWA invece di dare errore deve mostrare un selettore di viaggio basato su `trips/index.json`.

```javascript
// In main(), dopo il fetch di _active.json:
if (!active.id) {
  const index = await fetch('/trips/index.json').then(r => r.json());
  renderTripSelector(index.trips);  // da scrivere
  return;
}
```

**`renderTripSelector(trips)`:** mostra le card viaggio (flag, nome, date) e al click imposta l'ID e ricarica.

## Git

```bash
# Workflow standard
git add index.html sw.js admin/ trips/
git commit -m "descrizione"
git push   # → Vercel auto-deploya

# Aggiunta nuovo viaggio
# 1. Creare trips/<id>/trip.json e trips/<id>/tickets/
# 2. Aggiornare trips/index.json
# 3. git add trips/ && git commit && git push
# Oppure usare l'admin che fa tutto in automatico
```

## Riferimento

Il viaggio originale London2026 è conservato intatto in `~/claude/London2026/` come archivio di riferimento (app hardcoded, non toccare).
