import type {
  ContentCollection,
  ContentListResponse,
  ContentPageResponse
} from '~~/shared/types/content'

export function useContentList(
  collection: ContentCollection,
  locale: Ref<string>
) {
  return useAsyncData<ContentListResponse>(
    () => `content-${collection}-${locale.value}`,
    () =>
      $fetch<ContentListResponse>(`/api/content/${collection}`, {
        query: { locale: locale.value }
      }),
    { watch: [locale] }
  )
}

export function useContentPage(
  collection: ContentCollection,
  locale: Ref<string>,
  slug: Ref<string>
) {
  return useAsyncData<ContentPageResponse>(
    () => `content-${collection}-${locale.value}-${slug.value}`,
    () =>
      $fetch<ContentPageResponse>(
        `/api/content/${collection}/${encodeURIComponent(slug.value)}`,
        { query: { locale: locale.value } }
      ),
    { watch: [locale, slug] }
  )
}
