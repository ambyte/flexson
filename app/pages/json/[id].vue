<template>
  <div>
    <v-container max-width="1300">
      <v-row class="mb-6">
        <v-col cols="12" class="d-flex justify-space-between align-center">
          <div class="d-flex align-center">
            <NuxtLink to="/" class="text-decoration-none">
              <v-btn variant="text" size="large" color="secondary-text" class="mr-2">
                <v-icon start>mdi-arrow-left</v-icon>
                Back
              </v-btn>
            </NuxtLink>
            <h1 class="text-h5">{{ isEditing ? 'Edit' : 'View' }} JSON</h1>
          </div>
          <div class="d-flex align-center">
            <v-btn variant="flat" color="secondary-text" @click="toggleEditMode">
              {{ isEditing ? 'Cancel' : 'Edit' }}
            </v-btn>
            <v-btn v-if="!isEditing" class="ml-2" variant="flat" color="error" @click="deleteFile()">
              Delete
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row v-if="!currentFile" class="text-center py-8">
        <v-col cols="12">
          <div class="text-medium-emphasis">Loading...</div>
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col>
          <JsonFileForm :key="formKey" :is-editing="isEditing" :initial-data="editForm" :json-content="jsonContent"
            :loading="jsonStore.loading" @update:json-content="jsonContent = $event" @update:form="editForm = $event"
            @validate-json="validateJson" @save="saveChanges" />
        </v-col>
      </v-row>
    </v-container>

    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>Delete File</v-card-title>
        <v-card-text>
          Are you sure you want to delete this file?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="tonal" @click="dialog = false">Cancel</v-btn>
          <v-btn color="error" @click="confirmAction">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useJsonStore } from '../../stores/dataStore';
import { useRoute, useRouter } from 'vue-router';
import { useMessagesStore, useErrorsStore } from '../../stores/messagesStore';
import type { JsonEditFormData, JsonFile } from '../../../types/models';
const messages = useMessagesStore()
const errors = useErrorsStore()
const dialog = ref<boolean>(false);

declare const definePageMeta: (meta: { middleware: string, keepalive: boolean, pageTransition: boolean, key: (route: unknown) => string }) => void;

definePageMeta({
  middleware: 'auth',
  keepalive: false,
  pageTransition: false,
  key: (route: unknown) => (route as { fullPath: string }).fullPath
});

const jsonStore = useJsonStore();
const route = useRoute();
const router = useRouter();

const isEditing = ref<boolean>(false);
const jsonContent = ref<string>('');
const jsonError = ref<string>('');
const currentFile = ref<JsonFile | null>(null);
const formKey = ref<number>(0);

const editForm = ref<JsonEditFormData>({
  name: '',
  description: '',
  slug: '',
  group: undefined,
  currentFile: undefined
});

onMounted(async () => {
  await Promise.all([
    currentFile.value = await jsonStore.fetchFile(route.params.id as string),
    jsonStore.fetchGroups()
  ]);

  if (currentFile.value) {
    editForm.value = {
      name: currentFile.value.name,
      description: currentFile.value.description || '',
      slug: currentFile.value.slug,
      group: jsonStore.getGroupById(currentFile.value.groupId),
      currentFile: currentFile.value
    };
    jsonContent.value = JSON.stringify(currentFile.value.content, null, 2);
  }
});

const toggleEditMode = (): void => {
  if (isEditing.value) {
    if (currentFile.value) {
      editForm.value = {
        name: currentFile.value.name,
        description: currentFile.value.description || '',
        slug: currentFile.value.slug,
        group: jsonStore.getGroupById(currentFile.value.groupId),
        currentFile: currentFile.value
      };
      jsonContent.value = JSON.stringify(currentFile.value.content, null, 2);
    }
    jsonError.value = '';
  }
  isEditing.value = !isEditing.value;
};

const validateJson = (error: string | null): void => {
  jsonError.value = error || '';
};

const deleteFile = (): void => {
  dialog.value = true;
};

const confirmAction = async (): Promise<void> => {
  try {
    await jsonStore.deleteFile(route.params.id as string);
    router.push('/');
    messages.add('File deleted successfully');
  } catch (error: unknown) {
    errors.add((error as Error).message);
  }
  dialog.value = false;
};

const saveChanges = async (): Promise<void> => {
  if (!editForm.value.name) {
    errors.add('Name is required');
    return;
  }

  try {
    const content = JSON.parse(jsonContent.value);

    await jsonStore.updateFile({
      _id: route.params.id as string,
      name: editForm.value.name,
      description: editForm.value.description,
      groupId: editForm.value.group?._id,
      slug: editForm.value.slug,
      content
    });

    currentFile.value = await jsonStore.fetchFile(route.params.id as string);

    if (currentFile.value) {
      editForm.value = {
        ...editForm.value,
        currentFile: currentFile.value,
        slug: currentFile.value.slug
      };

      formKey.value++;
    }

    messages.add('File saved successfully');
    isEditing.value = false;
  } catch (error: unknown) {
    errors.add((error as Error).message);
  }
};

</script>