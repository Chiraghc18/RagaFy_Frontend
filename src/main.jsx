import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// 🔥 Add this line to load Font Awesome locally!
import '@fortawesome/fontawesome-free/css/all.min.css';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)