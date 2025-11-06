// /src/ui.js
// Purpose: UI helper functions: render cart, results, history, manage views and accessibility

export function formatMoney(v){ return '€' + v.toFixed(2); }

export function setActiveView(id){
  document.querySelectorAll('.view').forEach(v=>{
    if (v.id === id){ v.classList.add('active'); v.removeAttribute('aria-hidden'); }
    else { v.classList.remove('active'); v.setAttribute('aria-hidden','true'); }
  });
  document.querySelectorAll('.nav-btn').forEach(b=> b.classList.toggle('active', b.dataset.view === id));
}

export function renderCart(items){
  const list = document.getElementById('items');
  list.innerHTML = '';
  let total = 0;
  items.forEach((it, idx)=>{
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${escapeHtml(it.name)}</strong> <span class="muted">x${it.qty}</span></div>
                    <div>${formatMoney(it.price*it.qty)}</div>`;
    const del = document.createElement('button');
    del.textContent = '✖';
    del.className = 'secondary';
    del.setAttribute('aria-label','Rimuovi prodotto');
    del.addEventListener('click', ()=> {
      items.splice(idx,1);
      // save and re-render handled externally
      document.dispatchEvent(new CustomEvent('cart:updated',{detail:items}));
    });
    li.appendChild(del);
    list.appendChild(li);
    total += it.price*it.qty;
  });
  document.getElementById('total-amount').textContent = formatMoney(total);
}

export function renderResult(res){
  const el = document.getElementById('result-card');
  el.innerHTML = '';
  const total = res.total || 0;
  const userPart = document.createElement('div');
  userPart.innerHTML = `<h3>Tu - buoni coperti: ${formatMoney(res.coveredAmountUser)}</h3>`;
  res.assignmentUser.forEach(it=>{
    const p = document.createElement('div'); p.textContent = `${it.name} x${it.qty} — ${formatMoney(it.price*it.qty)}`; userPart.appendChild(p);
  });
  const partnerPart = document.createElement('div');
  partnerPart.innerHTML = `<h3>Lei - buoni coperti: ${formatMoney(res.coveredAmountPartner)}</h3>`;
  res.assignmentPartner.forEach(it=>{
    const p = document.createElement('div'); p.textContent = `${it.name} x${it.qty} — ${formatMoney(it.price*it.qty)}`; partnerPart.appendChild(p);
  });
  const remainder = document.createElement('div');
  remainder.innerHTML = `<h3>Resto da dividere: ${formatMoney(total - res.coveredAmountUser - res.coveredAmountPartner)}</h3>
                         <div>Tu: ${formatMoney(res.remainderSplit.user)} — Lei: ${formatMoney(res.remainderSplit.partner)}</div>`;
  el.appendChild(userPart); el.appendChild(partnerPart); el.appendChild(remainder);
}

export function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
