# AGENTS.md — Istruzioni per agenti AI

Linee guida operative per Claude Code (e altri agenti) che lavorano su questo repo.

## Orientamento rapido

Questo progetto è una **PWA statica multi-viaggio** senza build step, framework o backend.  
Ogni viaggio è descritto da un `trips/<id>/trip.json`. La PWA lo fetcha a runtime.  
L'admin (`/admin`) scrive direttamente su GitHub via REST API.

**Leggi sempre `CLAUDE.md` prima di iniziare qualsiasi modifica** — contiene le regole critiche (iOS fix, UTF-8 base64, schema dati).

## Come esplorare il codice

```
index.html       — tutto CSS (righe 1–460) + HTML shell + JS rendering engine
sw.js            — service worker (~82 righe, semplice)
admin/index.html — admin SPA con Alpine.js (~1018 righe)
trips/london-2026/trip.json — esempio completo di dati viaggio
```

Per capire come un campo viene renderizzato: cerca il nome del campo in `index.html` (es. `ev.placeGuide`, `day.style`, `t.isVip`). Le funzioni di rendering sono tutte nella sezione `<script>` dopo il body HTML.

Per capire come un campo viene editato nell'admin: cerca in `admin/index.html` con `x-model="trip.` — ogni binding Alpine corrisponde a un campo del JSON.

## Pattern: aggiungere un campo a trip.json

1. Aggiungi il campo al `trip.json` di london-2026 come esempio
2. In `index.html`: aggiungi il rendering in `renderDay()` / `renderEvent()` / funzione pertinente
3. In `admin/index.html`: aggiungi il campo al tab pertinente come `<input x-model="trip.path.del.campo">`
4. In `admin/index.html → emptyTrip()`: aggiungi il default per i nuovi viaggi
5. Testa con python3 -m http.server dal root di TravelApp

## Pattern: aggiungere un nuovo tipo di evento

1. Aggiungi il type in `renderEvent()` in `index.html` (funzione `dotClass()`)
2. Aggiungi l'opzione nel selettore radio in `admin/index.html` (sezione "Tipo evento")
3. Aggiungi il badge style in `admin/index.html` (oggetto `{ visit:…, booked:…, … }`)
4. Aggiorna `CLAUDE.md` nella tabella "Tipi evento"

## Pattern: modificare l'admin (nuovo tab o nuova sezione)

1. Aggiungi il pulsante tab nell'HTML: `<button class="tab" :class="{ active: tab === 'nome' }" @click="tab = 'nome'">Label</button>`
2. Aggiungi il div contenuto: `<div x-show="tab === 'nome'">…</div>`
3. Se serve nuovo stato Alpine: aggiungilo in `admin()` → `init` e in `emptyTrip()`

## Pattern: aggiungere un nuovo viaggio (manuale, senza admin)

```bash
mkdir trips/nuovo-id/tickets/
# Creare trips/nuovo-id/trip.json seguendo lo schema di london-2026/trip.json
# Aggiornare trips/index.json aggiungendo l'entry
git add trips/
git commit -m "Aggiunto viaggio: nome-viaggio"
git push
# Poi usare l'admin → "Imposta attivo" per attivarlo
```

## Testing locale

```bash
cd /Users/francescobarzano/claude/TravelApp
python3 -m http.server 8765
# Apri http://localhost:8765 → PWA
# Apri http://localhost:8765/admin → Admin (richiede PAT GitHub)
```

Il service worker non si attiva su localhost in modo normale; usa Chrome DevTools → Application → Service Workers per simulare offline.

## Regole operative

### NON fare
- Non usare `btoa(content)` diretto su stringhe con emoji o accenti → crasha. Usare sempre `btoa(unescape(encodeURIComponent(content)))`.
- Non rimuovere `document.body.style.minHeight = '200vh'` in `initNavigation()` — è il fix iOS PWA nav.
- Non aggiungere framework o build step. Tutto deve funzionare con `python3 -m http.server`.
- Non toccare `~/claude/London2026/` — è solo un archivio di riferimento.
- Non modificare `trips/london-2026/trip.json` durante test — è il dato reale del viaggio.

### SÌ fare
- Preferire modifiche chirurgiche a file singoli rispetto a refactor larghi.
- Testare sempre il render visivo con il server locale dopo modifiche a `index.html`.
- Verificare che l'admin salvi correttamente prima di committare modifiche ai campi.
- Aggiornare `CLAUDE.md` se aggiungi nuovi pattern architetturali rilevanti.

## Fase 4 da implementare

**Multi-trip selector** — quando `_active.json` non ha un ID valido, mostrare una schermata di selezione del viaggio basata su `trips/index.json`. Vedere la sezione "Fase 4" in `CLAUDE.md` per i dettagli.

Lavoro stimato: 2–3 ore. A basso rischio — solo aggiunta in `main()` di index.html, nessuna modifica alle funzioni esistenti.

## Contesto storico

Il viaggio London2026 (luglio–agosto 2026) è stato il primo viaggio. Il `trip.json` è stato estratto da un `index.html` monolitico di 2488 righe con tutti i dati hardcoded. L'app originale è in `~/claude/London2026/` e su GitHub come `frabarz17/London2026`.
