/**
 * UI module for SplitTicket
 * Handles all user interface interactions and updates
 */

const UI = {
    currentView: 'cart',
    cart: [],
    lastResult: null,
    
    /**
     * Initialize UI
     */
    init() {
        this.setupNavigation();
        this.setupButtons();
        this.setupModal();
        this.loadCart();
        this.loadHistory();
        this.updateCartDisplay();
        this.hideLoading();
    },
    
    /**
     * Setup navigation
     */
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });
    },
    
    /**
     * Switch between views
     */
    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewName);
        });
        
        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });
        
        this.currentView = viewName;
        
        // Handle view-specific actions
        if (viewName === 'scanner') {
            Scanner.startScanning();
            } else if (this.currentView === 'scanner') {
            Scanner.stopScanning();
        }
        
        if (viewName === 'history') {
            this.loadHistory();
        }
    },
    
    /**
     * Close a specific view and return to cart
     */
    closeView(viewName) {
        if (viewName === 'scanner') {
            Scanner.stopScanning();
        }
        this.switchView('cart');
    },
    
    /**
     * Setup button event listeners
     */
    setupButtons() {
        // Cart buttons
        document.getElementById('add-manual-btn').addEventListener('click', () => {
            this.openAddProductModal();
        });
        
        document.getElementById('calculate-btn').addEventListener('click', () => {
            this.calculateSplit();
        });
        
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.confirmClearCart();
        });
        
        // Scanner buttons
        document.getElementById('close-scanner-btn').addEventListener('click', () => {
            this.closeView('scanner');
        });
        
        document.getElementById('manual-entry-btn').addEventListener('click', () => {
            Scanner.stopScanning();
            this.closeView('scanner');
            this.openAddProductModal();
        });
        
        // Result buttons
        document.getElementById('save-split-btn').addEventListener('click', () => {
            this.saveSplit();
        });
        
        // History buttons
        document.getElementById('export-history-btn').addEventListener('click', () => {
            this.showExportOptions();
        });
        
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            this.confirmClearHistory();
        });
        
        // Settings buttons
        document.getElementById('user-voucher').addEventListener('change', (e) => {
            this.updateSetting('VOUCHER_VALUE_USER', parseFloat(e.target.value));
        });
        
        document.getElementById('partner-voucher').addEventListener('change', (e) => {
            this.updateSetting('VOUCHER_VALUE_PARTNER', parseFloat(e.target.value));
        });
        
        document.getElementById('user-name').addEventListener('change', (e) => {
            this.updateSetting('USER_NAME', e.target.value);
        });
        
        document.getElementById('partner-name').addEventListener('change', (e) => {
            this.updateSetting('PARTNER_NAME', e.target.value);
        });
    },
    
    /**
     * Setup modal functionality
     */
    setupModal() {
        const modal = document.getElementById('modal-overlay');
        const form = document.getElementById('product-form');
        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('modal-cancel');
        
        // Close modal handlers
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProductFromForm();
        });
    },
    
    /**
     * Open add product modal
     */
    openAddProductModal(barcode = '') {
        document.getElementById('modal-overlay').style.display = 'flex';
        document.getElementById('product-barcode').value = barcode;
        document.getElementById('product-name').focus();
    },
    
    /**
     * Close modal
     */
    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
        document.getElementById('product-form').reset();
    },
    
    /**
     * Add product from form
     */
    addProductFromForm() {
        const name = document.getElementById('product-name').value.trim();
        const price = parseFloat(document.getElementById('product-price').value);
        const quantity = parseInt(document.getElementById('product-quantity').value);
        const barcode = document.getElementById('product-barcode').value.trim();
        
        if (!name || !price || price <= 0) {
            this.showToast('Inserisci nome e prezzo validi', 'error');
            return;
        }
        
        const product = {
            id: Date.now(),
            name,
            price,
            quantity: quantity || 1,
            barcode: barcode || null
        };
        
        this.cart.push(product);
        this.saveCart();
        this.updateCartDisplay();
        this.closeModal();
        this.showToast(`${name} aggiunto al carrello`, 'success');
    },
    
    /**
     * Remove product from cart
     */
    removeProduct(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartDisplay();
        this.showToast('Prodotto rimosso', 'success');
    },
    
    /**
     * Update cart display
     */
    updateCartDisplay() {
        const container = document.getElementById('cart-items');
        const emptyState = document.getElementById('empty-cart');
        const totalElement = document.getElementById('cart-total');
        
        if (this.cart.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            totalElement.textContent = '€0.00';
            return;
        }
        
        container.style.display = 'flex';
        emptyState.style.display = 'none';
        
        // Calculate total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalElement.textContent = this.formatCurrency(total);
        
        // Render items
        container.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="cart-item-details">
                        ${this.formatCurrency(item.price)} × ${item.quantity}
                        ${item.barcode ? ` • ${item.barcode}` : ''}
                    </div>
                </div>
                <div class="cart-item-price">${this.formatCurrency(item.price * item.quantity)}</div>
                <button class="cart-item-remove" onclick="UI.removeProduct(${item.id})" aria-label="Rimuovi prodotto">
                    🗑️
                </button>
            </div>
        `).join('');
    },
    
    /**
     * Calculate optimal split
     */
    calculateSplit() {
        if (this.cart.length === 0) {
            this.showToast('Aggiungi prodotti al carrello', 'warning');
            return;
        }
        
        // Show loading
        this.showToast('Calcolo in corso...', 'success');
        
        // Run optimization
        setTimeout(() => {
            const result = Optimizer.optimize(this.cart);
            
            if (result) {
                this.lastResult = result;
                this.displayResult(result);
                this.switchView('result');
                this.showToast('Divisione calcolata!', 'success');
            } else {
                this.showToast('Errore nel calcolo', 'error');
            }
        }, 100);
    },
    
    /**
     * Display optimization result
     */
    displayResult(result) {
        const container = document.getElementById('result-content');
        
        const html = `
            <div class="result-section">
                <h2>Riepilogo</h2>
                <div class="summary-row">
                    <span>Totale spesa:</span>
                    <span class="summary-value">${this.formatCurrency(result.summary.total)}</span>
                </div>
                <div class="summary-row">
                    <span>Coperto da buoni:</span>
                    <span class="summary-value">${this.formatCurrency(result.summary.totalCoveredByVouchers)}</span>
                </div>
                <div class="summary-row">
                    <span>Da dividere:</span>
                    <span class="summary-value">${this.formatCurrency(result.summary.remainingToDivide)}</span>
                </div>
            </div>
            
            <div class="result-section">
                <h2>Divisione Ottimale</h2>
                
                <div class="result-person">
                    <div class="person-header">
                        <span class="person-name">${this.escapeHtml(result.user.name)}</span>
                        <span class="person-total">${this.formatCurrency(result.user.toPay)}</span>
                    </div>
                    <div class="person-items">
                        ${result.user.items.map(item => `
                            <div class="person-item">
                                <span>${this.escapeHtml(item.name)} × ${item.quantity}</span>
                                <span>${this.formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="voucher-coverage">
                        💳 Buono copre: ${this.formatCurrency(result.user.voucherCoverage)}
                    </div>
                    ${result.user.toPay - (result.user.subtotal - result.user.voucherCoverage) > 0 ? `
                        <div class="remaining-amount">
                            + Quota resto: ${this.formatCurrency(result.user.toPay - (result.user.subtotal - result.user.voucherCoverage))}
                        </div>
                    ` : ''}
                </div>
                
                <div class="result-person">
                    <div class="person-header">
                        <span class="person-name">${this.escapeHtml(result.partner.name)}</span>
                        <span class="person-total">${this.formatCurrency(result.partner.toPay)}</span>
                    </div>
                    <div class="person-items">
                        ${result.partner.items.map(item => `
                            <div class="person-item">
                                <span>${this.escapeHtml(item.name)} × ${item.quantity}</span>
                                <span>${this.formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="voucher-coverage">
                        💳 Buono copre: ${this.formatCurrency(result.partner.voucherCoverage)}
                    </div>
                    ${result.partner.toPay - (result.partner.subtotal - result.partner.voucherCoverage) > 0 ? `
                        <div class="remaining-amount">
                            + Quota resto: ${this.formatCurrency(result.partner.toPay - (result.partner.subtotal - result.partner.voucherCoverage))}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    /**
     * Save current split to history
     */
    saveSplit() {
        if (!this.lastResult) {
            this.showToast('Nessuna divisione da salvare', 'warning');
            return;
        }
        
        const saved = Storage.saveToHistory(this.lastResult);
        if (saved) {
            this.showToast('Divisione salvata nello storico', 'success');
            this.clearCart();
            this.switchView('cart');
        } else {
            this.showToast('Errore nel salvataggio', 'error');
        }
    },
    
    /**
     * Load and display history
     */
    loadHistory() {
        const history = Storage.getHistory();
        const container = document.getElementById('history-items');
        const emptyState = document.getElementById('empty-history');
        
        if (history.length === 0) {
            container.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }
        
        container.style.display = 'flex';
        emptyState.style.display = 'none';
        
        container.innerHTML = history.map(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="history-item" onclick="UI.showHistoryDetail(${entry.id})">
                    <div class="history-header">
                        <span class="history-date">${dateStr}</span>
                        <span class="history-total">${this.formatCurrency(entry.total)}</span>
                    </div>
                    <div class="history-summary">
                        ${entry.items.length} prodotti • Coperto: ${this.formatCurrency(entry.totalCoveredByVouchers)}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    /**
     * Show history entry detail
     */
    showHistoryDetail(entryId) {
        const history = Storage.getHistory();
        const entry = history.find(e => e.id === entryId);
        
        if (entry) {
            this.lastResult = entry;
            this.displayResult(entry);
            this.switchView('result');
        }
    },
    
    /**
     * Show export options
     */
    showExportOptions() {
        if (confirm('Esportare lo storico in formato CSV?')) {
            Storage.exportHistoryCSV();
            this.showToast('Storico esportato', 'success');
        } else {
            Storage.exportHistoryJSON();
            this.showToast('Storico esportato', 'success');
        }
    },
    
    /**
     * Confirm clear cart
     */
    confirmClearCart() {
        if (this.cart.length === 0) return;
        
        if (confirm('Vuoi svuotare il carrello?')) {
            this.clearCart();
        }
    },
    
    /**
     * Clear cart
     */
    clearCart() {
        this.cart = [];
        this.saveCart();
        this.updateCartDisplay();
        this.showToast('Carrello svuotato', 'success');
    },
    
    /**
     * Confirm clear history
     */
    confirmClearHistory() {
        if (confirm('Vuoi cancellare tutto lo storico? Questa azione non può essere annullata.')) {
            Storage.clearHistory();
            this.loadHistory();
            this.showToast('Storico cancellato', 'success');
        }
    },
    
    /**
     * Update app setting
     */
    updateSetting(key, value) {
        const settings = {};
        settings[key] = value;
        Storage.saveSettings(settings);
        this.showToast('Impostazione salvata', 'success');
    },
    
    /**
     * Save cart to storage
     */
    saveCart() {
        Storage.saveCart(this.cart);
    },
    
    /**
     * Load cart from storage
     */
    loadCart() {
        this.cart = Storage.getCart();
    },
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /**
     * Format currency
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat(CONFIG.LOCALE, {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Hide loading screen
     */
    hideLoading() {
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('app').style.display = 'flex';
        }, 500);
    }
};