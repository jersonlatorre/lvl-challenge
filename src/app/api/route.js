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
  const system = `Eres un escritor de microficciones cómicas en español. Tu especialidad es el absurdo deadpan con un remate inesperado: construyes una situación que parece ir en una dirección y en la última palabra o frase giras hacia algo completamente inesperado pero perfectamente lógico dentro del relato. Eres conciso, original y nunca explicas el chiste.`

  const user = `Genera una microficción cómica y su descripción visual para un pintor. Responde ÚNICAMENTE con un JSON válido con exactamente estas dos claves:

{
  "frase": "...",
  "descripcionImagen": "..."
}

REGLAS PARA "frase" (máximo 18 palabras):
1. El remate va AL FINAL — la última palabra o frase es la sorpresa.
2. Sé MUY específico en los detalles absurdos: la especificidad hace reír, no la vaguedad.
3. Tono neutro y serio, como noticia de periódico o entrada de enciclopedia.
4. La situación es imposible pero la reacción del personaje es completamente normal y mundana.
5. Ortografía española perfecta y obligatoria: todas las tildes (á, é, í, ó, ú, ü, ñ) deben estar correctamente escritas. Nunca omitas una tilde.
Palabras obligatorias, exactamente así, sin cambiar letras ni tildes, cada una solo una vez: ${a}, ${b}, ${c}.

REGLAS PARA "descripcionImagen" (40 a 70 palabras):
Describe la escena visualmente para un pintor que NO ha leído la frase. Incluye:
- Quiénes son los personajes y cómo se ven físicamente (especie, tamaño, ropa si aplica). SOLO los personajes que aparecen en la frase — ningún personaje extra, ninguna figura de fondo, ningún transeúnte.
- Qué expresión facial y corporal tienen — debe transmitir el humor y la emoción del momento.
- Qué están haciendo exactamente, con qué objetos, en qué postura.
- Dónde ocurre la escena y qué elementos del entorno son relevantes para la historia. El fondo debe ser simple y no añadir figuras adicionales.
- El tono emocional: alegre, absurdo, tierno, sorprendido, orgulloso, etc.

Ejemplos de "frase" para calibrar el registro (NO copies estructura ni palabras):
• "El tiburón aprendió a cocinar pasta y la crítica fue que le faltaba sal."
• "La luna renunció a su puesto y pidió tres semanas de vacaciones."
• "El volcán estuvo a punto de erupcionar, pero tenía una presentación en diez minutos."

Responde SOLO con el JSON. Sin texto adicional fuera del JSON.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 1,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error('La respuesta del modelo no incluyó contenido')
  const parsed = JSON.parse(raw)
  if (typeof parsed.frase !== 'string' || typeof parsed.descripcionImagen !== 'string') {
    throw new Error('El modelo no devolvió el JSON esperado')
  }
  return { frase: parsed.frase.trim(), descripcionImagen: parsed.descripcionImagen.trim() }
}

const requestImage = async (description) => {
  const scene = `Ilustra esta escena exactamente como se describe. Los personajes deben tener las expresiones y poses indicadas:\n"${description}"`

  const style = `ESTILO VISUAL OBLIGATORIO — impresionismo expresivo con brochazos GORDOS y visibles:
- TÉCNICA PRINCIPAL: pinceladas gruesas, largas y muy cargadas de pintura, como en Van Gogh o Monet en su etapa más expresiva. Los trazos del pincel son el elemento visual dominante: anchos, gestuales, claramente visibles, con dirección y energía propias.
- Cada zona de la imagen muestra brochazos distintos: el cielo tiene trazos en espiral o en curvas, la hierba en trazos verticales o diagonales, los personajes en trazos que siguen el volumen de las formas. El gesto del pintor debe sentirse en cada centímetro.
- Impasto visible: la pintura parece espesa y tridimensional, como si estuviera apilada sobre el lienzo. No hay zonas planas ni lisas.
- Paleta saturada y luminosa: colores vibrantes, luz intensa, ambiente festivo y alegre.
- Composición de libro álbum: personaje principal grande y centrado, proporciones ligeramente exageradas, ojos expresivos y graciosos, pose divertida. El fondo en brochazos más sueltos para no competir con el personaje.`

  const avoid = `PROHIBIDO — si aparece cualquiera de estos elementos el resultado es incorrecto:
- Cualquier texto, letra, número, palabra, signo, cartel o rótulo legible en cualquier parte de la imagen.
- Personajes, figuras humanas, animales o criaturas adicionales que no estén descritos explícitamente. El fondo no debe tener personas ni animales de relleno.
- Fotorrealismo: piel fotográfica, pelo hiperdetallado tipo render 3D, iluminación de estudio, aspecto de cámara o snapshot.
- CGI liso, plástico o aspecto de videojuego.
- Marcos, bordes decorativos, marcas de agua, viñetas o cualquier ornamento que no sea parte de la pintura.
- Paleta desaturada, grisácea o apagada.`

  const prompt = `${scene}\n\n${style}\n\n${avoid}`

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    style: 'vivid',
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

    if (!['phrase', 'image', 'proxy'].includes(type)) {
      return jsonError('type debe ser phrase, image o proxy', 400)
    }

    if (type === 'proxy') {
      const url = searchParams.get('url')
      if (!url) return jsonError('Falta url', 400)
      const upstream = await fetch(url)
      if (!upstream.ok) return jsonError('No se pudo obtener la imagen', 502)
      const buffer = await upstream.arrayBuffer()
      return new Response(buffer, {
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'image/png',
          'Cache-Control': 'no-store',
        },
      })
    }

    if (type === 'phrase') {
      let words
      try {
        words = parseWordsParam(searchParams.get('words'))
      } catch (e) {
        return jsonError(e.message, 400)
      }
      const result = await requestPhrase(words)
      return Response.json(result, { status: 200 })
    }

    const description = searchParams.get('description')
    if (description == null || description.trim() === '') {
      return jsonError('Falta description o está vacío', 400)
    }

    const imageUrl = await requestImage(description)
    return new Response(imageUrl, { status: 200 })
  } catch (err) {
    console.error('[api]', err)
    const message = err instanceof Error ? err.message : 'Error interno'
    return jsonError(message, 500)
  }
}
