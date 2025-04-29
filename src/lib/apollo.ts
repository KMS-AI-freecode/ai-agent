import { useMemo } from 'react'
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
} from '@apollo/client'

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

function createApolloClient() {
  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    link: new HttpLink({
      uri: '/api/graphql',
    }),
    cache: new InMemoryCache(),
  })
}

export function initializeApollo(
  initialState: NormalizedCacheObject | null = null,
) {
  const _apolloClient = apolloClient ?? createApolloClient()

  // Если страница с данными SSR/SSG, гидратировать кэш
  if (initialState) {
    _apolloClient.cache.restore(initialState)
  }

  // Для SSR создаем новый клиент каждый раз
  if (typeof window === 'undefined') return _apolloClient

  // Для клиента сохраняем экземпляр
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function useApollo(initialState: NormalizedCacheObject | null) {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
