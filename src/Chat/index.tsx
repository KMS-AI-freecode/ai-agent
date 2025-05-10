import React from 'react'
import { ChatMessages } from './Messages'
import { ChatStyled } from './styles'

export const Chat: React.FC = () => {
  return (
    <ChatStyled>
      <ChatMessages key="chat-content" />
    </ChatStyled>
  )
}
