<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

const { data, error } = await useContentPage('docs', locale, slug)
const page = computed(() => data.value?.page ?? null)
const { data: nav } = await useContentList('docs', locale)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 502,
    statusMessage: 'Unable to load Notion content',
    fatal: true
  })
}

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

function isCurrent(itemSlug: string) {
  return route.path === localePath(`/docs/${itemSlug}`)
}
</script>

<template>
  <UContainer class="py-12 lg:py-16">
    <div class="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-28 lg:self-start">
        <p
          class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)"
        >
          {{ t('docs.sidebar') }}
        </p>
        <nav class="mt-3 space-y-1">
          <NuxtLink
            v-for="item in nav?.items ?? []"
            :key="item.id"
            :to="localePath(`/docs/${item.slug}`)"
            class="block rounded-md px-3 py-2 text-sm transition"
            :class="
              isCurrent(item.slug)
                ? 'bg-(--ui-bg-elevated) font-medium text-(--ui-text-highlighted)'
                : 'text-(--ui-text-muted) hover:bg-(--ui-bg-muted) hover:text-(--ui-text)'
            "
          >
            {{ item.title }}
          </NuxtLink>
        </nav>
      </aside>

      <article v-if="page">
        <header class="mb-8 border-b border-(--ui-border) pb-6">
          <p class="font-mono text-[9px] uppercase tracking-[0.16em] text-(--ui-primary)">
            {{ t('docs.title') }}
          </p>
          <h1 class="mt-3 text-3xl font-bold tracking-tight text-(--ui-text-highlighted)">
            {{ page.title }}
          </h1>
          <p v-if="page.description" class="mt-3 text-lg text-(--ui-text-toned)">
            {{ page.description }}
          </p>
        </header>

        <div class="content-body" v-html="page.html" />

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
