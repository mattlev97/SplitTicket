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
    },

    /**
     * Renderizza i prodotti nell'archivio.
     * @param {Array} products - L'array dei prodotti archiviati.
     * @param {HTMLElement} container - L'elemento contenitore.
     * @param {Function} onSelect - Callback da eseguire alla selezione di un prodotto.
     * @param {Function} onRemove - Callback da eseguire alla rimozione di un prodotto.
     */
    renderArchive(products, container, onSelect, onRemove) {
        container.innerHTML = '';
        if (products.length === 0) {
            container.innerHTML = '<p>Nessun prodotto in archivio. Usa il tasto + per aggiungerne.</p>';
            return;
        }
        products.forEach(product => {
            const cardEl = document.createElement('div');
            cardEl.className = 'archive-card';
            cardEl.innerHTML = `
                <img src="${product.image_url || 'icons/icon-192x192.png'}" alt="${product.name}" class="archive-card-img">
                <div class="archive-card-info">
                    <h4>${product.name}</h4>
                    <p>${product.brands || 'Marca non disponibile'}</p>
                </div>
                <button data-barcode="${product.barcode}" class="remove-item-btn">🗑️</button>
            `;
            cardEl.querySelector('.remove-item-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Evita che il click si propaghi alla card
                onRemove(product.barcode);
            });
            cardEl.addEventListener('click', () => onSelect(product.barcode));
            container.appendChild(cardEl);
        });
    },

    /**
     * Renderizza i dettagli di un prodotto.
     * @param {Object|null} product - L'oggetto prodotto da Open Food Facts. Se null, pulisce la vista.
     * @param {HTMLElement} container - L'elemento contenitore.
     */
    renderProductDetail(product, container) {
        container.innerHTML = ''; // Pulisce sempre prima di iniziare
        if (!product) {
            return;
        }

        // Funzioni helper per estrarre i dati in modo sicuro
        const getName = (p) => p.product_name_it || p.product_name || 'Nome non disponibile';
        const getBrands = (p) => p.brands || 'Marca non disponibile';
        const getImageUrl = (p) => p.image_front_url || 'icons/icon-192x192.png';
        const getQuantity = (p) => p.quantity || 'Non specificata';
        const getIngredients = (p) => p.ingredients_text_it || p.ingredients_text || 'Non specificati';
        const getAllergens = (p) => p.allergens_from_ingredients || 'Nessuno specificato';
        const getCategories = (p) => p.categories || 'Non specificate';
        const getPackaging = (p) => p.packaging || 'Non specificato';
        const getManufacturingPlaces = (p) => p.manufacturing_places || p.origins || 'Non specificato';

        // Helper per formattare array di tag in stringhe leggibili
        const formatTags = (tags) => {
            if (!tags || !Array.isArray(tags) || tags.length === 0) return 'Non specificato';
            return tags
                .map(tag => tag.replace(/^(en|it|fr):/, '').replace(/-/g, ' '))
                .map(tag => tag.charAt(0).toUpperCase() + tag.slice(1))
                .join(', ');
        };

        const getAdditives = (p) => formatTags(p.additives_tags);
        const getTraces = (p) => formatTags(p.traces_tags);
        const getLabels = (p) => formatTags(p.labels_tags);

        const getLifestyle = (p) => {
            const analysis = p.ingredients_analysis_tags || [];
            const lifestyleInfo = [];
            if (analysis.includes('en:vegan')) lifestyleInfo.push('Vegano');
            if (analysis.includes('en:vegetarian')) lifestyleInfo.push('Vegetariano');
            if (analysis.includes('en:palm-oil-free')) lifestyleInfo.push('Senza Olio di Palma');
            
            if (lifestyleInfo.length === 0) return 'Non specificato';
            return lifestyleInfo.join(', ');
        };

        // Helper per creare i badge dei punteggi
        const renderScore = (label, score) => {
            if (!score) return '';
            const scoreClass = `score-${String(score).toLowerCase()}`;
            return `
                <div class="score-item">
                    <strong>${label}:</strong>
                    <span class="score-badge ${scoreClass}">${String(score).toUpperCase()}</span>
                </div>
            `;
        };

        // Helper per creare le righe della tabella nutrizionale
        const renderNutrimentRow = (label, value, unit) => {
            if (value === undefined || value === null) return '';
            return `<tr><td>${label}</td><td>${parseFloat(value).toFixed(2)} ${unit}</td></tr>`;
        };

        const nutriments = product.nutriments || {};

        const detailHTML = `
            <div class="product-detail-header">
                <img src="${getImageUrl(product)}" alt="${getName(product)}">
                <h2>${getName(product)}</h2>
                <p>${getBrands(product)} - ${getQuantity(product)}</p>
            </div>
            <div class="product-detail-section scores-section">
                <h3>Punteggi</h3>
                <div class="scores-container">
                    ${renderScore('Nutri-Score', product.nutriscore_grade)}
                    ${renderScore('Eco-Score', product.ecoscore_grade)}
                    ${renderScore('NOVA', product.nova_group)}
                </div>
            </div>
            <div class="product-detail-section">
                <h3>Ingredienti</h3>
                <p>${getIngredients(product)}</p>
            </div>
            <div class="product-detail-section">
                <h3>Allergeni e Tracce</h3>
                <p><strong>Allergeni dichiarati:</strong> ${getAllergens(product)}</p>
                <p><strong>Può contenere tracce di:</strong> ${getTraces(product)}</p>
            </div>
            <div class="product-detail-section">
                <h3>Additivi</h3>
                <p>${getAdditives(product)}</p>
            </div>
            <div class="product-detail-section">
                <h3>Certificazioni e Stile di Vita</h3>
                <p><strong>Certificazioni:</strong> ${getLabels(product)}</p>
                <p><strong>Stile di vita:</strong> ${getLifestyle(product)}</p>
            </div>
            <div class="product-detail-section">
                <h3>Valori Nutrizionali (per 100g)</h3>
                <table class="nutrition-table">
                    <tbody>
                        ${renderNutrimentRow('Energia', nutriments['energy-kcal_100g'], 'kcal')}
                        ${renderNutrimentRow('Grassi', nutriments.fat_100g, 'g')}
                        ${renderNutrimentRow('di cui Saturi', nutriments['saturated-fat_100g'], 'g')}
                        ${renderNutrimentRow('Carboidrati', nutriments.carbohydrates_100g, 'g')}
                        ${renderNutrimentRow('di cui Zuccheri', nutriments.sugars_100g, 'g')}
                        ${renderNutrimentRow('Fibre', nutriments.fiber_100g, 'g')}
                        ${renderNutrimentRow('Proteine', nutriments.proteins_100g, 'g')}
                        ${renderNutrimentRow('Sale', nutriments.salt_100g, 'g')}
                    </tbody>
                </table>
            </div>
            <div class="product-detail-section">
                <h3>Altre Informazioni</h3>
                <p><strong>Categorie:</strong> ${getCategories(product)}</p>
                <p><strong>Packaging:</strong> ${getPackaging(product)}</p>
                <p><strong>Luogo di produzione:</strong> ${getManufacturingPlaces(product)}</p>
            </div>
        `;
        container.innerHTML = detailHTML;
    },

    /**
     * Aggiunge la sezione dei prodotti simili a una vista di dettaglio già renderizzata.
     * @param {Array} similarProducts - Array di prodotti simili.
     * @param {HTMLElement} container - L'elemento contenitore del dettaglio prodotto.
     * @param {Function} onSimilarProductClick - Callback per il click su un prodotto simile.
     */
    appendSimilarProducts(similarProducts, container, onSimilarProductClick) {
        if (!similarProducts || similarProducts.length === 0) return;

        const similarSectionHTML = `
            <div class="product-detail-section">
                <h3>Prodotti Simili</h3>
                <div id="similar-products-container" class="similar-products-container"></div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', similarSectionHTML);
        
        const similarContainer = container.querySelector('#similar-products-container');
        similarProducts.forEach(p => {
            const card = document.createElement('div');
            card.className = 'similar-product-card';
            card.innerHTML = `
                <img src="${p.image_front_url || 'icons/icon-192x192.png'}" alt="${p.product_name || ''}">
                <div class="similar-product-info">
                    <strong>${p.product_name_it || p.product_name || 'Senza nome'}</strong>
                    <p>${p.brands || 'Marca sconosciuta'}</p>
                </div>
            `;
            card.addEventListener('click', () => onSimilarProductClick(p.code));
            similarContainer.appendChild(card);
        });
    }
};

export default ui;