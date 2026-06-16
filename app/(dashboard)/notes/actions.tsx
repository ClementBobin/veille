'use server'

import ObsidianRenderer from '@/components/ObsidianRenderer'
import { renderToStaticMarkup } from 'react-dom/server'

export async function renderNote(content: string): Promise<string> {
  const element = await ObsidianRenderer({ content })
  return renderToStaticMarkup(element)
}