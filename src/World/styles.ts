import styled from 'styled-components'

export const WorldCanvasContainerStyled = styled.div`
  width: 100%;
  height: 100%;
`
export const WorldChatCanvasContainerStyled = styled.div``

export const WorldStyled = styled.div`
  display: flex;
  width: 100%;
  height: 100%;

  ${WorldCanvasContainerStyled} {
    flex: 1;
  }

  ${WorldChatCanvasContainerStyled} {
    width: 300px;
    height: 100%;
  }
`
