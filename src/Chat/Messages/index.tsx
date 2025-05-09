import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

import { MainPageChatMessage } from './Message'

import {
  MainPageChatMessagesStyled,
  ChatInputContainerStyled,
  ChatInputStyled,
  SendButtonStyled,
  ChatMessagesStyled,
  ErrorMessageStyled,
} from './styles'

import { ChatMessageFragment } from './Message/interfaces'
import { useSendMessageMutation } from '../../gql/generated'

import { SendArrowIcon, SpinnerIcon } from './icons'

type MainPageChatMessagesProps = {
  //
}

export const MainPageChatMessages: React.FC<MainPageChatMessagesProps> = ({
  ...other
}) => {
  const [messages, messagesSetter] = useState<ChatMessageFragment[]>([])

  const [error, errorSetter] = useState<Error | null>(null)

  const handleErrorReset = useCallback(() => {
    errorSetter(null)
  }, [])

  // const response = useDialogQuery({
  //   skip: !user,
  // })

  // const messages = useMemo(
  //   () => response.data?.chatMessagesDialog || [],
  //   [response.data]
  // )

  const [messagesContainer, messagesContainerSetter] =
    useState<HTMLDivElement | null>(null)

  const [createChatMessage, { loading: inRequest }] = useSendMessageMutation({})

  // const isAnonymous = !user

  const [inputValue, setInputValue] = useState('')

  // const { MAIN_AI_AGENT_USERNAME } = useConfig()

  // if (!MAIN_AI_AGENT_USERNAME) {
  //   errorSetter(new Error('MAIN_AI_AGENT_USERNAME is empty'))
  // }

  const addMessageToOutput = useCallback(
    (text: string, creator: ChatMessageFragment['creator']) => {
      messagesSetter((messages) => [
        ...messages,
        {
          contentText: text,
          creator,
          createdAt: new Date(),
        },
      ])
    },
    [],
  )

  const handleSendMessage = useCallback(() => {
    setInputValue((text) => {
      addMessageToOutput(text, 'user')

      createChatMessage({
        variables: {
          text,
        },
      })
        .then((r) => {
          if (r.data?.sendMessage) {
            const message = r.data.sendMessage

            if (message) {
              addMessageToOutput(message, 'agent')
              setInputValue('')
            }
          }
        })
        .catch((error) => {
          console.error(error)
          errorSetter(error)
        })

      return ''
    })
  }, [addMessageToOutput, createChatMessage])

  const onSubmit = useCallback<React.FormEventHandler>(
    (event) => {
      event.preventDefault()

      handleSendMessage()
    },
    [handleSendMessage],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value)
    },
    [],
  )

  useEffect(() => {
    if (!messagesContainer || !messages.length) {
      return
    }

    // Smooth scroll to the last message with delay
    const scrollTimeout = setTimeout(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth',
      })
    }, 500) // 1 second delay

    // Clear timer when component unmounts
    return () => clearTimeout(scrollTimeout)
  }, [messages, messagesContainer])

  return (
    <MainPageChatMessagesStyled {...other}>
      <ChatMessagesStyled ref={messagesContainerSetter}>
        {messages.map((n, index) => (
          <MainPageChatMessage key={index} message={n} />
        ))}
      </ChatMessagesStyled>

      {error && (
        <ErrorMessageStyled>
          {error?.message}
          <button
            className="close-button"
            onClick={handleErrorReset}
            title="Close"
          >
            ✕
          </button>
        </ErrorMessageStyled>
      )}
      <ChatInputContainerStyled onSubmit={onSubmit}>
        <ChatInputStyled
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message..."
          disabled={inRequest}
        />
        <SendButtonStyled
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || inRequest}
          type="submit"
        >
          {inRequest ? <SpinnerIcon /> : <SendArrowIcon />}
        </SendButtonStyled>
      </ChatInputContainerStyled>
    </MainPageChatMessagesStyled>
  )
}
