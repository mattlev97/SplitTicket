// js/config.js
// File di configurazione centrale per SplitTicket.
// Modifica questi valori per personalizzare l'app.

const config = {
  // INFORMAZIONI SULLA REPOSITORY (per il README e link futuri)
  GITHUB_USERNAME: "TUO_USERNAME_GITHUB", // Sostituisci con il tuo username GitHub
  REPO_NAME: "SplitTicket", // Il nome della tua repository

  // VALORI DEI BUONI PASTO (in euro)
  VOUCHER_VALUE_USER: 7.50, // Valore del tuo buono pasto
  VOUCHER_VALUE_PARTNER: 7.00, // Valore del buono pasto del partner

  // NUMERO DI BUONI PASTO
  VOUCHER_COUNT_USER: 6, // Numero di buoni pasto per te (massimo 6)
  VOUCHER_COUNT_PARTNER: 6, // Numero di buoni pasto per il partner (massimo 6)

  // IMPOSTAZIONI ALGORITMO
  // L'algoritmo di ottimizzazione esatto (backtracking) può essere lento.
  // Se il numero di articoli supera questa soglia, l'app userà un'euristica più veloce (greedy).
  OPTIMIZER_EXACT_THRESHOLD: 20,

  // IMPOSTAZIONI UI
  CURRENCY_SYMBOL: "€", // Simbolo della valuta
};