import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { JsonFile, Group, GroupResponse } from "../../types/models";
import { api } from "../stores/api";
import { useErrorsStore } from "./messagesStore";
import { useRuntimeConfig } from "nuxt/app";
import { useAuthStore } from "./authStore";

export const useJsonStore = defineStore("json", () => {
  const files = ref<JsonFile[]>([]);
  const groups = ref<Group[]>([]);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const config = useRuntimeConfig();
  const auth = useAuthStore();

  const getFileById = computed(() => (id: string) => {
    if (files.value.length === 0) {
      return fetchFile(id);
    }
    return files.value.find((file) => file._id === id);
  });

  const getFilesByGroup = computed(() => (groupId: string) => {
    return files.value.filter((file) => file.groupId === groupId);
  });

  const getGroupById = computed(() => (id: string) => {
    return groups.value.find((group) => group._id === id);
  });

  // Files operations
  async function fetchFiles(
    groupId: string | null = null
  ): Promise<JsonFile[]> {
    loading.value = true;
    error.value = null;

    try {
      const query = groupId ? `?groupId=${groupId}` : "";
      const result = await api.request<JsonFile[]>(`/api/json${query}`);
      files.value = result;
      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to fetch files"));
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchFile(id: string): Promise<JsonFile | null> {
    loading.value = true;
    error.value = null;

    try {
      const result = await api.request<JsonFile>(`/api/json/${id}`);
      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to fetch file"));
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createFile(
    fileData: Partial<JsonFile>
  ): Promise<JsonFile | null> {
    loading.value = true;
    error.value = null;

    try {
      const result = await api.request<JsonFile>("/api/json", {
        method: "POST",
        body: fileData,
      });

      files.value.push(result);
      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to create file"));
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateFile(
    fileData: Partial<JsonFile>
  ): Promise<JsonFile | null> {
    loading.value = true;
    error.value = null;

    try {
      const result = await api.request<JsonFile>(`/api/json`, {
        method: "PUT",
        body: fileData,
      });

      const index = files.value.findIndex((f) => f._id === fileData._id);
      if (index !== -1) {
        files.value[index] = result;
      }

      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to update file"));
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFile(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await api.request(`/api/json/${id}`, {
        method: "DELETE",
      });

      files.value = files.value.filter((f) => f._id !== id);

      return true;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to delete file"));
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Groups operations
  async function fetchGroups(): Promise<Group[]> {
    loading.value = true;
    error.value = null;

    try {
      const result = await api.request<Group[]>("/api/groups");
      groups.value = result;
      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to fetch groups"));
      return [];
    } finally {
      loading.value = false;
    }
  }

  async function createGroup(data: Group): Promise<Group | null> {
    loading.value = true;
    error.value = null;

    try {
      const result = await api.request<GroupResponse>("/api/groups", {
        method: "POST",
        body: data,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      groups.value.push(result.group);
      return result.group;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to create group"));
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateGroup(data: Group): Promise<Group | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.request<GroupResponse>(`/api/groups`, {
        method: "PUT",
        body: data,
      });

      if (!response.success) {
        throw new Error(response.message);
      }

      const result = response.group;

      const index = groups.value.findIndex((g) => g._id === data._id);
      if (index !== -1) {
        groups.value[index] = result;
      }

      return result;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to update group"));
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteGroup(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      await api.request(`/api/groups/${id}`, {
        method: "DELETE",
      });

      groups.value = groups.value.filter((g) => g._id !== id);
      return true;
    } catch (e) {
      const errors = useErrorsStore();
      errors.add(api.handleError(e, "Failed to delete group"));
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function generateFileLink(id: string): Promise<string> {
    const fileResult = await getFileById.value(id);
    if (!fileResult) {
      return "";
    }
    const apiUrl = config.public.baseURL;
    const user = auth.getUser;
    const group = getGroupById.value(fileResult.groupId);
    return `${apiUrl}/api/data/${user?.slug}/${group?.slug}/${fileResult.slug}`;
  }

  function generateGroupLink(id: string): string {
    const group = groups.value.find((g) => g._id === id);
    if (!group) {
      return "";
    }
    const apiUrl = config.public.baseURL;
    const user = auth.getUser;
    return `${apiUrl}/api/data/${user?.slug}/${group.slug}`;
  }

  return {
    files,
    groups,
    loading,
    error,
    getFileById,
    getFilesByGroup,
    getGroupById,
    fetchFiles,
    fetchFile,
    createFile,
    updateFile,
    deleteFile,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    generateFileLink,
    generateGroupLink,
  };
});
