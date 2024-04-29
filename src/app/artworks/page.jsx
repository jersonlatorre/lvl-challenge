'use client'

import { useEffect, useState } from 'react'

import Image from 'next/image'
import useLocalStorage from '../../hooks/useLocalStorage'

export default function Artworks() {
  const [artworks] = useLocalStorage('artworks', [])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null 
  }

  return (
    <>
      <h1 className="text-3xl font-bold mt-10 text-center">Obras</h1>
      <div className="bg-white flex flex-wrap w-screen p-5">
        {artworks?.map((artwork) => (
          <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-3" key={artwork.id}>
            <div className="bg-white p-4 rounded-lg drop-shadow-lg">
              <div className="relative w-full h-64 mb-3">
                <Image src={artwork.imageUrl} alt="artwork" className="w-full h-auto mb-2 rounded-md" fill priority></Image>
              </div>
              <div className="text-center my-2 text-2xl">
                {artwork.emojis?.map((emoji) => (
                  <span key={emoji} className="mx-1">
                    {emoji}
                  </span>
                ))}
              </div>
              <p className="leading-tight mb-5">{artwork.phrase}</p>
              <p className="leading-tight text-gray-300">{artwork.author ? `por: ${artwork.author}` : '(sin autor)'}</p>
            </div>
          </div>
        ))}
      </div>
      <a href="/" className="absolute top-10 left-5 text-md ml-4 hover:text-gray-400">
        <span>{'< atrás'}</span>
      </a>
    </>
  )
}
