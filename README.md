# SplitTicket

Scopo: PWA mobile-first per iPhone che aiuta te e la tua ragazza a dividere la spesa ottimizzando l'uso dei buoni pasto.

Principali funzionalità:
- Inserimento rapido prodotti (nome, prezzo, qty, barcode opzionale)
- Scansione barcode dalla camera del telefono (via browser)
- Algoritmo esatto per assegnare prodotti ai buoni massimizzando l'importo coperto senza eccedere
- Cronologia esportabile (CSV/JSON)
- PWA installabile su iPhone (note su limitazioni iOS)
- Repository: SplitTicket

Mockup testuali:
- Home/Carrello: lista prodotti, aggiungi prodotto rapido, pulsante Scanner, Calcola ottimizzazione
- Scanner: stream camera con overlay, precompila i campi del prodotto
- Risultato: assegnazione prodotti ai buoni + divisione del resto
- Storico: elenco spese, esporta CSV/JSON

Installazione rapida su iPhone (crea i file dal browser):
1. Accedi a github.com/<tuo_utente>/SplitTicket
2. Crea file usando "Add file" > "Create new file" e incolla il contenuto di ogni file presente in questa repo seguendo i percorsi.
3. Commit dei file, poi vai su Settings > Pages per abilitare GitHub Pages (branch: main, folder: / root).

Comandi / Suggerimenti:
- Edit file direttamente dal browser iPhone usando l'editor web di GitHub.
- Test locale: apri `index.html` da GitHub Pages una volta pubblicato, oppure usa Replit/StackBlitz per test rapido.

Template Issue / PR:
Title: [feature|bug]: breve descrizione
Body:
1. Contesto
2. Cosa è cambiato
3. Test eseguiti
4. Note per il reviewer

License: MIT
