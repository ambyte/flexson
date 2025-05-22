<template>
    <div>
        <v-card class="mb-6">
            <v-card-text>
                <div v-if="isEditing" class="mt-4">
                    <v-text-field v-model="form.name" label="Name" placeholder="File name" required
                        variant="solo-filled" @update:model-value="updateNameField" />
                    <v-text-field v-model="form.slug" label="Slug"
                        :rules="[(v) => v === '' || /^[a-zA-Z0-9-]+$/.test(v) || 'Only latin letters, numbers and dashes are allowed']"
                        placeholder="Used for URLs and identification (optional)." variant="solo-filled"
                        @update:model-value="updateSlugField" />

                    <v-text-field v-model="form.description" label="Description" variant="solo-filled"
                        placeholder="File description (optional)" @update:model-value="updateDescriptionField" />

                    <v-select v-model="form.group" label="Group" :items="jsonStore.groups" item-title="name"
                        item-value="_id" return-object variant="solo-filled" @update:model-value="updateGroupField" />
                </div>

                <div v-else>
                    <div v-if="form.currentFile">
                        <h2 class="text-h5 mb-2">{{ form.currentFile.name }}</h2>
                        <p v-if="form.currentFile.description" class="text-medium-emphasis mb-4">
                            {{ form.currentFile.description }}
                        </p>

                        <v-row class="text-body-2 text-medium-emphasis">
                            <v-col cols="12" sm="4">
                                <strong>Group:</strong> {{ groupName }}
                            </v-col>
                            <v-col cols="12" sm="4">
                                <strong>Created:</strong> {{ formatDate(form.currentFile.createdAt.toString()) }}
                            </v-col>
                            <v-col cols="12" sm="4">
                                <strong>Updated:</strong> {{ formatDate(form.currentFile.updatedAt.toString()) }}
                            </v-col>
                        </v-row>

                        <v-divider v-if="form.currentFile.groupId" class="my-4" />

                        <div v-if="form.currentFile.groupId">
                            <h4 class="text-subtitle-1 font-weight-bold mb-2">API Access URL:</h4>
                            <div class="d-flex align-center justify-space-between">
                                <v-card variant="outlined" class="pa-2 flex-grow-1">
                                    <code class="text-body-2">{{ apiUrl }}</code>
                                </v-card>
                                <v-btn icon="mdi-content-copy" variant="text" color="secondary-text"
                                    @click="copyApiUrl" />
                            </div>

                            <p class="text-caption text-medium-emphasis mt-1">
                                Use this URL to access the raw JSON data directly via API.
                            </p>
                        </div>
                    </div>
                    <div v-else class="text-medium-emphasis">No file data available</div>
                </div>
            </v-card-text>
        </v-card>

        <div class="mb-4">
            <v-card v-if="isEditing" class="pa-0 overflow-visible">
                <div class="d-flex justify-space-between align-center">
                    <v-tabs v-model="activeTab" color="secondary-text">
                        <v-tab value="text">Json View</v-tab>
                        <v-tab value="object">Object View</v-tab>
                    </v-tabs>
                    <div v-if="isEditing" class="mr-1">
                        <v-btn color="primary" :loading="loading" :disabled="loading || !!jsonError || !isFormValid"
                            @click="$emit('save')">
                            {{ loading ? 'Saving...' : 'Save Changes' }}
                        </v-btn>
                    </div>
                </div>

                <div class="h-96 mt-2">
                    <v-tabs-window v-model="activeTab" class="overflow-visible">
                        <v-tabs-window-item value="text" transition="none" reverse-transition="none">
                            <JsonEditorVue v-model="localJsonContent"
                                :class="['font-mono text-sm h-96', { 'jse-theme-dark': current.dark }]"
                                placeholder="Enter valid JSON" :stringified="false" :mode="Mode.text"
                                @update:model-value="handleJsonUpdate" />
                        </v-tabs-window-item>

                        <v-tabs-window-item value="object" transition="none" reverse-transition="none">
                            <JsonObjectEditor v-model="localJsonContent as unknown as JsonValue"
                                :class="['font-mono text-sm h-96', { 'jse-theme-dark': current.dark }]"
                                placeholder="Enter valid JSON" @update:model-value="handleJsonUpdate as any" />
                        </v-tabs-window-item>
                    </v-tabs-window>
                </div>
            </v-card>

            <v-card v-else variant="outlined" class="pa-4 overflow-auto h-96">
                <pre class="font-mono text-sm">{{ formattedJson }}</pre>
            </v-card>
        </div>

        <v-alert v-if="jsonError" type="error" variant="tonal" class="mb-4">
            {{ jsonError }}
        </v-alert>



    </div>
</template>

<script setup lang="ts">
import { useJsonStore } from '../stores/dataStore';
import { computed, ref, watch } from 'vue';
import JsonEditorVue from 'json-editor-vue';
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import type { Group, JsonEditFormData } from '../../types/models';
import { useTheme } from 'vuetify'
import { Mode } from 'vanilla-jsoneditor';
import { useMessagesStore, useErrorsStore } from '../stores/messagesStore';

import JsonObjectEditor from './JsonObjectEditor.vue';

// Define JsonValue to match the type in JsonObjectEditor.vue
type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue }
    | JsonValue[];

const { current } = useTheme();
const activeTab = ref('text');

const jsonStore = useJsonStore();
const messages = useMessagesStore();
const errors = useErrorsStore();

interface Props {
    isEditing: boolean;
    initialData: JsonEditFormData;
    jsonContent: string;
    loading: boolean;
}

type Emits = {
    'update:form': [data: JsonEditFormData];
    'update:jsonContent': [content: string];
    'validateJson': [error: string | null];
    'save': [];
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const form = ref<JsonEditFormData>({ ...props.initialData });
const jsonError = ref<string>('');

const localJsonContent = ref<Record<string, unknown>>(
    typeof props.jsonContent === 'string'
        ? JSON.parse(props.jsonContent || '{}')
        : props.jsonContent || {}
);

watch(() => props.jsonContent, (newVal) => {
    const newValStr = typeof newVal === 'string' ? newVal : JSON.stringify(newVal);
    const currentStr = JSON.stringify(localJsonContent.value);

    if (newValStr !== currentStr) {
        localJsonContent.value = typeof newVal === 'string'
            ? JSON.parse(newVal || '{}')
            : newVal || {};
    }
}, { immediate: true });

watch(form, (newVal, oldVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        emit('update:form', newVal);
    }
}, { deep: true });

watch(() => props.initialData, (newVal, oldVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
        form.value = { ...newVal };
    }
}, { deep: true, immediate: true });

const apiUrl = ref<string>('');

watch(() => form.value.currentFile, async (newFile) => {
    if (!newFile) {
        apiUrl.value = '';
    } else {
        apiUrl.value = await jsonStore.generateFileLink(newFile._id);
    }
}, { immediate: true });

const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
};

const formattedJson = computed<string>(() => {
    try {
        return JSON.stringify(localJsonContent.value, null, 2);
    } catch {
        return '{}';
    }
});

const isFormValid = computed(() => {

    if (!form.value.name?.trim()) return false;
    if (form.value.slug && !/^[a-zA-Z0-9-]+$/.test(form.value.slug)) return false;
    if (!form.value.group) return false;

    return true;
});

const groupName = computed(() => {
    if (!form.value.currentFile?.groupId) return 'N/A';
    const group = jsonStore.groups.find(g => g._id === form.value.currentFile?.groupId);
    return group?.name || 'N/A';
});

const handleJsonUpdate = (content: Record<string, unknown>): void => {
    try {
        localJsonContent.value = content;
        jsonError.value = '';
        emit('update:jsonContent', JSON.stringify(content));
        emit('validateJson', null);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        jsonError.value = `Invalid JSON: ${errorMessage}`;
        emit('validateJson', errorMessage);
    }
};

const updateNameField = (value: string): void => {
    form.value.name = value;
    emit('update:form', { ...form.value });
}

const updateSlugField = (value: string): void => {
    form.value.slug = value;
    emit('update:form', { ...form.value });
}

const updateDescriptionField = (value: string): void => {
    form.value.description = value;
    emit('update:form', { ...form.value });
}

const updateGroupField = (value: Group): void => {
    form.value.group = value;
    emit('update:form', { ...form.value });
}

const copyApiUrl = async (): Promise<void> => {
    try {
        await navigator.clipboard.writeText(apiUrl.value);
        messages.add('API URL copied to clipboard');
    } catch {
        errors.add('Failed to copy API URL');
    }
};
</script>