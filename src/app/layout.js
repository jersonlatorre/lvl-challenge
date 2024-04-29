import './globals.css'

import { Rubik } from 'next/font/google'

const rubik = Rubik({ subsets: ['latin'] })

export const metadata = {
  title: 'Story Generator',
  description: 'Generador de historias con IA',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={rubik.className}>{children}</body>
    </html>
  )
}
