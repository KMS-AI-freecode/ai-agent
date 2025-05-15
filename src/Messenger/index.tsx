import React from 'react'
import { ChatMessages } from './Messages'
import { MessengerStyled } from './styles'

export const Messenger: React.FC = () => {
  return (
    <MessengerStyled>
      <ChatMessages key="chat-content" />
    </MessengerStyled>
  )
}
