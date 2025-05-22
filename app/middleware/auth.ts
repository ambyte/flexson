import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";
import type { RouteLocationNormalized } from "vue-router";
import { useAuthStore } from "../stores/authStore";

export default defineNuxtRouteMiddleware(
  async (to: RouteLocationNormalized) => {
    if (import.meta.server) return;

    const authStore = useAuthStore();
    const isAuthRoute = to.path === "/login" || to.path === "/register";

    const hasValidToken = await authStore.checkAndRefreshToken();

    if (!hasValidToken && !isAuthRoute) {
      return navigateTo("/login");
    }

    if (hasValidToken && isAuthRoute) {
      return navigateTo("/");
    }
  }
);
