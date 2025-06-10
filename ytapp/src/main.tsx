import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './theme.css';
import './i18n';
import { checkDependencies } from './features/dependencies';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    checkDependencies().finally(() => {
        root.render(<App />);
    });
}
