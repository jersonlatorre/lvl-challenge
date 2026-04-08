import { useEffect, useRef, useState } from 'react'

import BarLoader from 'react-spinners/BarLoader'
import Global from '../global'
import Image from 'next/image'
import gsap from 'gsap'
import useLocalStorage from '../hooks/useLocalStorage'

export default function Result({ id, phrase, imageUrl, emojis, generationError }) {
  const [parts, setParts] = useState([])
  const [author, setAuthor] = useState('')
  const [artworks, setArtworks] = useLocalStorage('artworks', [])
  const [imageReady, setImageReady] = useState(false)
  const [imageError, setImageError] = useState(false)
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
          .delay(i * 0.2)
      })
    }
  }, [parts])

  useEffect(() => {
    setImageReady(false)
    setImageError(false)
  }, [imageUrl])

  useEffect(() => {
    if (imageReady || generationError) {
      gsap.to(navigationRef.current, { opacity: 1, duration: 1 })
      gsap.to(formRef.current, { opacity: generationError ? 0 : 1, duration: 1 })
    }
  }, [imageReady, generationError])

  useEffect(() => {
    if (!phrase || generationError === 'phrase') {
      setParts([])
      return
    }
    let parts = phrase.split(/\s+|(?=[.,!?¡¿])/).filter(Boolean)
    parts = parts.map((part) => {
      const emoji = Global.selectedItems.find((emoji) => emoji.name === part)
      if (emoji) {
        return part + ' ' + emoji.emoji
      } else {
        return part
      }
    })

    setParts(parts)
  }, [phrase, generationError])

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
    <div className="bg-almost-black text-white w-screen h-screen text-center flex flex-col justify-center items-center">
      <section ref={imageRef}>
        {generationError === 'phrase' ? (
          <div
            className="mb-8 flex min-h-[min(50vw,50vh)] w-[min(90vw,50vh)] max-w-2xl flex-col items-center justify-center rounded-xl bg-white/5 px-6 py-10"
            style={{ minHeight: 'min(50vw, 50vh)' }}
          >
            <p className="text-center text-xl leading-relaxed text-white/90">No se pudo generar la historia. Vuelve atrás e inténtalo otra vez.</p>
          </div>
        ) : generationError === 'image' ? (
          <div
            className="mb-8 flex min-h-[min(50vw,50vh)] w-[min(90vw,50vh)] max-w-2xl flex-col items-center justify-center rounded-xl bg-white/5 px-6 py-10"
            style={{ minHeight: 'min(50vw, 50vh)' }}
          >
            <p className="text-center text-xl leading-relaxed text-white/90">
              La historia sí salió, pero no se pudo generar la ilustración. Puedes volver atrás e intentarlo de nuevo.
            </p>
          </div>
        ) : imageUrl ? (
          <div className="relative mb-8" style={{ width: 'min(50vw, 50vh)', height: 'min(50vw, 50vh)' }}>
            <Image
              src={imageUrl}
              fill
              alt="Ilustración generada"
              priority
              sizes="(max-width: 768px) 90vw, min(50vw, 50vh)"
              className={`rounded-xl object-contain transition-opacity duration-500 ${imageReady ? 'opacity-100' : 'opacity-0'}`}
              onLoadingComplete={() => setImageReady(true)}
              onError={() => setImageError(true)}
            />
            {!imageReady && !imageError ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-almost-black/60">
                <p className="mb-3 text-xl opacity-80">cargando imagen...</p>
                <BarLoader color="white" />
              </div>
            ) : null}
            {imageError ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-almost-black/80 px-4">
                <p className="text-center text-lg opacity-90">No se pudo mostrar la imagen. Prueba recargar o generar de nuevo.</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mb-10 flex flex-col items-center justify-center">
            <p className="text-1xl mb-3 opacity-20">pintando...</p>
            <BarLoader color="white" />
          </div>
        )}
      </section>
      <section ref={phraseRef} className="w-1/2 lowercase">
        {generationError === 'phrase' ? null : (
          <>
            {parts.map((part, i) => (
              <span key={i} className="sinusoidal-animation inline-block text-2xl m-1 scale-0 bg-white bg-opacity-15 p-2 rounded-2xl" style={{ animationDelay: i * 0.3 + 's' }}>
                {part}
              </span>
            ))}
          </>
        )}
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
            ✔
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
