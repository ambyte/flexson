<template>
  <v-app>
    <v-app-bar color="primary" elevation="1">
      <v-container class="mx-auto d-flex align-center justify-center" max-width="1200">
        <NuxtLink to="/" class="text-decoration-none text-white text-h5 me-4 d-flex align-center">
          <img src="~/assets/logo.png" alt="Flexson Logo" height="36" class="me-2">
          Flexson
        </NuxtLink>

        <v-spacer />

        <ClientOnly>
          <div v-if="isAuthenticated" class="d-flex align-center">
            <span class="text-white me-4">Hi, {{ username }}</span>
            <ThemeToggle class="ms-4" />

            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" v-bind="props" />
              </template>

              <v-list>
                <v-list-item to="/profile/account" :active="$route.path.startsWith('/profile/account')">
                  <v-list-item-title>Profile</v-list-item-title>
                  <template #prepend>
                    <v-icon>mdi-account</v-icon>
                  </template>
                </v-list-item>
                <v-list-item @click="logout">
                  <v-list-item-title>Logout</v-list-item-title>
                  <template #prepend>
                    <v-icon>mdi-logout</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </ClientOnly>
      </v-container>

    </v-app-bar>

    <v-main>
      <slot />
    </v-main>

    <v-footer color="primary" height="44" app>
      <div class="flex-1-0-100 text-center">
        © {{ new Date().getFullYear() }} Flexson - All rights reserved
      </div>
    </v-footer>
    <v-snackbar-queue v-model="messages.queue" closable timeout="3000" color="success" close-text="Close" />
    <v-snackbar-queue v-model="errors.queue" closable timeout="5000" color="error" close-text="Close" />
  </v-app>
</template>

<script lang="ts" setup>
import { useAuthStore } from '../stores/authStore';
import { useMessagesStore, useErrorsStore } from '../stores/messagesStore';
import { storeToRefs } from 'pinia';
import { onMounted, computed, type ComputedRef } from 'vue';
import { useRouter } from 'vue-router';

const messages = useMessagesStore()
const errors = useErrorsStore()
const router = useRouter();
const authStore = useAuthStore();
const { isAuthenticated, getUser } = storeToRefs(authStore);

const username: ComputedRef<string | undefined> = computed(() => getUser.value?.username);

// Initialize auth state from localStorage
onMounted(() => {
  authStore.initAuth();
});

// Logout function
const logout = (): void => {
  authStore.logout();
  router.push('/login');
};
</script>