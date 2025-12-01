// js/app.js
// File principale che gestisce la logica dell'applicazione e gli eventi.

document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let cart = [];
    let currentOptimizationResult = null;
    let appConfig = configManager.loadConfig();
    let deferredInstallPrompt = null;
    let isScannerReady = false;

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
        scannerContainer: document.getElementById('scanner-container'),
        closeScannerBtn: document.getElementById('close-scanner-btn'),
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
        allCategoriesContainer: document.getElementById('all-categories-container'),
        newCategoryInput: document.getElementById('new-category-input'),
        addCategoryBtn: document.getElementById('add-category-btn'),
        nonVoucherCategoriesContainer: document.getElementById('non-voucher-categories-container'),
        newNonVoucherCategoryInput: document.getElementById('new-non-voucher-category-input'),
        addNonVoucherCategoryBtn: document.getElementById('add-non-voucher-category-btn'),
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
        navigateTo('home');
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
        renderCategoryCards(elements.allCategoriesContainer, appConfig.CATEGORIES, 'all');
        renderCategoryCards(elements.nonVoucherCategoriesContainer, appConfig.NON_VOUCHER_CATEGORIES, 'non-voucher');
    }

    // Gestione Eventi
    function addEventListeners() {
        elements.hamburgerBtn.addEventListener('click', toggleSideMenu);
        elements.sideMenuOverlay.addEventListener('click', toggleSideMenu);
        elements.bottomNavButtons.forEach(btn => btn.addEventListener('click', () => navigateTo(btn.dataset.screen)));
        elements.sideMenuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.screen);
                toggleSideMenu();
            });
        });

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
        
        elements.addCategoryBtn.addEventListener('click', () => addCategory(elements.newCategoryInput, 'all'));
        elements.addNonVoucherCategoryBtn.addEventListener('click', () => addCategory(elements.newNonVoucherCategoryInput, 'non-voucher'));

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            elements.installPwaBtn.style.display = 'block';
        });
    }

    function navigateTo(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        if (screens[screenName]) screens[screenName].classList.add('active');
        elements.headerTitle.innerHTML = screenTitles[screenName] || 'SplitTicket';
        elements.headerSubtitle.style.display = ['home', 'history', 'settings'].includes(screenName) ? 'block' : 'none';
        elements.bottomNavButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.screen === screenName));
        if (screenName === 'history') loadHistory();
        if (screenName === 'settings') populateSettingsForm();
    }

    function toggleSideMenu() {
        elements.sideMenu.classList.toggle('open');
        elements.sideMenuOverlay.classList.toggle('visible');
    }

    function handleCategoryChange(e) {
        elements.itemNonVoucherCheckbox.checked = appConfig.NON_VOUCHER_CATEGORIES.includes(e.target.value);
    }
    
    function saveSettings() {
        const newUserVoucher = parseFloat(elements.settingUserVoucherValue.value);
        const newPartnerVoucher = parseFloat(elements.settingPartnerVoucherValue.value);
        if (isNaN(newUserVoucher) || isNaN(newPartnerVoucher) || newUserVoucher < 0 || newPartnerVoucher < 0) {
            alert("I valori dei buoni non sono validi."); return;
        }
        
        // Le categorie sono già aggiornate nell'oggetto appConfig dalle funzioni add/delete
        const newConfig = {
            ...appConfig,
            VOUCHER_VALUE_USER: newUserVoucher,
            VOUCHER_VALUE_PARTNER: newPartnerVoucher,
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
        if (existingItem) existingItem.quantity++;
        else cart.push({ id: Date.now(), ...item });
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
        if (typeof Quagga !== 'undefined') {
            isScannerReady = true;
            console.log("Scanner (QuaggaJS) pronto.");
        } else {
            elements.scanBarcodeBtn.disabled = true;
            elements.scanBarcodeBtn.title = "Libreria scanner non caricata.";
        }
    }

    function startScanner() {
        if (!isScannerReady) {
            alert("Scanner non pronto.");
            return;
        }
        navigateTo('scanner');
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: elements.scannerContainer,
                constraints: { width: 480, height: 320, facingMode: "environment" },
            },
            decoder: { readers: ["ean_reader"] },
        }, (err) => {
            if (err) {
                console.error(err);
                alert("Errore durante l'avvio dello scanner. Controlla i permessi della fotocamera.");
                stopScanner();
                return;
            }
            console.log("Scanner avviato.");
            Quagga.start();
        });

        Quagga.onDetected(handleBarcodeResult);
    }

    function stopScanner() {
        if (typeof Quagga !== 'undefined') {
            Quagga.offDetected(handleBarcodeResult);
            Quagga.stop();
        }
        navigateTo('home');
    }

    async function handleBarcodeResult(quaggaData) {
        const barcode = quaggaData.codeResult.code;
        stopScanner();
        alert('Ricerca prodotto in corso...');
        
        let productNameForPrompt = '';

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (response.ok) {
                const productData = await response.json();
                if (productData.status === 1 && productData.product) {
                    const product = productData.product;
                    let foundName = product.product_name_it || product.product_name || product.generic_name_it || product.generic_name || null;

                    if (foundName) {
                        foundName = foundName.trim();
                        if (product.brands && !foundName.toLowerCase().includes(product.brands.toLowerCase())) {
                            productNameForPrompt = `${product.brands} - ${foundName}`;
                        } else {
                            productNameForPrompt = foundName;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Errore durante la ricerca su Open Food Facts:", error);
            alert("Errore di rete. Impossibile contattare il database dei prodotti. Controlla la tua connessione e riprova.");
            return; // Interrompe l'esecuzione per evitare di chiedere l'input all'utente
        }

        if (productNameForPrompt === '') {
            alert(`Prodotto con codice ${barcode} non trovato nel database. Inseriscilo manualmente.`);
        }

        const name = prompt(`Nome prodotto:`, productNameForPrompt);
        if (name) {
            const priceStr = prompt(`Inserisci il prezzo per "${name}":`);
            const price = parseFloat(priceStr);
            if (!isNaN(price) && price > 0) {
                addItemToCart({ name, price, quantity: 1, category: 'Generico', isNonVoucher: false, barcode });
            } else if (priceStr !== null) {
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

    // Funzioni per la gestione delle categorie
    function renderCategoryCards(container, categories, type) {
        container.innerHTML = '';
        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.textContent = category;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-category-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.onclick = () => deleteCategory(category, type);
            
            card.appendChild(deleteBtn);
            container.appendChild(card);
        });
    }

    function addCategory(inputElement, type) {
        const newCategories = inputElement.value.split(',').map(c => c.trim()).filter(c => c);
        if (newCategories.length === 0) return;

        const targetArray = type === 'all' ? appConfig.CATEGORIES : appConfig.NON_VOUCHER_CATEGORIES;
        const container = type === 'all' ? elements.allCategoriesContainer : elements.nonVoucherCategoriesContainer;

        newCategories.forEach(cat => {
            if (!targetArray.includes(cat)) {
                targetArray.push(cat);
            }
        });
        
        inputElement.value = '';
        renderCategoryCards(container, targetArray, type);
    }

    function deleteCategory(categoryToDelete, type) {
        if (type === 'all') {
            appConfig.CATEGORIES = appConfig.CATEGORIES.filter(c => c !== categoryToDelete);
            renderCategoryCards(elements.allCategoriesContainer, appConfig.CATEGORIES, 'all');
        } else {
            appConfig.NON_VOUCHER_CATEGORIES = appConfig.NON_VOUCHER_CATEGORIES.filter(c => c !== categoryToDelete);
            renderCategoryCards(elements.nonVoucherCategoriesContainer, appConfig.NON_VOUCHER_CATEGORIES, 'non-voucher');
        }
    }

    init();
});