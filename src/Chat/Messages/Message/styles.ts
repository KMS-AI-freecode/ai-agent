import styled from 'styled-components'

export const ChatMessageContentStyled = styled.div`
  white-space: pre-line;
  padding: 4px 6px;
`

interface MessageDateStyledProps {
  isUser?: boolean
}

export const MessageDateStyled = styled.div<MessageDateStyledProps>`
  font-size: 0.85rem;
  color: ${(props) => (props.isUser ? '#ffffff' : '#444')};
  margin-top: 8px;
  text-align: right;
  padding: 3px 5px;
  font-weight: 500;
  background-color: ${(props) =>
    props.isUser ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'};
  border-radius: 4px;
  display: inline-block;
  margin-left: auto;
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
