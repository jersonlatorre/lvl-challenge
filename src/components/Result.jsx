import { useEffect, useRef, useState } from 'react'

import BarLoader from 'react-spinners/BarLoader'
import Global from '../global'
import Image from 'next/image'
import gsap from 'gsap'
import useLocalStorage from '../hooks/useLocalStorage'

const fuzzyMatch = (phrasePart, emojiName) => {
  const a = phrasePart.toLowerCase()
  const b = emojiName.toLowerCase()
  if (a === b) return true
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  return shorter.length >= 3 && longer.startsWith(shorter)
}

export default function Result({ id, phrase, imageUrl, emojis, generationError, onBack }) {
  const [parts, setParts] = useState([])
  const [author, setAuthor] = useState('')
  const [artworks, setArtworks] = useLocalStorage('artworks', [])
  const [imageReady, setImageReady] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const phraseRef = useRef(null)
  const imageRef = useRef(null)
  const authorRef = useRef(null)
  const navigationRef = useRef(null)
  const formRef = useRef(null)
  const downloadRef = useRef(null)

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
    if (imageReady && !generationError) {
      gsap.to(downloadRef.current, { opacity: 1, duration: 1 })
    }
  }, [imageReady, generationError])

  useEffect(() => {
    if (!phrase || generationError === 'phrase') {
      setParts([])
      return
    }
    let parts = phrase.split(/\s+|(?=[.,!?¡¿])/).filter(Boolean)
    parts = parts.map((part) => {
      const emoji = Global.selectedItems.find((item) => fuzzyMatch(part, item.name))
      if (emoji) {
        return part + ' ' + emoji.emoji
      } else {
        return part
      }
    })

    setParts(parts)
  }, [phrase, generationError])

  const handleDownload = async () => {
    if (!imageUrl || !phrase || downloading) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/?type=proxy&url=${encodeURIComponent(imageUrl)}`)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)

      const img = new window.Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = blobUrl
      })

      const W = img.naturalWidth
      const fontSize = Math.round(W * 0.03)
      const padding = Math.round(W * 0.06)
      const lineHeight = fontSize * 1.7
      const fontStack = `italic ${fontSize}px Georgia, "Times New Roman", serif, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`

      const captionText = parts
        .join(' ')
        .replace(/ ([.,!?¡¿])/g, '$1')

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = W
      canvas.height = W

      ctx.font = fontStack
      const maxWidth = W - padding * 2
      const words = captionText.split(' ')
      const lines = []
      let line = ''
      for (const word of words) {
        const test = line ? `${line} ${word}` : word
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line)
          line = word
        } else {
          line = test
        }
      }
      if (line) lines.push(line)

      const captionH = padding * 2 + lines.length * lineHeight
      canvas.height = W + captionH

      ctx.drawImage(img, 0, 0, W, W)

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, W, W, captionH)

      ctx.fillStyle = '#ffffff'
      ctx.font = fontStack
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      lines.forEach((l, i) => {
        ctx.fillText(l, W / 2, W + padding + i * lineHeight)
      })

      URL.revokeObjectURL(blobUrl)

      canvas.toBlob((b) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(b)
        a.download = `obra-${id}.png`
        a.click()
      }, 'image/png')
    } catch (err) {
      console.error('Error al descargar:', err)
    } finally {
      setDownloading(false)
    }
  }

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
            <p className="text-center text-xl leading-relaxed text-white/90">el relato existió brevemente y luego decidió no existir. elige otros emojis e inténtalo de nuevo 🌀</p>
          </div>
        ) : generationError === 'image' ? (
          <div
            className="mb-8 flex min-h-[min(50vw,50vh)] w-[min(90vw,50vh)] max-w-2xl flex-col items-center justify-center rounded-xl bg-white/5 px-6 py-10"
            style={{ minHeight: 'min(50vw, 50vh)' }}
          >
            <p className="text-center text-xl leading-relaxed text-white/90">
              la historia está lista, pero el pintor renunció sin previo aviso. inténtalo de nuevo 🎨
            </p>
          </div>
        ) : (
          <div className="relative mb-8 rounded-xl" style={{ width: 'min(50vw, 50vh)', height: 'min(50vw, 50vh)' }}>
            {imageUrl && (
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
            )}
            {(!imageReady && !imageError) && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl">
                <BarLoader color="white" />
              </div>
            )}
            {imageError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-almost-black/80 px-4">
                <p className="text-center text-lg opacity-90">el cuadro llegó, pero venía vacío. recarga o genera uno nuevo 🖼️</p>
              </div>
            )}
          </div>
        )}
      </section>
      <div ref={downloadRef} className="opacity-0 mb-6">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-2 text-sm text-white/70 transition hover:bg-white/20 hover:text-white disabled:opacity-40"
        >
          {downloading ? (
            'descargando...'
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3v13" />
                <path d="M7 11l5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              llevar a casa
            </>
          )}
        </button>
      </div>

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
        <label className="text-2xl mr-2">¿quién es el responsable de esto? </label>
        {author !== '' ? (
          <p className="text-3xl inline-block text-white w-1/3">{author}</p>
        ) : (
          <input ref={authorRef} type="text" placeholder="tu nombre aquí" className="w-1/3 text-black text-3xl px-4 py-2 rounded-2xl mt-10 border-none focus:border-none focus:outline-none focus:ring-0" />
        )}
        {author == '' ? (
          <button onClick={handleAuthorClick} className="bg-white text-black text-3xl p-2 ml-4 rounded-2xl mt-10">
            ✔
          </button>
        ) : null}
      </section>
      <section ref={navigationRef} className="opacity-0">
        <button onClick={onBack} className="absolute top-5 left-5 text-1xl opacity-50 hover:opacity-100">
          ← elegir otros
        </button>
        <a href="/artworks" className="absolute top-5 right-5 text-1xl opacity-50 hover:opacity-100 flex items-center">
          <span>el museo →</span>
        </a>
      </section>
    </div>
  )
}
