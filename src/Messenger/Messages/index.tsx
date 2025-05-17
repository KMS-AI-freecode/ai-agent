import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from 'react'

import { ChatMessage } from './Message'

import {
  ChatMessagesListStyled,
  ChatInputFormStyled,
  ChatInputStyled,
  SendButtonStyled,
  ChatMessagesStyled,
  ErrorMessageStyled,
} from './styles'

// import { ChatMessageFragment } from './Message/interfaces'
import {
  CurrentUserDocument,
  useCreateTokenMutation,
  UserFragment,
  useSendMessageMutation,
} from '../../gql/generated'

import { SendArrowIcon, SpinnerIcon } from './icons'
import { LOCAL_STORAGE_KEY } from '../../interfaces'
import { useApolloClient } from '@apollo/client'
import { AppActionType, AppState, useAppContext } from '../../App/Context'

type ChatMessagesProps = {
  currentUser: UserFragment | undefined
  messages: AppState['messages']
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  currentUser,
  messages,
  ...other
}) => {
  const client = useApolloClient()

  const { dispatch } = useAppContext()

  // const [messages, messagesSetter] = useState<ChatMessageFragment[]>([])

  const [error, errorSetter] = useState<Error | null>(null)

  const [createTokenMutation, { loading: createTokenMutationLoading }] =
    useCreateTokenMutation()

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

  const [createChatMessage, { loading: createChatMessageLoading }] =
    useSendMessageMutation({})

  const inRequest = createChatMessageLoading || createTokenMutationLoading

  // const isAnonymous = !user

  const [inputValue, setInputValue] = useState('')

  // const { MAIN_AI_AGENT_USERNAME } = useConfig()

  // if (!MAIN_AI_AGENT_USERNAME) {
  //   errorSetter(new Error('MAIN_AI_AGENT_USERNAME is empty'))
  // }

  // const addMessageToOutput = useCallback(
  //   (text: string, creator: ChatMessageFragment['creator']) => {
  //     messagesSetter((messages) => [
  //       ...messages,
  //       {
  //         contentText: text,
  //         creator,
  //         createdAt: new Date(),
  //       },
  //     ])
  //   },
  //   [],
  // )

  const handleSendMessage = useCallback(() => {
    ;(async () => {
      if (!currentUser) {
        try {
          const response = await createTokenMutation().then(
            (r) => r.data?.createAuthToken,
          )

          if (response) {
            const { token } = response

            localStorage?.setItem(LOCAL_STORAGE_KEY.token, token)

            client.refetchQueries({
              include: [CurrentUserDocument],
            })
          }
        } catch (error) {
          const message =
            error instanceof Error && error.message
              ? error.message
              : 'Can not create user'

          errorSetter(new Error(message))

          return
        }
      }

      setInputValue((text) => {
        // addMessageToOutput(text, 'user')

        createChatMessage({
          variables: {
            text,
          },
        })
          .then((r) => {
            if (r.data?.sendMessage) {
              const message = r.data.sendMessage

              setInputValue('')

              if (message.reply?.text) {
                // addMessageToOutput(message.reply.text, 'agent')

                dispatch({
                  type: AppActionType.AddMessage,
                  payload: message.reply,
                })
              }
            }
          })
          .catch((error) => {
            console.error(error)
            errorSetter(error)
          })

        return ''
      })
    })()
  }, [client, createChatMessage, createTokenMutation, currentUser, dispatch])

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
        e.stopPropagation()

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
    <ChatMessagesStyled {...other}>
      <ChatMessagesListStyled ref={messagesContainerSetter}>
        {messages.map((n, index) => (
          <ChatMessage key={index} message={n} currentUser={currentUser} />
        ))}
      </ChatMessagesListStyled>

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
      <ChatInputFormStyled onSubmit={onSubmit}>
        <ChatInputStyled
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Enter your message..."
          disabled={inRequest}
        />
        <SendButtonStyled
          disabled={!inputValue.trim() || inRequest}
          type="submit"
        >
          {inRequest ? <SpinnerIcon /> : <SendArrowIcon />}
        </SendButtonStyled>
      </ChatInputFormStyled>
    </ChatMessagesStyled>
  )
}
