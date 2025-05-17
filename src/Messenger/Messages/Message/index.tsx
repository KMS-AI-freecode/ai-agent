import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import {
  ChatMessageContentStyled,
  ChatMessageStyled,
  MessageDateStyled,
  VideoContainerStyled,
} from './styles'
import { MessageFragment, useUserQuery } from '../../../gql/generated'
import { AppContextValue } from '../../../App/Context'
import { formatDate } from '../../../helpers/format'

type ChatMessageProps = {
  message: MessageFragment
  currentUser: AppContextValue['currentUser']
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentUser,
  ...other
}) => {
  const isUser = message.userId === currentUser?.id

  const userResponse = useUserQuery({
    variables: {
      id: message.userId,
    },
    skip: !message.userId,
  })

  const user = userResponse.data?.user

  return (
    <ChatMessageStyled isUser={isUser} {...other}>
      <ChatMessageContentStyled>
        {/* Имя автора сообщения */}
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 'bold',
            color: isUser ? '#fff' : '#444',
            marginBottom: '5px',
          }}
        >
          {user?.name || `Пользователь ${message.userId?.substring(0, 6)}...`}
        </div>

        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ node: _node, href, ...props }) => (
              <>{href ? <a href={href} {...props} /> : <span {...props} />}</>
            ),
            iframe: ({ node: _node, ...props }) => (
              <VideoContainerStyled>
                <iframe {...props} />
              </VideoContainerStyled>
            ),
            video: ({ node: _node, ...props }) => (
              <VideoContainerStyled>
                <video controls {...props} />
              </VideoContainerStyled>
            ),
          }}
        >
          {message.text}
        </ReactMarkdown>

        <MessageDateStyled isUser={isUser}>
          {user?.type && (
            <span style={{ marginRight: '5px' }}>[{user.type}]</span>
          )}
          {message.createdAt && formatDate(message.createdAt)}
        </MessageDateStyled>
      </ChatMessageContentStyled>
    </ChatMessageStyled>
  )
}
