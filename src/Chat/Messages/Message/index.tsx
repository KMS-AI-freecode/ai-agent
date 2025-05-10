import ReactMarkdown from 'react-markdown'
import {
  ChatMessageContentStyled,
  ChatMessageStyled,
  MessageDateStyled,
} from './styles'
import { ChatMessageFragment } from './interfaces'

type ChatMessageProps = {
  message: ChatMessageFragment
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  ...other
}) => {
  const isUser = message.creator === 'user'

  // Format the date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <ChatMessageStyled isUser={isUser} {...other}>
      <ChatMessageContentStyled>
        <ReactMarkdown
          components={{
            a: ({ node: _node, href, ...props }) => (
              <>{href ? <a href={href} {...props} /> : <span {...props} />}</>
            ),
          }}
        >
          {message.contentText}
        </ReactMarkdown>

        <MessageDateStyled isUser={isUser}>
          {message.createdAt && formatDate(message.createdAt)}
        </MessageDateStyled>
      </ChatMessageContentStyled>
    </ChatMessageStyled>
  )
}
