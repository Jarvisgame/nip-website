<script setup lang="ts">
type FeatureVariant = 'kernel' | 'names' | 'faces' | 'numbers'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: notes } = await useContentList('blog', locale)
const { data: documents } = await useContentList('docs', locale)

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

const pillars = computed<
  Array<{
    index: string
    variant: FeatureVariant
    title: string
    desc: string
    to: string
  }>
>(() => [
  {
    index: '01',
    variant: 'names',
    title: t('home.pillarKernelTitle'),
    desc: t('home.pillarKernelDesc'),
    to: localePath('/docs/architecture')
  },
  {
    index: '02',
    variant: 'faces',
    title: t('home.pillarFacesTitle'),
    desc: t('home.pillarFacesDesc'),
    to: localePath('/docs/architecture')
  },
  {
    index: '03',
    variant: 'kernel',
    title: t('home.pillarSocketTitle'),
    desc: t('home.pillarSocketDesc'),
    to: localePath('/docs/getting-started')
  },
  {
    index: '04',
    variant: 'numbers',
    title: t('home.pillarEvidenceTitle'),
    desc: t('home.pillarEvidenceDesc'),
    to: localePath('/docs/performance')
  }
])

const principles = computed(() => [
  {
    index: '01',
    title: t('home.principleNameTitle'),
    desc: t('home.principleNameDesc')
  },
  {
    index: '02',
    title: t('home.principleFacesTitle'),
    desc: t('home.principleFacesDesc')
  },
  {
    index: '03',
    title: t('home.principleStateTitle'),
    desc: t('home.principleStateDesc')
  }
])

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat(locale.value === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

useSeoMeta({
  title: computed(() => `${t('home.title')} · NIP`),
  description: () => t('site.description')
})
</script>

<template>
  <div>
    <section class="relative overflow-hidden border-b border-black/10 dark:border-white/10">
      <div
        class="pointer-events-none absolute -right-12 top-20 hidden select-none text-[15rem] font-black uppercase leading-none tracking-[-0.08em] text-black/[0.025] dark:text-white/[0.03] lg:block"
      >
        iStack
      </div>

      <UContainer class="relative">
        <div
          class="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-black/10 py-3 dark:border-white/10"
        >
          <span class="nip-kicker text-[#fd7800]">{{ t('home.heroKicker') }}</span>
          <div
            class="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.12em] text-(--ui-text-muted)"
          >
            <span>{{ t('home.heroMeta') }}</span>
            <span class="hidden sm:inline">{{ t('home.heroAffiliation') }}</span>
            <a
              :href="PAPER_PDF_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-[#fd7800] hover:underline"
            >
              {{ t('home.ctaPdf') }}
              <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
            </a>
          </div>
        </div>

        <div
          class="grid items-start gap-12 py-12 sm:py-16 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:py-20"
        >
          <div>
            <div class="flex items-center gap-3">
              <span class="h-2 w-2 bg-[#fd7800]" />
              <span class="nip-kicker text-(--ui-text-muted)">
                {{ t('home.heroEyebrow') }}
              </span>
            </div>

            <h1 class="mt-8">
              <span
                class="nip-display block text-[clamp(2.25rem,12vw,4rem)] uppercase leading-[0.78] text-[#fd7800] sm:text-[clamp(2rem,8vw,7rem)]"
              >
                Named Data
              </span>
              <span
                class="nip-display block text-[clamp(2.25rem,12vw,4rem)] uppercase leading-[0.78] text-[#fd7800] sm:text-[clamp(2rem,8vw,7rem)]"
              >
                Networking
              </span>
              <span
                class="mt-7 block max-w-2xl text-balance text-2xl font-semibold leading-tight tracking-tight text-(--ui-text-highlighted) sm:text-3xl lg:text-[2.4rem]"
              >
                {{ t('home.title') }}
              </span>
            </h1>

            <p class="mt-6 max-w-xl text-base leading-7 text-(--ui-text-toned)">
              {{ t('home.intro') }}
            </p>

            <div class="mt-8 flex flex-wrap items-center gap-3">
              <UButton
                :to="localePath('/docs')"
                size="lg"
                color="primary"
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

            <div class="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2">
              <p
                class="font-mono text-[11px] uppercase leading-5 tracking-[0.12em] text-(--ui-text-muted)"
              >
                Tianlong Li · Tian Song · Yating Yang
              </p>
              <span class="hidden h-3 w-px bg-black/15 dark:bg-white/15 sm:block" />
              <p
                class="font-mono text-[11px] uppercase leading-5 tracking-[0.12em] text-(--ui-text-muted)"
              >
                {{ t('home.heroAffiliation') }}
              </p>
            </div>
          </div>

          <div class="relative lg:pt-2">
            <div
              class="absolute -left-4 top-8 hidden h-20 w-px bg-[#fd7800] lg:block"
            />
            <article
              class="relative border border-black/15 bg-[#f5f1ea] p-5 dark:border-white/15 dark:bg-neutral-900 sm:p-7"
            >
              <div class="h-1 w-full bg-[#fd7800]" />
              <div
                class="mt-4 flex items-center justify-between gap-4 border-b border-black/15 pb-3 dark:border-white/15"
              >
                <span class="nip-kicker text-(--ui-text-muted)">
                  {{ t('home.paperLabel') }}
                </span>
                <span class="font-mono text-[11px] tracking-[0.1em] text-[#fd7800]">
                  NSDI '24
                </span>
              </div>

              <p class="mt-7 font-mono text-[11px] uppercase tracking-[0.14em] text-[#fd7800]">
                iStack
              </p>
              <h2
                class="mt-3 max-w-md text-[1.35rem] font-bold leading-[1.18] tracking-tight text-(--ui-text-highlighted)"
              >
                {{ t('home.paperTitle') }}
              </h2>
              <p class="mt-4 text-sm leading-6 text-(--ui-text-toned)">
                {{ t('home.abstractShort') }}
              </p>

              <div
                class="mt-7 grid grid-cols-3 divide-x divide-black/10 border-y border-black/15 py-3 dark:divide-white/10 dark:border-white/15"
              >
                <div class="pr-3">
                  <p class="font-mono text-[10px] uppercase tracking-[0.1em] text-(--ui-text-muted)">
                    Venue
                  </p>
                  <p class="mt-1 text-sm font-bold text-(--ui-text-highlighted)">NSDI '24</p>
                </div>
                <div class="px-3">
                  <p class="font-mono text-[10px] uppercase tracking-[0.1em] text-(--ui-text-muted)">
                    Stack
                  </p>
                  <p class="mt-1 text-sm font-bold text-(--ui-text-highlighted)">in-kernel</p>
                </div>
                <div class="pl-3">
                  <p class="font-mono text-[10px] uppercase tracking-[0.1em] text-(--ui-text-muted)">
                    Focus
                  </p>
                  <p class="mt-1 text-sm font-bold text-(--ui-text-highlighted)">NDN</p>
                </div>
              </div>

              <div class="mt-5 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p class="nip-kicker text-(--ui-text-muted)">
                    {{ t('home.paperAuthors') }}
                  </p>
                  <p class="mt-2 text-xs leading-5 text-(--ui-text-muted)">
                    {{ t('home.heroAffiliation') }}
                  </p>
                </div>
                <a
                  :href="PAPER_URL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#fd7800] hover:underline"
                >
                  {{ t('home.paperPage') }}
                  <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
            <div
              class="mt-3 flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-(--ui-text-muted)"
            >
              <span>{{ t('home.paperCaption') }}</span>
              <span>NIP / 01</span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section class="border-b border-black/10 bg-(--ui-bg-muted) dark:border-white/10">
      <UContainer>
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 py-4 dark:border-white/10"
        >
          <span class="nip-kicker text-(--ui-text-muted)">
            {{ t('home.statsLabel') }}
          </span>
          <span class="max-w-xl font-mono text-[10px] leading-5 text-(--ui-text-muted)">
            {{ t('home.statsNote') }}
          </span>
        </div>
        <dl class="grid divide-y divide-black/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0"
          >
            <dd class="text-3xl font-black tracking-tight text-(--ui-text-highlighted) sm:text-4xl">
              {{ stat.value }}
            </dd>
            <dt class="mt-2 max-w-[13rem] font-mono text-[10px] uppercase leading-5 tracking-[0.1em] text-(--ui-text-muted)">
              {{ stat.label }}
            </dt>
          </div>
        </dl>
      </UContainer>
    </section>

    <section id="pillars" class="scroll-mt-32 border-b border-black/10 dark:border-white/10">
      <UContainer class="py-14 sm:py-20">
        <div class="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div class="max-w-3xl">
            <p class="nip-kicker text-[#fd7800]">01 / {{ t('home.pillarsLabel') }}</p>
            <h2
              class="nip-display mt-4 text-3xl uppercase leading-[0.95] text-(--ui-text-highlighted) sm:text-5xl"
            >
              {{ t('home.pillarsTitle') }}
            </h2>
          </div>
          <p class="max-w-sm text-sm leading-6 text-(--ui-text-toned) lg:pb-1">
            {{ t('home.pillarsIntro') }}
          </p>
        </div>

        <div class="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 2xl:grid-cols-4">
          <article v-for="pillar in pillars" :key="pillar.index" class="group">
            <LandingFeatureVisual :variant="pillar.variant" />
            <p class="mt-4 font-mono text-[10px] tracking-[0.12em] text-[#fd7800]">
              {{ pillar.index }}
            </p>
            <h3
              class="mt-2 text-lg font-extrabold uppercase leading-tight tracking-tight text-(--ui-text-highlighted)"
            >
              {{ pillar.title }}
            </h3>
            <p class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
              {{ pillar.desc }}
            </p>
            <NuxtLink
              :to="pillar.to"
              class="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#fd7800] group-hover:underline"
            >
              {{ t('home.pillarCta') }}
              <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
            </NuxtLink>
          </article>
        </div>
      </UContainer>
    </section>

    <section
      id="architecture"
      class="scroll-mt-32 border-b border-white/10 bg-[#101010] text-white"
    >
      <UContainer class="py-14 sm:py-20 lg:py-24">
        <div class="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div>
            <p class="nip-kicker text-[#fd7800]">02 / {{ t('home.architectureLabel') }}</p>
            <h2
              class="nip-display mt-4 max-w-xl text-3xl uppercase leading-[1.02] sm:text-[2.5rem] 2xl:text-5xl"
            >
              <span class="block">{{ t('home.architectureTitleLine1') }}</span>
              <span class="block">{{ t('home.architectureTitleLine2') }}</span>
            </h2>
            <p class="mt-6 max-w-lg text-base leading-7 text-white/55">
              {{ t('home.architectureIntro') }}
            </p>

            <ol class="mt-10">
              <li
                v-for="principle in principles"
                :key="principle.index"
                class="grid grid-cols-[2.5rem_1fr] gap-4 border-t border-white/10 py-5"
              >
                <span class="font-mono text-xs text-[#fd7800]">{{ principle.index }}</span>
                <div>
                  <h3 class="text-lg font-semibold text-white">{{ principle.title }}</h3>
                  <p class="mt-1.5 text-sm leading-6 text-white/45">{{ principle.desc }}</p>
                </div>
              </li>
            </ol>
          </div>

          <div class="lg:pt-7">
            <LandingStackDiagram />
            <div
              class="mt-3 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-2"
            >
              <div class="bg-[#101010] p-4">
                <p class="nip-kicker text-white/30">{{ t('home.stateNoteTitle') }}</p>
                <p class="mt-2 text-sm leading-6 text-white/50">{{ t('home.stateNote') }}</p>
              </div>
              <div class="bg-[#101010] p-4">
                <p class="nip-kicker text-white/30">{{ t('home.faceNoteTitle') }}</p>
                <p class="mt-2 text-sm leading-6 text-white/50">{{ t('home.faceNote') }}</p>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section id="evidence" class="relative scroll-mt-32 overflow-hidden bg-[#fd7800] text-black">
      <div
        class="pointer-events-none absolute -right-6 -top-12 select-none text-[17rem] font-black leading-none tracking-[-0.1em] text-black/[0.045] lg:block"
      >
        6.50
      </div>
      <UContainer class="relative py-14 sm:py-20">
        <div class="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p class="nip-kicker text-black/60">03 / {{ t('home.evidenceLabel') }}</p>
            <h2 class="nip-display mt-4 text-4xl uppercase leading-[0.9] sm:text-5xl">
              {{ t('home.evidenceTitle') }}
            </h2>
            <p class="mt-5 max-w-md text-sm leading-6 text-black/65">
              {{ t('home.evidenceIntro') }}
            </p>
            <NuxtLink
              :to="localePath('/docs/performance')"
              class="mt-6 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] underline decoration-black/40 underline-offset-4 hover:decoration-black"
            >
              {{ t('home.evidenceCta') }}
              <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div>
            <dl
              class="grid divide-y divide-black/20 border-y border-black/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            >
              <div
                v-for="stat in stats"
                :key="stat.label"
                class="py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0"
              >
                <dd class="text-4xl font-black tracking-tight 2xl:text-5xl">
                  {{ stat.value }}
                </dd>
                <dt class="mt-2 max-w-[12rem] font-mono text-[10px] uppercase leading-5 tracking-[0.1em] text-black/60">
                  {{ stat.label }}
                </dt>
              </div>
            </dl>
            <p class="mt-5 max-w-2xl font-mono text-[10px] leading-5 text-black/55">
              {{ t('home.evidenceNote') }}
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <section class="border-b border-black/10 dark:border-white/10">
      <UContainer class="py-14 sm:py-20">
        <div class="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div>
            <p class="nip-kicker text-[#fd7800]">{{ t('home.paperLabel') }} / NSDI '24</p>
            <p class="mt-4 max-w-sm text-sm leading-6 text-(--ui-text-toned)">
              {{ t('home.paperAuthors') }}<br />
              {{ t('home.heroAffiliation') }}
            </p>
            <div class="mt-6 flex flex-col items-start gap-3">
              <a
                :href="PAPER_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#fd7800] hover:underline"
              >
                {{ t('home.paperPage') }}
                <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
              </a>
              <a
                :href="PAPER_PDF_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.1em] text-(--ui-text-muted) hover:text-[#fd7800]"
              >
                {{ t('home.pdfDownload') }}
                <UIcon name="i-lucide-file-text" class="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div class="border-l-2 border-[#fd7800] pl-5 sm:pl-8">
            <p
              class="max-w-3xl text-xl font-medium leading-relaxed tracking-tight text-(--ui-text-highlighted) sm:text-2xl sm:leading-relaxed"
            >
              {{ t('home.paperAbstract') }}
            </p>
            <p class="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-(--ui-text-muted)">
              iStack / {{ t('home.paperVenue') }}
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <section id="notes" class="scroll-mt-32 border-b border-black/10 dark:border-white/10">
      <UContainer class="py-14 sm:py-20">
        <div class="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p class="nip-kicker text-[#fd7800]">04 / {{ t('home.notesLabel') }}</p>
            <h2
              class="nip-display mt-4 max-w-md text-3xl uppercase leading-[0.95] text-(--ui-text-highlighted) sm:text-5xl"
            >
              {{ t('home.notesTitle') }}
            </h2>
            <p class="mt-5 max-w-md text-sm leading-6 text-(--ui-text-toned)">
              {{ t('home.notesIntro') }}
            </p>
            <NuxtLink
              :to="localePath('/blog')"
              class="mt-6 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#fd7800] hover:underline"
            >
              {{ t('home.allNotes') }}
              <UIcon name="i-lucide-arrow-right" class="h-3.5 w-3.5" />
            </NuxtLink>
          </div>

          <div>
            <template v-if="notes?.items?.length">
              <NuxtLink
                v-for="note in notes.items"
                :key="note.id"
                :to="localePath(`/blog/${note.slug}`)"
                class="group grid gap-4 border-t border-black/10 py-6 dark:border-white/10 sm:grid-cols-[6.5rem_1fr]"
              >
                <div>
                  <p class="nip-kicker text-[#fd7800]">{{ t('home.noteTag') }}</p>
                  <time v-if="note.date" class="mt-2 block font-mono text-[10px] leading-5 text-(--ui-text-muted)">
                    {{ formatDate(note.date) }}
                  </time>
                </div>
                <div>
                  <h3
                    class="text-xl font-semibold tracking-tight text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
                  >
                    {{ note.title }}
                  </h3>
                  <p v-if="note.description" class="mt-2 text-sm leading-6 text-(--ui-text-muted)">
                    {{ note.description }}
                  </p>
                  <div v-if="note.tags.length" class="mt-3 flex flex-wrap gap-2">
                    <span
                      v-for="tag in note.tags"
                      :key="tag"
                      class="border border-black/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ui-text-muted) dark:border-white/10"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </NuxtLink>
            </template>
            <p v-else class="border-t border-black/10 py-6 text-sm text-(--ui-text-muted) dark:border-white/10">
              {{ t('home.emptyNotes') }}
            </p>

            <div class="mt-10">
              <div
                class="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3 dark:border-white/10"
              >
                <p class="nip-kicker text-(--ui-text-muted)">{{ t('home.docsLabel') }}</p>
                <NuxtLink
                  :to="localePath('/docs')"
                  class="font-mono text-[10px] uppercase tracking-[0.1em] text-[#fd7800] hover:underline"
                >
                  {{ t('home.allDocs') }} →
                </NuxtLink>
              </div>

              <template v-if="documents?.items?.length">
                <NuxtLink
                  v-for="(document, index) in documents.items"
                  :key="document.id"
                  :to="localePath(`/docs/${document.slug}`)"
                  class="group grid grid-cols-[2rem_1fr_auto] gap-4 border-b border-black/10 py-4 dark:border-white/10"
                >
                  <span class="font-mono text-[11px] text-[#fd7800]">
                    {{ String(index + 1).padStart(2, '0') }}
                  </span>
                  <div>
                    <h3
                      class="text-sm font-semibold text-(--ui-text-highlighted) group-hover:text-(--ui-primary)"
                    >
                      {{ document.title }}
                    </h3>
                    <p class="mt-1 text-sm leading-6 text-(--ui-text-muted)">
                      {{ document.description }}
                    </p>
                  </div>
                  <UIcon
                    name="i-lucide-arrow-up-right"
                    class="mt-1 h-4 w-4 text-(--ui-text-muted) transition group-hover:text-[#fd7800]"
                  />
                </NuxtLink>
              </template>
              <p v-else class="border-b border-black/10 py-4 text-sm text-(--ui-text-muted) dark:border-white/10">
                {{ t('home.emptyDocs') }}
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <section>
      <UContainer class="py-14 sm:py-20 lg:py-24">
        <div class="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div>
            <p class="nip-kicker text-[#fd7800]">{{ t('home.finalKicker') }}</p>
            <h2
              class="nip-display mt-4 max-w-4xl text-balance text-4xl uppercase leading-[1.08] text-(--ui-text-highlighted) sm:text-6xl"
            >
              {{ t('home.finalTitle') }}
            </h2>
            <p class="mt-5 max-w-xl text-sm leading-6 text-(--ui-text-toned)">
              {{ t('home.finalIntro') }}
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <UButton
              :to="localePath('/docs')"
              size="lg"
              color="primary"
              icon="i-lucide-book-open"
            >
              {{ t('home.finalDocs') }}
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
              {{ t('home.finalPaper') }}
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
