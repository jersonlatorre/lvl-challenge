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
  const [a, b, c] = words
  const system = `Eres un autor de microfábulas en español. Tu tono es absurdo gentil: situaciones imposibles o causales ridículas, pero tiernas, nunca crueles ni cinicas.`

  const user = `Escribe una sola oración (máximo 20 palabras) que funcione como fábula miniatura: un mini relato con un giro suavemente absurdo.

Palabras obligatorias — deben aparecer exactamente así, sin cambiar letras ni tildes, y cada una solo una vez: ${a}, ${b}, ${c}.

Evita explícitamente: moralejas didácticas tipo lección; frases de apertura cliché ("había una vez", "erase que se era"); ironía mordaz o sarcasmo que hienda; violencia o miedo; explicar el chiste al final; preguntas retóricas vacías.

Responde únicamente con esa oración, sin comillas ni título.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.9,
  })

  const text = completion.choices[0]?.message?.content
  if (!text) {
    throw new Error('La respuesta del modelo no incluyó texto')
  }
  return text
}

const requestImage = async (phrase) => {
  const scene = `Escena e idea a pintar (debe leerse clara a un niño, personajes u objetos reconocibles pero estilizados):\n"${phrase}"`

  const style = `Estilo visual obligatorio:
- Óleo o acrílico sobre lienzo con trazo MUY visible: pinceladas marcadas, textura de pintura húmeda, impasto sugerido donde encaje.
- Luz y color de tradición impresionista; en parte del cuadro puede usarse punteo o puntillismo (manchitas de color separadas) mezclado con pincelada suelta — debe notarse que es pintura, no foto.
- Ilustración de álbum infantil: proporciones ligeramente exageradas, color vivo, sensación plástica y pintada a mano (como doble página de libro ilustrado), no escena documental.`

  const avoid = `NO incluir: ningún texto, letras, números, carteles legibles, marcas de agua, marcos ni bordes ornamentales.
NO usar: fotorrealismo, piel tipo fotografía, pelo hiperdetallado estilo render, iluminación de estudio tipo stock, CGI 3D liso, aspecto de captura de cámara o snapshot.`

  const prompt = `${scene}\n\n${style}\n\n${avoid}`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    style: 'natural',
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
