'use client'

import dynamic from 'next/dynamic'

const ObsidianRenderer = dynamic(() => import('@/components/ObsidianRenderer'), {
  ssr: true,
  loading: () => <div className="text-zinc-600 text-sm animate-pulse">Chargement...</div>,
})

export default function ObsidianRendererWrapper({ content }: { content: string }) {
  return <ObsidianRenderer content={content} />
}