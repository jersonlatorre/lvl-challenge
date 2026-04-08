'use client'

import { useEffect, useState } from 'react'

import Global from '../global'
import Result from '../components/Result'
import dynamic from 'next/dynamic'
import sketch from '../p5/sketch'
import { uid } from 'uid'
import useLocalStorage from '../hooks/useLocalStorage'

const ReactP5Wrapper = dynamic(() => import('@p5-wrapper/react').then((mod) => mod.ReactP5Wrapper), { ssr: false })

export default function Home() {
  const [phrase, setPhrase] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  /** null | 'phrase' | 'image' — evita mezclar error con phrase y el spinner de imagen */
  const [generationError, setGenerationError] = useState(null)
  const [emojis, setEmojis] = useState([])
  const [id, setId] = useState('')
  const [state, setState] = useState('select')
  const [fade, setFade] = useState(true)
  const [, setArtworks] = useLocalStorage('artworks', [])

  useEffect(() => {
    const handleComplete = () => {
      setFade(false)
      setTimeout(() => {
        setState('result')
        setFade(true)
      }, 500)
    }

    if (typeof window === 'undefined') return
    window.addEventListener('selection-finished', handleComplete)
    return () => window.removeEventListener('selection-finished', handleComplete)
  }, [])

  useEffect(() => {
    const handleRequest = async () => {
      const newId = uid()
      setId(newId)
      setPhrase('')
      setImageUrl('')
      setGenerationError(null)

      const uriEmojisNames = encodeURIComponent(JSON.stringify(Global.selectedItems.map((emoji) => emoji.name)))
      const emojisSymbols = Global.selectedItems.map((emoji) => emoji.emoji)

      const phraseRes = await fetch(`/api/?type=phrase&words=${uriEmojisNames}`)
      if (!phraseRes.ok) {
        const err = await phraseRes.json().catch(() => ({}))
        console.error(err.error || phraseRes.statusText)
        setEmojis(emojisSymbols)
        setGenerationError('phrase')
        return
      }
      const fetchedPhrase = await phraseRes.text()
      setEmojis(emojisSymbols)
      setPhrase(fetchedPhrase)

      const uriPhrase = encodeURIComponent(fetchedPhrase)
      const imageRes = await fetch(`/api/?type=image&phrase=${uriPhrase}`)
      if (!imageRes.ok) {
        const err = await imageRes.json().catch(() => ({}))
        console.error(err.error || imageRes.statusText)
        setGenerationError('image')
        return
      }
      const fetchedImageUrl = await imageRes.text()
      setImageUrl(fetchedImageUrl)

      setArtworks((prev) => [
        ...(prev ?? []),
        { id: newId, phrase: fetchedPhrase, imageUrl: fetchedImageUrl, emojis: emojisSymbols, author: '' },
      ])
    }

    if (typeof window === 'undefined') return
    window.addEventListener('all-emojis-selected', handleRequest)
    return () => window.removeEventListener('all-emojis-selected', handleRequest)
  }, [setArtworks])

  return (
    <div className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {state === 'select' && <ReactP5Wrapper sketch={sketch} />}
      {state === 'result' && (
        <Result id={id} phrase={phrase} imageUrl={imageUrl} emojis={emojis} generationError={generationError} />
      )}
    </div>
  )
}
