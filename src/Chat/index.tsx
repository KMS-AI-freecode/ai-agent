import React from 'react'
import { MainPageChatMessages } from './Messages'
import { MainPageChatStyled } from './styles'

export const MainPageChat: React.FC = () => {
  return (
    <MainPageChatStyled>
      <MainPageChatMessages key="chat-content" />
    </MainPageChatStyled>
  )
}
