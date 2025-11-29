// js/db.js
// Gestore per IndexedDB per memorizzare lo storico delle spese.

const db = {
    dbName: 'SplitTicketDB',
    dbVersion: 1,
    storeName: 'expenses',
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
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    },

    saveExpense(expenseData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
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
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result.reverse()); // Mostra i più recenti prima
            request.onerror = (event) => reject('Errore nel recupero dello storico: ' + event.target.error);
        });
    },

    clearHistory() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (event) => reject('Errore nella pulizia dello storico: ' + event.target.error);
        });
    }
};