# TravelApp

PWA personale per la gestione di viaggi di famiglia. Un motore generico riutilizzabile: aggiungi un viaggio tramite l'admin online, e l'app si aggiorna automaticamente.

**Zero framework. Zero build step. Zero backend.** Solo HTML/CSS/JS puro + Vercel + GitHub.

---

## Come funziona

```
trips/<id>/trip.json   ← tutti i dati del viaggio (orari, eventi, biglietti, voli…)
          └── tickets/ ← PDF biglietti offline
trips/_active.json     ← { "id": "london-2026" } — quale viaggio mostrare
trips/index.json       ← elenco di tutti i viaggi
```

La PWA fetcha `_active.json` → `trip.json` a runtime e costruisce tutta l'interfaccia in JavaScript. L'admin scrive questi file direttamente su GitHub via REST API — ogni salvataggio triggera un Vercel redeploy in ~30 secondi.

---

## Setup (prima volta)

### 1. Crea repo e collega Vercel

```bash
gh repo create frabarz17/TravelApp --public --source=. --push
```

Poi su [vercel.com](https://vercel.com): **New Project** → importa `frabarz17/TravelApp` → Deploy. Nessuna configurazione necessaria: Vercel serve i file statici così com'è.

### 2. Crea un Personal Access Token GitHub

Su GitHub: **Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens**  
Scope richiesto: **Contents** (Read + Write) sulla repo TravelApp.

### 3. Accedi all'admin

Apri `https://tuo-dominio.vercel.app/admin` → inserisci `frabarz17/TravelApp` e il PAT → Accedi.

---

## Aggiungere un nuovo viaggio

**Via admin (consigliato):**
1. Admin → **+ Nuovo viaggio**
2. Compila tutti i tab: Meta, Hotel, Voli, Giorni & Eventi, Biglietti, Info, Mappe
3. **Salva** → il file `trip.json` viene scritto su GitHub → Vercel redeploya
4. **Imposta attivo** → il viaggio appare nella PWA

**Via file JSON (per import massivo):**
1. Crea `trips/<id>/trip.json` seguendo lo schema di `trips/london-2026/trip.json`
2. Aggiungi l'entry in `trips/index.json`
3. `git add trips/ && git commit -m "Aggiunto viaggio" && git push`

---

## Struttura app

### PWA (`/`)

| Sezione | Tab | Contenuto |
|---|---|---|
| Itinerario | Giorni | Day card con timeline eventi, bottone "Guidami" |
| Mappa | Mappa | Google My Maps embed |
| Metro | Metro | Immagine mappa metro scrollabile |
| Info | Info | Convertitore valute · Voli+checklist · Supermercati · Pratiche · Altro |
| Biglietti | Biglietti | Card PDF biglietti (offline-ready) |

Installabile su iPhone/Android come PWA. Funziona offline dopo il primo caricamento (service worker).

### Admin (`/admin`)

| Tab | Cosa si configura |
|---|---|
| Meta & Tema | Nome, date, viaggiatori, colori tema, valute |
| Hotel | Nome, indirizzo, landmark vicini |
| Voli | Dettagli andata/ritorno, checklist imbarco |
| Giorni & Eventi | CRUD giorni e eventi, tipo evento, "Guidami", trasporti |
| Biglietti | CRUD + upload PDF drag&drop |
| Info Locale | Supermercati, pratiche, da prenotare, Oyster Card |
| Mappe | Google My Maps ID, URL mappa metro |

**Helper inclusi:**
- 🗺️ **Testa Guidami** — verifica ogni destinazione aprendola in Google Maps
- **Genera mappa** — costruisce OSM embed URL dall'indirizzo via Nominatim
- **Estrai ID** — ricava il Google My Maps ID dall'URL di condivisione

---

## Stack tecnico

| Componente | Scelta | Motivo |
|---|---|---|
| Frontend | HTML/CSS/JS puro | Zero build step, deploy immediato |
| Admin reattività | Alpine.js (CDN) | Minimo per gestire form nidificati |
| Database | File JSON nel repo | Niente backend, versioning gratis |
| API | GitHub REST API | Lettura/scrittura JSON dal browser |
| Deploy | Vercel | Auto-deploy su push, CDN globale |
| Offline | Service Worker | Cache PDF biglietti + stale-while-revalidate |

---

## Schema trip.json

Vedi [`CLAUDE.md`](CLAUDE.md) per lo schema completo con tutti i campi e i tipi.

Il viaggio di esempio completo è in [`trips/london-2026/trip.json`](trips/london-2026/trip.json).

---

## Git workflow

```bash
git add index.html admin/ trips/
git commit -m "descrizione"
git push   # Vercel deploya in ~30s
```

---

*Progetto personale — Francesco Barzanò*
