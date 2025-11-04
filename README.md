# SplitTicket

**SplitTicket** — PWA mobile-first per iPhone per dividere la spesa e ottimizzare l'uso dei buoni pasto.
Default: tu €7.50, lei €7.00, repo: `SplitTicket`.

## Scopo
App leggera (Vanilla JS) che:
- Inserisce prodotti velocemente (nome, prezzo, qty, barcode opzionale)
- Scanner barcode via camera (ZXing via CDN) con fallback manuale
- Ottimizza assegnazione prodotti a buoni pasto (massimizza importo coperto senza eccedere)
- Storico esportabile (CSV/JSON)
- PWA installabile su iPhone (note su limitazioni iOS incluse)

## Palette (pastello)
- Soft Blue: `#A9D6E5`
- Mint: `#C6F6D5`
- Peach: `#FFD6C5`
- Mauve: `#DCC6E0`

## Come usare (crea repo e file da iPhone)
1. Crea un nuovo repo su GitHub: `github.com/<tuo_utente>/SplitTicket`
2. Usa l'editor web (o GitHub mobile) per aggiungere i file nella struttura indicata.
   - Suggerimento pratico: apri `github.com/<tuo_utente>/SplitTicket/new` e incolla i file
3. Prima di creare i file: modifica `/config/params.js` con il tuo `GITHUB_USERNAME`.
4. Commit e push.

## Deploy su GitHub Pages
1. Vai su Settings > Pages > Branch: `main` (o `master`) > root `/`
2. Salva: la tua app sarà disponibile su `https://<tuo_utente>.github.io/SplitTicket/`.

## Sviluppo e test solo da iPhone
- Apri `index.html` nel browser dopo il deploy oppure usa un servizio di hosting temporaneo (es. StackBlitz, Replit) se vuoi testare prima.
- iOS: Safari non supporta prompt "Add to Home Screen" automatico per PWA con cam; usa "Condividi → Aggiungi a Home" per installare.

## File principali
- `index.html` — entry
- `src/app.js` — logica UI/app
- `src/barcode.js` — scanner barcode (ZXing CDN)
- `src/optimizer.js` — algoritmo di ottimizzazione (exact + heuristics)
- `src/db.js` — storage (IndexedDB con fallback a localStorage)
- `service-worker.js` — caching PWA
- `manifest.webmanifest` — meta PWA

## Template Issue / PR
Use the templates below when opening PRs.

### PR Template