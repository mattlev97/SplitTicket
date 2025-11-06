/**
 * Configuration file for SplitTicket
 * Modify these values to customize the app for your needs
 */

// === PARAMETRI CONFIGURABILI ===
// Modifica questi valori prima di pubblicare l'app

const CONFIG = {
    // GitHub (opzionale - solo per riferimento)
    GITHUB_USERNAME: "tuousername",
    REPO_NAME: "SplitTicket",
    
    // Buoni pasto - MODIFICA QUESTI VALORI
    VOUCHER_VALUE_USER: 7.50,        // Valore del tuo buono in euro
    VOUCHER_VALUE_PARTNER: 7.00,     // Valore del buono del partner in euro
    VOUCHER_COUNT_USER: 1,           // Numero di buoni disponibili
    VOUCHER_COUNT_PARTNER: 1,        // Numero di buoni disponibili
    
    // Nomi (personalizzazione interfaccia)
    USER_NAME: "Tu",
    PARTNER_NAME: "Lei",
    
    // Colori tema pastello (HEX)
    COLORS: {
        PRIMARY: "#A8D5E2",      // Azzurro pastello
        SECONDARY: "#FFA5A5",    // Rosa pastello
        ACCENT: "#FFD4A3",       // Pesca pastello
        BACKGROUND: "#F5F5F0"    // Beige chiaro
    },
    
    // Impostazioni app
    APP_VERSION: "1.0.0",
    MAX_ITEMS: 20,               // Limite prodotti per calcolo ottimale
    CURRENCY: "€",
    LOCALE: "it-IT",
    
    // Storage keys
    STORAGE_KEYS: {
        CART: "splitticket_cart",
        HISTORY: "splitticket_history",
        SETTINGS: "splitticket_settings"
    }
};

// Export config for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}