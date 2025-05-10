import React from 'react'
import ReactDOM from 'react-dom/client'
// import { MainPage } from './pages/MainPage'
import { ApolloProvider } from '@apollo/client'
import { client } from './gql/client'
import { AppThemeProvider } from './theme'
import { World } from './World'
import { WorldContextProvider } from './World/Context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Важно! Нельзя в React.StrictMode, потому что навешиваются двойные события
  // <React.StrictMode>
  <ApolloProvider client={client}>
    <AppThemeProvider>
      <WorldContextProvider>
        <World />
      </WorldContextProvider>
    </AppThemeProvider>
  </ApolloProvider>,
  // </React.StrictMode>
)
