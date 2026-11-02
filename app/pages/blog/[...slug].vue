<script setup lang="ts">
const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const slug = computed(() => {
  const raw = route.params.slug
  return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

const postPath = computed(() => `/blog/${locale.value}/${slug.value}`)

const { data: post } = await useAsyncData(
  () => `post-${locale.value}-${slug.value}`,
  () => queryCollection('blog').path(postPath.value).first(),
  { watch: [postPath] }
)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found',
    fatal: true
  })
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(value))
}

useSeoMeta({
  title: computed(() => `${post.value?.title ?? t('blog.title')} · NIP`),
  description: () => post.value?.description ?? t('blog.intro')
})
</script>

<template>
  <UContainer class="py-12 lg:py-16">
    <article v-if="post" class="mx-auto max-w-3xl">
      <div class="flex items-center gap-2 text-xs text-(--ui-text-muted)">
        <time>{{ formatDate(post.date) }}</time>
        <span>·</span>
        <span>{{ t('blog.published') }}</span>
      </div>
      <h1
        class="mt-3 text-3xl font-bold tracking-tight text-(--ui-text-highlighted)"
      >
        {{ post.title }}
      </h1>
      <p v-if="post.description" class="mt-3 text-lg text-(--ui-text-toned)">
        {{ post.description }}
      </p>
      <div v-if="post.tags?.length" class="mt-5 flex flex-wrap gap-2">
        <UBadge
          v-for="tag in post.tags"
          :key="tag"
          color="neutral"
          variant="subtle"
          size="sm"
        >
          {{ tag }}
        </UBadge>
      </div>

      <div class="content-body mt-8">
        <ContentRenderer :value="post" />
      </div>

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
