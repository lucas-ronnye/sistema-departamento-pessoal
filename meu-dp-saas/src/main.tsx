import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'
import { worker } from './mocks/browser'

// Para demo pública, habilitamos MSW também em produção.
// Caso queira desativar em produção depois, troque `usingMSW` para `import.meta.env.DEV`.
const usingMSW = true

async function enableMocking() {
  if (usingMSW) {
    await worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )

  // Evita conflito: se MSW estiver ativo, não registra o SW de PWA
  if ('serviceWorker' in navigator && import.meta.env.PROD && !usingMSW) {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err))
  }
})
