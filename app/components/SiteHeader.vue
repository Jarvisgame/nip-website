<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()

const nav = computed(() => [
  { label: t('nav.home'), to: localePath('/') },
  { label: t('nav.docs'), to: localePath('/docs') },
  { label: t('nav.blog'), to: localePath('/blog') }
])

function isActive(to: string) {
  if (to === localePath('/')) {
    return route.path === to || route.path === `${to}/`
  }

  return route.path === to || route.path.startsWith(`${to}/`)
}
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-(--ui-border) bg-(--ui-bg)"
  >
    <UContainer>
      <div class="flex h-16 items-center justify-between gap-3">
        <NuxtLink
          :to="localePath('/')"
          class="flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-(--ui-primary)"
        >
          <span
            class="grid h-9 w-9 place-items-center rounded-lg bg-(--ui-primary) text-sm font-bold text-white"
          >
            NIP
          </span>
          <span class="hidden flex-col leading-tight sm:flex">
            <span class="text-sm font-semibold text-(--ui-text-highlighted)">
              {{ t('site.name') }}
            </span>
            <span class="text-xs text-(--ui-text-muted)">
              {{ t('site.tagline') }}
            </span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 sm:flex">
          <UButton
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            variant="ghost"
            :color="isActive(item.to) ? 'primary' : 'neutral'"
            size="sm"
          >
            {{ item.label }}
          </UButton>
        </nav>

        <div class="flex items-center gap-1">
          <UButton
            :to="PAPER_URL"
            target="_blank"
            rel="noopener noreferrer"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide-file-text"
            class="hidden md:inline-flex"
          >
            {{ t('nav.paper') }}
          </UButton>
          <LocaleSwitcher />
          <UColorModeButton />
        </div>
      </div>

      <nav class="flex items-center gap-1 pb-3 sm:hidden">
        <UButton
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          variant="ghost"
          :color="isActive(item.to) ? 'primary' : 'neutral'"
          size="sm"
        >
          {{ item.label }}
        </UButton>
      </nav>
    </UContainer>
  </header>
</template>
