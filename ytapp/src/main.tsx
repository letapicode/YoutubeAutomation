import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import './theme.css';
import './i18n';
import { checkDependencies } from './features/dependencies';
import { loadSettings } from './features/settings';
import { watchDirectory } from './features/watch';

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    (async () => {
        const settings = await loadSettings();
        if (settings.watchDir) {
            await watchDirectory(settings.watchDir, { autoUpload: settings.autoUpload });
        }
        await checkDependencies();
        root.render(<App />);
    })();
}
