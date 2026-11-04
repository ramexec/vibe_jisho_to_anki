import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import './index.css'
import "./i18n";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      theme="dark"
      richColors
      closeButton
      visibleToasts={4}
      toastOptions={{ duration: 4500 }}
    />
  </StrictMode>,
)
