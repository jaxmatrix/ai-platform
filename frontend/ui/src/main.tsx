import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import { HashRouter } from 'react-router-dom'
import { SocketProvider } from './contexts/SocketContext'

render(
  <HashRouter>
    <SocketProvider>
      <App />
    </SocketProvider>
  </HashRouter>, 
  document.getElementById('app')!
)
