import { ThemeProvider } from 'styled-components'
import { GlobalStyle } from './GlobalStyle'

const breakpoints = {
  xs: 480,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1920,
} as const

/**
 * Цвета
 */
const colors = {
  primary: '#333',
} as const

/**
 * Итоговая тема
 */
export const theme = {
  colors,
  breakpoints,
}

export type Theme = typeof theme

export type ThemeProps = { theme?: Theme }

export const AppThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      {children}
    </ThemeProvider>
  )
}
