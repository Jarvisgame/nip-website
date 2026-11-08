<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: posts } = await useContentList('blog', locale)

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

useSeoMeta({
  title: computed(() => `${t('blog.title')} · NIP`),
  description: () => t('blog.intro')
})
</script>

<template>
  <UContainer class="py-16">
    <div class="max-w-2xl">
      <h1
        class="text-3xl font-bold tracking-tight text-(--ui-text-highlighted)"
      >
        {{ t('blog.title') }}
      </h1>
      <p class="mt-4 text-(--ui-text-toned)">
        {{ t('blog.intro') }}
      </p>
    </div>

    <div v-if="posts?.items?.length" class="mt-10 space-y-4">
      <article
        v-for="post in posts.items"
        :key="post.id"
        class="rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6 transition hover:border-(--ui-primary)/50"
      >
        <NuxtLink
          :to="localePath(`/blog/${post.slug}`)"
          class="group block"
        >
          <time v-if="post.date" class="text-xs text-(--ui-text-muted)">
            {{ formatDate(post.date) }}
          </time>
          <h2
            class="mt-2 text-xl font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
          >
            {{ post.title }}
          </h2>
          <p
            v-if="post.description"
            class="mt-2 text-sm leading-6 text-(--ui-text-muted)"
          >
            {{ post.description }}
          </p>
          <div v-if="post.tags.length" class="mt-4 flex flex-wrap gap-2">
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
          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--ui-primary)"
          >
            {{ t('blog.readMore') }}
            <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
          </span>
        </NuxtLink>
      </article>
    </div>

    <p v-else class="mt-10 text-(--ui-text-muted)">
      {{ t('blog.empty') }}
    </p>
  </UContainer>
</template>
