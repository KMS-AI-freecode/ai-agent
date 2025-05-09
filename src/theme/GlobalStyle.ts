import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body, html {
    padding: 0;
    margin: 0;
    height: 100%;
  }

  body { 
    font-size: 14px;
    line-height: 1.2; 
  }

  #root {
    display: contents;
  }

  a { 
    text-decoration: none; 

    &{ 
      &:hover {
        text-decoration: underline;
      }
    }
  }  
`
