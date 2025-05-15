import React from 'react'
import { useApollo } from '../gql/client'
import { ApolloProvider } from '@apollo/client'
import { AppThemeProvider } from '../theme'
// import { WorldContextProvider } from '../World/Context'
import { Messenger } from '../Messenger'
import { AppContextProvider } from './Context'

export const App: React.FC = () => {
  const client = useApollo()

  return (
    <ApolloProvider client={client}>
      <AppThemeProvider>
        <AppContextProvider client={client}>
          <Messenger />
        </AppContextProvider>
      </AppThemeProvider>
    </ApolloProvider>
  )
}
