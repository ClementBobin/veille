import { createHighlighter } from 'shiki'

export const highlighterPromise = createHighlighter({
  themes: ['github-dark'],
  langs: [
    'typescript', 'javascript', 'tsx', 'jsx',
    'python', 'bash', 'sh', 'json', 'yaml',
    'markdown', 'css', 'html', 'sql', 'rust', 'go', 'text',
  ],
})