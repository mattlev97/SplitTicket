/**
 * Storage module for SplitTicket
 * Handles data persistence using localStorage with IndexedDB fallback
 */

const Storage = {
    
    /**
     * Initialize storage and load settings
     */
    init() {
        this.loadSettings();
    },
    
    /**
     * Load user settings from storage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
            if (saved) {
                const settings = JSON.parse(saved);
                // Apply saved settings to CONFIG
                Object.assign(CONFIG, settings);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },
    
    /**
     * Save user settings to storage
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            Object.assign(CONFIG, settings);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    },
    
    /**
     * Get cart items
     */
    getCart() {
        try {
            const cart = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
            return cart ? JSON.parse(cart) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    },
    
    /**
     * Save cart items
     */
    saveCart(items) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
            return true;
        } catch (error) {
            console.error('Error saving cart:', error);
            return false;
        }
    },
    
    /**
     * Clear cart
     */
    clearCart() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.CART);
            return true;
        } catch (error) {
            console.error('Error clearing cart:', error);
            return false;
        }
    },
    
    /**
     * Get history of saved splits
     */
    getHistory() {
        try {
            const history = localStorage.getItem(CONFIG.STORAGE_KEYS.HISTORY);
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    },
    
    /**
     * Save a split to history
     */
    saveToHistory(split) {
        try {
            const history = this.getHistory();
            const entry = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                ...split
            };
            history.unshift(entry); // Add to beginning
            
            // Keep only last 50 entries
            if (history.length > 50) {
                history.splice(50);
            }
            
            localStorage.setItem(CONFIG.STORAGE_KEYS.HISTORY, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error saving to history:', error);
            return false;
        }
    },
    
    /**
     * Clear all history
     */
    clearHistory() {
        try {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.HISTORY);
            return true;
        } catch (error) {
            console.error('Error clearing history:', error);
            return false;
        }
    },
    
    /**
     * Export history as JSON
     */
    exportHistoryJSON() {
        const history = this.getHistory();
        const dataStr = JSON.stringify(history, null, 2);
        this.downloadFile(dataStr, 'splitticket-history.json', 'application/json');
    },
    
    /**
     * Export history as CSV
     */
    exportHistoryCSV() {
        const history = this.getHistory();
        if (history.length === 0) {
            return;
        }
        
        // CSV header
        let csv = 'Data,Totale,Coperto Buoni,Da Dividere,Prodotti\n';
        
        // CSV rows
        history.forEach(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString('it-IT');
            const total = entry.total.toFixed(2);
            const covered = entry.totalCoveredByVouchers.toFixed(2);
            const remaining = entry.remainingToDivide.toFixed(2);
            const items = entry.items.length;
            
            csv += `"${date}","${total}","${covered}","${remaining}","${items}"\n`;
        });
        
        this.downloadFile(csv, 'splitticket-history.csv', 'text/csv');
    },
    
    /**
     * Helper function to trigger file download
     */
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};