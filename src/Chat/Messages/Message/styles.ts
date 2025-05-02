import styled from 'styled-components'

export const ChatMessageContentStyled = styled.div`
  white-space: pre-line;
  padding: 4px 6px;
`

interface ChatMessageStyledProps {
  isUser: boolean
}

export const ChatMessageStyled = styled.div<ChatMessageStyledProps>`
  display: flex;
  justify-content: ${(props) => (props.isUser ? 'flex-end' : 'flex-start')};
  padding: 10px;

  p {
    margin-top: 2px;
    margin-bottom: 2px;
  }

  pre,
  code {
    background-color: #333;
    color: white;
  }

  ${ChatMessageContentStyled} {
    max-width: 90%;
    border-radius: 8px;
    background-color: ${(props) => (props.isUser ? '#007bff' : '#f1f1f1')};
    color: ${(props) => (props.isUser ? '#fff' : '#333')};
  }
`
