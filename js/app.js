// js/app.js
// File principale che gestisce la logica dell'applicazione e gli eventi.

// Importa le funzioni per le notifiche toast
import { showLoading, dismissToast, showSuccess, showError } from './utils/toast.js';
import configManager from './config.js';
import db from './db.js';
import optimizer from './optimizer.js';
import ui from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let cart = [];
    let currentOptimizationResult = null;
    let appConfig = configManager.loadConfig();
    let deferredInstallPrompt = null;
    let isScannerReady = false;
    let scannerContext = 'cart'; // 'cart' o 'archive'

    // Elementi del DOM
    const screens = {
        home: document.getElementById('home-screen'),
        scanner: document.getElementById('scanner-screen'),
        result: document.getElementById('result-screen'),
        history: document.getElementById('history-screen'),
        archive: document.getElementById('archive-screen'),
        productDetail: document.getElementById('product-detail-screen'),
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

        // Schermata Archivio
        archiveList: document.getElementById('archive-list'),
        addToArchiveBtn: document.getElementById('add-to-archive-btn'),

        // Schermata Dettaglio Prodotto
        productDetailContent: document.getElementById('product-detail-content'),
        closeDetailBtn: document.getElementById('close-detail-btn'),
        
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
        archive: 'Split<span class="ticket-part">Ticket</span>',
        productDetail: 'Dettaglio Prodotto',
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
        elements.scanBarcodeBtn.addEventListener('click', startScannerForCart);
        elements.addToArchiveBtn.addEventListener('click', startScannerForArchive);
        elements.closeScannerBtn.addEventListener('click', stopScanner);
        elements.closeResultBtn.addEventListener('click', () => navigateTo('home'));
        elements.closeDetailBtn.addEventListener('click', () => navigateTo('archive'));
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
        elements.headerSubtitle.style.display = ['home', 'history', 'settings', 'archive'].includes(screenName) ? 'block' : 'none';
        
        // Nasconde la bottom nav per le schermate di dettaglio/modali
        const mainContentScreens = ['home', 'history', 'archive', 'settings'];
        document.getElementById('bottom-nav').style.display = mainContentScreens.includes(screenName) ? 'flex' : 'none';

        elements.bottomNavButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.screen === screenName));
        if (screenName === 'history') loadHistory();
        if (screenName === 'archive') loadArchive();
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
            showError("I valori dei buoni non sono validi."); return;
        }
        
        const newConfig = {
            ...appConfig,
            VOUCHER_VALUE_USER: newUserVoucher,
            VOUCHER_VALUE_PARTNER: newPartnerVoucher,
        };

        if (configManager.saveConfig(newConfig)) {
            appConfig = newConfig;
            applyConfig();
            showSuccess("Impostazioni salvate!");
            navigateTo('home');
        } else {
            showError("Errore durante il salvataggio.");
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
            showError('Inserisci un nome e un prezzo validi.');
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

    function startScannerForCart() {
        scannerContext = 'cart';
        startScanner();
    }

    function startScannerForArchive() {
        scannerContext = 'archive';
        startScanner();
    }

    function startScanner() {
        if (!isScannerReady) {
            showError("Scanner non pronto.");
            return;
        }
        navigateTo('scanner');
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: elements.scannerContainer,
                constraints: { width: 640, height: 480, facingMode: "environment" },
                area: { top: "30%", right: "10%", left: "10%", bottom: "30%" }
            },
            decoder: { readers: ["ean_reader"] },
        }, (err) => {
            if (err) {
                console.error(err);
                showError("Errore avvio scanner. Controlla i permessi della fotocamera.");
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
        const targetScreen = scannerContext === 'archive' ? 'archive' : 'home';
        navigateTo(targetScreen);
    }

    async function handleBarcodeResult(quaggaData) {
        const barcode = quaggaData.codeResult.code;
        stopScanner();
        
        const toastId = showLoading('Ricerca prodotto...');
        
        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const productData = await response.json();
            dismissToast(toastId);

            if (productData.status !== 1 || !productData.product) {
                showError(`Prodotto con codice ${barcode} non trovato.`);
                return;
            }

            const product = productData.product;
            const name = product.product_name_it || product.product_name || 'Senza nome';
            const brands = product.brands || '';
            const image_url = product.image_front_url || '';

            if (scannerContext === 'archive') {
                await db.saveProduct({ barcode, name, brands, image_url });
                showSuccess(`"${name}" aggiunto all'archivio!`);
                loadArchive(); // Ricarica la vista archivio
            } else { // 'cart' context
                const priceStr = prompt(`Inserisci il prezzo per "${name}":`);
                const price = parseFloat(priceStr);
                if (!isNaN(price) && price > 0) {
                    addItemToCart({ name, price, quantity: 1, category: 'Generico', isNonVoucher: false, barcode });
                } else if (priceStr !== null) {
                    showError('Prezzo non valido.');
                }
            }
        } catch (error) {
            console.error("Errore API Open Food Facts:", error);
            dismissToast(toastId);
            showError("Errore di rete. Impossibile cercare il prodotto.");
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
            showSuccess('Spesa salvata!');
            cart = [];
            updateCartView();
            navigateTo('home');
        } catch (error) {
            showError('Errore durante il salvataggio.');
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

    async function loadArchive() {
        try {
            const products = await db.getProducts();
            ui.renderArchive(products, elements.archiveList, showProductDetail, deleteFromArchive);
        } catch (error) { console.error('Errore caricamento archivio:', error); }
    }

    async function deleteFromArchive(barcode) {
        if (confirm('Rimuovere questo prodotto dall\'archivio?')) {
            try {
                await db.deleteProduct(barcode);
                showSuccess('Prodotto rimosso.');
                loadArchive();
            } catch (error) {
                showError('Errore durante la rimozione.');
            }
        }
    }

    async function showProductDetail(barcode) {
        ui.renderProductDetail(null, elements.productDetailContent);
        navigateTo('productDetail');
        const toastId = showLoading('Caricamento dettagli...');
    
        try {
            const productResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
            if (!productResponse.ok) throw new Error('Risposta di rete non valida per il prodotto principale');
            
            const productData = await productResponse.json();
    
            if (productData.status !== 1 || !productData.product) {
                dismissToast(toastId);
                showError('Dettagli prodotto non trovati.');
                return;
            }
            
            const product = productData.product;
            let similarProducts = [];
    
            const categories = product.categories_tags;
            if (categories && categories.length > 0) {
                const reversedCategories = [...categories].reverse();
                
                for (const category of reversedCategories) {
                    const searchUrl = `https://world.openfoodfacts.org/api/v2/search?categories_tags_contains=${category}&page_size=6&json=true&fields=product_name_it,product_name,brands,image_front_url,code`;
                    
                    try {
                        const similarResponse = await fetch(searchUrl);
                        if (similarResponse.ok) {
                            const similarData = await similarResponse.json();
                            if (similarData.products && similarData.products.length > 1) {
                                const foundProducts = similarData.products
                                    .filter(p => p.code !== barcode)
                                    .slice(0, 5);
                                
                                if (foundProducts.length > 0) {
                                    similarProducts = foundProducts;
                                    console.log(`Trovati prodotti simili nella categoria: ${category}`);
                                    break; 
                                }
                            }
                        }
                    } catch (e) {
                        console.warn(`Ricerca per categoria "${category}" fallita, provo la successiva.`, e);
                    }
                }
            }
            
            dismissToast(toastId);
            ui.renderProductDetail(product, elements.productDetailContent, similarProducts, showProductDetail);
    
        } catch (error) {
            dismissToast(toastId);
            showError('Errore di rete nel recupero dei dettagli.');
            console.error(error);
        }
    }

    function exportHistoryAs(format) {
        db.getExpenses().then(history => {
            if (history.length === 0) { showError('Lo storico è vuoto.'); return; }
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