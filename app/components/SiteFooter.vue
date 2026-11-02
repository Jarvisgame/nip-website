<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-20 border-t border-(--ui-border) bg-(--ui-bg-muted)">
    <UContainer class="py-10">
      <div class="grid gap-8 sm:grid-cols-[1.5fr_1fr]">
        <div>
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-center gap-2 text-sm font-semibold text-(--ui-text-highlighted)"
          >
            <span
              class="grid h-7 w-7 place-items-center rounded-md bg-(--ui-primary) text-[11px] font-bold text-white"
            >
              NIP
            </span>
            {{ t('site.name') }}
          </NuxtLink>
          <p class="mt-3 max-w-md text-sm leading-6 text-(--ui-text-muted)">
            {{ t('footer.desc') }}
          </p>
          <p class="mt-4 text-xs text-(--ui-text-dimmed)">
            {{ t('footer.builtWith') }}
          </p>
        </div>

        <div class="sm:justify-self-end">
          <p
            class="text-xs font-semibold uppercase tracking-wider text-(--ui-text-muted)"
          >
            {{ t('footer.links') }}
          </p>
          <ul class="mt-3 space-y-2 text-sm">
            <li>
              <NuxtLink
                :to="PAPER_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="text-(--ui-text-toned) hover:text-(--ui-primary)"
              >
                {{ t('footer.paper') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="PAPER_PDF_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="text-(--ui-text-toned) hover:text-(--ui-primary)"
              >
                PDF
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/docs')"
                class="text-(--ui-text-toned) hover:text-(--ui-primary)"
              >
                {{ t('nav.docs') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/blog')"
                class="text-(--ui-text-toned) hover:text-(--ui-primary)"
              >
                {{ t('nav.blog') }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-8 flex flex-col gap-2 border-t border-(--ui-border) pt-6 text-xs text-(--ui-text-dimmed) sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ year }} NIP. {{ t('footer.rights') }}</p>
        <p>NSDI '24 · iStack</p>
      </div>
    </UContainer>
  </footer>
</template>
