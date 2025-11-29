// js/ui.js
// Funzioni dedicate alla manipolazione del DOM e all'aggiornamento dell'interfaccia.

const ui = {
    /**
     * Mostra una schermata e nasconde le altre.
     * @param {HTMLElement} screenToShow - L'elemento della schermata da mostrare.
     * @param {Object} allScreens - Un oggetto contenente tutti gli elementi delle schermate.
     */
    showScreen(screenToShow, allScreens) {
        Object.values(allScreens).forEach(screen => {
            screen.classList.remove('active');
        });
        screenToShow.classList.add('active');
    },

    /**
     * Renderizza gli articoli nel carrello.
     * @param {Array} cart - L'array degli articoli nel carrello.
     * @param {HTMLElement} container - L'elemento contenitore.
     * @param {string} currencySymbol - Il simbolo della valuta.
     * @param {Function} onRemove - Callback da eseguire alla rimozione di un articolo.
     */
    renderCart(cart, container, currencySymbol, onRemove) {
        container.innerHTML = '';
        if (cart.length === 0) {
            container.innerHTML = '<p>Il carrello è vuoto.</p>';
            return;
        }
        cart.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <div class="item-info">
                    <span>${item.name} (x${item.quantity})</span>
                    <br>
                    <small>${(item.price * item.quantity).toFixed(2)}${currencySymbol}</small>
                </div>
                <div class="item-actions">
                    <button data-id="${item.id}" class="remove-item-btn">🗑️</button>
                </div>
            `;
            itemEl.querySelector('.remove-item-btn').addEventListener('click', () => onRemove(item.id));
            container.appendChild(itemEl);
        });
    },

    /**
     * Mostra i risultati dell'ottimizzazione.
     * @param {Object} result - L'oggetto risultato dall'ottimizzatore.
     * @param {Object} config - L'oggetto di configurazione.
     */
    displayResults(result, config) {
        document.getElementById('user-voucher-value').textContent = config.VOUCHER_VALUE_USER.toFixed(2);
        document.getElementById('partner-voucher-value').textContent = config.VOUCHER_VALUE_PARTNER.toFixed(2);

        this.renderResultList(document.getElementById('user-items'), result.user.items, config.CURRENCY_SYMBOL);
        document.getElementById('user-total-covered').textContent = result.user.total.toFixed(2);

        this.renderResultList(document.getElementById('partner-items'), result.partner.items, config.CURRENCY_SYMBOL);
        document.getElementById('partner-total-covered').textContent = result.partner.total.toFixed(2);

        this.renderResultList(document.getElementById('remaining-items'), result.remaining.items, config.CURRENCY_SYMBOL);
        document.getElementById('remaining-total').textContent = result.remaining.total.toFixed(2);
        document.getElementById('remaining-per-person').textContent = result.remaining.perPerson.toFixed(2);
    },

    /**
     * Funzione helper per renderizzare una lista di articoli nei risultati.
     * @param {HTMLElement} ulElement - L'elemento <ul> dove inserire gli articoli.
     * @param {Array} items - L'array di articoli da mostrare.
     * @param {string} currencySymbol - Il simbolo della valuta.
     */
    renderResultList(ulElement, items, currencySymbol) {
        ulElement.innerHTML = '';
        if (items.length === 0) {
            ulElement.innerHTML = '<li>Nessun prodotto in questa categoria.</li>';
            return;
        }
        items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${item.name} (x${item.quantity})</span>
                <span>${(item.price * item.quantity).toFixed(2)}${currencySymbol}</span>
            `;
            ulElement.appendChild(li);
        });
    },

    /**
     * Renderizza lo storico delle spese.
     * @param {Array} history - L'array delle spese salvate.
     * @param {string} currencySymbol - Il simbolo della valuta.
     */
    renderHistory(history, currencySymbol) {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        if (history.length === 0) {
            container.innerHTML = '<p>Nessuna spesa salvata.</p>';
            return;
        }
        history.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <p><strong>Data:</strong> ${new Date(entry.date).toLocaleString('it-IT')}</p>
                <p><strong>Totale Spesa:</strong> ${entry.total.toFixed(2)}${currencySymbol}</p>
                <p><strong>Coperto da Te:</strong> ${entry.user.total.toFixed(2)}${currencySymbol}</p>
                <p><strong>Coperto da Partner:</strong> ${entry.partner.total.toFixed(2)}${currencySymbol}</p>
                <p><strong>Resto diviso:</strong> ${entry.remaining.total.toFixed(2)}${currencySymbol}</p>
            `;
            container.appendChild(el);
        });
    }
};