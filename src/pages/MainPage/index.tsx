import Head from 'next/head'
import { MainPageChat } from '../../Chat'

export const MainPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>AI Agent</title>
      </Head>

      <MainPageChat />
    </>
  )
}
