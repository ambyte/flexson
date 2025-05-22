<template>
    <div>
        <div class="d-flex align-center justify-space-between mb-6">
            <h1 class="text-h4">API Keys</h1>
            <v-btn color="primary" prepend-icon="mdi-plus" @click="showCreateModal = true">
                Create New API Key
            </v-btn>
        </div>

        <v-card v-if="apiKeys.length === 0" class="text-center pa-6">
            <v-icon size="48" color="grey" class="mb-4">mdi-key-variant</v-icon>
            <p class="text-body-1 text-grey">No API keys found. Create your first API key to get started.</p>
        </v-card>

        <v-card v-else>
            <v-data-table :headers="headers" :items="apiKeys" class="elevation-0" hide-default-footer>
                <template #[`item.name`]="{ item }">
                    {{ item.name }}
                </template>
                <template #[`item.apiKey`]="{ item }">
                    <div class="d-flex align-center">
                        <span class="text-truncate" style="max-width: 180px">{{ maskApiKey(item.apiKey) }}</span>
                    </div>
                </template>
                <template #[`item.createdAt`]="{ item }">
                    {{ formatDate(item.createdAt) }}
                </template>

                <template #[`item.lastUsed`]="{ item }">
                    {{ item.lastUsed ? formatDate(item.lastUsed) : 'Never used' }}
                </template>
                <template #[`item.expiresAt`]="{ item }">
                    {{ item.expiresAt ? formatDate(item.expiresAt) : 'Never expires' }}
                </template>
                <template #[`item.status`]="{ item }">
                    <v-chip :color="getStatusColor(item)" size="small">
                        {{ getStatusText(item) }}
                    </v-chip>
                </template>
                <template #[`item.actions`]="{ item }">
                    <v-menu>
                        <template #activator="{ props }">
                            <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text" />
                        </template>
                        <v-list>
                            <v-list-item @click="copyKey(item.apiKey)">
                                <v-list-item-title>Copy</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="showEditDialog(item)">
                                <v-list-item-title>Rename</v-list-item-title>
                            </v-list-item>
                            <v-list-item @click="toggleKeyStatus(item)">
                                <v-list-item-title>{{ item.isActive ? 'Deactivate' : 'Activate' }}</v-list-item-title>
                            </v-list-item>
                            <v-list-item color="error" @click="revokeKey(item._id)">
                                <v-list-item-title>Delete</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-menu>
                </template>
            </v-data-table>
        </v-card>

        <v-dialog v-model="showCreateModal" max-width="500">
            <v-card>
                <v-card-title class="text-h5">Create New API Key</v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="createApiKey">
                        <v-text-field v-model="newKey.name" label="Key Name" placeholder="Enter a name for your API key"
                            variant="outlined" class="mb-4" required />

                        <v-select v-model="newKey.expiry" label="Expiry (Optional)" variant="outlined" :items="[
                            { title: 'Never', value: '' },
                            { title: '30 days', value: '30' },
                            { title: '90 days', value: '90' },
                            { title: '180 days', value: '180' },
                            { title: '1 year', value: '365' }
                        ]" item-title="title" item-value="value" />
                    </v-form>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="tonal" @click="showCreateModal = false">
                        Cancel
                    </v-btn>
                    <v-btn variant="flat" color="secondary" :loading="accountStore.loading" :disabled="!newKey.name"
                        @click="createApiKey">
                        Create Key
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showEditModal" max-width="500">
            <v-card>
                <v-card-title class="text-h5">Rename API Key</v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="updateKeyName">
                        <v-text-field v-model="editKey.name" label="Key Name" variant="outlined" required />
                    </v-form>
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="tonal" @click="showEditModal = false">
                        Cancel
                    </v-btn>
                    <v-btn variant="flat" color="secondary" :loading="accountStore.loading" :disabled="!editKey.name"
                        @click="updateKeyName">
                        Save
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="showNewKeyModal" max-width="500" persistent>
            <v-card>
                <v-card-title class="text-h5">API Key Created</v-card-title>
                <v-card-text>
                    <p class="text-body-1 mb-2">Your new API key has been created.</p>
                    <v-text-field v-model="createdApiKey" label="API Key" variant="outlined" readonly class="mb-2"
                        append-inner-icon="mdi-content-copy" @click:append-inner="copyCreatedKey" />
                </v-card-text>
                <v-card-actions class="pa-4">
                    <v-spacer />
                    <v-btn variant="flat" color="primary" @click="closeNewKeyModal">
                        Done
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { useAccountStore } from '../../stores/accountStore';
import { useMessagesStore, useErrorsStore } from '../../stores/messagesStore';
import type { ApiKey } from '../../../types/models';
import { ref, onMounted } from 'vue';

declare const definePageMeta: (meta: { layout: string, middleware: string }) => void;
definePageMeta({
    layout: 'profile',
    middleware: 'auth'
});

const accountStore = useAccountStore();
const messages = useMessagesStore();
const errors = useErrorsStore();
const showCreateModal = ref<boolean>(false);
const showEditModal = ref<boolean>(false);
const showNewKeyModal = ref<boolean>(false);
const createdApiKey = ref<string>('');
const apiKeys = ref<ApiKey[]>([]);
const newKey = ref<{
    name: string;
    expiry: string;
}>({
    name: '',
    expiry: ''
});
const editKey = ref<{
    _id: string;
    name: string;
}>({
    _id: '',
    name: ''
});

const headers = [
    { title: 'Name', key: 'name' },
    { title: 'API Key', key: 'apiKey' },
    { title: 'Created On', key: 'createdAt' },
    { title: 'Last Used', key: 'lastUsed' },
    { title: 'Expires On', key: 'expiresAt' },
    { title: 'Status', key: 'status' },
    { title: 'Actions', key: 'actions', align: 'end' as const }
];

onMounted(async () => {
    const result = await accountStore.getApiKeys();
    if (result.success) {
        apiKeys.value = result.data;
    } else {
        apiKeys.value = [];
    }
});

const formatDate = (dateString: string | Date): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
};

const maskApiKey = (key: string): string => {
    if (!key) return '';
    const prefix = key.substring(0, 6);
    const suffix = key.substring(key.length - 4);
    return `${prefix}.......${suffix}`;
};

const copyKey = async (key: string): Promise<void> => {
    try {
        await navigator.clipboard.writeText(key);
        messages.add('API key copied to clipboard');
    } catch {
        errors.add("Failed to copy API key");
    }
};

const copyCreatedKey = async (): Promise<void> => {
    try {
        await navigator.clipboard.writeText(createdApiKey.value);
        messages.add('API key copied to clipboard');
    } catch {
        errors.add("Failed to copy API key");
    }
};

const createApiKey = async (): Promise<void> => {
    const result = await accountStore.createApiKey(newKey.value);
    if (result.success && result.data) {
        apiKeys.value.push(result.data);
        showCreateModal.value = false;

        createdApiKey.value = result.data.apiKey;
        showNewKeyModal.value = true;

        newKey.value = { name: '', expiry: '' };
    }
};

const revokeKey = async (keyId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

    const result = await accountStore.deleteApiKey(keyId);
    if (result.success) {
        apiKeys.value = apiKeys.value.filter(key => key._id !== keyId);
        messages.add('API key deleted');
    }
};

const showEditDialog = (key: ApiKey): void => {
    editKey.value = {
        _id: key._id,
        name: key.name
    };
    showEditModal.value = true;
};

const updateKeyName = async (): Promise<void> => {
    const result = await accountStore.updateApiKeyName(editKey.value._id, editKey.value.name);
    if (result.success) {
        const keyIndex = apiKeys.value.findIndex(k => k._id === editKey.value._id);
        if (keyIndex !== -1) {
            apiKeys.value[keyIndex]!.name = editKey.value.name;
        }
        showEditModal.value = false;
        messages.add('API key renamed');
    }
};

const toggleKeyStatus = async (key: ApiKey): Promise<void> => {
    const newStatus = !key.isActive;
    const result = await accountStore.updateKeyStatus(key._id, newStatus);
    if (result.success) {
        const keyIndex = apiKeys.value.findIndex(k => k._id === key._id);
        if (keyIndex !== -1) {
            apiKeys.value[keyIndex]!.isActive = newStatus;
        }
        messages.add(`API key ${newStatus ? 'activated' : 'deactivated'}`);
    }
};

const closeNewKeyModal = (): void => {
    showNewKeyModal.value = false;
    createdApiKey.value = '';
};

const getStatusColor = (key: ApiKey): string => {
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        return 'warning';
    }
    return key.isActive ? 'success' : 'error';
};

const getStatusText = (key: ApiKey): string => {
    if (key.expiresAt && new Date(key.expiresAt) < new Date()) {
        return 'Expired';
    }
    return key.isActive ? 'Active' : 'Inactive';
};

</script>
