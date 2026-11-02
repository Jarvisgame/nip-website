<script setup lang="ts">
defineProps<{
  error: NuxtError
}>()

const { locale } = useI18n()
const localePath = useLocalePath()

const isZh = computed(() => locale.value === 'zh')

useHead(() => ({
  htmlAttrs: {
    lang: isZh.value ? 'zh-CN' : 'en'
  }
}))
</script>

<template>
  <UApp>
    <div
      class="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <p class="text-sm font-semibold tracking-widest text-(--ui-primary)">
        {{ error.statusCode || 500 }}
      </p>
      <h1
        class="mt-3 text-3xl font-bold tracking-tight text-(--ui-text-highlighted)"
      >
        {{
          error.statusCode === 404
            ? isZh
              ? '页面不存在'
              : 'Page not found'
            : isZh
              ? '出了点问题'
              : 'Something went wrong'
        }}
      </h1>
      <p class="mt-3 max-w-md text-sm leading-6 text-(--ui-text-muted)">
        {{
          isZh
            ? '你访问的页面可能已被移动或不存在。'
            : 'The page you are looking for may have been moved or does not exist.'
        }}
      </p>
      <UButton
        :to="localePath('/')"
        class="mt-8"
        icon="i-lucide-home"
        :locale="false"
      >
        {{ isZh ? '返回首页' : 'Back home' }}
      </UButton>
    </div>
  </UApp>
</template>
