/* eslint-disable no-console */
import { useMemo } from 'react'
import {
  ApolloClient,
  HttpLink,
  InMemoryCache,
  NormalizedCacheObject,
  split,
} from '@apollo/client'
import { setContext } from '@apollo/client/link/context'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { LOCAL_STORAGE_KEY } from '../../interfaces'
import { typePolicies } from './typePolicies'

let apolloClient: ApolloClient<NormalizedCacheObject> | undefined

function createApolloClient() {
  // Создаем базовый HTTP линк
  const httpLink = new HttpLink({
    uri: '/api',
  })

  // Создаем контекстный линк, который будет добавлять заголовки авторизации при каждом запросе
  const authLink = setContext((_, { headers }) => {
    // Получаем актуальный токен при каждом запросе
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(LOCAL_STORAGE_KEY.token)
        : null

    // Возвращаем заголовки с токеном, если он есть
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: token } : {}),
      },
    }
  })

  // Создаем WebSocket линк
  // Для WebSocket используем функцию, которая будет вызываться при создании соединения
  const wsLink = new GraphQLWsLink(
    createClient({
      url: '/api',
      connectionParams: () => {
        // Получаем актуальный токен при создании соединения
        const token =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem(LOCAL_STORAGE_KEY.token)
            : null

        return token ? { Authorization: token } : {}
      },
    }),
  )

  const splitLink = split(
    ({ query }) => {
      console.log('query', query)

      const definition = getMainDefinition(query)
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      )
    },
    wsLink,
    httpLink,
  )

  return new ApolloClient({
    ssrMode: typeof window === 'undefined',
    // Объединяем authLink с остальными линками
    link: authLink.concat(splitLink),
    cache: new InMemoryCache({
      typePolicies,
    }),
  })
}

export function initializeApollo(
  initialState: NormalizedCacheObject | null = null,
) {
  const _apolloClient = apolloClient ?? createApolloClient()

  if (initialState) {
    _apolloClient.cache.restore(initialState)
  }

  if (typeof window === 'undefined') return _apolloClient
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function useApollo(initialState?: NormalizedCacheObject) {
  const store = useMemo(() => initializeApollo(initialState), [initialState])
  return store
}
