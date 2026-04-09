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

  const handleBack = () => {
    setFade(false)
    setTimeout(() => {
      Global.numClicks = 0
      Global.selectedItems = []
      setPhrase('')
      setImageUrl('')
      setGenerationError(null)
      setEmojis([])
      setId('')
      setState('select')
      setFade(true)
    }, 500)
  }

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
      const { frase, descripcionImagen } = await phraseRes.json()
      setEmojis(emojisSymbols)
      setPhrase(frase)

      const uriDescription = encodeURIComponent(descripcionImagen)
      const imageRes = await fetch(`/api/?type=image&description=${uriDescription}`)
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
        { id: newId, phrase: frase, imageUrl: fetchedImageUrl, emojis: emojisSymbols, author: '' },
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
        <Result id={id} phrase={phrase} imageUrl={imageUrl} emojis={emojis} generationError={generationError} onBack={handleBack} />
      )}
    </div>
  )
}
