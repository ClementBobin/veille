import { NextResponse } from 'next/server'

export type SourceTypeTemplate = {
  label: string
  value: string
}

export type SourceTypeMeta = {
  value: string
  label: string
  color: string
  icon: string
  cacheSupported: boolean
  urlPlaceholder: string
  urlHint?: string
  urlPattern?: string
  urlTemplate?: string
  urlTemplateLabel?: string
  /** Quick-fill templates shown in a helper panel */
  urlTemplates?: SourceTypeTemplate[]
}

const TYPES: SourceTypeMeta[] = [
  {
    value: 'RSS',
    label: 'RSS',
    color: 'text-sky-400 bg-sky-400/10',
    icon: '📡',
    cacheSupported: false,
    urlPlaceholder: 'https://blog.example.com/feed.xml',
    urlHint: 'URL du flux RSS ou Atom',
    urlPattern: '^https?://.+',
  },
  {
    value: 'SCRAPING',
    label: 'Scraping',
    color: 'text-orange-400 bg-orange-400/10',
    icon: '🕷️',
    cacheSupported: true,
    urlPlaceholder: 'https://example.com/blog',
    urlHint: 'Page web à scraper via UpRock ou MrScraper',
    urlPattern: '^https?://.+',
  },
  {
    value: 'VIDEO',
    label: 'Vidéo',
    color: 'text-pink-400 bg-pink-400/10',
    icon: '🎬',
    cacheSupported: true,
    urlPlaceholder: 'https://www.youtube.com/watch?v=...',
    urlHint: 'URL YouTube — la transcription sera extraite via Supadata',
    urlPattern: '^https?://(www\\.)?youtube\\.com/watch\\?v=|^https?://youtu\\.be/',
  },
  {
    value: 'AUDIO',
    label: 'Audio / Podcast',
    color: 'text-violet-400 bg-violet-400/10',
    icon: '🎙️',
    cacheSupported: true,
    urlPlaceholder: 'https://podcast.example.com/episode.mp3',
    urlHint: "URL directe d'un épisode — transcription via Supadata",
    urlPattern: '^https?://.+',
  },
  {
    value: 'SOCIAL',
    label: 'Social',
    color: 'text-emerald-400 bg-emerald-400/10',
    icon: '💬',
    cacheSupported: false,
    urlPlaceholder: 'https://api.github.com/users/torvalds/events/public',
    urlHint: 'GitHub · Reddit · HN · DEV.to · Lemmy · Mastodon · Bluesky · LinkedIn',
    urlPattern: '^https?://.+',
    urlTemplates: [
      { label: 'GitHub user feed',     value: 'https://api.github.com/users/USERNAME/events/public' },
      { label: 'GitHub repo releases', value: 'https://api.github.com/repos/OWNER/REPO/releases' },
      { label: 'GitHub repo issues',   value: 'https://api.github.com/repos/OWNER/REPO/issues?state=open' },
      { label: 'GitHub search repos',  value: 'https://api.github.com/search/repositories?q=QUERY&sort=updated' },
      { label: 'Reddit subreddit',     value: 'https://www.reddit.com/r/SUBREDDIT.json' },
      { label: 'HN Algolia',           value: 'https://hn.algolia.com/api/v1/search?tags=story&query=QUERY' },
      { label: 'DEV.to tag',           value: 'https://dev.to/api/articles?tag=TAG' },
      { label: 'Mastodon timeline',    value: 'https://mastodon.social/api/v1/timelines/public' },
      { label: 'Bluesky user feed',    value: 'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=HANDLE&limit=30' },
      { label: 'Bluesky search posts',  value: 'https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=QUERY&limit=30' },
    ],
  },
  {
    value: 'NEWSLETTER',
    label: 'Newsletter',
    color: 'text-yellow-400 bg-yellow-400/10',
    icon: '✉️',
    cacheSupported: false,
    urlPlaceholder: 'newsletter-label',
    urlHint: 'Label Gmail utilisé pour filtrer les newsletters (ex: newsletters/tech)',
  },
  {
    value: 'FILE',
    label: 'Fichier',
    color: 'text-teal-400 bg-teal-400/10',
    icon: '📄',
    cacheSupported: true,
    urlPlaceholder: 'https://drive.google.com/file/d/.../view',
    urlHint: 'Google Drive — le fichier sera téléchargé et extrait via Ollama',
    urlPattern: '^https://drive\\.google\\.com/',
    urlTemplate: 'https://drive.google.com/file/d/FILE_ID/view',
    urlTemplateLabel: '📁 Template Drive',
  },
]

export async function GET() {
  return NextResponse.json(TYPES)
}