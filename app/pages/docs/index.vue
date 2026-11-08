<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: docs } = await useContentList('docs', locale)

useSeoMeta({
  title: computed(() => `${t('docs.title')} · NIP`),
  description: () => t('docs.intro')
})
</script>

<template>
  <UContainer class="py-16">
    <div class="max-w-2xl">
      <h1
        class="text-3xl font-bold tracking-tight text-(--ui-text-highlighted)"
      >
        {{ t('docs.title') }}
      </h1>
      <p class="mt-4 text-(--ui-text-toned)">
        {{ t('docs.intro') }}
      </p>
    </div>

    <div v-if="docs?.items?.length" class="mt-10 grid gap-4 sm:grid-cols-2">
      <NuxtLink
        v-for="doc in docs.items"
        :key="doc.id"
        :to="localePath(`/docs/${doc.slug}`)"
        class="group rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6 transition hover:border-(--ui-primary)/50"
      >
        <h2
          class="text-lg font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
        >
          {{ doc.title }}
        </h2>
        <p
          v-if="doc.description"
          class="mt-2 text-sm leading-6 text-(--ui-text-muted)"
        >
          {{ doc.description }}
        </p>
        <span
          class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--ui-primary)"
        >
          {{ t('docs.title') }}
          <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
        </span>
      </NuxtLink>
    </div>

    <p v-else class="mt-10 text-(--ui-text-muted)">
      {{ t('docs.empty') }}
    </p>
  </UContainer>
</template>
