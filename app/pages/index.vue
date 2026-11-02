<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const stats = computed(() => [
  {
    value: t('home.stats.throughputValue'),
    label: t('home.stats.throughputLabel')
  },
  {
    value: t('home.stats.speedupValue'),
    label: t('home.stats.speedupLabel')
  },
  {
    value: t('home.stats.latencyValue'),
    label: t('home.stats.latencyLabel')
  }
])

const designs = computed(() => [
  {
    icon: 'i-lucide-search-code',
    title: t('home.designNrsTitle'),
    desc: t('home.designNrsDesc')
  },
  {
    icon: 'i-lucide-layers',
    title: t('home.designFacesTitle'),
    desc: t('home.designFacesDesc')
  },
  {
    icon: 'i-lucide-plug',
    title: t('home.designSocketTitle'),
    desc: t('home.designSocketDesc')
  }
])

const layers = [
  { label: 'Applications', note: 'NDN consumer / producer', highlight: false },
  { label: 'Socket-compatible API', note: 'keep existing usage', highlight: false },
  { label: 'Name resolution', note: 'forwarding + demultiplexing', highlight: true },
  { label: 'Two-layer faces', note: 'MAC / IP / port abstraction', highlight: true },
  { label: 'NIC & network', note: 'address-based devices', highlight: false }
]

useSeoMeta({
  title: computed(() => `${t('home.title')} · NIP`),
  description: () => t('site.description')
})
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-(--ui-border)">
      <div class="hero-glow pointer-events-none absolute inset-0 -z-10" />

      <UContainer class="py-16 sm:py-24">
        <div class="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <UBadge color="primary" variant="subtle" size="lg">
              {{ t('home.eyebrow') }}
            </UBadge>
            <h1
              class="mt-6 text-4xl font-bold tracking-tight text-(--ui-text-highlighted) sm:text-5xl"
            >
              {{ t('home.title') }}
            </h1>
            <p class="mt-6 max-w-2xl text-lg leading-8 text-(--ui-text-toned)">
              {{ t('home.intro') }}
            </p>
            <div class="mt-9 flex flex-wrap items-center gap-3">
              <UButton
                :to="localePath('/docs')"
                size="lg"
                icon="i-lucide-book-open"
              >
                {{ t('home.ctaDocs') }}
              </UButton>
              <UButton
                :to="PAPER_URL"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="outline"
                color="neutral"
                icon="i-lucide-file-text"
              >
                {{ t('home.ctaPaper') }}
              </UButton>
            </div>
          </div>

          <div
            class="rounded-2xl border border-(--ui-border) bg-(--ui-bg-elevated) p-2"
          >
            <div class="rounded-xl bg-(--ui-bg) p-4">
              <div class="flex items-center justify-between">
                <p
                  class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)"
                >
                  iStack
                </p>
                <span
                  class="rounded-full bg-(--ui-bg-elevated) px-2 py-0.5 text-[11px] text-(--ui-text-muted)"
                >
                  in-kernel
                </span>
              </div>

              <ul class="mt-3 space-y-2">
                <li
                  v-for="layer in layers"
                  :key="layer.label"
                  class="flex flex-col rounded-lg border px-3 py-2"
                  :class="
                    layer.highlight
                      ? 'border-(--ui-primary)/40 bg-(--ui-primary)/5'
                      : 'border-(--ui-border) bg-(--ui-bg-muted)'
                  "
                >
                  <span
                    class="text-sm font-medium text-(--ui-text-highlighted)"
                  >
                    {{ layer.label }}
                  </span>
                  <span class="text-[11px] text-(--ui-text-muted)">
                    {{ layer.note }}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <dl class="mt-14 grid gap-4 sm:grid-cols-3">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6"
          >
            <dd
              class="text-2xl font-semibold tracking-tight text-(--ui-text-highlighted)"
            >
              {{ stat.value }}
            </dd>
            <dt class="mt-1 text-sm text-(--ui-text-muted)">
              {{ stat.label }}
            </dt>
          </div>
        </dl>
      </UContainer>
    </section>

    <section class="border-b border-(--ui-border)">
      <UContainer class="py-16">
        <div class="max-w-2xl">
          <h2
            class="text-2xl font-bold tracking-tight text-(--ui-text-highlighted)"
          >
            {{ t('home.designTitle') }}
          </h2>
          <p class="mt-3 text-(--ui-text-toned)">
            {{ t('home.designIntro') }}
          </p>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <div
            v-for="item in designs"
            :key="item.title"
            class="rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6"
          >
            <div
              class="grid h-10 w-10 place-items-center rounded-lg bg-(--ui-bg-elevated) text-(--ui-primary)"
            >
              <UIcon :name="item.icon" class="h-5 w-5" />
            </div>
            <h3
              class="mt-4 text-base font-semibold text-(--ui-text-highlighted)"
            >
              {{ item.title }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
              {{ item.desc }}
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <section>
      <UContainer class="py-16">
        <div class="max-w-2xl">
          <h2
            class="text-2xl font-bold tracking-tight text-(--ui-text-highlighted)"
          >
            {{ t('home.resourcesTitle') }}
          </h2>
          <p class="mt-3 text-(--ui-text-toned)">
            {{ t('home.resourcesIntro') }}
          </p>
        </div>

        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <NuxtLink
            :to="localePath('/docs')"
            class="group rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6 transition hover:border-(--ui-primary)/50"
          >
            <h3
              class="text-base font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
            >
              {{ t('home.docsCardTitle') }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
              {{ t('home.docsCardDesc') }}
            </p>
            <span
              class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--ui-primary)"
            >
              {{ t('home.docsCardCta') }}
              <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
            </span>
          </NuxtLink>

          <NuxtLink
            :to="localePath('/blog')"
            class="group rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6 transition hover:border-(--ui-primary)/50"
          >
            <h3
              class="text-base font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
            >
              {{ t('home.blogCardTitle') }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
              {{ t('home.blogCardDesc') }}
            </p>
            <span
              class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--ui-primary)"
            >
              {{ t('home.blogCardCta') }}
              <UIcon name="i-lucide-arrow-right" class="h-4 w-4" />
            </span>
          </NuxtLink>

          <NuxtLink
            :to="PAPER_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="group rounded-xl border border-(--ui-border) bg-(--ui-bg) p-6 transition hover:border-(--ui-primary)/50"
          >
            <h3
              class="text-base font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
            >
              {{ t('home.paperCardTitle') }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
              {{ t('home.paperCardDesc') }}
            </p>
            <span
              class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-(--ui-primary)"
            >
              {{ t('home.paperCardCta') }}
              <UIcon name="i-lucide-external-link" class="h-4 w-4" />
            </span>
          </NuxtLink>
        </div>
      </UContainer>
    </section>
  </div>
</template>
