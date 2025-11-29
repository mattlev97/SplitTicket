// js/app.js
// File principale che gestisce la logica dell'applicazione e gli eventi.

document.addEventListener('DOMContentLoaded', () => {
    // Stato dell'applicazione
    let cart = [];
    let currentOptimizationResult = null;
    const barcodeReader = new ZXingBrowser.BrowserMultiFormatReader();
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
        itemNameInput: document.getElementById('item-name'),
        itemPriceInput: document.getElementById('item-price'),
        addItemBtn: document.getElementById('add-item-btn'),
        scanBarcodeBtn: document.getElementById('scan-barcode-btn'),
        optimizeBtn: document.getElementById('optimize-btn'),
        cartItemsContainer: document.getElementById('cart-items'),
        totalAmountSpan: document.getElementById('total-amount'),
        closeScannerBtn: document.getElementById('close-scanner-btn'),
        scannerVideo: document.getElementById('scanner-video'),
        scannerFeedback: document.getElementById('scanner-feedback'),
        closeResultBtn: document.getElementById('close-result-btn'),
        saveHistoryBtn: document.getElementById('save-history-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        closeSettingsBtn: document.getElementById('close-settings-btn'),
        historyLink: document.getElementById('history-link'),
        closeHistoryBtn: document.getElementById('close-history-btn'),
        exportCsvBtn: document.getElementById('export-csv-btn'),
        exportJsonBtn: document.getElementById('export-json-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        installPwaBtn: document.getElementById('install-pwa-btn'),
    };

    // Inizializzazione
    init();

    function init() {
        addEventListeners();
        db.initDB().then(() => {
            console.log('Database inizializzato.');
        });
        updateCartView();
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

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            elements.installPwaBtn.style.display = 'block';
        });
    }

    // Funzioni Logiche
    function addItemManually() {
        const name = elements.itemNameInput.value.trim();
        const price = parseFloat(elements.itemPriceInput.value);

        if (name && !isNaN(price) && price > 0) {
            addItemToCart({ name, price, quantity: 1 });
            elements.itemNameInput.value = '';
            elements.itemPriceInput.value = '';
            elements.itemNameInput.focus();
        } else {
            alert('Inserisci un nome e un prezzo validi.');
        }
    }

    function addItemToCart(item) {
        // Se l'articolo esiste già, aumenta la quantità
        const existingItem = cart.find(cartItem => cartItem.name.toLowerCase() === item.name.toLowerCase());
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
        ui.renderCart(cart, elements.cartItemsContainer, config.CURRENCY_SYMBOL, removeItemFromCart);
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        elements.totalAmountSpan.textContent = total.toFixed(2);
        elements.optimizeBtn.disabled = cart.length === 0;
    }

    async function startScanner() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            elements.scannerVideo.srcObject = stream;
            ui.showScreen(screens.scanner, screens);
            elements.scannerFeedback.textContent = 'Puntando la fotocamera...';

            barcodeReader.decodeFromStream(elements.scannerVideo, stream, (result, err) => {
                if (result) {
                    handleBarcodeResult(result.getText());
                }
                if (err && !(err instanceof ZXingBrowser.NotFoundException)) {
                    console.error(err);
                    elements.scannerFeedback.textContent = 'Errore durante la scansione.';
                }
            });
        } catch (error) {
            console.error('Errore accesso fotocamera:', error);
            alert('Impossibile accedere alla fotocamera. Assicurati di aver dato i permessi.');
            ui.showScreen(screens.home, screens);
        }
    }

    function stopScanner() {
        barcodeReader.reset();
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
                addItemToCart({ name, price, quantity: 1, barcode });
            } else {
                alert('Prezzo non valido.');
            }
        }
    }

    function optimizeAndShowResults() {
        if (cart.length === 0) return;

        // Espandi il carrello in singoli articoli
        const itemsToOptimize = cart.flatMap(item =>
            Array(item.quantity).fill({ name: item.name, price: item.price })
        );

        // Calcola la capacità totale dei buoni per ogni persona
        const totalUserVoucher = config.VOUCHER_VALUE_USER * config.VOUCHER_COUNT_USER;
        const totalPartnerVoucher = config.VOUCHER_VALUE_PARTNER * config.VOUCHER_COUNT_PARTNER;

        const result = optimizer.optimizeSplit(
            itemsToOptimize,
            totalUserVoucher,
            totalPartnerVoucher,
            config.OPTIMIZER_EXACT_THRESHOLD
        );
        
        currentOptimizationResult = result;
        ui.displayResults(result, config);
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
            ui.renderHistory(history, config.CURRENCY_SYMBOL);
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
                        e.total.toFixed(2),
                        e.user.total.toFixed(2),
                        e.partner.total.toFixed(2),
                        e.remaining.total.toFixed(2)
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