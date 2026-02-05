import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SeasonProvider } from './context/SeasonContext'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Check if we were redirected from 404.html and navigate to the correct path
if (sessionStorage.redirectPath) {
  const redirectPath = sessionStorage.redirectPath;
  sessionStorage.removeItem('redirectPath');
  window.history.replaceState(null, null, redirectPath);
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <AuthProvider>
      <SeasonProvider>
        <App />
      </SeasonProvider>
    </AuthProvider>
  </BrowserRouter>,
)
