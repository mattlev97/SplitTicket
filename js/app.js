// js/app.js
// File principale che gestisce la logica dell'applicazione e gli eventi.

document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let cart = [];
    let currentOptimizationResult = null;
    let appConfig = configManager.loadConfig();
    let barcodeReader = null;
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
        // Navigazione Globale
        hamburgerBtn: document.getElementById('hamburger-btn'),
        sideMenu: document.getElementById('side-menu'),
        sideMenuOverlay: document.getElementById('side-menu-overlay'),
        sideMenuLinks: document.querySelectorAll('.side-menu-link'),
        bottomNavButtons: document.querySelectorAll('.nav-btn'),
        headerTitle: document.getElementById('header-title'),
        headerSubtitle: document.getElementById('header-subtitle'),

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
        
        // Schermata Scanner
        closeScannerBtn: document.getElementById('close-scanner-btn'),
        scannerVideo: document.getElementById('scanner-video'),
        scannerFeedback: document.getElementById('scanner-feedback'),
        
        // Schermata Risultati
        closeResultBtn: document.getElementById('close-result-btn'),
        saveHistoryBtn: document.getElementById('save-history-btn'),
        
        // Schermata Storico
        exportCsvBtn: document.getElementById('export-csv-btn'),
        exportJsonBtn: document.getElementById('export-json-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Schermata Impostazioni
        installPwaBtn: document.getElementById('install-pwa-btn'),
        saveSettingsBtn: document.getElementById('save-settings-btn'),
        settingUserVoucherValue: document.getElementById('setting-user-voucher-value'),
        settingPartnerVoucherValue: document.getElementById('setting-partner-voucher-value'),
        settingCategories: document.getElementById('setting-categories'),
        settingNonVoucherCategories: document.getElementById('setting-non-voucher-categories'),
    };

    // Mappa dei titoli per le schermate
    const screenTitles = {
        home: 'Split<span class="ticket-part">Ticket</span>',
        history: 'Split<span class="ticket-part">Ticket</span>',
        settings: 'Split<span class="ticket-part">Ticket</span>',
        result: 'Risultati',
        scanner: 'Scanner'
    };

    // Inizializzazione
    function init() {
        addEventListeners();
        db.initDB().then(() => console.log('Database inizializzato.'));
        applyConfig();
        updateCartView();
        navigateTo('home'); // Imposta la schermata iniziale
        initScanner();
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
        // Navigazione
        elements.hamburgerBtn.addEventListener('click', toggleSideMenu);
        elements.sideMenuOverlay.addEventListener('click', toggleSideMenu);
        elements.bottomNavButtons.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.screen)));
        elements.sideMenuLinks.forEach(link => link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.screen);
            toggleSideMenu();
        }));

        // Azioni specifiche
        elements.addItemBtn.addEventListener('click', addItemManually);
        elements.optimizeBtn.addEventListener('click', optimizeAndShowResults);
        elements.scanBarcodeBtn.addEventListener('click', startScanner);
        elements.closeScannerBtn.addEventListener('click', stopScanner);
        elements.closeResultBtn.addEventListener('click', () => navigateTo('home'));
        elements.saveHistoryBtn.addEventListener('click', saveResultToHistory);
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

    // Logica di Navigazione
    function navigateTo(screenName) {
        // Nasconde tutte le schermate
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        
        // Mostra la schermata richiesta
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }

        // Aggiorna il titolo dell'header
        elements.headerTitle.innerHTML = screenTitles[screenName] || 'SplitTicket';

        // Mostra/nascondi il sottotitolo
        if (screenName === 'home' || screenName === 'history' || screenName === 'settings') {
            elements.headerSubtitle.style.display = 'block';
        } else {
            elements.headerSubtitle.style.display = 'none';
        }

        // Aggiorna lo stato attivo della barra inferiore
        elements.bottomNavButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.screen === screenName);
        });

        // Carica i dati se si va allo storico
        if (screenName === 'history') {
            loadHistory();
        }
    }

    function toggleSideMenu() {
        elements.sideMenu.classList.toggle('open');
        elements.sideMenuOverlay.classList.toggle('visible');
    }

    function handleCategoryChange(e) {
        const selectedCategory = e.target.value;
        elements.itemNonVoucherCheckbox.checked = appConfig.NON_VOUCHER_CATEGORIES.includes(selectedCategory);
    }
    
    function saveSettings() {
        const newUserVoucher = parseFloat(elements.settingUserVoucherValue.value);
        const newPartnerVoucher = parseFloat(elements.settingPartnerVoucherValue.value);
        
        if (isNaN(newUserVoucher) || isNaN(newPartnerVoucher) || newUserVoucher < 0 || newPartnerVoucher < 0) {
            alert("I valori dei buoni non sono validi."); return;
        }

        const newConfig = {
            ...appConfig,
            VOUCHER_VALUE_USER: newUserVoucher,
            VOUCHER_VALUE_PARTNER: newPartnerVoucher,
            CATEGORIES: elements.settingCategories.value.split(',').map(s => s.trim()).filter(Boolean),
            NON_VOUCHER_CATEGORIES: elements.settingNonVoucherCategories.value.split(',').map(s => s.trim()).filter(Boolean)
        };

        if (configManager.saveConfig(newConfig)) {
            appConfig = newConfig;
            applyConfig();
            alert("Impostazioni salvate!");
            navigateTo('home');
        } else {
            alert("Errore durante il salvataggio.");
        }
    }

    // Funzioni Logiche Principali
    function addItemManually() {
        const name = elements.itemNameInput.value.trim();
        const price = parseFloat(elements.itemPriceInput.value);
        if (name && !isNaN(price) && price > 0) {
            addItemToCart({ name, price, quantity: 1, category: elements.itemCategorySelect.value, isNonVoucher: elements.itemNonVoucherCheckbox.checked });
            elements.itemNameInput.value = '';
            elements.itemPriceInput.value = '';
            elements.itemNameInput.focus();
        } else {
            alert('Inserisci un nome e un prezzo validi.');
        }
    }

    function addItemToCart(item) {
        const existingItem = cart.find(ci => ci.name.toLowerCase() === item.name.toLowerCase() && ci.isNonVoucher === item.isNonVoucher);
        if (existingItem) {
            existingItem.quantity++;
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
        if (typeof ZXing === 'undefined') {
            console.error("ZXing library not loaded.");
            elements.scanBarcodeBtn.disabled = true;
            elements.scanBarcodeBtn.style.cursor = 'not-allowed';
            elements.scanBarcodeBtn.title = "Funzione scanner non disponibile. Controlla la connessione internet.";
            return;
        }
        try {
            const hints = new Map();
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8]);
            barcodeReader = new ZXing.BrowserMultiFormatReader(hints);
            console.log("Scanner initialized.");
        } catch (error) {
            console.error("Failed to initialize scanner:", error);
            elements.scanBarcodeBtn.disabled = true;
            elements.scanBarcodeBtn.style.cursor = 'not-allowed';
            elements.scanBarcodeBtn.title = "Impossibile avviare lo scanner.";
        }
    }

    async function startScanner() {
        if (!barcodeReader) { alert("Scanner non pronto."); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            elements.scannerVideo.srcObject = stream;
            elements.scannerVideo.play();
            navigateTo('scanner');
            elements.scannerFeedback.textContent = 'Inquadra il codice...';
            barcodeReader.decodeFromStream(elements.scannerVideo, stream, (result, err) => {
                if (result) handleBarcodeResult(result.getText());
                if (err && !(err instanceof ZXing.NotFoundException)) console.error(err);
            });
        } catch (error) {
            console.error('Errore fotocamera:', error);
            alert('Impossibile accedere alla fotocamera.');
            navigateTo('home');
        }
    }

    function stopScanner() {
        if (barcodeReader) barcodeReader.reset();
        const stream = elements.scannerVideo.srcObject;
        if (stream) stream.getTracks().forEach(track => track.stop());
        elements.scannerVideo.srcObject = null;
        navigateTo('home');
    }

    async function handleBarcodeResult(barcode) {
        stopScanner();
        alert('Ricerca prodotto in corso...');
        let productName = `Prodotto ${barcode}`;
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 1 && data.product && data.product.product_name) {
                    productName = data.product.product_name;
                }
            }
        } catch (error) { console.error("Errore Open Food Facts:", error); }
        const name = prompt(`Nome prodotto:`, productName);
        if (name) {
            const price = parseFloat(prompt(`Inserisci il prezzo per "${name}":`));
            if (!isNaN(price) && price > 0) {
                addItemToCart({ name, price, quantity: 1, category: 'Generico', isNonVoucher: false, barcode });
            } else {
                alert('Prezzo non valido.');
            }
        }
    }

    function optimizeAndShowResults() {
        if (cart.length === 0) return;
        const allItems = cart.flatMap(item => Array(item.quantity).fill({ ...item }));
        const voucherItems = allItems.filter(item => !item.isNonVoucher);
        const nonVoucherItems = allItems.filter(item => item.isNonVoucher);
        const result = optimizer.optimizeSplit(voucherItems, appConfig.VOUCHER_VALUE_USER, appConfig.VOUCHER_COUNT_USER, appConfig.VOUCHER_VALUE_PARTNER, appConfig.VOUCHER_COUNT_PARTNER);
        const nonVoucherTotal = nonVoucherItems.reduce((sum, item) => sum + item.price, 0);
        result.user.cashToPay += nonVoucherTotal / 2;
        result.partner.cashToPay += nonVoucherTotal / 2;
        result.totalCash += nonVoucherTotal;
        result.nonVoucherItems = optimizer.groupItems(nonVoucherItems);
        result.nonVoucherTotal = nonVoucherTotal;
        currentOptimizationResult = result;
        ui.displayResults(result, appConfig);
        navigateTo('result');
    }

    async function saveResultToHistory() {
        if (!currentOptimizationResult) return;
        try {
            await db.saveExpense(currentOptimizationResult);
            alert('Spesa salvata!');
            cart = [];
            updateCartView();
            navigateTo('home');
        } catch (error) {
            alert('Errore durante il salvataggio.');
        }
    }

    async function loadHistory() {
        try {
            const history = await db.getExpenses();
            ui.renderHistory(history, appConfig.CURRENCY_SYMBOL);
        } catch (error) { console.error('Errore caricamento storico:', error); }
    }

    async function clearHistory() {
        if (confirm('Sei sicuro di voler cancellare tutto lo storico?')) {
            await db.clearHistory();
            loadHistory();
        }
    }

    function exportHistoryAs(format) {
        db.getExpenses().then(history => {
            if (history.length === 0) { alert('Lo storico è vuoto.'); return; }
            let dataStr, filename, type;
            if (format === 'json') {
                dataStr = JSON.stringify(history, null, 2);
                filename = 'splitticket_history.json';
                type = 'application/json';
            } else {
                const headers = 'Data,Totale,Tua Parte,Parte Partner,Totale Contanti\n';
                const rows = history.map(e => [new Date(e.date).toLocaleString('it-IT'), e.grandTotal.toFixed(2), e.user.cashToPay.toFixed(2), e.partner.cashToPay.toFixed(2), e.totalCash.toFixed(2)].join(',')).join('\n');
                dataStr = headers + rows;
                filename = 'splitticket_history.csv';
                type = 'text/csv';
            }
            const blob = new Blob([dataStr], { type });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    function exportHistoryAsCSV() { exportHistoryAs('csv'); }
    function exportHistoryAsJSON() { exportHistoryAs('json'); }

    function installPWA() {
        if (deferredInstallPrompt) deferredInstallPrompt.prompt();
    }

    // Avvia l'app
    init();
});