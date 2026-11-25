import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {});
}

if ('caches' in window) {
  caches.keys()
    .then((names) => Promise.all(names.map((name) => caches.delete(name))))
    .catch(() => {});
}

createRoot(document.getElementById('root')).render(<App />);
