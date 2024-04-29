import { useEffect, useRef, useState } from 'react'

import BarLoader from 'react-spinners/BarLoader'
import Global from '../global'
import Image from 'next/image'
import gsap from 'gsap'
import useLocalStorage from '../hooks/useLocalStorage'

export default function Result({ id, phrase, imageUrl, emojis }) {
  const [parts, setParts] = useState([])
  const [author, setAuthor] = useState('')
  const [artworks, setArtworks] = useLocalStorage('artworks', [])
  const phraseRef = useRef(null)
  const imageRef = useRef(null)
  const authorRef = useRef(null)
  const navigationRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    if (parts.length > 0) {
      phraseRef.current.children.forEach((part, i) => {
        gsap
          .to(part, {
            scale: 1,
            duration: 1,
            ease: 'elastic',
          })
          .delay(i * 0.1)
      })
    }
  }, [parts])

  useEffect(() => {
    if (imageUrl) {
      gsap.to(navigationRef.current, { opacity: 1, duration: 1 })
      gsap.to(formRef.current, { opacity: 1, duration: 1 })
    }
  }, [imageUrl])

  useEffect(() => {
    let parts = phrase.split(/\s+|(?=[.,!?¡¿])/)
    parts = parts.map((part) => {
      const emoji = Global.selectedItems.find((emoji) => emoji.name === part)
      if (emoji) {
        return part + ' ' + emoji.emoji
      } else {
        return part
      }
    })

    setParts(parts)
  }, [phrase])

  const handleAuthorClick = () => {
    if (!authorRef.current) return
    const author = authorRef.current.value

    if (!author) return
    setAuthor(author)

    const updatedArtworks = artworks.map((artwork) => {
      if (artwork.id === id) {
        return { ...artwork, author: author, emojis }
      }
      return artwork
    })

    setArtworks(updatedArtworks)
  }

  return (
    <div className="bg-black text-white w-screen h-screen text-center flex flex-col justify-center items-center">
      <section ref={imageRef}>
        {imageUrl ? (
          <div className="relative mb-8" style={{ width: 'min(50vw, 50vh)', height: 'min(50vw, 50vh)' }}>
            <Image src={imageUrl} fill alt="image" className="rounded-xl"></Image>
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center mb-10">
            <p className="text-1xl mb-3 opacity-20">generando imagen...</p>
            <BarLoader color="white" />
          </div>
        )}
      </section>
      <section ref={phraseRef} className="w-1/2 lowercase">
        {parts.map((part, i) => (
          <span key={i} className="inline-block text-2xl m-1 scale-0 bg-white bg-opacity-15 p-2 rounded-2xl">
            {part}
          </span>
        ))}
      </section>
      <section ref={formRef} className="absolute bottom-10 opacity-0">
        <label className="text-2xl mr-2">autor : </label>
        {author !== '' ? (
          <p className="text-3xl inline-block text-white w-1/3">{author}</p>
        ) : (
          <input ref={authorRef} type="text" className="w-1/3 text-black text-3xl px-4 py-2 rounded-2xl mt-10 border-none focus:border-none focus:outline-none focus:ring-0" />
        )}
        {author == '' ? (
          <button onClick={handleAuthorClick} className="bg-white text-black text-3xl p-2 ml-4 rounded-2xl mt-10">
            OK
          </button>
        ) : null}
      </section>
      <section ref={navigationRef} className="opacity-0">
        <a href="/" className="absolute top-5 left-5 text-1xl opacity-50 hover:opacity-100">
          {'< atrás'}
        </a>
        <a href="/artworks" className="absolute top-5 right-5 text-1xl opacity-50 hover:opacity-100 flex items-center">
          <span>{'ver obras >'}</span>
        </a>
      </section>
    </div>
  )
}
