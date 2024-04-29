import React, { useDebugValue, useEffect, useState } from 'react'

const useLocalStorage = (key, initialState) => {
  const [state, setState] = useState(initialState)

  useDebugValue(state)

  useEffect(() => {
    const item = localStorage.getItem(key)
    if (item) setState(parse(item))
  }, [key])

  useEffect(() => {
    if (state !== initialState) {
      localStorage.setItem(key, JSON.stringify(state))
    }
  }, [state, key, initialState])

  return [state, setState]
}

const parse = (value) => {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export default useLocalStorage
