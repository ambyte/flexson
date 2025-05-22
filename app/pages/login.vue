<template>
  <v-card class="pa-4">
    <v-card-title class="text-h4 text-center mb-6">
      Log In
    </v-card-title>

    <v-alert v-if="authStore.error" type="error" variant="tonal" class="mb-4">
      {{ authStore.error }}
    </v-alert>

    <v-form @submit.prevent="handleLogin">
      <v-text-field v-model="username" label="Username" placeholder="Enter your username" required variant="solo-filled"
        :disabled="authStore.loading" autocomplete="username" />

      <v-text-field v-model="password" label="Password" type="password" placeholder="Enter your password" required
        variant="solo-filled" :disabled="authStore.loading" class="mt-4" autocomplete="current-password" />

      <v-btn type="submit" color="primary" block :loading="authStore.loading" :disabled="authStore.loading"
        class="mt-6">
        {{ authStore.loading ? 'Logging in...' : 'Log In' }}
      </v-btn>

      <div v-if="!isRegistrationDisabled" class="text-center mt-4">
        <span class="text-medium-emphasis">
          Don't have an account?
          <NuxtLink to="/register">
            Register here
          </NuxtLink>
        </span>
      </div>
    </v-form>
  </v-card>

</template>

<script lang="ts" setup>
import { ref, type Ref, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRuntimeConfig, navigateTo } from 'nuxt/app';

declare const definePageMeta: (meta: { layout: string, middleware: string[] }) => void;
definePageMeta({
  layout: 'auth',
  middleware: ['auth', 'registration']
});

const config = useRuntimeConfig();

const isRegistrationDisabled = computed(() => {
  return config.public.disableRegistration === 'true';
});

const authStore = useAuthStore();
const username: Ref<string> = ref('');
const password: Ref<string> = ref('');

const handleLogin = async (): Promise<void> => {
  const success = await authStore.login(username.value, password.value);
  if (success) {
    navigateTo('/');
  }
};
</script>