<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

const { data, error } = await useContentPage('blog', locale, slug)
const page = computed(() => data.value?.page ?? null)

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
    statusMessage: 'Post not found',
    fatal: true
  })
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

useSeoMeta({
  title: computed(() => `${page.value?.title ?? t('blog.title')} · NIP`),
  description: () => page.value?.description ?? t('blog.intro')
})
</script>

<template>
  <UContainer class="py-12 lg:py-16">
    <article v-if="page" class="mx-auto max-w-3xl">
      <div class="flex items-center gap-2 text-xs text-(--ui-text-muted)">
        <time v-if="page.date">{{ formatDate(page.date) }}</time>
        <span v-if="page.date">·</span>
        <span>{{ t('blog.published') }}</span>
      </div>
      <h1
        class="mt-3 text-3xl font-bold tracking-tight text-(--ui-text-highlighted)"
      >
        {{ page.title }}
      </h1>
      <p v-if="page.description" class="mt-3 text-lg text-(--ui-text-toned)">
        {{ page.description }}
      </p>
      <div v-if="page.tags.length" class="mt-5 flex flex-wrap gap-2">
        <UBadge
          v-for="tag in page.tags"
          :key="tag"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ tag }}
        </UBadge>
      </div>

      <div class="content-body mt-8" v-html="page.html" />

      <div class="mt-12 border-t border-(--ui-border) pt-6">
        <UButton
          :to="localePath('/blog')"
          variant="ghost"
          color="neutral"
          icon="i-lucide-arrow-left"
        >
          {{ t('blog.back') }}
        </UButton>
      </div>
    </article>
  </UContainer>
</template>
