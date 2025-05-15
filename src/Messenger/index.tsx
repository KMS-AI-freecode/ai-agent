/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-console */
import React from 'react'
import { ChatMessages } from './Messages'
import { MessengerStyled } from './styles'
import { useAppContext } from '../App/Context'
import { useCurrentUserQuery } from '../gql/generated'
// import { useActivityAddedSubscription } from '../gql/generated'
// import { AppActionType, useAppContext } from '../App/Context'
// import { useApolloClient } from '@apollo/client'
// import { ActivityAddedDocument } from '../gql/generated'

export const Messenger: React.FC = () => {
  const {
    state: { messages },
  } = useAppContext()

  const currentUserResponse = useCurrentUserQuery()

  const currentUser = currentUserResponse.data?.currentUser ?? undefined

  console.log('currentUser', currentUser)

  console.log('messages', messages)

  // Подписываемся на получение новых активностей
  // const { data } = useActivityAddedSubscription({})

  // console.log('data', data)

  // Эффект, который срабатывает при получении новых данных
  // useEffect(() => {
  //   if (data?.activityAdded) {
  //     const activity = data.activityAdded

  //     // Обработка в зависимости от типа активности
  //     switch (activity.__typename) {
  //       case 'Message':
  //         // Обработка нового сообщения
  //         // handleNewMessage(activity)
  //         dispatch({
  //           type: AppActionType.AddMessage,
  //           payload: activity,
  //         })
  //         break
  //       case 'User':
  //         // Обработка активности пользователя
  //         // handleUserActivity(activity)
  //         break
  //     }
  //   }
  // }, [data, dispatch])

  // // Обработчики различных типов активности
  // const handleNewMessage = (_message: Record<string, unknown>) => {
  //   // Здесь можно обновить состояние или перенаправить в хранилище
  // }

  // const handleUserActivity = (_user: Record<string, unknown>) => {
  //   // Здесь логика для активности пользователя
  // }

  return (
    <MessengerStyled>
      <ChatMessages key="chat-content" currentUser={currentUser} />
    </MessengerStyled>
  )
}
