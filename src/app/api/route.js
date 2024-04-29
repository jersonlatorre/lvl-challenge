import { OpenAI } from 'openai'
import { createProdia } from 'prodia'

export const maxDuration = 10
export const dynamic = 'force-dynamic'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
})

const prodia = createProdia({
  apiKey: process.env.PRODIA_API_KEY,
})

const requestPhrase = async (words) => {
  const prompt = `relata una historia, muy creativa, graciosa e irónica, orientada a niños; que quepa en una sola oración de menos de 20 palabras, usando estas palabras: ${words[0]}, ${words[1]} y ${words[2]}. las palabras deben respetarse tal cual, sin modificarlas y sin repetirlas.`

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
  })

  return completion.choices[0].message.content
}

const requestImage = async (phrase) => {
  const prompt = `creame una pintura impresionista, con los elementos bien reconocibles, sin texto, que se parezca a la siguiente oración: "${phrase}"`

  const response = await openai.images.generate({
    model: 'dall-e-2',
    prompt: prompt,
    n: 1,
    size: '256x256',
  })
  
  return response.data[0].url

  // const job = await prodia.generate({
  //   prompt: prompt,
  // })

  // console.log(job)

  // const { imageUrl, status } = await prodia.wait(job)
  // console.log(status)
  // return imageUrl
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  if (type === 'phrase') {
    const words = JSON.parse(searchParams.get('words'))
    const phrase = await requestPhrase(words)
    return new Response(phrase, { status: 200 })
  }

  if (type === 'image') {
    const phrase = searchParams.get('phrase')
    const imageUrl = await requestImage(phrase)
    return new Response(imageUrl, { status: 200 })
  }
}
