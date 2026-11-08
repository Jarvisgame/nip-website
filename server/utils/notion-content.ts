import { Client } from '@notionhq/client'
import { NotionToMarkdown } from 'notion-to-md'
import { marked } from 'marked'
import {
  createError,
  getHeader,
  getQuery,
  getRouterParam
} from 'h3'
import type { H3Event } from 'h3'
import type {
  ContentCollection,
  ContentListResponse,
  ContentLocale,
  ContentPage,
  ContentPageResponse,
  ContentSummary
} from '~~/shared/types/content'

const LIST_TTL_SECONDS = 60 * 5
const PAGE_TTL_SECONDS = 60 * 60
const CACHE_VERSION = 'v1'
const MEMORY_CACHE_LIMIT = 200

interface MemoryEntry {
  expiresAt: number
  value: unknown
}

interface KvNamespaceLike {
  get(key: string, type: 'json'): Promise<unknown | null>
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number }
  ): Promise<void>
  delete(key: string): Promise<void>
  list(options?: {
    prefix?: string
  }): Promise<{ keys: Array<{ name: string }> }>
}

const memoryCache = new Map<string, MemoryEntry>()
const dataSourceCache = new Map<string, string>()
let notionClient: { token: string; client: Client } | null = null

const defaultProperties = {
  title: 'Name',
  slug: 'Slug',
  description: 'Description',
  locale: 'Locale',
  order: 'Order',
  date: 'Date',
  tags: 'Tags',
  published: 'Published'
} as const

function getCloudflareEnv(event: H3Event): Record<string, string | undefined> {
  return (
    (event.context as { cloudflare?: { env?: Record<string, string> } })
      .cloudflare?.env ?? {}
  )
}

function getEnv(event: H3Event, key: string): string | undefined {
  const cloudflareValue = getCloudflareEnv(event)[key]
  if (cloudflareValue) return cloudflareValue

  if (typeof process !== 'undefined') {
    return process.env[key]
  }

  return undefined
}

function getPropertyName(
  event: H3Event,
  key: keyof typeof defaultProperties
): string {
  return (
    getEnv(event, `NOTION_${key.toUpperCase()}_PROPERTY`) ??
    defaultProperties[key]
  )
}

function getDefaultLocale(event: H3Event): ContentLocale {
  return getEnv(event, 'NOTION_DEFAULT_LOCALE') === 'en' ? 'en' : 'zh'
}

function getRequestedLocale(event: H3Event): ContentLocale {
  const raw = String(getQuery(event).locale ?? '')
  return raw === 'en' ? 'en' : raw === 'zh' ? 'zh' : getDefaultLocale(event)
}

function getCollection(event: H3Event): ContentCollection {
  const raw = String(getRouterParam(event, 'collection') ?? '')
  if (raw !== 'docs' && raw !== 'blog') {
    throw createError({ statusCode: 404, statusMessage: 'Unknown collection' })
  }
  return raw
}

function getNotionClient(event: H3Event): Client {
  const token = getEnv(event, 'NOTION_API_KEY')
  if (!token) {
    throw createError({
      statusCode: 503,
      statusMessage:
        'Notion is not configured: set NOTION_API_KEY in .env/.dev.vars or as a Worker secret'
    })
  }

  if (notionClient?.token === token) {
    return notionClient.client
  }

  const client = new Client({
    auth: token,
    // Workers requires fetch to be bound to globalThis.
    fetch: globalThis.fetch.bind(globalThis)
  })

  notionClient = { token, client }
  return client
}

function getKv(event: H3Event): KvNamespaceLike | null {
  const env = (
    event.context as {
      cloudflare?: {
        env?: {
          NIP_CACHE?: KvNamespaceLike
          CACHE?: KvNamespaceLike
        }
      }
    }
  ).cloudflare?.env

  return env?.NIP_CACHE ?? env?.CACHE ?? null
}

function pruneMemoryCache() {
  if (memoryCache.size <= MEMORY_CACHE_LIMIT) return

  const now = Date.now()
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) memoryCache.delete(key)
  }

  while (memoryCache.size > MEMORY_CACHE_LIMIT) {
    const oldest = memoryCache.keys().next().value
    if (!oldest) break
    memoryCache.delete(oldest)
  }
}

async function readCache<T>(
  event: H3Event,
  key: string
): Promise<T | null> {
  const kv = getKv(event)

  if (kv) {
    try {
      const value = await kv.get(key, 'json')
      if (value !== null) return value as T

      // KV is authoritative when available. Do not let a per-isolate
      // memory entry survive after a KV purge.
      memoryCache.delete(key)
      return null
    } catch (error) {
      console.warn('KV read failed; falling back to memory cache', error)
    }
  }

  const entry = memoryCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    return null
  }

  return entry.value as T
}

async function writeCache(
  event: H3Event,
  key: string,
  value: unknown,
  ttlSeconds: number
) {
  const kv = getKv(event)
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value), {
        expirationTtl: ttlSeconds
      })
      return
    } catch (error) {
      console.warn('KV write failed; falling back to memory cache', error)
    }
  }

  memoryCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value
  })
  pruneMemoryCache()
}

async function withCache<T>(
  event: H3Event,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<{ value: T; cached: boolean }> {
  const cached = await readCache<T>(event, key)
  if (cached !== null) {
    return { value: cached, cached: true }
  }

  const value = await loader()
  await writeCache(event, key, value, ttlSeconds)
  return { value, cached: false }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      if (attempt === retries) throw error

      const message = String(error?.message ?? '')
      const isNetworkError =
        error?.cause?.code === 'ECONNRESET' ||
        error?.code === 'ECONNRESET' ||
        message.includes('fetch failed')

      if (!isNetworkError) throw error
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
    }
  }

  throw new Error('unreachable')
}

function richText(items: any[] | undefined): string {
  return (items ?? [])
    .map(item => item?.plain_text ?? item?.text?.content ?? '')
    .join('')
    .trim()
}

function readTitle(properties: Record<string, any>, name: string): string {
  const preferred = properties[name]
  if (preferred?.type === 'title') return richText(preferred.title)

  const fallback = Object.values(properties).find(
    property => property?.type === 'title'
  )
  return fallback ? richText(fallback.title) : ''
}

function readRichText(properties: Record<string, any>, name: string): string {
  const property = properties[name]
  if (property?.type === 'rich_text') return richText(property.rich_text)
  return ''
}

function readSelect(properties: Record<string, any>, name: string): string {
  const property = properties[name]
  if (!property) return ''

  if (property.type === 'select') return property.select?.name ?? ''
  if (property.type === 'status') return property.status?.name ?? ''
  if (property.type === 'rich_text') return richText(property.rich_text)
  return ''
}

function readNumber(
  properties: Record<string, any>,
  name: string,
  fallback: number
): number {
  const property = properties[name]
  return property?.type === 'number' && typeof property.number === 'number'
    ? property.number
    : fallback
}

function readDate(properties: Record<string, any>, name: string): string | null {
  const property = properties[name]
  if (property?.type === 'date') return property.date?.start ?? null
  return null
}

function readTags(properties: Record<string, any>, name: string): string[] {
  const property = properties[name]
  if (!property) return []

  if (property.type === 'multi_select') {
    return (property.multi_select ?? [])
      .map((item: any) => String(item.name ?? '').trim())
      .filter(Boolean)
  }

  if (property.type === 'rich_text') {
    return richText(property.rich_text)
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return []
}

function readPublished(
  properties: Record<string, any>,
  name: string
): boolean {
  const property = properties[name]
  if (property?.type !== 'checkbox') return true
  return property.checkbox === true
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toSummary(
  page: any,
  collection: ContentCollection,
  requestedLocale: ContentLocale,
  event: H3Event
): ContentSummary | null {
  const properties = page.properties ?? {}
  const title = readTitle(properties, getPropertyName(event, 'title'))
  const slugSource = readRichText(
    properties,
    getPropertyName(event, 'slug')
  )
  const slug = slugSource || slugify(title) || page.id.replace(/-/g, '')
  const rawLocale = readSelect(
    properties,
    getPropertyName(event, 'locale')
  ).toLowerCase()
  const locale: ContentLocale = rawLocale.startsWith('en')
    ? 'en'
    : rawLocale.startsWith('zh')
      ? 'zh'
      : getDefaultLocale(event)

  if (!title || !slug || locale !== requestedLocale) return null
  if (!readPublished(properties, getPropertyName(event, 'published'))) {
    return null
  }

  return {
    id: page.id,
    slug,
    title,
    description: readRichText(
      properties,
      getPropertyName(event, 'description')
    ),
    locale,
    collection,
    order: readNumber(properties, getPropertyName(event, 'order'), 99),
    date: readDate(properties, getPropertyName(event, 'date')),
    tags: readTags(properties, getPropertyName(event, 'tags')),
    updatedAt: page.last_edited_time
  }
}

async function resolveDataSourceId(
  event: H3Event,
  notion: Client,
  collection: ContentCollection
): Promise<string> {
  const prefix = collection === 'docs' ? 'DOCS' : 'BLOG'
  const directId = getEnv(event, `NOTION_${prefix}_DATA_SOURCE_ID`)
  if (directId) return directId

  const databaseId = getEnv(event, `NOTION_${prefix}_DATABASE_ID`)
  if (!databaseId) {
    throw createError({
      statusCode: 503,
      statusMessage: `Notion is not configured: set NOTION_${prefix}_DATABASE_ID`
    })
  }

  const cachedId = dataSourceCache.get(databaseId)
  if (cachedId) return cachedId

  const database: any = await withRetry(() =>
    notion.databases.retrieve({ database_id: databaseId })
  )
  const dataSourceId = database?.data_sources?.[0]?.id

  if (!dataSourceId) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'This Notion database has no data source. Use a data source ID instead.'
    })
  }

  dataSourceCache.set(databaseId, dataSourceId)
  return dataSourceId
}

async function fetchCollection(
  event: H3Event,
  collection: ContentCollection,
  locale: ContentLocale
): Promise<ContentSummary[]> {
  const notion = getNotionClient(event)
  const dataSourceId = await resolveDataSourceId(event, notion, collection)

  const pages: any[] = []
  let cursor: string | undefined

  do {
    const response: any = await withRetry(() =>
      notion.dataSources.query({
        data_source_id: dataSourceId,
        page_size: 100,
        start_cursor: cursor
      } as any)
    )

    pages.push(
      ...(response.results ?? []).filter(
        (item: any) => item?.object === 'page' && item.properties
      )
    )

    cursor =
      response.has_more && response.next_cursor
        ? response.next_cursor
        : undefined
  } while (cursor)

  const items = pages
    .map(page => toSummary(page, collection, locale, event))
    .filter((item): item is ContentSummary => item !== null)

  return items.sort((a, b) => {
    if (collection === 'blog') {
      return (b.date ?? b.updatedAt).localeCompare(a.date ?? a.updatedAt)
    }

    return a.order - b.order || a.title.localeCompare(b.title)
  })
}

async function fetchPageHtml(event: H3Event, pageId: string): Promise<string> {
  const notion = getNotionClient(event)
  const n2m = new NotionToMarkdown({ notionClient: notion })
  const blocks = await withRetry(() => n2m.pageToMarkdown(pageId))
  const markdown = n2m.toMarkdownString(blocks).parent ?? ''

  return marked.parse(markdown, { async: false }) as string
}

function listCacheKey(
  collection: ContentCollection,
  locale: ContentLocale
): string {
  return `nip:${CACHE_VERSION}:${collection}:${locale}:list`
}

function pageCacheKey(
  collection: ContentCollection,
  locale: ContentLocale,
  slug: string
): string {
  return `nip:${CACHE_VERSION}:${collection}:${locale}:page:${encodeURIComponent(slug)}`
}

export async function listContent(
  event: H3Event
): Promise<ContentListResponse> {
  const collection = getCollection(event)
  const locale = getRequestedLocale(event)
  const { value, cached } = await withCache(
    event,
    listCacheKey(collection, locale),
    LIST_TTL_SECONDS,
    () => fetchCollection(event, collection, locale)
  )

  return {
    items: value,
    cached,
    fetchedAt: new Date().toISOString()
  }
}

export async function getContentPage(
  event: H3Event
): Promise<ContentPageResponse> {
  const collection = getCollection(event)
  const locale = getRequestedLocale(event)
  const slug = String(getRouterParam(event, 'slug') ?? '').trim()

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing content slug' })
  }

  const { value: collectionItems } = await withCache(
    event,
    listCacheKey(collection, locale),
    LIST_TTL_SECONDS,
    () => fetchCollection(event, collection, locale)
  )

  const summary = collectionItems.find(item => item.slug === slug)
  if (!summary) {
    return {
      page: null,
      cached: false,
      fetchedAt: new Date().toISOString()
    }
  }

  const { value: page, cached } = await withCache<ContentPage>(
    event,
    pageCacheKey(collection, locale, slug),
    PAGE_TTL_SECONDS,
    async () => ({
      ...summary,
      html: await fetchPageHtml(event, summary.id)
    })
  )

  return {
    page,
    cached,
    fetchedAt: new Date().toISOString()
  }
}

export async function revalidateContent(event: H3Event): Promise<number> {
  const expected = getEnv(event, 'NIP_REVALIDATE_TOKEN')
  const provided = String(getHeader(event, 'x-revalidate-token') ?? '')

  if (!expected || provided !== expected) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid revalidation token' })
  }

  const kv = getKv(event)
  let purged = 0

  if (kv) {
    try {
      const result = await kv.list({ prefix: `nip:${CACHE_VERSION}:` })
      for (const key of result.keys) {
        await kv.delete(key.name)
        purged++
      }
    } catch (error) {
      console.warn('KV purge failed; clearing memory cache only', error)
    }
  }

  for (const key of memoryCache.keys()) {
    if (key.startsWith(`nip:${CACHE_VERSION}:`)) {
      memoryCache.delete(key)
      purged++
    }
  }

  return purged
}
