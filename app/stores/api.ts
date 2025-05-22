import { useAuthStore } from "../stores/authStore";
import type { ApiError } from "../../types/models";
import { $fetch } from "ofetch";
import { navigateTo } from "nuxt/app";

type RequestOptions = {
  headers?: Record<string, string>;
  [key: string]: unknown;
};

export const api = {
  async getToken(): Promise<string | null> {
    const authStore = useAuthStore();
    const hasValidToken = await authStore.checkAndRefreshToken();
    if (!hasValidToken) {
      navigateTo("/login");
      return null;
    }
    const token = authStore.getAccessToken;
    if (!token) {
      navigateTo("/login");
      return null;
    }
    return token;
  },

  async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const token = await this.getToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return $fetch<T>(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  },

  handleError(e: unknown, fallbackMessage: string): string {
    const err = e as ApiError;
    return (
      err.data?.message ||
      (e instanceof Error ? e.message : "") ||
      fallbackMessage
    );
  },
};
