// React provides StrictMode, which runs extra development checks for unsafe component behavior.
import React from 'react';
// createRoot is React 18+'s browser entry point for mounting an application into the DOM.
import { createRoot } from 'react-dom/client';
// App is the top-level workbench component containing navigation, forms, and result views.
import App from './App';
// The stylesheet contains the shared visual system and responsive layout rules.
import './styles.css';

// Find the empty <div id="root"> supplied by index.html and create a React rendering root in it.
const root = createRoot(document.getElementById('root'));

// StrictMode does not render visible UI; it helps reveal accidental side effects during development.
root.render(
  <React.StrictMode>
    {/* App owns the complete mlpack Studio user interface. */}
    <App />
  </React.StrictMode>,
);
