// Создаем экземпляр универсального клиента OpenAI

import OpenAI from 'openai'

// Может использоваться как для LM Studio, так и для OpenAI API
export const openaiClient = new OpenAI({
  baseURL: process.env.OPENAI_API_BASE_URL || undefined,
  // Для LM Studio ключ не важен, но для OpenAI API нужен настоящий ключ
  apiKey: process.env.OPENAI_API_KEY || undefined,
})
