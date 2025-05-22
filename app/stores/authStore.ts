import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { $fetch } from "ofetch";
import { useRuntimeConfig } from "nuxt/app";
import type { User, AuthResponse } from "../../types/models";
import { api } from "./api";

const authHelpers = {
  saveToStorage(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));

    const accessTokenExp = this.getTokenExpiration(accessToken);
    localStorage.setItem("accessTokenExp", accessTokenExp.toString());
  },

  clearStorage(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("accessTokenExp");
  },

  getFromStorage(): {
    accessToken: string | null;
    refreshToken: string | null;
    user: User | null;
    accessTokenExp: number | null;
  } {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const userJson = localStorage.getItem("user");
    const accessTokenExp = localStorage.getItem("accessTokenExp");

    if (!accessToken || !refreshToken || !userJson) {
      this.clearStorage();
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        accessTokenExp: null,
      };
    }

    try {
      const user = JSON.parse(userJson) as User;
      return {
        accessToken,
        refreshToken,
        user,
        accessTokenExp: accessTokenExp ? parseInt(accessTokenExp) : null,
      };
    } catch {
      this.clearStorage();
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        accessTokenExp: null,
      };
    }
  },

  getTokenExpiration(token: string): number {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return 0;

      const base64Url = parts[1];
      // Since we've checked parts.length above, base64Url is guaranteed to exist
      const base64 = base64Url!.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded.exp * 1000;
    } catch {
      return 0;
    }
  },

  shouldRefreshToken(expiresAt: number): boolean {
    const config = useRuntimeConfig();
    const threshold = this.parseTimeString(
      config.public.tokenRefreshThreshold as string
    );
    return expiresAt - Date.now() < threshold;
  },

  parseTimeString(timeString: string | undefined): number {
    if (!timeString) return 5 * 60 * 1000; // Default to 5 minutes if undefined

    const value = parseInt(timeString);
    const unit = timeString.slice(-1);

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      case "d":
        return value * 24 * 60 * 60 * 1000;
      default:
        return 5 * 60 * 1000; // Default to 5 minutes
    }
  },

  logAuthEvent(_event: string, _details?: unknown): void {
    if (!import.meta.client) return;
  },
};

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const isRefreshing = ref<boolean>(false);
  const refreshPromise = ref<Promise<boolean> | null>(null);

  const isAuthenticated = computed(() => !!accessToken.value);
  const getUser = computed(() => user.value);
  const getAccessToken = computed(() => accessToken.value);

  async function refreshTokens(): Promise<boolean> {
    if (!refreshToken.value || isRefreshing.value) return false;

    if (refreshPromise.value) {
      return refreshPromise.value;
    }

    isRefreshing.value = true;

    refreshPromise.value = (async () => {
      try {
        const response = await $fetch<AuthResponse>("/api/auth/refresh", {
          method: "POST",
          body: { refreshToken: refreshToken.value },
        });

        accessToken.value = response.accessToken;
        refreshToken.value = response.refreshToken;

        authHelpers.saveToStorage(
          response.accessToken,
          response.refreshToken,
          response.user
        );

        return true;
      } catch {
        logout();
        return false;
      } finally {
        isRefreshing.value = false;
        refreshPromise.value = null;
      }
    })();

    return refreshPromise.value;
  }

  async function checkAndRefreshToken(): Promise<boolean> {
    const stored = authHelpers.getFromStorage();
    refreshToken.value = stored.refreshToken;
    accessToken.value = stored.accessToken;
    user.value = stored.user;

    if (!stored.accessToken || !stored.accessTokenExp) return false;

    if (authHelpers.shouldRefreshToken(stored.accessTokenExp)) {
      const refreshed = await refreshTokens();
      if (refreshed) {
        const newStored = authHelpers.getFromStorage();
        accessToken.value = newStored.accessToken;
        refreshToken.value = newStored.refreshToken;
        user.value = newStored.user;
        return true;
      }
      return false;
    }
    accessToken.value = stored.accessToken;
    refreshToken.value = stored.refreshToken;
    user.value = stored.user;
    return true;
  }

  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const response = await $fetch<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: { username, password },
      });

      accessToken.value = response.accessToken;
      refreshToken.value = response.refreshToken;
      user.value = response.user;

      authHelpers.saveToStorage(
        response.accessToken,
        response.refreshToken,
        response.user
      );

      return true;
    } catch (e) {
      error.value = api.handleError(e, "Login failed");
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function register(
    username: string,
    password: string
  ): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await $fetch("/api/auth/register", {
        method: "POST",
        body: { username, password },
      });

      return true;
    } catch (e) {
      error.value = api.handleError(e, "Registration failed");
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    accessToken.value = null;
    refreshToken.value = null;
    user.value = null;
    refreshPromise.value = null;
    authHelpers.clearStorage();
  }

  function initAuth(): void {
    if (!import.meta.client) return;

    const stored = authHelpers.getFromStorage();
    if (stored.accessToken && stored.refreshToken && stored.user) {
      accessToken.value = stored.accessToken;
      refreshToken.value = stored.refreshToken;
      user.value = stored.user;

      if (
        stored.accessTokenExp &&
        authHelpers.shouldRefreshToken(stored.accessTokenExp)
      ) {
        refreshTokens();
      }
    }
  }

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    getUser,
    getAccessToken,
    login,
    register,
    logout,
    initAuth,
    refreshTokens,
    checkAndRefreshToken,
  };
});
