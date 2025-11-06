// /src/app.js
// Scopo: Main app logic (modulo). IMPORT relativi corretti per funzionare su GitHub Pages.
// Nota: questo file include un piccolo overlay di debug visibile su schermo per errori runtime (utile su iPhone).

import { saveCart, loadCart, saveHistoryItem, loadHistory, exportCSV, exportJSON, clearHistory } from './store.js';
import { startScanner, stopScanner } from './scanner.js';
import { optimizeAssignment } from './optimizer.js';
import { setActiveView, renderCart, renderResult, formatMoney } from './ui.js';
import { VOUCHER_VALUE_USER, VOUCHER_VALUE_PARTNER, VOUCHER_COUNT_USER, VOUCHER_COUNT_PARTNER } from '../config/params.js';

// Debug on-screen overlay (temporary helper)
(function(){
  const dbg = document.createElement('div');
  dbg.id = 'app-debug';
  dbg.style.position = 'fixed';
  dbg.style.left = '8px';
  dbg.style.right = '8px';
  dbg.style.bottom = '64px';
  dbg.style.background = 'rgba(255,255,255,0.95)';
  dbg.style.border = '1px solid #eee';
  dbg.style.padding = '6px';
  dbg.style.fontSize = '12px';
  dbg.style.zIndex = 9999;
  dbg.style.display = 'none';
  dbg.style.borderRadius = '8px';
  document.addEventListener('DOMContentLoaded', ()=>document.body.appendChild(dbg));
  window.showAppDebug = (msg)=>{ dbg.style.display='block'; dbg.textContent = msg; };
  window.hideAppDebug = ()=>{ dbg.style.display='none'; dbg.textContent = ''; };
})();

// App state
let cart = [];
let currentSettings = {
  voucherValueUser: VOUCHER_VALUE_USER,
  voucherValuePartner: VOUCHER_VALUE_PARTNER,
  voucherCountUser: VOUCHER_COUNT_USER,
  voucherCountPartner: VOUCHER_COUNT_PARTNER
};

async function init(){
  try {
    // load cart from storage
    cart = await loadCart() || [];
    renderCart(cart);
    // populate settings UI
    document.getElementById('voucher-user').value = currentSettings.voucherValueUser;
    document.getElementById('voucher-partner').value = currentSettings.voucherValuePartner;
    document.getElementById('voucher-count-user').value = currentSettings.voucherCountUser;
    document.getElementById('voucher-count-partner').value = currentSettings.voucherCountPartner;

    bindUI();
    registerSW();
    window.hideAppDebug && window.hideAppDebug();
  } catch (err) {
    console.error(err);
    window.showAppDebug && window.showAppDebug('Init error: ' + (err && err.message ? err.message : String(err)));
  }
}

function registerSW(){
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('/service-worker.js').catch((e)=>{ console.warn('SW register failed', e); });
  }
}

function bindUI(){
  // Navigation
  document.querySelectorAll('.nav-btn').forEach(b=>{
    b.addEventListener('click', ()=> {
      setActiveView(b.dataset.view);
    });
  });

  // Quick add form
  const form = document.getElementById('quick-add-form');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = document.getElementById('input-name').value.trim();
    const price = parseFloat(document.getElementById('input-price').value) || 0;
    const qty = parseInt(document.getElementById('input-qty').value) || 1;
    const barcode = document.getElementById('input-barcode').value.trim();
    if (!name || price <= 0){
      window.showAppDebug && window.showAppDebug('Nome o prezzo non valido');
      return;
    }
    cart.push({id: 'p_' + Date.now(), name, price, qty, barcode});
    saveCart(cart);
    document.dispatchEvent(new CustomEvent('cart:updated',{detail:cart}));
    form.reset();
  });

  // Scanner button
  document.getElementById('btn-scan').addEventListener('click', ()=>{
    setActiveView('view-scanner');
    startScannerFlow();
  });

  // ensure btn-add also triggers submit on some browsers
  document.getElementById('btn-add').addEventListener('click', (e)=>{
    e.preventDefault();
    form.requestSubmit && form.requestSubmit(); // prefer requestSubmit if available
  });

  document.addEventListener('cart:updated', (e)=>{
    cart = e.detail;
    saveCart(cart);
    renderCart(cart);
  });

  document.getElementById('btn-clear').addEventListener('click', ()=>{ cart = []; saveCart(cart); renderCart(cart); });

  // Optimize
  document.getElementById('btn-optimize').addEventListener('click', ()=>{
    if (cart.length === 0) { window.showAppDebug && window.showAppDebug('Carrello vuoto'); return; }
    const res = optimizeAssignment(cart, currentSettings);
    renderResult(res);
    window._lastResult = {...res, items: cart};
    setActiveView('view-result');
  });

  document.getElementById('btn-save-history').addEventListener('click', async ()=>{
    try {
      const last = window._lastResult;
      if (!last) { window.showAppDebug && window.showAppDebug('Nessun risultato da salvare'); return; }
      await saveHistoryItem({items: last.items, total: last.total, result: last, ts: Date.now()});
      window.showAppDebug && window.showAppDebug('Salvato nello storico');
    } catch (err) {
      console.error(err);
      window.showAppDebug && window.showAppDebug('Errore salvataggio: ' + err.message);
    }
  });

  document.getElementById('btn-back-home').addEventListener('click', ()=> setActiveView('view-cart'));

  // Scanner controls
  document.getElementById('btn-stop-scan').addEventListener('click', async ()=>{
    await stopScanner();
    setActiveView('view-cart');
  });

  // History export
  document.getElementById('btn-export-json').addEventListener('click', async ()=>{
    try {
      const json = await exportJSON();
      downloadTextFile('splitticket-history.json', json);
    } catch(err){
      console.error(err);
      window.showAppDebug && window.showAppDebug('Export JSON failed');
    }
  });
  document.getElementById('btn-export-csv').addEventListener('click', async ()=>{
    try {
      const csv = await exportCSV();
      downloadTextFile('splitticket-history.csv', csv);
    } catch(err){
      console.error(err);
      window.showAppDebug && window.showAppDebug('Export CSV failed');
    }
  });
  document.getElementById('btn-clear-history').addEventListener('click', async ()=>{
    if (confirm('Cancella tutto lo storico?')){ await clearHistory(); alert('Storico cancellato'); }
  });

  // Settings
  document.getElementById('btn-save-settings').addEventListener('click', ()=>{
    currentSettings.voucherValueUser = parseFloat(document.getElementById('voucher-user').value) || currentSettings.voucherValueUser;
    currentSettings.voucherValuePartner = parseFloat(document.getElementById('voucher-partner').value) || currentSettings.voucherValuePartner;
    currentSettings.voucherCountUser = parseInt(document.getElementById('voucher-count-user').value) || currentSettings.voucherCountUser;
    currentSettings.voucherCountPartner = parseInt(document.getElementById('voucher-count-partner').value) || currentSettings.voucherCountPartner;
    window.showAppDebug && window.showAppDebug('Impostazioni salvate');
    setActiveView('view-cart');
  });
  document.getElementById('btn-reset-settings').addEventListener('click', ()=>{
    currentSettings = {
      voucherValueUser: VOUCHER_VALUE_USER,
      voucherValuePartner: VOUCHER_VALUE_PARTNER,
      voucherCountUser: VOUCHER_COUNT_USER,
      voucherCountPartner: VOUCHER_COUNT_PARTNER
    };
    document.getElementById('voucher-user').value = currentSettings.voucherValueUser;
    document.getElementById('voucher-partner').value = currentSettings.voucherValuePartner;
    document.getElementById('voucher-count-user').value = currentSettings.voucherCountUser;
    document.getElementById('voucher-count-partner').value = currentSettings.voucherCountPartner;
    window.showAppDebug && window.showAppDebug('Impostazioni ripristinate ai default');
  });

  // Load history when opening history view
  document.querySelector('button[data-view="view-history"]').addEventListener('click', async ()=>{
    const hist = await loadHistory();
    const container = document.getElementById('history-list');
    container.innerHTML = '';
    if (!hist || hist.length===0){ container.textContent = 'Nessuna spesa salvata.'; return;}
    hist.reverse().forEach(h=>{
      const card = document.createElement('div');
      card.className='card';
      const date = new Date(h.ts).toLocaleString();
      card.innerHTML = `<strong>${date} - Totale: ${formatMoney(h.total||0)}</strong><div>${(h.items||[]).map(i=>`${i.name} x${i.qty}`).join('<br>')}</div>`;
      container.appendChild(card);
    });
  });
}

// Utility: download text file
function downloadTextFile(filename, content){
  const blob = new Blob([content], {type:'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Scanner flow
async function startScannerFlow(){
  setActiveView('view-scanner');
  const video = document.getElementById('video');
  const feedback = (msg)=>{ document.getElementById('scan-feedback').textContent = msg; };
  const onDetected = (text) => {
    document.getElementById('input-barcode').value = text;
    // Attempt to auto-fill name/price via simple heuristic (text may be "name|price")
    let suggestedName = '', suggestedPrice = '';
    if (text.includes('|')){
      const parts = text.split('|');
      suggestedName = parts[0];
      suggestedPrice = parseFloat(parts[1]) || '';
    }
    if (suggestedName) document.getElementById('input-name').value = suggestedName;
    if (suggestedPrice) document.getElementById('input-price').value = suggestedPrice;
    alert('Codice rilevato: ' + text + '. Controlla e premi Aggiungi al carrello.');
    stopScanner();
    setActiveView('view-cart');
  };
  await startScanner(video, onDetected, feedback);
}

// Initialize app
document.addEventListener('DOMContentLoaded', init);
