import React from 'react'
import ReactDOM from 'react-dom/client'
// import { MainPage } from './pages/MainPage'
import { ApolloProvider } from '@apollo/client'
import { client } from './gql/client'
import { AppThemeProvider } from './theme'
import { World } from './World'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AppThemeProvider>
        <World />
      </AppThemeProvider>
    </ApolloProvider>
  </React.StrictMode>,
)
