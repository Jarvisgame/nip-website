<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const year = new Date().getFullYear()

const homePath = computed(() => localePath('/'))
const homeAnchor = (hash: string) => `${homePath.value}${hash}`
</script>

<template>
  <footer class="border-t border-black/10 bg-(--ui-bg) dark:border-white/10">
    <UContainer class="py-12 sm:py-14">
      <div class="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <NuxtLink
            :to="localePath('/')"
            class="inline-flex items-end gap-3"
          >
            <span class="nip-display text-4xl leading-none text-[#fd7800]">
              NIP
            </span>
            <span
              class="mb-1 font-mono text-[10px] uppercase leading-[1.4] tracking-[0.12em] text-(--ui-text-muted)"
            >
              Named Data<br />
              Networking
            </span>
          </NuxtLink>
          <p class="mt-5 max-w-md text-sm leading-6 text-(--ui-text-muted)">
            {{ t('footer.desc') }}
          </p>
          <p class="mt-5 font-mono text-[10px] uppercase leading-5 tracking-[0.08em] text-(--ui-text-dimmed)">
            {{ t('footer.builtWith') }}
          </p>
        </div>

        <div>
          <p class="nip-kicker text-(--ui-text-muted)">
            {{ t('footer.links') }}
          </p>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li>
              <NuxtLink
                :to="homeAnchor('#architecture')"
                class="text-(--ui-text-toned) hover:text-[#fd7800]"
              >
                {{ t('nav.architecture') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/docs')"
                class="text-(--ui-text-toned) hover:text-[#fd7800]"
              >
                {{ t('nav.docs') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="localePath('/blog')"
                class="text-(--ui-text-toned) hover:text-[#fd7800]"
              >
                {{ t('nav.blog') }}
              </NuxtLink>
            </li>
          </ul>
        </div>

        <div>
          <p class="nip-kicker text-(--ui-text-muted)">
            {{ t('footer.external') }}
          </p>
          <ul class="mt-4 space-y-2.5 text-sm">
            <li>
              <NuxtLink
                :to="PAPER_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-(--ui-text-toned) hover:text-[#fd7800]"
              >
                {{ t('footer.usenix') }}
                <UIcon name="i-lucide-arrow-up-right" class="h-3 w-3" />
              </NuxtLink>
            </li>
            <li>
              <NuxtLink
                :to="PAPER_PDF_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-(--ui-text-toned) hover:text-[#fd7800]"
              >
                PDF
                <UIcon name="i-lucide-file-text" class="h-3 w-3" />
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <div
        class="mt-10 flex flex-col gap-2 border-t border-black/10 pt-5 font-mono text-[10px] uppercase tracking-[0.08em] text-(--ui-text-dimmed) dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ year }} NIP. {{ t('footer.rights') }}</p>
        <p>NSDI '24 · iStack</p>
      </div>
    </UContainer>
  </footer>
</template>
