import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Providers } from './contexts/provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers />
    </StrictMode>,
)
