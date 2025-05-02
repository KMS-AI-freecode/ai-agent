import ReactMarkdown from 'react-markdown'
import { ChatMessageContentStyled, ChatMessageStyled } from './styles'
import { ChatMessageFragment } from './interfaces'
import Link from 'next/link'

type MainPageChatMessageProps = {
  message: ChatMessageFragment
}

export const MainPageChatMessage: React.FC<MainPageChatMessageProps> = ({
  message,
  ...other
}) => {
  return (
    <ChatMessageStyled isUser={message.creator === 'user'} {...other}>
      <ChatMessageContentStyled>
        <ReactMarkdown
          components={{
            a: ({ node: _node, href, ...props }) => (
              <>
                {href ? <Link href={href} {...props} /> : <span {...props} />}
              </>
            ),
          }}
        >
          {message.contentText}
        </ReactMarkdown>
      </ChatMessageContentStyled>
    </ChatMessageStyled>
  )
}
