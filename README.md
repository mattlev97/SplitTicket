# SplitTicket 🎟️

SplitTicket è una Progressive Web App (PWA) mobile-first per dividere la spesa in modo ottimale utilizzando i buoni pasto.

## ✨ Funzionalità

- **Inserimento Rapido Prodotti**: Aggiungi nome e prezzo dei prodotti al carrello.
- **Scanner Codici a Barre**: Usa la fotocamera per rilevare i codici a barre (richiede inserimento manuale di nome/prezzo dopo la scansione).
- **Algoritmo di Ottimizzazione**: Calcola la migliore assegnazione dei prodotti ai buoni pasto per massimizzare il risparmio.
- **Storico Spese**: Salva e rivedi le tue spese passate.
- **Esportazione Dati**: Esporta lo storico in formato CSV o JSON.
- **100% Offline**: Funziona completamente offline grazie all'uso di Service Worker e IndexedDB.
- **Sviluppo da iPhone**: Progettato per essere creato e mantenuto interamente da un browser mobile.

## 🚀 Come usare l'app

1.  Apri l'URL dell'app (una volta pubblicata su GitHub Pages).
2.  Aggiungi i prodotti al carrello manualmente o usando lo scanner.
3.  Premi "Ottimizza Divisione" per vedere il risultato.
4.  Salva la spesa nello storico se vuoi tenerne traccia.
5.  **Per installarla**: Su iPhone, apri l'app in Safari, tocca l'icona di condivisione e seleziona "Aggiungi a schermata Home".

## 📱 Mockup dell'interfaccia

```
+---------------------------------------+
| SplitTicket                     ⚙️    |
+---------------------------------------+
| [Carrello]                            |
| - Latte (x1)               1.50€   🗑️ |
| - Pane (x1)                2.00€   🗑️ |
| - Pasta (x2)               3.00€   🗑️ |
|                                       |
| Totale: 6.50€                         |
+---------------------------------------+
| [Nome prodotto] [Prezzo] [Add] [📷]   |
| [       Ottimizza Divisione       ]   |
+---------------------------------------+
```

## 🛠️ Sviluppo e Deploy (solo da iPhone)

Questa app è stata pensata per essere sviluppata senza un computer.

### Creazione della Repository

1.  Apri `github.com` su Safari e accedi.
2.  Crea una nuova repository chiamata `SplitTicket`.
3.  Nella nuova repository, usa il pulsante "Add file" -> "Create new file".
4.  Crea ogni file (`index.html`, `css/style.css`, etc.) copiando e incollando il codice fornito. **Attenzione**: per i file in sottocartelle come `css/style.css`, scrivi il percorso completo nel nome del file.

### Deploy su GitHub Pages

1.  Vai su "Settings" nella tua repository GitHub.
2.  Scorri fino alla sezione "Pages".
3.  Sotto "Branch", seleziona `main` e la cartella `/ (root)`.
4.  Clicca "Save".
5.  Dopo qualche minuto, la tua app sarà live all'indirizzo `https://<TUO_USERNAME>.github.io/SplitTicket/`.

## 📜 Licenza

Questo progetto è rilasciato sotto la [Licenza MIT](LICENSE).