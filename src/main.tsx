import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Conditionally register image-caching service worker based on cookie consent
function registerImageCacheWorker() {
  if ('serviceWorker' in navigator) {
    // Check if user has accepted cookies (consent for performance caching)
    const consent = localStorage.getItem('petcao_cookie_consent');
    if (consent === 'accepted') {
      navigator.serviceWorker.register('/sw-images.js').catch(() => {
        // SW registration failed silently
      });
    }
  }
}

// Restore custom favicon from localStorage
function restoreCustomFavicon() {
  const customFavicon = localStorage.getItem('petcao-favicon');
  if (customFavicon) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = customFavicon;
    link.type = 'image/png';
  }
}
restoreCustomFavicon();

// Register on load
window.addEventListener('load', registerImageCacheWorker);

// Also listen for consent changes (when user accepts later)
window.addEventListener('storage', (e) => {
  if (e.key === 'petcao_cookie_consent' && e.newValue === 'accepted') {
    registerImageCacheWorker();
  }
});

createRoot(document.getElementById("root")!).render(<App />);