/* src/app.js
   Main application logic ties together UI, barcode scanner, db and optimizer.
   - Commenti in inglese/italiano per punti chiave.
*/

/* NOTE:
   - Default voucher values are set from /config/params.js if you want to customize.
   - This file attaches event listeners, handles forms, and coordinates optimization.
*/

import { DEFAULT_VOUCHER_VALUE_USER, DEFAULT_VOUCHER_VALUE_PARTNER, DEFAULT_VOUCHER_COUNT_USER, DEFAULT_VOUCHER_COUNT_PARTNER } from '../config/params.js';
import * as ui from './ui.js';
import * as db from './db.js';
import { startScanner, stopScanner, onDetected } from './barcode.js';
import { optimizeAssignment } from './optimizer.js';

// in-memory cart
let cart = []; // each item: {id, name, price, qty, barcode}
let settings = {
  voucherValueUser: DEFAULT_VOUCHER_VALUE_USER,
  voucherValuePartner: DEFAULT_VOUCHER_VALUE_PARTNER,
  voucherCountUser: DEFAULT_VOUCHER_COUNT_USER,
  voucherCountPartner: DEFAULT_VOUCHER_COUNT_PARTNER
};

// DOM refs
const form = document.getElementById('product-form');
const cartList = document.getElementById('cart-list');
const cartSummary = document.getElementById('cart-summary');

function saveCartToLocal(){
  localStorage.setItem('st_cart', JSON.stringify(cart));
}
function loadCartFromLocal(){
  const s = localStorage.getItem('st_cart');
  if (s) cart = JSON.parse(s);
  else cart = [];
}
function renderCart(){
  ui.renderCartList(cart, cartList);
  const total = cart.reduce((s,i)=>s + Number(i.price)*Number(i.qty), 0);
  cartSummary.innerHTML = `<div><strong>Totale:</strong> ${ui.formatCurrency(total)}</div>`;
  saveCartToLocal();
}

function addProduct(p){
  p.id = p.id || `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  cart.push(p);
  renderCart();
}

function clearCart(){
  cart = [];
  renderCart();
  localStorage.removeItem('st_cart');
}

// form add
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const price = parseFloat(form.price.value);
  const qty = parseInt(form.qty.value,10) || 1;
  const barcode = form.barcode.value.trim();
  if (!name || !isFinite(price)) return alert('Compila nome e prezzo validi.');
  addProduct({name, price, qty, barcode});
  form.reset();
});

// quick actions
document.getElementById('btn-clear-cart').addEventListener('click', () => {
  if (confirm('Svuotare il carrello?')) clearCart();
});

document.getElementById('btn-optimize').addEventListener('click', async () => {
  if (cart.length === 0) return alert('Carrello vuoto.');
  // Build items
  const items = cart.map((it, idx) => ({ id: it.id, name: it.name, price: Number(it.price), qty: Number(it.qty) }));
  const cfg = {
    voucherValueUser: Number(settings.voucherValueUser),
    voucherValuePartner: Number(settings.voucherValuePartner),
    voucherCountUser: Number(settings.voucherCountUser),
    voucherCountPartner: Number(settings.voucherCountPartner)
  };
  const res = optimizeAssignment(items, cfg);
  showResult(res, cfg, cart);
});

// navigation buttons
document.getElementById('btn-history').addEventListener('click', async () => {
  await renderHistory();
  ui.showScreen('screen-history');
});
document.getElementById('btn-settings').addEventListener('click', () => {
  // populate settings inputs
  document.getElementById('setting-voucher-user').value = settings.voucherValueUser;
  document.getElementById('setting-voucher-partner').value = settings.voucherValuePartner;
  document.getElementById('setting-voucher-count-user').value = settings.voucherCountUser;
  document.getElementById('setting-voucher-count-partner').value = settings.voucherCountPartner;
  ui.showScreen('screen-settings');
});
document.getElementById('btn-settings-back').addEventListener('click', () => ui.showScreen('screen-home'));

document.getElementById('btn-save-settings').addEventListener('click', () => {
  settings.voucherValueUser = Number(document.getElementById('setting-voucher-user').value);
  settings.voucherValuePartner = Number(document.getElementById('setting-voucher-partner').value);
  settings.voucherCountUser = Number(document.getElementById('setting-voucher-count-user').value);
  settings.voucherCountPartner = Number(document.getElementById('setting-voucher-count-partner').value);
  alert('Impostazioni salvate.');
  ui.showScreen('screen-home');
});

// scanner
document.getElementById('btn-scan').addEventListener('click', () => {
  ui.showScreen('screen-scan');
  startScanUI();
});
document.getElementById('btn-scan-back').addEventListener('click', () => {
  stopScanUI();
  ui.showScreen('screen-home');
});
document.getElementById('btn-scan-stop').addEventListener('click', () => {
  stopScanUI();
  ui.showScreen('screen-home');
});

function startScanUI(){
  const video = document.getElementById('video');
  startScanner(video).catch(err => {
    alert('Errore accesso camera: ' + (err && err.message));
    ui.showScreen('screen-home');
  });
  // when barcode detected, populate fields and stop
  onDetected((code) => {
    stopScanUI();
    // heuristics: use barcode as product code; ask user to confirm name/price
    const name = prompt(`Codice rilevato: ${code}\nInserisci nome prodotto (opzionale):`);
    const priceStr = prompt('Inserisci prezzo (€):', '0.00');
    const price = parseFloat(priceStr) || 0;
    const qtyStr = prompt('Quantità:', '1');
    const qty = parseInt(qtyStr,10) || 1;
    if (name && price>0){
      addProduct({name, price, qty, barcode: code});
      ui.showScreen('screen-home');
    } else {
      alert('Prodotto non aggiunto: assicurati di inserire nome e prezzo validi.');
      ui.showScreen('screen-home');
    }
  });
}

function stopScanUI(){
  stopScanner();
}

// result rendering & save
function showResult(res, cfg, originalCart){
  ui.showScreen('screen-result');
  const rc = document.getElementById('result-card');
  rc.innerHTML = `
    <div><strong>Strategia:</strong> ${res.strategy}</div>
    <div><strong>Coperto totale:</strong> ${ui.formatCurrency(res.coveredSum)}</div>
    <hr/>
    <div><strong>Utente (buoni €${cfg.voucherValueUser} × ${cfg.voucherCountUser}):</strong>
      <ul>${res.assignments.user.map(u=>`<li>${u.name} — €${u.price.toFixed(2)}</li>`).join('')}</ul>
      <div><strong>Totale utente:</strong> ${ui.formatCurrency(res.totals.userCovered)}</div>
    </div>
    <div><strong>Partner (buoni €${cfg.voucherValuePartner} × ${cfg.voucherCountPartner}):</strong>
      <ul>${res.assignments.partner.map(u=>`<li>${u.name} — €${u.price.toFixed(2)}</li>`).join('')}</ul>
      <div><strong>Totale partner:</strong> ${ui.formatCurrency(res.totals.partnerCovered)}</div>
    </div>
    <div><strong>Non assegnati:</strong>
      <ul>${res.unassigned.map(u=>`<li>${u.name} — €${u.price.toFixed(2)}</li>`).join('')}</ul>
    </div>
  `;

  document.getElementById('btn-save-result').onclick = async () => {
    const entry = { timestamp: Date.now(), cart: originalCart, result: res };
    await db.saveHistoryEntry(entry);
    alert('Risultato salvato nello storico.');
  };
  document.getElementById('btn-export-json').onclick = () => {
    const data = JSON.stringify({ cart: originalCart, result: res }, null, 2);
    downloadText('split-ticket-result.json', data);
  };
  document.getElementById('btn-export-csv').onclick = () => {
    // Build a CSV containing assigned lines
    const rows = [['who','name','price']];
    res.assignments.user.forEach(u=>rows.push(['user',u.name,u.price]));
    res.assignments.partner.forEach(u=>rows.push(['partner',u.name,u.price]));
    res.unassigned.forEach(u=>rows.push(['unassigned',u.name,u.price]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    downloadText('split-ticket-result.csv', csv);
  };
}

function downloadText(filename, txt){
  const blob = new Blob([txt], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// history
async function renderHistory(){
  const hist = await db.loadHistory();
  const cont = document.getElementById('history-list');
  if (!hist || hist.length === 0){
    cont.innerHTML = '<div class="card">Nessuna voce storica.</div>';
    return;
  }
  cont.innerHTML = hist.map(h => {
    const d = new Date(h.timestamp).toLocaleString();
    const tot = h.result ? h.result.totals.total : 0;
    return `<div class="card"><div><strong>${d}</strong> - Coperto: ${ui.formatCurrency(tot)}</div><details><summary>Dettagli</summary><pre>${JSON.stringify(h, null, 2)}</pre></details></div>`;
  }).join('');
}

document.getElementById('btn-history-back').addEventListener('click', () => ui.showScreen('screen-home'));
document.getElementById('btn-clear-history').addEventListener('click', async () => {
  if (confirm('Eliminare tutte le voci storiche?')){ await db.clearHistory(); renderHistory(); }
});

// initial load
function init(){
  loadCartFromLocal();
  renderCart();
  ui.showScreen('screen-home');

  // cart item delete/edit simple handlers (event delegation)
  cartList.addEventListener('click', (ev) => {
    const t = ev.target;
    if (t.matches('button.del')){
      const idx = Number(t.getAttribute('data-index'));
      if (!isNaN(idx)){
        cart.splice(idx,1);
        renderCart();
      }
    }
  });
}

init();