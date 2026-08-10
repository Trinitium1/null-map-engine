import React from 'react';
import { createRoot } from 'react-dom/client';
import MapEngineApp from './3dmapengine/MapEngineApp';

// Suppress THREE.Clock deprecation warning caused by React Three Fiber's internal loop
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('THREE.Clock:')) return;
  originalWarn(...args);
};

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<MapEngineApp />);
