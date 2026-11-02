<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const target = computed(() => locales.value.find(item => item.code !== locale.value))
const label = computed(() => (locale.value === 'zh' ? 'English' : '中文'))
</script>

<template>
  <UButton
    v-if="target"
    :to="switchLocalePath(target.code)"
    :hreflang="target.language"
    :locale="false"
    variant="ghost"
    color="neutral"
    size="sm"
    icon="i-lucide-languages"
    :aria-label="`Switch to ${label}`"
  >
    {{ label }}
  </UButton>
</template>
