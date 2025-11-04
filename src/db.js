/* src/db.js
   Simple storage layer using IndexedDB with fallback to localStorage.
   - Exposes: saveCart, loadCart, saveHistoryEntry, loadHistory, clearHistory, exportJSON/CSV
*/

/* Comments:
   - We keep an IndexedDB database 'splitTicketDB' with object stores 'carts' and 'history'.
   - If IndexedDB not available, fallback to localStorage under keys 'st_cart' and 'st_history'.
*/

const DB_NAME = 'splitTicketDB';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';

function promisifyRequest(req){
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

export async function openDB(){
  if (!('indexedDB' in window)) return null;
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_HISTORY)){
        db.createObjectStore(STORE_HISTORY, { keyPath: 'id', autoIncrement: true });
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function saveHistoryEntry(entry){
  // entry: {timestamp, cart, result}
  const db = await openDB();
  if (db){
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      store.add(entry);
      tx.oncomplete = () => res(true);
      tx.onerror = () => rej(tx.error);
    });
  } else {
    // fallback localStorage
    const list = JSON.parse(localStorage.getItem('st_history') || '[]');
    list.push({id:Date.now(), ...entry});
    localStorage.setItem('st_history', JSON.stringify(list));
    return true;
  }
}

export async function loadHistory(){
  const db = await openDB();
  if (db){
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_HISTORY, 'readonly');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.getAll();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  } else {
    return JSON.parse(localStorage.getItem('st_history') || '[]');
  }
}

export async function clearHistory(){
  const db = await openDB();
  if (db){
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE_HISTORY, 'readwrite');
      const store = tx.objectStore(STORE_HISTORY);
      const req = store.clear();
      req.onsuccess = () => res(true);
      req.onerror = () => rej(req.error);
    });
  } else {
    localStorage.removeItem('st_history');
    return true;
  }
}

export function exportCSV(history){
  // history: array of entries
  const rows = [];
  rows.push(['id','timestamp','cart_json','result_json']);
  history.forEach(h => {
    rows.push([
      h.id || '',
      new Date(h.timestamp).toISOString(),
      JSON.stringify(h.cart),
      JSON.stringify(h.result)
    ]);
  });
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}

export function exportJSON(history){
  return JSON.stringify(history, null, 2);
}