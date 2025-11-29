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
            const nonVoucherTag = item.isNonVoucher ? '<span class="non-voucher-tag">Solo Contanti</span>' : '';
            itemEl.innerHTML = `
                <div class="item-info">
                    <span>${item.name} (x${item.quantity})</span> ${nonVoucherTag}
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
        const currency = config.CURRENCY_SYMBOL;

        // Sezione prodotti non pagabili con buoni
        const nonVoucherSection = document.getElementById('non-voucher-section');
        if (result.nonVoucherItems && result.nonVoucherItems.length > 0) {
            this.renderResultList(document.getElementById('non-voucher-items'), result.nonVoucherItems, currency);
            document.getElementById('non-voucher-total').textContent = result.nonVoucherTotal.toFixed(2);
            nonVoucherSection.style.display = 'block';
        } else {
            nonVoucherSection.style.display = 'none';
        }

        // Dettagli spesa utente
        document.getElementById('user-voucher-capacity').textContent = (config.VOUCHER_COUNT_USER * config.VOUCHER_VALUE_USER).toFixed(2);
        this.renderResultList(document.getElementById('user-items'), result.user.items, currency);
        document.getElementById('user-cart-total').textContent = result.user.cartTotal.toFixed(2);
        document.getElementById('user-covered').textContent = result.user.coveredByVoucher.toFixed(2);
        document.getElementById('user-cash-to-pay').textContent = result.user.cashToPay.toFixed(2);

        // Dettagli spesa partner
        document.getElementById('partner-voucher-capacity').textContent = (config.VOUCHER_COUNT_PARTNER * config.VOUCHER_VALUE_PARTNER).toFixed(2);
        this.renderResultList(document.getElementById('partner-items'), result.partner.items, currency);
        document.getElementById('partner-cart-total').textContent = result.partner.cartTotal.toFixed(2);
        document.getElementById('partner-covered').textContent = result.partner.coveredByVoucher.toFixed(2);
        document.getElementById('partner-cash-to-pay').textContent = result.partner.cashToPay.toFixed(2);

        // Riepilogo totale
        document.getElementById('grand-total').textContent = result.grandTotal.toFixed(2);
        document.getElementById('total-covered-by-vouchers').textContent = result.totalCovered.toFixed(2);
        document.getElementById('total-cash-to-pay').textContent = result.totalCash.toFixed(2);
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
            ulElement.innerHTML = '<li>Nessun prodotto in questo carrello.</li>';
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
                <p><strong>Totale Spesa:</strong> ${entry.grandTotal.toFixed(2)}${currencySymbol}</p>
                <p><strong>Tua parte pagata:</strong> ${entry.user.cashToPay.toFixed(2)}${currencySymbol}</p>
                <p><strong>Parte Partner pagata:</strong> ${entry.partner.cashToPay.toFixed(2)}${currencySymbol}</p>
                <p><strong>Totale coperto da buoni:</strong> ${entry.totalCovered.toFixed(2)}${currencySymbol}</p>
            `;
            container.appendChild(el);
        });
    }
};