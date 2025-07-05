import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@drdata/docomo/styles'; // Import docomo library CSS
import './services/http'; // Initialize HTTP interceptors

const root = createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
