import * as Sentry from '@sentry/electron/renderer';
import React from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './App.global.css';

Sentry.init({
  dsn: 'https://56e47edf5a3c437186196bb49bb03c4c@o845499.ingest.sentry.io/6146413',
});

const root = createRoot(document.getElementById('root') as HTMLDivElement);
root.render(<App />);
