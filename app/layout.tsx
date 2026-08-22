import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/shared/Header'
import { Footer } from '@/components/shared/Footer'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WatermarkOut — AI Watermark Remover | Zero Blur Inpainting',
  description:
    'Remove watermarks, logos, text stamps, and unwanted objects from photos and videos using AI neural inpainting. Zero blur, pristine resolution.',
  keywords: [
    'watermark remover',
    'AI inpainting',
    'remove watermark from video',
    'remove watermark from photo',
    'big-lama',
    'ffmpeg wasm',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} font-sans bg-background text-text-primary min-h-screen flex flex-col selection:bg-primary/30 selection:text-white`}
      >
        {/* Background Ambient Glows */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-3xl opacity-70" />
          <div className="absolute top-1/3 -left-40 w-[450px] h-[450px] bg-primary/10 blur-3xl rounded-full" />
          <div className="absolute top-1/2 -right-40 w-[450px] h-[450px] bg-accent/10 blur-3xl rounded-full" />
          <div className="absolute inset-0 bg-radial-grid opacity-60" />
        </div>

        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
