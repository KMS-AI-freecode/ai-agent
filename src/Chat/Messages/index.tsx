import dynamic from 'next/dynamic'
import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

const MainPageChatMessage = dynamic(
  () => import('./Message').then((m) => m.MainPageChatMessage),
  { ssr: false },
)

import {
  MainPageChatMessagesStyled,
  ChatInputStyled,
  ChatMessagesStyled,
  ChatInputContainerStyled,
  SendButtonStyled,
  ErrorMessageStyled,
} from './styles'

import { ChatMessageFragment } from './Message/interfaces'
import { useSendMessageMutation } from '../../gql/generated'

type MainPageChatMessagesProps = {
  //
}

export const MainPageChatMessages: React.FC<MainPageChatMessagesProps> = (
  ...other
) => {
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

  const addMessageToOutput = useCallback((text: string) => {
    messagesSetter((messages) => [
      ...messages,
      {
        contentText: text,
        creator: 'user',
      },
    ])
  }, [])

  const handleSendMessage = useCallback(() => {
    setInputValue((text) => {
      addMessageToOutput(text)

      createChatMessage({
        variables: {
          text,
        },
      })
        .then((r) => {
          if (r.data?.sendMessage) {
            const message = r.data.sendMessage

            if (message) {
              addMessageToOutput(message)
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

    // Плавная прокрутка до последнего сообщения с задержкой
    const scrollTimeout = setTimeout(() => {
      messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: 'smooth',
      })
    }, 500) // Задержка в 1 секунду

    // Очистка таймера при размонтировании компонента
    return () => clearTimeout(scrollTimeout)
  }, [messages, messagesContainer])

  return (
    <MainPageChatMessagesStyled {...other}>
      <ChatMessagesStyled
        ref={messagesContainerSetter}
        isEmpty={messages.length === 0}
      >
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
            title="Закрыть"
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
          placeholder="Введите ваше сообщение..."
          disabled={inRequest}
        />
        <SendButtonStyled
          onClick={handleSendMessage}
          disabled={!inputValue.trim() || inRequest}
          type="submit"
        >
          {inRequest ? <div>Sending</div> : <div>Send</div>}
        </SendButtonStyled>
      </ChatInputContainerStyled>
    </MainPageChatMessagesStyled>
  )
}
