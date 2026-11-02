<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const toRoutePath = (path: string) => path.replace(/^\/docs\/[^/]+/, '/docs')

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

const docPath = computed(() => `/docs/${locale.value}/${slug.value}`)

const { data: page } = await useAsyncData(
  () => `doc-${locale.value}-${slug.value}`,
  () => queryCollection('docs').path(docPath.value).first(),
  { watch: [docPath] }
)

const { data: nav } = await useAsyncData(
  () => `docs-nav-${locale.value}`,
  () =>
    queryCollection('docs')
      .where('path', 'LIKE', `/docs/${locale.value}/%`)
      .order('order', 'ASC')
      .all(),
  { watch: [locale] }
)

if (!page.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Document not found',
    fatal: true
  })
}

useSeoMeta({
  title: computed(() => `${page.value?.title ?? t('docs.title')} · NIP`),
  description: () => page.value?.description ?? t('docs.intro')
})

function isCurrent(path: string) {
  return route.path === localePath(toRoutePath(path))
}
</script>

<template>
  <UContainer class="py-12 lg:py-16">
    <div class="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <p
          class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)"
        >
          {{ t('docs.sidebar') }}
        </p>
        <nav class="mt-3 space-y-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.path"
            :to="localePath(toRoutePath(item.path))"
            class="block rounded-md px-3 py-2 text-sm transition"
            :class="
              isCurrent(item.path)
                ? 'bg-(--ui-bg-elevated) font-medium text-(--ui-text-highlighted)'
                : 'text-(--ui-text-muted) hover:bg-(--ui-bg-muted) hover:text-(--ui-text)'
            "
          >
            {{ item.title }}
          </NuxtLink>
        </nav>
      </aside>

      <article v-if="page">
        <div class="content-body">
          <ContentRenderer :value="page" />
        </div>

        <div class="mt-12 border-t border-(--ui-border) pt-6">
          <UButton
            :to="localePath('/docs')"
            variant="ghost"
            color="neutral"
            icon="i-lucide-arrow-left"
          >
            {{ t('docs.back') }}
          </UButton>
        </div>
      </article>
    </div>
  </UContainer>
</template>
