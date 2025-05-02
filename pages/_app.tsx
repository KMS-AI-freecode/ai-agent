import { AppProps } from 'next/app'
import { ApolloProvider } from '@apollo/client'
import { useApollo } from '../src/lib/apollo'
import { AppThemeProvider } from '../src/theme'

function MyApp({ Component, pageProps }: AppProps) {
  const apolloClient = useApollo(pageProps)

  return (
    <ApolloProvider client={apolloClient}>
      <AppThemeProvider>
        <Component {...pageProps} />
      </AppThemeProvider>
    </ApolloProvider>
  )
}

export default MyApp
