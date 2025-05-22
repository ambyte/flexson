<template>
  <v-container max-width="1300">
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex align-center">
          <v-btn variant="text" color="secondary-text" :to="'/'" class="mr-2">
            <v-icon start>mdi-arrow-left</v-icon>
            Back
          </v-btn>
          <h1 class="text-h4">Create New JSON File</h1>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <JsonFileForm :is-editing="true" :initial-data="form" :json-content="jsonContent" :loading="jsonStore.loading"
          :api-url="apiUrl" @update:json-content="jsonContent = $event" @update:form="form = $event"
          @validate-json="validateJson" @save="createFile" />
      </v-col>
    </v-row>

    <v-row v-if="jsonStore.error">
      <v-col cols="12">
        <v-alert type="error" variant="tonal" class="mt-4">
          {{ jsonStore.error }}
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, } from 'vue';
import { useJsonStore } from '../../stores/dataStore';
import { useRouter } from 'vue-router';
import type { RouteLocationNormalized } from 'vue-router';
import type { JsonEditFormData } from '../../../types/models';
import { useErrorsStore, useMessagesStore } from '../../stores/messagesStore';

declare const definePageMeta: (meta: { middleware: string, keepalive: boolean, pageTransition: boolean, key: (route: RouteLocationNormalized) => string }) => void;

definePageMeta({
  middleware: 'auth',
  keepalive: false,
  pageTransition: false,
  key: route => route.fullPath
});

const jsonStore = useJsonStore();
const router = useRouter();
const errors = useErrorsStore();
const messages = useMessagesStore();
const form = ref<JsonEditFormData>({
  name: '',
  description: '',
  slug: '',
  group: undefined,
  currentFile: undefined
});

const jsonContent = ref(JSON.stringify({}));
const jsonError = ref<string>('');

const apiUrl = computed(() => '');

onMounted(async () => {
  jsonContent.value = JSON.stringify({});
  jsonError.value = '';

  fetchGroups();
});

const fetchGroups = async () => {
  try {
    const groupData = await jsonStore.fetchGroups();
    if (groupData && groupData.length > 0) {
      form.value.group = groupData[0];
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      errors.add(error.message);
    } else {
      errors.add('Unknown error occurred');
    }
  }
};

const validateJson = (error: string | null): void => {
  jsonError.value = error || '';
};

const createFile = async (): Promise<void> => {
  if (!form.value.name) {
    errors.add('Name is required');
    return;
  }
  if (!form.value.group) {
    errors.add('Group is required');
    return;
  }

  if (!jsonContent.value.trim()) {
    errors.add('JSON content is required');
    return;
  }

  try {
    const content = JSON.parse(jsonContent.value);
    const newFile = await jsonStore.createFile({
      name: form.value.name,
      description: form.value.description,
      slug: form.value.slug,
      groupId: form.value.group._id,
      content
    });

    if (newFile) {
      router.push(`/json/${newFile._id}`);
      messages.add('File created successfully');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      errors.add(error.message);
    } else {
      errors.add('Unknown error occurred');
    }
  }
};
</script>