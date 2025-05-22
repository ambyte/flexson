import {
  defineNuxtRouteMiddleware,
  navigateTo,
  useRuntimeConfig,
} from "nuxt/app";

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig();

  if (to.path === "/register" && config.public.disableRegistration === "true") {
    return navigateTo("/login");
  }
});
