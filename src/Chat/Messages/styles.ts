import styled from 'styled-components'

export const SendButtonStyled = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: #2d7ff9;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

export const ChatInputStyled = styled.textarea`
  flex: 1;
  border: none;
  outline: none;
  padding: 8px;
  font-size: 14px;
  resize: none;
  min-height: 150px;
  max-height: 30vh;
  font-family: inherit;

  &::placeholder {
    color: #aaa;
  }
`

export const ChatInputFormStyled = styled.form`
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  padding: 10px;
`

export const ErrorMessageStyled = styled.div`
  color: #d32f2f;
  background-color: #fdecea;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .close-button {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: #9e3536;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: #6d2526;
    }
  }
`

export const ChatMessagesListStyled = styled.div`
  overflow-y: auto;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const ChatMessagesStyled = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
  height: 100%;

  ${ChatMessagesListStyled} {
    flex: 1;
  }
`
