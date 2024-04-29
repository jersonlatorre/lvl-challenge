/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useEffect, useState } from 'react'

import Global from '../global'
import { ReactP5Wrapper } from '@p5-wrapper/react'
import Result from './Result'
import sketch from '../p5/sketch'
import { uid } from 'uid'
import { useLocalStorage } from '@uidotdev/usehooks'

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

    window.addEventListener('selection-finished', handleComplete)

    return () => {
      window.removeEventListener('selection-finished', handleComplete)
    }
  }, [])

  useEffect(() => {
    const handleRequest = async (e) => {
      const id = uid()
      setId(id)

      const uriEmojisNames = encodeURIComponent(JSON.stringify(Global.selectedItems.map((emoji) => emoji.name)))
      const emojisSymbols = Global.selectedItems.map((emoji) => emoji.emoji)
      const phrase = await fetch(`/api/?type=phrase&words=${uriEmojisNames}`).then((res) => res.text())
      setEmojis(emojisSymbols)
      setPhrase(phrase)

      const uriPhrase = encodeURIComponent(phrase)
      const imageUrl = await fetch(`/api/?type=image&phrase=${uriPhrase}`).then((res) => res.text())
      setImageUrl(imageUrl)

      setArtworks([...artworks, { id, phrase, imageUrl, emojis: emojisSymbols, author: '' }])
    }

    window.addEventListener('all-emojis-selected', handleRequest)

    return () => {
      window.removeEventListener('all-emojis-selected', handleRequest)
    }
  }, [])

  return (
    <div className={`transition-opacity duration-500 ${fade ? 'opacity-100' : 'opacity-0'}`}>
      {state === 'select' && <ReactP5Wrapper sketch={sketch} />}
      {state === 'result' && <Result id={id} phrase={phrase} imageUrl={imageUrl} emojis={emojis} />}
    </div>
  )
}
