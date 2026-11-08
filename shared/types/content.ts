export type ContentLocale = 'zh' | 'en'

export type ContentCollection = 'docs' | 'blog'

export interface ContentSummary {
  id: string
  slug: string
  title: string
  description: string
  locale: ContentLocale
  collection: ContentCollection
  order: number
  date: string | null
  tags: string[]
  updatedAt: string
}

export interface ContentPage extends ContentSummary {
  html: string
}

export interface ContentListResponse {
  items: ContentSummary[]
  cached: boolean
  fetchedAt: string
}

export interface ContentPageResponse {
  page: ContentPage | null
  cached: boolean
  fetchedAt: string
}
