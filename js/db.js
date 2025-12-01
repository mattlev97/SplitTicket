// js/db.js
// Gestore per IndexedDB per memorizzare lo storico delle spese e l'archivio prodotti.

const db = {
    dbName: 'SplitTicketDB',
    dbVersion: 2, // Versione incrementata per onupgradeneeded
    stores: {
        expenses: 'expenses',
        products: 'products'
    },
    db: null,

    initDB() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                return resolve(this.db);
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('Errore IndexedDB:', event.target.errorCode);
                reject('Errore durante l\'apertura del database.');
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.stores.expenses)) {
                    db.createObjectStore(this.stores.expenses, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(this.stores.products)) {
                    // Usiamo il barcode come chiave unica per evitare duplicati
                    db.createObjectStore(this.stores.products, { keyPath: 'barcode' });
                }
            };
        });
    },

    // Metodi per le Spese
    saveExpense(expenseData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.expenses], 'readwrite');
            const store = transaction.objectStore(this.stores.expenses);
            const expenseRecord = {
                date: new Date().toISOString(),
                ...expenseData
            };
            const request = store.add(expenseRecord);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Errore nel salvataggio della spesa: ' + event.target.error);
        });
    },

    getExpenses() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.expenses], 'readonly');
            const store = transaction.objectStore(this.stores.expenses);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result.reverse()); // Mostra i più recenti prima
            request.onerror = (event) => reject('Errore nel recupero dello storico: ' + event.target.error);
        });
    },

    clearHistory() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.expenses], 'readwrite');
            const store = transaction.objectStore(this.stores.expenses);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Errore nella pulizia dello storico: ' + event.target.error);
        });
    },

    // Metodi per i Prodotti Archiviati
    saveProduct(productData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.products], 'readwrite');
            const store = transaction.objectStore(this.stores.products);
            // 'put' aggiorna il record se la chiave (barcode) esiste già, altrimenti lo crea.
            const request = store.put(productData);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Errore nel salvataggio del prodotto: ' + event.target.error);
        });
    },

    getProducts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.products], 'readonly');
            const store = transaction.objectStore(this.stores.products);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject('Errore nel recupero dei prodotti: ' + event.target.error);
        });
    },

    deleteProduct(barcode) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.stores.products], 'readwrite');
            const store = transaction.objectStore(this.stores.products);
            const request = store.delete(barcode);

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Errore nell\'eliminazione del prodotto: ' + event.target.error);
        });
    }
};

export default db;