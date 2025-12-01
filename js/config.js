// js/config.js
// Gestore di configurazione che utilizza localStorage per la persistenza.

const CONFIG_KEY = 'splitTicketConfig';

// Valori di default usati al primo avvio o se non ci sono impostazioni salvate.
const defaultConfig = {
    APP_VERSION: '1.1.1',
    VOUCHER_VALUE_USER: 7.50,
    VOUCHER_VALUE_PARTNER: 7.00,
    VOUCHER_COUNT_USER: 6,
    VOUCHER_COUNT_PARTNER: 6,
    CURRENCY_SYMBOL: "€",
    CATEGORIES: [
        "Generico", "Frutta e Verdura", "Carne e Pesce", "Pane e Pasticceria",
        "Latticini e Uova", "Surgelati", "Dispensa", "Bevande", "Alcolici",
        "Igiene e Casa", "Bambini", "Animali"
    ],
    NON_VOUCHER_CATEGORIES: ["Alcolici", "Igiene e Casa"]
};

const configManager = {
    /**
     * Carica la configurazione da localStorage. Se non esiste, usa i valori di default.
     * @returns {Object} La configurazione corrente.
     */
    loadConfig() {
        try {
            const savedConfig = localStorage.getItem(CONFIG_KEY);
            if (savedConfig) {
                // Unisce la configurazione salvata con quella di default
                // per garantire che eventuali nuove chiavi di default siano presenti.
                return { ...defaultConfig, ...JSON.parse(savedConfig) };
            }
        } catch (error) {
            console.error("Errore nel caricamento della configurazione, uso i default:", error);
        }
        return defaultConfig;
    },

    /**
     * Salva un oggetto di configurazione in localStorage.
     * @param {Object} newConfig - Il nuovo oggetto di configurazione da salvare.
     */
    saveConfig(newConfig) {
        try {
            localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
            return true;
        } catch (error) {
            console.error("Errore nel salvattaggio della configurazione:", error);
            return false;
        }
    }
};

export default configManager;