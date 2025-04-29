/* eslint-disable no-console */
import { useState, useCallback } from 'react'
import { gql, useMutation } from '@apollo/client'
import Head from 'next/head'

// GraphQL мутация для обработки стимула
const PROCESS_STIMULUS = gql`
  mutation ProcessStimulus($content: String!, $metadata: JSON) {
    processStimulus(content: $content, metadata: $metadata) {
      id
      type
      content
      createdAt
    }
  }
`

type Response = { id: string; content: string }

export default function Home() {
  const [message, setMessage] = useState('')
  const [responses, setResponses] = useState<Response[]>([])

  // Мутация для отправки сообщений агенту
  const [processStimulus, { loading: inRequest }] = useMutation(
    PROCESS_STIMULUS,
    {},
  )

  // Обработчик отправки сообщения
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()

      setMessage((message) => {
        if (message) {
          processStimulus({
            variables: {
              content: message,
              metadata: { source: 'user-input' },
            },
          }).then((r) => {
            console.log('r', r)

            r.data?.processStimulus && setResponses(r.data.processStimulus)
          })
        }

        return ''
      })
    },
    [processStimulus],
  )

  // Обработчик изменения значения поля ввода
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(e.target.value)
    },
    [],
  )

  return (
    <div>
      <Head>
        <title>AI Agent</title>
        <meta
          name="description"
          content="Легкая и масштабируемая платформа для агентов ИИ"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto p-4 max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">AI Agent</h1>

        {/* Область сообщений */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
          {responses.length === 0 ? (
            <p className="text-gray-500">Начните диалог с агентом...</p>
          ) : (
            responses.map((response) => (
              <div
                key={response.id}
                className="mb-4 p-3 bg-white rounded-lg shadow"
              >
                {response.content}
              </div>
            ))
          )}
          {inRequest && <p className="text-gray-500">Думаю...</p>}
        </div>

        {/* Форма ввода */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Введите сообщение..."
            className="flex-grow p-2 border rounded"
            disabled={inRequest}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={inRequest}
          >
            Отправить
          </button>
        </form>
      </main>
    </div>
  )
}
