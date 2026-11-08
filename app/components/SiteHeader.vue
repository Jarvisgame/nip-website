<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const homePath = computed(() => localePath('/'))
const homeAnchor = (hash: string) => `${homePath.value}${hash}`

const nav = computed(() => [
  { label: t('nav.home'), to: homePath.value },
  { label: t('nav.architecture'), to: homeAnchor('#architecture') },
  { label: t('nav.evidence'), to: homeAnchor('#evidence') },
  { label: t('nav.docs'), to: localePath('/docs') },
  { label: t('nav.blog'), to: localePath('/blog') }
])

function isActive(to: string) {
  if (to === homePath.value) {
    return route.path === to || route.path === `${to}/`
  }

  if (to.includes('#')) {
    const [path, hash] = to.split('#')
    return route.path === path && route.hash === `#${hash}`
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-black/10 bg-(--ui-bg)/95 backdrop-blur dark:border-white/10"
  >
    <UContainer>
      <div class="flex h-20 items-center justify-between gap-4">
        <NuxtLink
          :to="localePath('/')"
          class="flex shrink-0 items-center gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fd7800]"
          :aria-label="t('site.name')"
        >
          <span class="nip-display text-[2rem] leading-none text-[#fd7800]">
            NIP
          </span>
          <span
            class="hidden border-l border-black/15 pl-3 font-mono text-[10px] uppercase leading-[1.4] tracking-[0.12em] text-(--ui-text-muted) dark:border-white/15 sm:block"
          >
            Named Data<br />
            Networking
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-6 lg:flex" aria-label="Primary">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="relative py-2 text-sm font-medium transition-colors"
            :class="
              isActive(item.to)
                ? 'text-[#fd7800]'
                : 'text-(--ui-text-toned) hover:text-(--ui-text-highlighted)'
            "
          >
            {{ item.label }}
            <span
              v-if="isActive(item.to)"
              class="absolute inset-x-0 -bottom-px h-0.5 bg-[#fd7800]"
            />
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-1">
          <NuxtLink
            :to="PAPER_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="mr-2 hidden items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#fd7800] hover:underline md:inline-flex"
          >
            {{ t('nav.paper') }}
            <UIcon name="i-lucide-arrow-up-right" class="h-3.5 w-3.5" />
          </NuxtLink>
          <LocaleSwitcher />
          <UColorModeButton />
        </div>
      </div>

      <nav
        class="flex items-center gap-5 overflow-x-auto pb-3 lg:hidden"
        aria-label="Primary mobile"
      >
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="relative shrink-0 py-1 text-[13px] font-medium"
          :class="
            isActive(item.to)
              ? 'text-[#fd7800]'
              : 'text-(--ui-text-muted)'
          "
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </UContainer>
  </header>
</template>
