import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './theme.css';
import './i18n';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
