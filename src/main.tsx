import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Важно! Нельзя в React.StrictMode, потому что навешиваются двойные события
  // <React.StrictMode>
  <App />,
  // </React.StrictMode>
)
