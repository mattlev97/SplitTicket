// js/utils/toast.js
// Funzioni helper per mostrare notifiche toast non bloccanti.
// Usa la libreria Sonner, che è già inclusa nel progetto.

// Questa funzione è un placeholder perché Sonner è globale.
// In un ambiente a moduli, importeremmo `toast` da 'sonner'.
const toast = window.toast;

export const showSuccess = (message) => {
  if (toast && toast.success) {
    toast.success(message);
  } else {
    alert(message); // Fallback
  }
};

export const showError = (message) => {
  if (toast && toast.error) {
    toast.error(message);
  } else {
    alert(message); // Fallback
  }
};

export const showLoading = (message) => {
  if (toast && toast.loading) {
    return toast.loading(message);
  }
  // Non c'è un buon fallback per il caricamento, quindi non facciamo nulla.
  return null;
};

export const dismissToast = (toastId) => {
  if (toast && toast.dismiss && toastId) {
    toast.dismiss(toastId);
  }
};