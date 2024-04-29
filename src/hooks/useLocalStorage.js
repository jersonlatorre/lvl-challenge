import { useDebugValue, useEffect, useState } from 'react'

const useLocalStorage = (key, initialState) => {
  const [state, setState] = useState(() => {
    let item
    if (typeof window === 'undefined') return
    item = localStorage.getItem(key)

    return item ? parse(item) : initialState
  })

  useDebugValue(state)

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(key, JSON.stringify(state))
  }, [state, key])

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
