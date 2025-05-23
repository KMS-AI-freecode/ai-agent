import React, { useContext, useMemo, useReducer } from 'react'

import { WorldObject } from '../interfaces'

export enum WorldActionType {
  ADD_OBJECT = 'ADD_OBJECT',
  REMOVE_OBJECT = 'REMOVE_OBJECT',
  UPDATE_OBJECT = 'UPDATE_OBJECT',
  RESET_OBJECTS = 'RESET_OBJECTS',
}

type WorldAction =
  | { type: WorldActionType.ADD_OBJECT; payload: WorldObject }
  | { type: WorldActionType.REMOVE_OBJECT; payload: { id: string } }
  | { type: WorldActionType.UPDATE_OBJECT; payload: WorldObject }
  | { type: WorldActionType.RESET_OBJECTS; payload: WorldObject[] }

type WorldContextValue = {
  objects: WorldObject[]
  dispatch: React.Dispatch<WorldAction>
}

const WorldContext = React.createContext<WorldContextValue | undefined>(
  undefined,
)

const worldReducer = (
  state: WorldObject[],
  action: WorldAction,
): WorldObject[] => {
  switch (action.type) {
    case WorldActionType.ADD_OBJECT:
      return [...state, action.payload]

    case WorldActionType.REMOVE_OBJECT:
      return state.filter((obj) => obj.id !== action.payload.id)

    case WorldActionType.UPDATE_OBJECT:
      return state.map((obj) =>
        obj.id === action.payload.id ? action.payload : obj,
      )

    case WorldActionType.RESET_OBJECTS:
      return action.payload
  }
}

export const WorldContextProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [objects, dispatch] = useReducer(worldReducer, [])

  const contextValue = useMemo(() => {
    return {
      objects,
      dispatch,
    }
  }, [objects])

  return (
    <WorldContext.Provider value={contextValue}>
      {children}
    </WorldContext.Provider>
  )
}

export const useWorldContext = () => {
  const context = useContext(WorldContext)
  if (!context) {
    throw new Error('WorldContext is not definded')
  }

  return context
}
