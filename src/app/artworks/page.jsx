'use client'

import { useLocalStorage } from '@uidotdev/usehooks'

export default function Artworks() {
  const [artworks] = useLocalStorage('artworks', [])
  return (
    <>
      <h1 className="text-3xl font-bold mt-10 text-center">Obras</h1>
      <div className="bg-white flex flex-wrap w-screen p-5">
        {artworks.map((artwork, i) => (
          <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-3" key={i}>
            <div className="bg-white p-4 rounded-lg drop-shadow-lg">
              <img src={artwork.imageUrl} alt="artwork" className="w-full h-auto mb-2 rounded-md" />
              <div className="text-center my-2 text-2xl">
                {artwork.emojis?.map((emoji, j) => (
                  <span key={j} className="mx-1">
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
      <a href="/" className="absolute top-10 left-5 text-1xl flex items-center">
        <span className="mr-2 text-2xl translate-y">←</span>
        <span>volver</span>
      </a>
    </>
  )
}
