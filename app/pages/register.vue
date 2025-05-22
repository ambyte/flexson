<template>
  <v-card class="pa-4">
    <v-card-title class="text-h4 text-center mb-6">
      Register
    </v-card-title>

    <v-alert v-if="authStore.error" type="error" variant="tonal" class="mb-4">
      {{ authStore.error }}
    </v-alert>

    <v-form @submit.prevent="handleRegister">
      <v-text-field v-model="username" label="Username" placeholder="Choose a username" required
        :disabled="authStore.loading" autocomplete="username" />

      <v-text-field v-model="password" label="Password" type="password" placeholder="Choose a password" required
        :disabled="authStore.loading" class="mt-4" autocomplete="new-password" />

      <v-text-field v-model="confirmPassword" label="Confirm Password" type="password"
        placeholder="Confirm your password" required :disabled="authStore.loading" class="mt-4"
        autocomplete="new-password" />

      <v-btn type="submit" color="primary" block :loading="authStore.loading" :disabled="authStore.loading"
        class="mt-6">
        {{ authStore.loading ? 'Registering...' : 'Register' }}
      </v-btn>

      <div class="text-center mt-4">
        <span class="text-medium-emphasis">
          Already have an account?
          <NuxtLink to="/login">
            Log in here
          </NuxtLink>
        </span>
      </div>
    </v-form>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, type Ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { navigateTo } from 'nuxt/app';

declare const definePageMeta: (meta: { layout: string, middleware: string[] }) => void;
definePageMeta({
  layout: 'auth',
  middleware: ['auth', 'registration']
});

const authStore = useAuthStore();
const username: Ref<string> = ref('');
const password: Ref<string> = ref('');
const confirmPassword: Ref<string> = ref('');

const handleRegister = async (): Promise<void> => {
  if (password.value !== confirmPassword.value) {
    authStore.$patch({ error: 'Passwords do not match' });
    return;
  }

  const success = await authStore.register(username.value, password.value);
  if (success) {
    navigateTo('/');
  }
};
</script>