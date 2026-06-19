import { ApiReference } from '@scalar/nextjs-api-reference'

export const GET = ApiReference({
  url: '/api/openapi.json',
  pageTitle: 'veille.io — API Reference',
  theme: 'default',
  layout: 'modern',
  defaultHttpClient: {
    targetKey: 'javascript',
    clientKey: 'fetch',
  },
  authentication: {
    preferredSecurityScheme: 'apiKeyAuth',
  },
})