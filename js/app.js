// js/app.js
// File principale che gestisce la logica dell'applicazione e gli eventi.

document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let cart = [];
    let currentOptimizationResult = null;
    let appConfig = configManager.loadConfig(); // Carica la configurazione all'avvio
    
    let barcodeReader = null; // Verrà inizializzato al primo uso
    let deferredInstallPrompt = null;

    // Elementi del DOM
    const screens = {
        home: document.getElementById('home-screen'),
        scanner: document.getElementById('scanner-screen'),
        result: document.getElementById('result-screen'),
        history: document.getElementById('history-screen'),
        settings: document.getElementById('settings-screen'),
    };

    const elements = {
        // Schermata Home
        appVersionSpan: document.getElementById('app-version'),
        itemCategorySelect: document.getElementById('item-category'),
        itemNameInput: document.getElementById('item-name'),
        itemPriceInput: document.getElementById('item-price'),
        itemNonVoucherCheckbox: document.getElementById('item-non-voucher'),
        addItemBtn: document.getElementById('add-item-btn'),
        scanBarcodeBtn: document.getElementById('scan-barcode-btn'),
        optimizeBtn: document.getElementById('optimize-btn'),
        cartItemsContainer: document.getElementById('cart-items'),
        totalAmountSpan: document.getElementById('total-amount'),
        settingsBtn: document.getElementById('settings-btn'),
        
        // Schermata Scanner
        closeScannerBtn: document.getElementById('close-scanner-btn'),
        scannerVideo: document.getElementById('scanner-video'),
        scannerFeedback: document.getElementById('scanner-feedback'),
        
        // Schermata Risultati
        closeResultBtn: document.getElementById('close-result-btn'),
        saveHistoryBtn: document.getElementById('save-history-btn'),
        
        // Schermata Storico
        closeHistoryBtn: document.getElementById('close-history-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        exportJsonBtn: document.getElementById('export-json-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Schermata Impostazioni
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        historyLink: document.getElementById('history-link'),
        installPwaBtn: document.getElementById('install-pwa-btn'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        settingUserVoucherValue: document.getElementById('setting-user-voucher-value'),
        settingPartnerVoucherValue: document.getElementById('setting-partner-voucher-value'),
        settingCategories: document.getElementById('setting-categories'),
        settingNonVoucherCategories: document.getElementById('setting-non-voucher-categories'),
    };

    // Inizializzazione
    init();

    function init() {
        addEventListeners();
        db.initDB().then(() => console.log('Database inizializzato.'));
        applyConfig();
        updateCartView();
    }
    
    function applyConfig() {
        populateCategories();
        populateSettingsForm();
        elements.appVersionSpan.textContent = `v${appConfig.APP_VERSION}`;
    }

    function populateCategories() {
        elements.itemCategorySelect.innerHTML = '';
        appConfig.CATEGORIES.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            elements.itemCategorySelect.appendChild(option);
        });
    }
    
    function populateSettingsForm() {
        elements.settingUserVoucherValue.value = appConfig.VOUCHER_VALUE_USER;
        elements.settingPartnerVoucherValue.value = appConfig.VOUCHER_VALUE_PARTNER;
        elements.settingCategories.value = appConfig.CATEGORIES.join(', ');
        elements.settingNonVoucherCategories.value = appConfig.NON_VOUCHER_CATEGORIES.join(', ');
    }

    // Gestione Eventi
    function addEventListeners() {
        elements.addItemBtn.addEventListener('click', addItemManually);
        elements.optimizeBtn.addEventListener('click', optimizeAndShowResults);
        elements.scanBarcodeBtn.addEventListener('click', startScanner);
        elements.closeScannerBtn.addEventListener('click', stopScanner);
        elements.closeResultBtn.addEventListener('click', () => ui.showScreen(screens.home, screens));
        elements.saveHistoryBtn.addEventListener('click', saveResultToHistory);
        elements.settingsBtn.addEventListener('click', () => ui.showScreen(screens.settings, screens));
        elements.closeSettingsBtn.addEventListener('click', () => ui.showScreen(screens.home, screens));
        elements.historyLink.addEventListener('click', showHistory);
        elements.closeHistoryBtn.addEventListener('click', () => ui.showScreen(screens.settings, screens));
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
        elements.exportCsvBtn.addEventListener('click', exportHistoryAsCSV);
        elements.exportJsonBtn.addEventListener('click', exportHistoryAsJSON);
        elements.installPwaBtn.addEventListener('click', installPWA);
        elements.itemCategorySelect.addEventListener('change', handleCategoryChange);
        elements.saveSettingsBtn.addEventListener('click', saveSettings);

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            elements.installPwaBtn.style.display = 'block';
        });
    }

    function handleCategoryChange(e) {
        const selectedCategory = e.target.value;
        elements.itemNonVoucherCheckbox.checked = appConfig.NON_VOUCHER_CATEGORIES.includes(selectedCategory);
    }
    
    function saveSettings() {
        const newUserVoucher = parseFloat(elements.settingUserVoucherValue.value);
        const newPartnerVoucher = parseFloat(elements.settingPartnerVoucherValue.value);
        
        if (isNaN(newUserVoucher) || isNaN(newPartnerVoucher) || newUserVoucher < 0 || newPartnerVoucher < 0) {
            alert("I valori dei buoni non sono validi.");
            return;
        }

        const newCategories = elements.settingCategories.value.split(',').map(s => s.trim()).filter(Boolean);
        const newNonVoucherCategories = elements.settingNonVoucherCategories.value.split(',').map(s => s.trim()).filter(Boolean);

        const newConfig = {
            ...appConfig,
            VOUCHER_VALUE_USER: newUserVoucher,
            VOUCHER_VALUE_PARTNER: newPartnerVoucher,
            CATEGORIES: newCategories,
            NON_VOUCHER_CATEGORIES: newNonVoucherCategories
        };

        if (configManager.saveConfig(newConfig)) {
            appConfig = newConfig; // Aggiorna la configurazione in memoria
            applyConfig(); // Riapplica la configurazione all'UI
            alert("Impostazioni salvate con successo!");
            ui.showScreen(screens.home, screens);
        } else {
            alert("Errore durante il salvataggio delle impostazioni.");
        }
    }

    // Funzioni Logiche
    function addItemManually() {
        const name = elements.itemNameInput.value.trim();
        const price = parseFloat(elements.itemPriceInput.value);
        const category = elements.itemCategorySelect.value;
        const isNonVoucher = elements.itemNonVoucherCheckbox.checked;

        if (name && !isNaN(price) && price > 0) {
            addItemToCart({ name, price, quantity: 1, category, isNonVoucher });
            elements.itemNameInput.value = '';
            elements.itemPriceInput.value = '';
            elements.itemNameInput.focus();
        } else {
            alert('Inserisci un nome e un prezzo validi.');
        }
    }

    function addItemToCart(item) {
        const existingItem = cart.find(cartItem =>
            cartItem.name.toLowerCase() === item.name.toLowerCase() &&
            cartItem.isNonVoucher === item.isNonVoucher
        );
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id: Date.now(), ...item });
        }
        updateCartView();
    }

    function removeItemFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        updateCartView();
    }

    function updateCartView() {
        ui.renderCart(cart, elements.cartItemsContainer, appConfig.CURRENCY_SYMBOL, removeItemFromCart);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.totalAmountSpan.textContent = total.toFixed(2);
        elements.optimizeBtn.disabled = cart.length === 0;
    }

    function initScanner() {
        if (barcodeReader) return; // Già inizializzato

        if (typeof ZXing === 'undefined') {
            alert("Libreria di scansione non ancora pronta. Riprova tra un istante.");
            return;
        }
        
        const hints = new Map();
        const formats = [
            ZXing.BarcodeFormat.EAN_13,
            ZXing.BarcodeFormat.EAN_8,
            ZXing.BarcodeFormat.UPC_A,
            ZXing.BarcodeFormat.UPC_E
        ];
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
        barcodeReader = new ZXing.BrowserMultiFormatReader(hints);
    }

    async function startScanner() {
        initScanner();
        if (!barcodeReader) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            elements.scannerVideo.srcObject = stream;
            elements.scannerVideo.play();
            ui.showScreen(screens.scanner, screens);
            elements.scannerFeedback.textContent = 'Inquadra il codice a barre al centro del riquadro.';

            barcodeReader.decodeFromStream(elements.scannerVideo, stream, (result, err) => {
                if (result) {
                    handleBarcodeResult(result.getText());
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error(err);
                    elements.scannerFeedback.textContent = 'Scansione fallita. Prova con più luce e metti a fuoco.';
                }
            });
        } catch (error) {
            console.error('Errore accesso fotocamera:', error);
            alert('Impossibile accedere alla fotocamera. Assicurati di aver dato i permessi.');
            ui.showScreen(screens.home, screens);
        }
    }

    function stopScanner() {
        if (barcodeReader) {
            barcodeReader.reset();
        }
        const stream = elements.scannerVideo.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        elements.scannerVideo.srcObject = null;
        ui.showScreen(screens.home, screens);
    }

    function handleBarcodeResult(barcode) {
        stopScanner();
        const name = prompt(`Codice a barre rilevato: ${barcode}\nInserisci il nome del prodotto:`, `Prodotto ${barcode}`);
        if (name) {
            const priceStr = prompt(`Inserisci il prezzo per "${name}":`);
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0) {
                addItemToCart({ name, price, quantity: 1, category: 'Generico', isNonVoucher: false, barcode });
            } else {
                alert('Prezzo non valido.');
            }
        }
    }

    function optimizeAndShowResults() {
        if (cart.length === 0) return;

        const allItems = cart.flatMap(item =>
            Array(item.quantity).fill({ name: item.name, price: item.price, isNonVoucher: item.isNonVoucher })
        );

        const voucherItems = allItems.filter(item => !item.isNonVoucher);
        const nonVoucherItems = allItems.filter(item => item.isNonVoucher);

        const result = optimizer.optimizeSplit(
            voucherItems,
            appConfig.VOUCHER_VALUE_USER,
            appConfig.VOUCHER_COUNT_USER,
            appConfig.VOUCHER_VALUE_PARTNER,
            appConfig.VOUCHER_COUNT_PARTNER
        );

        const nonVoucherTotal = nonVoucherItems.reduce((sum, item) => sum + item.price, 0);
        const nonVoucherSplit = nonVoucherTotal / 2;

        result.user.cashToPay += nonVoucherSplit;
        result.partner.cashToPay += nonVoucherSplit;
        result.totalCash += nonVoucherTotal;
        
        result.nonVoucherItems = optimizer.groupItems(nonVoucherItems);
        result.nonVoucherTotal = nonVoucherTotal;
        
        currentOptimizationResult = result;
        ui.displayResults(result, appConfig);
        ui.showScreen(screens.result, screens);
    }

    async function saveResultToHistory() {
        if (currentOptimizationResult) {
            try {
                await db.saveExpense(currentOptimizationResult);
                alert('Spesa salvata nello storico!');
                cart = [];
                updateCartView();
                ui.showScreen(screens.home, screens);
            } catch (error) {
                console.error('Errore nel salvataggio:', error);
                alert('Errore durante il salvataggio della spesa.');
            }
        }
    }

    async function showHistory() {
        try {
            const history = await db.getExpenses();
            ui.renderHistory(history, appConfig.CURRENCY_SYMBOL);
            ui.showScreen(screens.history, screens);
        } catch (error) {
            console.error('Errore nel caricamento dello storico:', error);
        }
    }

    async function clearHistory() {
        if (confirm('Sei sicuro di voler cancellare tutto lo storico? L\'azione è irreversibile.')) {
            await db.clearHistory();
            showHistory(); // Ricarica la vista vuota
        }
    }

    function exportHistoryAs(format) {
        db.getExpenses().then(history => {
            if (history.length === 0) {
                alert('Lo storico è vuoto.');
                return;
            }
            let dataStr, filename, type;
            if (format === 'json') {
                dataStr = JSON.stringify(history, null, 2);
                filename = 'splitticket_history.json';
                type = 'application/json';
            } else { // CSV
                const headers = 'Data,Totale,Coperto da Te,Coperto da Partner,Resto\n';
                const rows = history.map(e => 
                    [
                        new Date(e.date).toLocaleString('it-IT'),
                        e.grandTotal.toFixed(2),
                        e.user.cashToPay.toFixed(2),
                        e.partner.cashToPay.toFixed(2),
                        (e.user.cashToPay + e.partner.cashToPay).toFixed(2)
                    ].join(',')
                ).join('\n');
                dataStr = headers + rows;
                filename = 'splitticket_history.csv';
                type = 'text/csv';
            }
            
            const blob = new Blob([dataStr], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    function exportHistoryAsCSV() { exportHistoryAs('csv'); }
    function exportHistoryAsJSON() { exportHistoryAs('json'); }

    function installPWA() {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the A2HS prompt');
                }
                deferredInstallPrompt = null;
            });
        }
    }
});