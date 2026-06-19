import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'veille.io API',
    description:
      'REST API for the veille.io tech monitoring pipeline. Authentication via session cookie (login) or `x-api-key` header (API key).',
    version: '1.0.0',
  },
  servers: [{ url: '/api', description: 'Current origin' }],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'session',
        description: 'Session cookie obtained from `POST /auth/login`.',
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'API key generated from `POST /auth/keys`.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      Source: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          url: { type: 'string' },
          type: {
            type: 'string',
            enum: ['RSS', 'SCRAPING', 'VIDEO', 'AUDIO', 'SOCIAL', 'NEWSLETTER', 'FILE', 'WEBHOOK'],
          },
          active: { type: 'boolean' },
          cache: { type: 'boolean' },
          lastFetch: { type: 'string', format: 'date-time', nullable: true },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FeedItem: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          content: { type: 'string', nullable: true },
          sourceId: { type: 'string' },
          userId: { type: 'string' },
          relevant: { type: 'boolean' },
          processed: { type: 'boolean' },
          score: { type: 'number' },
          publishedAt: { type: 'string', format: 'date-time', nullable: true },
          fetchedAt: { type: 'string', format: 'date-time' },
          tags: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tag: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    color: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      Tag: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          color: { type: 'string', description: 'Hex color, e.g. `#6366f1`' },
          description: { type: 'string', nullable: true },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Digest: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          summary: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['PENDING', 'SELECTED', 'DONE'] },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          content: { type: 'string' },
          filename: { type: 'string', nullable: true },
          exportedTo: { type: 'string' },
          digestId: { type: 'string', nullable: true },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      PipelineEvent: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          workflow: { type: 'string', example: 'WF1' },
          status: { type: 'string', example: 'done' },
          message: { type: 'string', nullable: true },
          runId: { type: 'string', nullable: true },
          branch: { type: 'string', nullable: true },
          userId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiKey: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          lastUsed: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ cookieAuth: [] }, { apiKeyAuth: [] }],
  tags: [
    { name: 'Auth', description: 'Registration, login, logout, and API key management' },
    { name: 'Sources', description: 'Feed sources (RSS, scraping, video, social, …)' },
    { name: 'Articles', description: 'Raw and categorized feed items' },
    { name: 'Digests', description: 'Digest creation, selection, and retrieval' },
    { name: 'Notes', description: 'Obsidian-style notes generated from digests' },
    { name: 'Tags', description: 'Tag management' },
    { name: 'Pipeline', description: 'Pipeline event tracking (WF1–WF4)' },
    { name: 'System', description: 'Config, logs, cleanup, import/export' },
  ],
  paths: {
    // ── Auth ────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created, session cookie set' },
          '400': { description: 'Missing fields or password too short' },
          '409': { description: 'Email already in use' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Logged in, session cookie set' },
          '401': { description: 'Invalid credentials' },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'Logout (clears session cookie)',
        security: [],
        responses: {
          '200': { description: 'Logged out' },
        },
      },
    },
    '/auth/keys': {
      get: {
        tags: ['Auth'],
        summary: 'List API keys',
        responses: {
          '200': {
            description: 'List of API keys (raw key never returned after creation)',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ApiKey' } } } },
          },
        },
      },
      post: {
        tags: ['Auth'],
        summary: 'Create a new API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: { name: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Key created — raw value shown only once',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    key: { type: 'string', description: 'Raw API key, store it now' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['Auth'],
        summary: 'Delete an API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['id'],
                properties: { id: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Key deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    // ── Sources ─────────────────────────────────────────────────────────────
    '/sources': {
      get: {
        tags: ['Sources'],
        summary: 'List active sources',
        parameters: [
          {
            name: 'for_n8n',
            in: 'query',
            description: 'When `true`, filters out cache-only sources that already have items',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of sources',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Source' } } } },
          },
        },
      },
      post: {
        tags: ['Sources'],
        summary: 'Create a source',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'url', 'type'],
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['RSS', 'SCRAPING', 'VIDEO', 'AUDIO', 'SOCIAL', 'NEWSLETTER', 'FILE', 'WEBHOOK'],
                  },
                  cache: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Source created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Source' } } } },
          '400': { description: 'Missing required fields' },
        },
      },
    },
    '/sources/type': {
      get: {
        tags: ['Sources'],
        summary: 'Get source type metadata',
        description: 'Returns labels, icons, URL patterns, and quick-fill templates for each source type.',
        security: [],
        responses: {
          '200': { description: 'Array of source type metadata objects' },
        },
      },
    },
    '/sources/{id}': {
      get: {
        tags: ['Sources'],
        summary: 'Get a source by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Source', content: { 'application/json': { schema: { $ref: '#/components/schemas/Source' } } } },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Sources'],
        summary: 'Update a source',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  url: { type: 'string' },
                  type: { type: 'string' },
                  active: { type: 'boolean' },
                  cache: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated source' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Sources'],
        summary: 'Delete a source',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    // ── Articles ─────────────────────────────────────────────────────────────
    '/articles/raw': {
      post: {
        tags: ['Articles'],
        summary: 'Ingest raw feed items (WF1)',
        description: 'Accepts a single item or array. Upserts on `userId + url`. Updates `lastFetch` on all provided `sourceId`s.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  {
                    type: 'object',
                    required: ['title', 'url', 'sourceId'],
                    properties: {
                      title: { type: 'string' },
                      url: { type: 'string' },
                      content: { type: 'string' },
                      sourceId: { type: 'string' },
                      publishedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['title', 'url', 'sourceId'],
                      properties: {
                        title: { type: 'string' },
                        url: { type: 'string' },
                        content: { type: 'string' },
                        sourceId: { type: 'string' },
                        publishedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Ingestion result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    created: { type: 'integer' },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['Articles'],
        summary: 'List feed items',
        parameters: [
          {
            name: 'unprocessed',
            in: 'query',
            description: 'When `true`, returns only unprocessed or cache-active items (max 200)',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          '200': {
            description: 'Array of feed items',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/FeedItem' } } } },
          },
        },
      },
    },
    '/articles/categorized': {
      post: {
        tags: ['Articles'],
        summary: 'Categorize a feed item (WF2)',
        description: 'Sets `relevant`, `score`, and tag associations. Skips update if tag hash is unchanged and item is already processed.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  feedItemId: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' }, description: 'Tag names to associate' },
                  score: { type: 'number' },
                  relevant: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated feed item, or `{ skipped: true, reason: "tags_unchanged" }`' },
          '404': { description: 'Feed item not found' },
        },
      },
      get: {
        tags: ['Articles'],
        summary: 'List relevant, processed items not yet in a digest',
        parameters: [
          {
            name: 'resumeFrom',
            in: 'query',
            description: 'Pagination cursor — returns items with `id > resumeFrom`',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Array of feed items', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/FeedItem' } } } } },
        },
      },
    },
    '/articles/processed/{id}': {
      post: {
        tags: ['Articles'],
        summary: 'Mark a feed item as processed',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: '`{ ok: true }`' },
          '404': { description: 'Not found' },
        },
      },
    },
    // ── Digests ──────────────────────────────────────────────────────────────
    '/digest': {
      post: {
        tags: ['Digests'],
        summary: 'Create a digest (WF3)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string' },
                  summary: { type: 'string' },
                  toc: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        articleIds: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Digest created with subjects and TOC entries', content: { 'application/json': { schema: { $ref: '#/components/schemas/Digest' } } } },
        },
      },
      get: {
        tags: ['Digests'],
        summary: 'List digests',
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING', 'SELECTED', 'DONE'] },
            description: 'Filter by status. When `PENDING`, only the latest digest is returned.',
          },
        ],
        responses: {
          '200': { description: 'Array of digests (max 20, or 1 for PENDING)', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Digest' } } } } },
        },
      },
    },
    '/digest/selection': {
      post: {
        tags: ['Digests'],
        summary: 'Save subject selection and trigger WF4',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['digestId', 'selectedSubjectIds'],
                properties: {
                  digestId: { type: 'string' },
                  selectedSubjectIds: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '`{ ok: true, selected: N }`' },
          '404': { description: 'Digest not found' },
        },
      },
      get: {
        tags: ['Digests'],
        summary: 'Get digest with selected subjects and articles',
        parameters: [
          { name: 'digestId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Digest with selected subjects, articles, and TOC (or `null`)' },
        },
      },
    },
    // ── Notes ─────────────────────────────────────────────────────────────
    '/notes': {
      post: {
        tags: ['Notes'],
        summary: 'Create a note',
        description: 'If `digestId` is provided, the linked digest status is set to `DONE`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  digestId: { type: 'string' },
                  filename: { type: 'string' },
                  exportedTo: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Note created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          '404': { description: 'Digest not found' },
        },
      },
      get: {
        tags: ['Notes'],
        summary: 'List notes',
        responses: {
          '200': { description: 'Array of notes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Note' } } } } },
        },
      },
    },
    '/notes/{id}': {
      get: {
        tags: ['Notes'],
        summary: 'Get a note',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Note', content: { 'application/json': { schema: { $ref: '#/components/schemas/Note' } } } },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Notes'],
        summary: 'Delete a note',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/notes/{id}/render': {
      get: {
        tags: ['Notes'],
        summary: 'Render a note as HTML',
        description: 'Renders the Obsidian-style markdown content to static HTML.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'HTML output',
            content: { 'text/html': { schema: { type: 'string' } } },
          },
          '404': { description: 'Not found' },
        },
      },
    },
    // ── Tags ─────────────────────────────────────────────────────────────
    '/tags': {
      get: {
        tags: ['Tags'],
        summary: 'List tags',
        responses: {
          '200': { description: 'Tags sorted by name', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Tag' } } } } },
        },
      },
      post: {
        tags: ['Tags'],
        summary: 'Create a tag',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string', default: '#6366f1' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Tag created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Tag' } } } },
          '400': { description: '`name` required' },
        },
      },
    },
    '/tags/{id}': {
      patch: {
        tags: ['Tags'],
        summary: 'Update a tag',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  color: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated tag' },
          '404': { description: 'Not found' },
        },
      },
      delete: {
        tags: ['Tags'],
        summary: 'Delete a tag',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Deleted' },
          '404': { description: 'Not found' },
        },
      },
    },
    // ── Pipeline ──────────────────────────────────────────────────────────
    '/pipeline-events': {
      get: {
        tags: ['Pipeline'],
        summary: 'List pipeline events (last 50)',
        responses: {
          '200': { description: 'Events', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PipelineEvent' } } } } },
        },
      },
      post: {
        tags: ['Pipeline'],
        summary: 'Record a pipeline event',
        description:
          'When `workflow=WF1` and `status=branch-done`, starts a 60 s timer that auto-triggers WF2 via the configured n8n webhook if no `done` event for the same `runId` arrives.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['workflow', 'status'],
                properties: {
                  workflow: { type: 'string', example: 'WF1' },
                  status: { type: 'string', example: 'branch-done' },
                  message: { type: 'string' },
                  runId: { type: 'string' },
                  branch: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Event created', content: { 'application/json': { schema: { $ref: '#/components/schemas/PipelineEvent' } } } },
        },
      },
    },
    '/pipeline-events/latest': {
      get: {
        tags: ['Pipeline'],
        summary: 'Get the latest event for each workflow (WF1–WF4)',
        responses: {
          '200': {
            description: 'Array of `{ workflow, event | null }` for WF1–WF4',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      workflow: { type: 'string' },
                      event: { $ref: '#/components/schemas/PipelineEvent' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // ── System ────────────────────────────────────────────────────────────
    '/system/config': {
      get: {
        tags: ['System'],
        summary: 'Get user config',
        description: 'Returns values for `N8N_BASE_URL`, `N8N_WEBHOOK_PATH`, `RETENTION_DAYS`.',
        responses: {
          '200': { description: 'Config key/value map' },
        },
      },
      patch: {
        tags: ['System'],
        summary: 'Update user config',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  N8N_BASE_URL: { type: 'string', example: 'http://localhost:5678' },
                  N8N_WEBHOOK_PATH: { type: 'string', example: 'webhook-test' },
                  RETENTION_DAYS: { type: 'string', example: '30' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '`{ ok: true, updated: string[] }`' },
          '400': { description: 'No valid keys provided' },
        },
      },
    },
    '/system/cleanup': {
      get: {
        tags: ['System'],
        summary: 'Preview cleanup',
        description: 'Returns count of feed items eligible for deletion based on `RETENTION_DAYS`.',
        responses: {
          '200': {
            description: 'Cleanup preview',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cutoff: { type: 'string', format: 'date-time' },
                    eligibleForCleanup: { type: 'integer' },
                    retentionDays: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      delete: {
        tags: ['System'],
        summary: 'Run cleanup',
        parameters: [
          {
            name: 'dryRun',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'If `true`, shows what would be deleted without deleting anything',
          },
        ],
        responses: {
          '200': { description: '`{ deleted: N, cutoff, dryRun }`' },
        },
      },
    },
    '/system/logs': {
      get: {
        tags: ['System'],
        summary: 'List request logs',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
          { name: 'path', in: 'query', schema: { type: 'string' }, description: 'Partial path filter' },
          { name: 'method', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'integer' } },
          { name: 'authType', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'Paginated logs',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    logs: { type: 'array', items: { type: 'object' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    pages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/system/export': {
      get: {
        tags: ['System'],
        summary: 'Export all user data',
        description: 'Returns a JSON file attachment containing all tables for the authenticated user.',
        responses: {
          '200': {
            description: 'JSON export file download',
            content: { 'application/json': { schema: { type: 'object' } } },
          },
        },
      },
    },
    '/system/import': {
      post: {
        tags: ['System'],
        summary: 'Import data from an export file',
        description: 'Upserts all records from a v1 export. Existing records are overwritten.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['version', 'data'],
                properties: {
                  version: { type: 'integer', enum: [1] },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: '`{ ok: true, imported: { tags: N, sources: N, … } }`' },
          '400': { description: 'Invalid JSON or unrecognized format' },
        },
      },
    },
    '/user': {
      delete: {
        tags: ['System'],
        summary: 'Delete account',
        description: 'Requires password confirmation and the string `"DELETE MY ACCOUNT"` in the `confirm` field.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password', 'confirm'],
                properties: {
                  password: { type: 'string' },
                  confirm: { type: 'string', enum: ['DELETE MY ACCOUNT'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Account deleted, session cookie cleared' },
          '400': { description: 'Wrong confirmation string' },
          '401': { description: 'Wrong password' },
          '404': { description: 'User not found' },
        },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(spec)
}