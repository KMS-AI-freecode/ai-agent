import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloProvider } from '@apollo/client'
import { client } from './gql/client'
import { AppThemeProvider } from './theme'
import { Messenger } from './Messenger'
import { WorldContextProvider } from './World/Context'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Важно! Нельзя в React.StrictMode, потому что навешиваются двойные события
  // <React.StrictMode>
  <ApolloProvider client={client}>
    <AppThemeProvider>
      <WorldContextProvider>
        <Messenger />
      </WorldContextProvider>
    </AppThemeProvider>
  </ApolloProvider>,
  // </React.StrictMode>
)
