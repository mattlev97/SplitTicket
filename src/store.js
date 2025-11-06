// /src/store.js
// Purpose: Persistence layer using IndexedDB with localStorage fallback.
// Exports: saveCart, loadCart, saveHistoryItem, loadHistory, clearHistory, exportJSON, exportCSV

// Simple IndexedDB wrapper
const DB_NAME = 'splitticket-db';
const DB_VERSION = 1;
const STORE_CART = 'cart';
const STORE_HISTORY = 'history';

function openDB(){
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return resolve(null);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_CART)) db.createObjectStore(STORE_CART,{keyPath:'id'});
      if (!db.objectStoreNames.contains(STORE_HISTORY)) db.createObjectStore(STORE_HISTORY,{keyPath:'id'});
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

async function idbPut(storeName, obj){
  const db = await openDB();
  if (!db) return localPut(storeName, obj);
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName,'readwrite');
    const st = tx.objectStore(storeName);
    st.put(obj);
    tx.oncomplete = () => res(true);
    tx.onerror = () => res(false);
  });
}
async function idbGetAll(storeName){
  const db = await openDB();
  if (!db) return localGetAll(storeName);
  return new Promise((res, rej) => {
    const tx = db.transaction(storeName,'readonly');
    const st = tx.objectStore(storeName);
    const req = st.getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => res([]);
  });
}

function localPut(storeName, obj){
  const k = `splitticket.${storeName}`;
  const list = JSON.parse(localStorage.getItem(k)||'[]');
  const idx = list.findIndex(i=>i.id===obj.id);
  if(idx>=0) list[idx]=obj; else list.push(obj);
  localStorage.setItem(k,JSON.stringify(list));
  return Promise.resolve(true);
}
function localGetAll(storeName){
  const k = `splitticket.${storeName}`;
  return Promise.resolve(JSON.parse(localStorage.getItem(k)||'[]'));
}

export async function saveCart(cart){
  const obj = {id:'current', cart, ts:Date.now()};
  return idbPut(STORE_CART,obj);
}

export async function loadCart(){
  const all = await idbGetAll(STORE_CART);
  const found = all.find(i=>i.id==='current');
  return found ? found.cart : [];
}

export async function saveHistoryItem(item){
  const obj = {...item, id: 'h_' + Date.now()};
  return idbPut(STORE_HISTORY, obj);
}

export async function loadHistory(){
  return idbGetAll(STORE_HISTORY);
}

export async function clearHistory(){
  // Clear both IDB and localStorage fallback
  const db = await openDB();
  if (db){
    return new Promise((res,rej)=>{
      const tx = db.transaction(STORE_HISTORY,'readwrite');
      tx.objectStore(STORE_HISTORY).clear();
      tx.oncomplete = ()=>{ localStorage.removeItem('splitticket.history'); res(true); };
      tx.onerror = ()=>res(false);
    });
  } else {
    localStorage.removeItem('splitticket.history');
    return true;
  }
}

export async function exportJSON(){
  const h = await loadHistory();
  return JSON.stringify(h, null, 2);
}

export async function exportCSV(){
  const h = await loadHistory();
  // Flatten into CSV rows: id, ts, total, items(JSON)
  const rows = [['id','ts','total','items']];
  h.forEach(r=>{
    rows.push([r.id, new Date(r.ts).toISOString(), (r.total||0).toFixed(2), JSON.stringify(r.items)]);
  });
  return rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}
