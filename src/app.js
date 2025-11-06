/**
 * Main application file for SplitTicket
 * Initializes all modules and handles PWA installation
 */

// PWA installation prompt
let deferredPrompt;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize storage
        Storage.init();
        
        // Initialize scanner
        await Scanner.init();
        
        // Initialize UI
        UI.init();
        
        console.log('SplitTicket initialized successfully');
    } catch (error) {
        console.error('Error initializing app:', error);
        UI.showToast('Errore di inizializzazione', 'error');
    }
});

// Handle PWA installation
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    const installBtn = document.getElementById('install-pwa-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', installPWA);
    }
});

// Install PWA function
async function installPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
        UI.showToast('App installata!', 'success');
    }
    
    deferredPrompt = null;
    document.getElementById('install-pwa-btn').style.display = 'none';
}

// Handle app installed
window.addEventListener('appinstalled', () => {
    UI.showToast('SplitTicket installata con successo!', 'success');
    deferredPrompt = null;
});

// Handle online/offline status
window.addEventListener('online', () => {
    UI.showToast('Connessione ripristinata', 'success');
});

window.addEventListener('offline', () => {
    UI.showToast('Modalità offline', 'warning');
});

// Prevent zoom on double tap (iOS Safari)
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);