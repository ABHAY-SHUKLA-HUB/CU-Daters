import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { migrateLegacyLocalStorageKeys } from './utils/localStorageMigration'

console.log('main.jsx: Starting app initialization');

try {
  migrateLegacyLocalStorageKeys();
  console.log('main.jsx: Storage migration complete');
} catch (error) {
  console.error('main.jsx: Storage migration failed:', error);
}

const rootElement = document.getElementById('root');
console.log('main.jsx: Root element exists?', !!rootElement);

if (rootElement) {
  try {
    console.log('main.jsx: Creating root and rendering App...');
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('main.jsx: App rendered successfully');
  } catch (error) {
    console.error('main.jsx: Render failed:', error);
    rootElement.innerHTML = `<pre style="padding: 20px; color: red; font-size: 12px; overflow: auto;">Render Error: ${error.message}\n\n${error.stack}</pre>`;
  }
} else {
  console.error('main.jsx: Root element not found');
}
