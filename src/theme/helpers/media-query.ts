import { css, DefaultTheme } from 'styled-components'
import { RuleSet, Styles } from 'styled-components/dist/types'
import { theme } from '..'

export type BreakpointsKey = keyof (typeof theme)['breakpoints']

type MediaQueryFnArgs =
  | string
  | TemplateStringsArray
  | RuleSet<object>
  | ((theme: DefaultTheme) => string)

type MediaQueryFn = (
  args: MediaQueryFnArgs,
) => Styles<object> | RuleSet<object> | string

export type MinWidth = Record<BreakpointsKey, MediaQueryFn>

export const minWidth = Object.keys(theme.breakpoints).reduce<
  Partial<MinWidth>
>((accumulator, _label) => {
  const label = _label as BreakpointsKey
  accumulator[label] = (args) => {
    let cssString: MediaQueryFnArgs = ''

    if (typeof args === 'function') {
      cssString = args(theme)
    } else {
      cssString = args
    }

    return css`
      @media (min-width: ${theme.breakpoints[label]}px) {
        ${cssString};
      }
    `
  }
  return accumulator
}, {}) as MinWidth
