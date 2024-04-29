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
  const [emojis, setEmojis] = useState([])
  const [id, setId] = useState('')
  const [state, setState] = useState('select')
  const [fade, setFade] = useState(true)
  const [artworks, setArtworks] = useLocalStorage('artworks', [])

  useEffect(() => {
    const handleComplete = () => {
      setFade(false)
      setTimeout(() => {
        setState('result')
        setFade(true)
      }, 500)
    }

    if (!typeof window) return
    window.addEventListener('selection-finished', handleComplete)
    return () => window.removeEventListener('selection-finished', handleComplete)
  }, [])

  useEffect(() => {
    const handleRequest = async () => {
      const newId = uid()
      setId(newId)

      const uriEmojisNames = encodeURIComponent(JSON.stringify(Global.selectedItems.map((emoji) => emoji.name)))
      const emojisSymbols = Global.selectedItems.map((emoji) => emoji.emoji)
      const fetchedPhrase = await fetch(`/api/?type=phrase&words=${uriEmojisNames}`).then((res) => res.text())
      setEmojis(emojisSymbols)
      setPhrase(fetchedPhrase)

      const uriPhrase = encodeURIComponent(fetchedPhrase)
      const fetchedImageUrl = await fetch(`/api/?type=image&phrase=${uriPhrase}`).then((res) => res.text())
      setImageUrl(fetchedImageUrl)

      setArtworks([...artworks, { id: newId, phrase: fetchedPhrase, imageUrl: fetchedImageUrl, emojis: emojisSymbols, author: '' }])
    }

    if (!typeof window) return
    window.addEventListener('all-emojis-selected', handleRequest)
    return () => window.removeEventListener('all-emojis-selected', handleRequest)
  }, [])

  return (
    <div className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {state === 'select' && <ReactP5Wrapper sketch={sketch} />}
      {state === 'result' && <Result id={id} phrase={phrase} imageUrl={imageUrl} emojis={emojis} />}
    </div>
  )
}
