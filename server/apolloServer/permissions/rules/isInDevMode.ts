import { rule } from 'graphql-shield'

export const isInDevMode = rule()(() => {
  return process.env.NODE_ENV === 'development'
})
