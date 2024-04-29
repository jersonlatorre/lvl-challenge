import { useEffect, useState } from 'react'

const usePreferredLanguage = () => {
  const [language, setLanguage] = useState(null)

  useEffect(() => {
    const browserLanguage = navigator.language.split('-')[0]
    setLanguage(browserLanguage)
  }, [])

  return language
}

export default usePreferredLanguage
