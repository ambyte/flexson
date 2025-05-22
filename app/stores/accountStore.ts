import { defineStore } from "pinia";
import { navigateTo } from "#app";
import { useAuthStore } from "./authStore";
import { api } from "./api";
import { useErrorsStore } from "./messagesStore";
import type { ApiKey } from "../../types/models";
import { ref } from "vue";

export const useAccountStore = defineStore("account", () => {
  const loading = ref<boolean>(false);
  // User profile operations
  async function updateUserProfile(profileData: {
    username: string;
    email: string;
  }): Promise<{ success: boolean }> {
    try {
      loading.value = true;
      const result = await api.request<{ success: boolean }>(
        "/api/user/profile",
        {
          method: "PUT",
          body: profileData,
        }
      );

      if (result.success) {
        // After successful profile update, refresh auth token to update user data
        const authStore = useAuthStore();
        await authStore.refreshTokens();
        await authStore.initAuth();
        navigateTo("/profile/account");
      }

      return { success: true };
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to update profile"));
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  async function updatePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean }> {
    try {
      loading.value = true;
      await api.request<{ success: boolean }>("/api/user/password", {
        method: "PUT",
        body: passwordData,
      });

      return { success: true };
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to update password"));
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  async function createApiKey(apiKey: { name: string; expiry: string }) {
    try {
      loading.value = true;
      const result = await api.request<{
        success: boolean;
        data: ApiKey;
      }>("/api/user/apikey", {
        method: "POST",
        body: { apiKey },
      });

      return result;
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to update api key"));
      return { success: false, data: null };
    } finally {
      loading.value = false;
    }
  }

  async function getApiKeys() {
    try {
      loading.value = true;
      const result = await api.request<{ success: boolean; data: ApiKey[] }>(
        "/api/user/apikey",
        {
          method: "GET",
        }
      );

      return result;
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to get api keys"));
      return { success: false, data: [] };
    } finally {
      loading.value = false;
    }
  }

  async function deleteApiKey(keyId: string) {
    try {
      loading.value = true;
      const result = await api.request<{ success: boolean }>(
        "/api/user/apikey",
        {
          method: "DELETE",
          body: { keyId },
        }
      );

      return result;
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to delete api key"));
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  async function updateKeyStatus(keyId: string, isActive: boolean) {
    try {
      loading.value = true;
      const result = await api.request<{ success: boolean }>(
        "/api/user/apikey/status",
        {
          method: "PUT",
          body: { keyId, isActive },
        }
      );

      return result;
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to update API key status"));
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  async function updateApiKeyName(keyId: string, name: string) {
    try {
      loading.value = true;
      const result = await api.request<{ success: boolean }>(
        "/api/user/apikey/rename",
        {
          method: "PUT",
          body: { keyId, name },
        }
      );

      return result;
    } catch (error) {
      const errors = useErrorsStore();
      errors.add(api.handleError(error, "Failed to rename API key"));
      return { success: false };
    } finally {
      loading.value = false;
    }
  }

  return {
    updateUserProfile,
    updatePassword,
    createApiKey,
    getApiKeys,
    deleteApiKey,
    updateKeyStatus,
    updateApiKeyName,
    loading,
  };
});
