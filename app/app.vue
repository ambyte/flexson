<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
<script setup lang="ts">
import { useNuxtApp } from 'nuxt/app'
import { useTheme } from 'vuetify'
import { onMounted } from 'vue'

const theme = useTheme()

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    theme.global.name.value = savedTheme
  }
})

const nuxtApp = useNuxtApp();
if (nuxtApp.$client) {
  nuxtApp.hooks.hook('link:prefetch', () => {
    return Promise.resolve();
  });
}
</script>
