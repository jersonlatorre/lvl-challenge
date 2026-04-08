import { OpenAI } from 'openai'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function jsonError(message, status) {
  return Response.json({ error: message }, { status })
}

function parseWordsParam(raw) {
  if (raw == null || raw === '') {
    throw new Error('Falta el parámetro words')
  }
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed) || parsed.length !== 3) {
    throw new Error('words debe ser un array JSON de exactamente 3 elementos')
  }
  if (!parsed.every((w) => typeof w === 'string' && w.length > 0)) {
    throw new Error('Cada palabra en words debe ser un string no vacío')
  }
  return parsed
}

const requestPhrase = async (words) => {
  const prompt = `relata una historia, muy creativa, graciosa e irónica, orientada a niños; que quepa en una sola oración de menos de 20 palabras, usando estas palabras: ${words[0]}, ${words[1]} y ${words[2]}. las palabras deben respetarse tal cual, sin modificarlas y sin repetirlas.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  })

  const text = completion.choices[0]?.message?.content
  if (!text) {
    throw new Error('La respuesta del modelo no incluyó texto')
  }
  return text
}

const requestImage = async (phrase) => {
  const prompt = `creame una pintura impresionista, con los elementos bien reconocibles, sin texto, que se parezca a la siguiente oración: "${phrase}"`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
  })

  const url = response.data?.[0]?.url
  if (!url) {
    throw new Error('No se obtuvo URL de imagen')
  }
  return url
}

export async function GET(request) {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError('OPENAI_API_KEY no está configurada', 503)
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type !== 'phrase' && type !== 'image') {
      return jsonError('type debe ser phrase o image', 400)
    }

    if (type === 'phrase') {
      let words
      try {
        words = parseWordsParam(searchParams.get('words'))
      } catch (e) {
        return jsonError(e.message, 400)
      }
      const phrase = await requestPhrase(words)
      return new Response(phrase, { status: 200 })
    }

    const phrase = searchParams.get('phrase')
    if (phrase == null || phrase.trim() === '') {
      return jsonError('Falta phrase o está vacío', 400)
    }

    const imageUrl = await requestImage(phrase)
    return new Response(imageUrl, { status: 200 })
  } catch (err) {
    console.error('[api]', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return jsonError(message, 500)
  }
}
