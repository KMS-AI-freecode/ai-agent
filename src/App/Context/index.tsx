/* eslint-disable no-console */
import React, { useContext, useEffect, useMemo, useReducer } from 'react'
import {
  ActivityAddedDocument,
  ActivityAddedSubscription,
  MessageFragment,
  useCurrentUserQuery,
  UserFragment,
} from '../../gql/generated'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'

export enum AppActionType {
  AddMessage = 'AddMessage',
  // SetCurrentUser = 'SetCurrentUser',
}

type AppAction = { type: AppActionType.AddMessage; payload: MessageFragment }
// | { type: AppActionType.SetCurrentUser; payload: AppState['currentUser'] }

export type AppState = {
  messages: MessageFragment[]
}

export type AppContextValue = {
  state: AppState
  dispatch: React.Dispatch<AppAction>
  currentUser: UserFragment | undefined
}

const AppContext = React.createContext<AppContextValue | undefined>(undefined)

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case AppActionType.AddMessage:
      {
        const message = action.payload

        if (!state.messages.find((n) => n.id === message.id)) {
          state = {
            ...state,
            messages: [
              ...state.messages,
              {
                ...message,
                createdAt: new Date(message.createdAt),
              },
            ],
          }
        }
      }

      break
  }

  return state
}

const defaultState: AppState = {
  messages: [],
  // currentUser: undefined,
}

type AppContextProviderProps = React.PropsWithChildren<{
  client: ApolloClient<NormalizedCacheObject>
}>

export const AppContextProvider: React.FC<AppContextProviderProps> = ({
  children,
  client,
}) => {
  const [state, dispatch] = useReducer(appReducer, defaultState)

  // const client = useApolloClient()

  const currentUserResponse = useCurrentUserQuery()

  const currentUser = currentUserResponse.data?.currentUser ?? undefined

  useEffect(() => {
    if (!currentUser) {
      return
    }

    const observable = client.subscribe<ActivityAddedSubscription>({
      query: ActivityAddedDocument,
    })

    const subscription = observable.subscribe({
      next({ data }) {
        const activity = data?.activityAdded

        if (activity) {
          switch (activity.__typename) {
            case 'Message':
              // Обработка нового сообщения
              // handleNewMessage(activity)
              dispatch({
                type: AppActionType.AddMessage,
                payload: activity,
              })
              break
            case 'User':
              // Обработка активности пользователя
              // handleUserActivity(activity)
              break
          }
        }

        console.log('subscription data ssd', data)
      },
      error(err) {
        console.error('Subscription error:', err)
      },
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client, currentUser])

  const contextValue = useMemo<AppContextValue>(() => {
    return {
      state,
      dispatch,
      currentUser,
    }
  }, [state, currentUser])

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('AppContext is not definded')
  }

  return context
}
