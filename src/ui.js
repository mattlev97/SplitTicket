/* src/ui.js
   UI helper functions: render cart, render result, navigation
*/

export function q(sel){ return document.querySelector(sel); }
export function on(el, ev, cb){ el.addEventListener(ev, cb); }

export function showScreen(id){
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.setAttribute('aria-hidden','true');
  });
  const screen = document.getElementById(id);
  if (screen){
    screen.classList.add('active');
    screen.setAttribute('aria-hidden','false');
  }
}

export function renderCartList(items, container){
  // items: [{id,name,price,qty,barcode}]
  container.innerHTML = '';
  items.forEach((it, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${it.name}</strong><div class="muted">€${Number(it.price).toFixed(2)} × ${it.qty}</div></div>
                    <div><button data-index="${idx}" class="btn small">✏️</button> <button data-index="${idx}" class="btn small del">🗑️</button></div>`;
    container.appendChild(li);
  });
}

export function formatCurrency(v){
  return `€${Number(v).toFixed(2)}`;
}