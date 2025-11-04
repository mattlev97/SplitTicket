/* src/barcode.js
   Barcode scanner module that wraps @zxing/browser usage.
   - Exposes: startScanner(containerVideoElement), stopScanner(), onDetected(callback)
   - Provides permission handling and simple UI feedback via events.
*/

/* English/Italian notes:
   - Uses ZXing Browser library (CDN included in index.html).
   - startScanner will request camera, show video, and call callback on detected code.
*/

import { BrowserMultiFormatReader, NotFoundException } from '@zxing/browser';

let codeReader = null;
let selectedDeviceId = null;
let continuous = true;
let onDetectedCallback = null;

export async function startScanner(videoEl){
  // request camera and start decoding
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    throw new Error('Camera API non disponibile');
  }
  codeReader = new BrowserMultiFormatReader();
  // List devices and pick environment camera if available
  const devices = await BrowserMultiFormatReader.listVideoInputDevices();
  const backCamera = devices.find(d => /back|rear|environment|posteri/i.test(d.label)) || devices[0];
  selectedDeviceId = backCamera && backCamera.deviceId;

  try {
    await codeReader.decodeFromVideoDevice(selectedDeviceId, videoEl, (result, err) => {
      if (result){
        // Detected a code
        if (onDetectedCallback) onDetectedCallback(result.getText());
        if (!continuous) stopScanner();
      } else {
        // no result - ignore NotFoundExceptions silently
        if (err && !(err instanceof NotFoundException)) {
          console.warn(err);
        }
      }
    });
  } catch (err){
    console.error('Scanner start error', err);
    throw err;
  }
}

export function stopScanner(){
  if (codeReader){
    try { codeReader.reset(); } catch(e){}
    codeReader = null;
  }
}

export function onDetected(cb){
  onDetectedCallback = cb;
}