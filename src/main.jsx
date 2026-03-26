import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { migrateLegacyLocalStorageKeys } from './utils/localStorageMigration'

migrateLegacyLocalStorageKeys()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
