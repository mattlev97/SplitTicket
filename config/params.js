/**
 * SplitTicket - Parametri di configurazione globali
 * --------------------------------------------------
 * ⚙️ Modifica questi valori per personalizzare il comportamento dell'app.
 * Questo file definisce:
 *  - I valori dei buoni pasto di ciascun utente
 *  - Il numero di buoni disponibili
 *  - Le informazioni base del repository (per export/report)
 *
 * 🧭 Come modificare:
 *  Apri questo file su GitHub → clicca ✏️ (Edit) → aggiorna i valori → Commit changes.
 */

// === 🪪 Repository Info ===
export const GITHUB_USERNAME = "mattlev97";
export const REPO_NAME = "SplitTicket";

// === 💳 Valori Buoni Pasto ===
export const VOUCHER_VALUE_USER = 7.50;     // Valore buono tuo (€)
export const VOUCHER_VALUE_PARTNER = 7.00;  // Valore buono partner (€)
export const VOUCHER_COUNT_USER = 1;        // Numero buoni tuoi
export const VOUCHER_COUNT_PARTNER = 1;     // Numero buoni partner

// === 🧮 Opzioni varie ===
export const CURRENCY_SYMBOL = "€";         // Simbolo valuta da mostrare
export const MAX_PRODUCTS = 50;             // Numero massimo di prodotti nel carrello

// === 📦 Info per export/report ===
export const APP_NAME = "SplitTicket";
export const APP_VERSION = "1.0.0";
export const AUTHOR = "mattlev97";
export const EXPORT_FILENAME_PREFIX = "splitticket_report";

// === 🎨 Palette colori (pastello) ===
export const COLORS = {
  primary: "#A3C9A8",   // verde pastello
  secondary: "#FFD6A5", // arancio chiaro
  accent: "#FFB5A7",    // rosa salmone
  background: "#F8F9FA" // grigio chiaro neutro
};

// === 🧠 Note sviluppo ===
// Tutti i moduli JS principali importano questi parametri. Se cambi i valori
// qui, le modifiche saranno riflesse in:
// - /src/app.js → calcolo e ottimizzazione
// - /src/ui.js  → layout e colori
// - /src/storage.js → report/esportazione dati
// Non serve ricompilare: basta ricaricare la pagina PWA.