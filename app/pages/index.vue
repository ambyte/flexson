<template>
    <div>
        <v-overlay :value="isLoading">
            <v-progress-circular indeterminate size="64" color="primary" />
        </v-overlay>
        <v-container max-width="1300">
            <v-row>
                <v-col md="12" class="d-flex justify-end ga-4">
                    <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" label="Search files"
                        variant="outlined" hide-details density="compact" @update:model-value="debounceSearch" />
                    <v-btn :to="'/json/new'" variant="flat" color="secondary" height="40">
                        Create json
                    </v-btn>
                </v-col>
            </v-row>
            <v-row class="d-flex justify-center">
                <v-col md="4">
                    <v-card class="flex-1-1-100 border-lg">
                        <v-card-title class="d-flex justify-space-between align-center">
                            <span>Groups</span>
                            <v-btn variant="text" color="secondary-text" size="small" @click="openCreateGroupModal">
                                + New Group
                            </v-btn>
                        </v-card-title>

                        <v-card-text>
                            <div v-if="jsonStore.loading && !jsonStore.groups" class="text-medium-emphasis">
                                Loading groups...
                            </div>

                            <v-list v-else>
                                <v-list-item :active="!selectedGroup"
                                    :color="!selectedGroup ? 'secondary-text' : undefined" @click="selectGroup(null)">
                                    <v-list-item-title>All files</v-list-item-title>
                                </v-list-item>

                                <v-list-item v-for="group in jsonStore.groups" :key="group._id"
                                    :active="selectedGroup === group._id"
                                    :color="selectedGroup === group._id ? 'secondary-text' : undefined"
                                    @click="selectGroup(group._id)">
                                    <template #append>
                                        <v-btn icon="mdi-pencil" variant="text" size="small" title="Edit group"
                                            @click.stop="editGroup(group)" />
                                        <v-btn icon="mdi-link" variant="text" size="small" title="Copy group link"
                                            @click.stop="copyGroupLink(group)" />
                                    </template>
                                    <v-list-item-title>{{ group.name }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-card-text>
                    </v-card>
                </v-col>

                <v-col cols="12" md="8">

                    <div v-if="jsonStore.loading" class="text-center py-8">
                        <div class="text-medium-emphasis">Loading...</div>
                    </div>

                    <div v-else-if="filteredFiles.length === 0" class="text-center py-8">
                        <div class="text-medium-emphasis mb-4">No JSON files found</div>
                        <v-btn color="primary" :to="'/json/new'">
                            Create your first JSON file
                        </v-btn>
                    </div>

                    <div v-else class="d-flex flex-wrap ga-4">
                        <v-card v-for="file in filteredFiles" :key="file._id" height="175" width="410">
                            <v-card-title class="d-flex justify-space-between align-start">
                                <span class="d-inline-block text-truncate text-body-1">
                                    {{ file.name }}
                                </span>
                                <v-chip size="small" color="grey" variant="tonal" class="mt-1">
                                    <span class="d-inline-block text-truncate" style="max-width: 150px;">
                                        {{ getGroupName(file.groupId) }}
                                    </span>

                                </v-chip>
                            </v-card-title>

                            <v-card-subtitle>
                                Updated: {{ formatDate(file.updatedAt.toString()) }}
                            </v-card-subtitle>

                            <v-card-text class="d-flex justify-space-between align-center">
                                <span class="d-inline-block text-truncate" style="height: 20px; overflow: hidden;">
                                    {{ file.description }}
                                </span>
                            </v-card-text>

                            <v-card-actions class="d-flex justify-space-between align-center">
                                <v-btn variant="tonal" size="small" prepend-icon="mdi-link" @click="copyFileLink(file)">
                                    Link
                                </v-btn>
                                <div>
                                    <v-btn variant="outlined" size="small" :to="`/json/${file._id}`">
                                        View & Edit
                                    </v-btn>
                                </div>

                            </v-card-actions>
                        </v-card>
                    </div>
                </v-col>
            </v-row>

            <v-dialog v-model="showGroupModal" max-width="500">
                <v-card>
                    <v-card-title>
                        {{ isEditMode ? 'Edit Group' : 'Create New Group' }}
                    </v-card-title>

                    <v-card-text>
                        <v-form @submit.prevent="saveGroup">
                            <v-text-field v-model="groupForm.name" label="Group Name" placeholder="Enter group name"
                                variant="outlined" required />

                            <v-text-field v-model="groupForm.slug" label="Slug"
                                :rules="[(v) => v === '' || /^[a-zA-Z0-9-]+$/.test(v) || 'Only latin letters, numbers and dashes are allowed']"
                                placeholder="Used for URLs and identification (optional)." variant="outlined"
                                class="mt-4" />

                            <v-textarea v-model="groupForm.description" label="Description (optional)"
                                variant="outlined" placeholder="Enter group description" class="mt-4" />

                            <div class="d-flex">
                                <v-switch v-model="groupForm.allowPublicWrite" label="Allow public write access"
                                    color="success" class="mr-4" />
                                <v-switch v-model="groupForm.protected" label="Protected" color="success" />
                            </div>
                        </v-form>
                    </v-card-text>

                    <v-card-actions class="d-flex justify-space-between">
                        <v-btn v-if="isEditMode" color="error" variant="text"
                            @click="confirmDeleteGroup(groupForm._id)">
                            Delete
                        </v-btn>
                        <v-spacer v-else />
                        <div class="d-flex ga-2">
                            <v-btn variant="tonal" @click="closeGroupModal">
                                Cancel
                            </v-btn>
                            <v-btn color="secondary-text" :loading="jsonStore.loading" variant="flat"
                                :disabled="!isGroupFormValid || jsonStore.loading" @click="saveGroup">
                                {{ isEditMode ? 'Update' : 'Create' }}
                            </v-btn>
                        </div>
                    </v-card-actions>
                </v-card>
            </v-dialog>

            <v-dialog v-model="dialog" max-width="500">
                <v-card>
                    <v-card-title>Delete Group</v-card-title>
                    <v-card-text>
                        Are you sure you want to delete this group?
                    </v-card-text>
                    <v-card-actions>
                        <v-spacer />
                        <v-btn variant="tonal" @click="dialog = false">Cancel</v-btn>
                        <v-btn color="error" @click="confirmAction">Delete</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useJsonStore } from '../stores/dataStore';
import type { JsonFile, Group } from '../../types/models';
import { useMessagesStore, useErrorsStore } from '../stores/messagesStore';

declare const definePageMeta: (meta: { middleware: string }) => void;

definePageMeta({
    middleware: 'auth'
});

const jsonStore = useJsonStore();
const messages = useMessagesStore()
const errors = useErrorsStore()
const getGroupName = computed(() => (groupId: string) => {
    const group = jsonStore.getGroupById(groupId);
    return group?.name || '';
});

const selectedGroup = ref<string | null>(null);
const showGroupModal = ref<boolean>(false);
const dialog = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const isEditMode = ref<boolean>(false);
const groupToDelete = ref<string | null>(null);
const groupForm = ref<Group>({} as Group);
const searchQuery = ref<string>('');
const debouncedSearchQuery = ref<string>('');
let searchTimer: number | null = null;

const debounceSearch = (value: string) => {
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
        debouncedSearchQuery.value = value;
    }, 500);
};

const filteredFiles = computed(() => {
    if (!jsonStore.files) return [];
    if (!debouncedSearchQuery.value) return jsonStore.files;

    const query = debouncedSearchQuery.value.toLowerCase();
    return jsonStore.files.filter(file =>
        file.name.toLowerCase().includes(query) ||
        (file.description?.toLowerCase() || '').includes(query) ||
        (file.content?.toLowerCase() || '').includes(query) ||
        getGroupName.value(file.groupId).toLowerCase().includes(query)
    );
});

const isGroupFormValid = computed(() => {
    if (groupForm.value.slug) {
        return groupForm.value.name && /^[a-zA-Z0-9-]+$/.test(groupForm.value.slug);
    }
    return groupForm.value.name;
});

onMounted(() => {
    debouncedSearchQuery.value = searchQuery.value;
});

onMounted(async () => {
    try {
        isLoading.value = true;
        await Promise.all([
            jsonStore.fetchGroups(),
            jsonStore.fetchFiles()
        ]);
    } finally {
        isLoading.value = false;
    }
});

const openCreateGroupModal = () => {
    isEditMode.value = false;
    groupForm.value = {} as Group;
    showGroupModal.value = true;
};

const editGroup = (group: Group) => {
    isEditMode.value = true;
    groupForm.value = {
        ...group,
    };
    showGroupModal.value = true;
};

const closeGroupModal = () => {
    showGroupModal.value = false;
};

const selectGroup = async (groupId: string | null): Promise<void> => {
    selectedGroup.value = groupId;
    await jsonStore.fetchFiles(groupId);
};

const formatDate = (date: string | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleString();
};

const saveGroup = async (): Promise<void> => {
    if (!groupForm.value) return;

    if (isEditMode.value) {
        await jsonStore.updateGroup(groupForm.value);
    } else {
        await jsonStore.createGroup(groupForm.value);
    }
    await jsonStore.fetchGroups();
    closeGroupModal();
    messages.add('Group saved successfully');
};

const confirmDeleteGroup = (groupId: string): void => {
    groupToDelete.value = groupId;
    dialog.value = true;
};

const confirmAction = async (): Promise<void> => {
    if (groupToDelete.value) {
        await jsonStore.deleteGroup(groupToDelete.value);
        closeGroupModal();
        await Promise.all([
            jsonStore.fetchGroups(),
            jsonStore.fetchFiles()
        ]);
        if (selectedGroup.value === groupToDelete.value) {
            selectGroup(null);
        }
        messages.add('Group deleted successfully');
    }
    dialog.value = false;
    groupToDelete.value = null;
};

const copyGroupLink = async (group: Group): Promise<void> => {
    const url = jsonStore.generateGroupLink(group._id);
    try {
        await navigator.clipboard.writeText(url);
        messages.add('Group link copied to clipboard');
    } catch {
        errors.add('Failed to copy group link');
    }
};

const copyFileLink = async (file: JsonFile): Promise<void> => {
    const url = await jsonStore.generateFileLink(file._id);
    try {
        await navigator.clipboard.writeText(url);
        messages.add('File link copied to clipboard');
    } catch {
        errors.add('Failed to copy file link');
    }
};

</script>