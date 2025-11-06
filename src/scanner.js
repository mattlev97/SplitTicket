// /src/scanner.js
// Purpose: Barcode scanner using ZXing library (browser build included in index.html).
// Exports: startScanner(videoElement, onDetected), stopScanner()

let codeReader = null;
let selectedDeviceId = null;
let _scanActive = false;

export async function startScanner(videoElem, onDetected, feedbackCallback){
  // Request camera and start decoding continuously
  if (!window.ZXing) {
    feedbackCallback && feedbackCallback('Barcode library non disponibile');
    return;
  }
  codeReader = new window.ZXing.BrowserMultiFormatReader();
  try {
    const devices = await codeReader.listVideoInputDevices();
    if (devices.length === 0) {
      feedbackCallback && feedbackCallback('Nessuna videocamera trovata');
      return;
    }
    selectedDeviceId = devices[0].deviceId;
    _scanActive = true;
    feedbackCallback && feedbackCallback('Avvio camera...');
    await codeReader.decodeFromVideoDevice(selectedDeviceId, videoElem, (result, err) => {
      if (!_scanActive) return;
      if (result) {
        feedbackCallback && feedbackCallback('Codice rilevato: ' + result.text);
        onDetected && onDetected(result.text);
      }
      if (err && !(err instanceof window.ZXing.NotFoundException)) {
        // show other errors silently
      }
    });
  } catch (e) {
    feedbackCallback && feedbackCallback('Errore camera: ' + e.message);
  }
}

export async function stopScanner(){
  _scanActive = false;
  if (codeReader) {
    try { codeReader.reset(); } catch(e){}
    codeReader = null;
  }
}
