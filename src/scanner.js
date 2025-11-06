/**
 * Barcode scanner module for SplitTicket
 * Uses @zxing/browser library for barcode detection
 */

const Scanner = {
    isScanning: false,
    stream: null,
    codeReader: null,
    
    /**
     * Initialize scanner
     */
    async init() {
        // Load ZXing library from CDN
        if (typeof ZXing === 'undefined') {
            await this.loadZXingLibrary();
        }
    },
    
    /**
     * Load ZXing library from CDN
     */
    loadZXingLibrary() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/zxing-js-library/0.20.0/index.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    },
    
    /**
     * Start scanning
     */
    async startScanning() {
        if (this.isScanning) return;
        
        try {
            // Request camera permission
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            
            const videoElement = document.getElementById('scanner-video');
            videoElement.srcObject = this.stream;
            await videoElement.play();
            
            // Initialize code reader
            this.codeReader = new ZXing.BrowserMultiFormatReader();
            this.isScanning = true;
            
            // Start continuous scanning
            this.codeReader.decodeFromVideoDevice(null, 'scanner-video', (result, error) => {
                if (result) {
                    this.handleScanResult(result.text);
                }
            });
            
            this.updateStatus('Inquadra il codice a barre', 'scanning');
            
        } catch (error) {
            console.error('Error starting scanner:', error);
            this.updateStatus('Errore: impossibile accedere alla camera', 'error');
            UI.showToast('Impossibile accedere alla camera. Verifica i permessi.', 'error');
        }
    },
    
    /**
     * Stop scanning
     */
    stopScanning() {
        if (!this.isScanning) return;
        
        // Stop code reader
        if (this.codeReader) {
            this.codeReader.reset();
            this.codeReader = null;
        }
        
        // Stop media stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Clear video
        const videoElement = document.getElementById('scanner-video');
        videoElement.srcObject = null;
        
        this.isScanning = false;
    },
    
    /**
     * Handle successful barcode scan
     */
    handleScanResult(barcode) {
        if (!this.isScanning) return;
        
        this.stopScanning();
        this.updateStatus('Codice rilevato!', 'success');
        
        // Vibrate if available
        if ('vibrate' in navigator) {
            navigator.vibrate(200);
        }
        
        // Show toast
        UI.showToast(`Codice rilevato: ${barcode}`, 'success');
        
        // Open modal with barcode pre-filled
        setTimeout(() => {
            UI.closeView('scanner');
            UI.openAddProductModal(barcode);
        }, 500);
    },
    
    /**
     * Update scanner status message
     */
    updateStatus(message, status = '') {
        const statusElement = document.getElementById('scanner-status');
        statusElement.textContent = message;
        statusElement.className = 'scanner-status ' + status;
    }
};