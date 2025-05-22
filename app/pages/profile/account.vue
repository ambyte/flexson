<template>
    <div>
        <v-card class="mb-6">
            <v-card-title class="text-h6 mb-4">Profile Information</v-card-title>
            <v-card-text>
                <v-form @submit.prevent="updateProfile">
                    <v-text-field v-model="profile.name" label="Login for authentication" placeholder="Enter your login"
                        variant="outlined" class="mb-4" />

                    <v-text-field v-model="profile.email" label="Email" type="email" placeholder="Enter your email"
                        variant="outlined" class="mb-4" />

                    <v-btn color="primary" type="submit" :loading="accountStore.loading">
                        Save Changes
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>

        <v-card>
            <v-card-title class="text-h6 mb-4">Change Password</v-card-title>
            <v-card-text>
                <v-btn color="primary" @click="showPasswordDialog = true">
                    Change Password
                </v-btn>
            </v-card-text>
        </v-card>

        <v-dialog v-model="showPasswordDialog" max-width="500px">
            <v-card>
                <v-card-title class="text-h6 mb-4">Change Password</v-card-title>
                <v-card-text>
                    <v-form @submit.prevent="changePassword">
                        <v-text-field v-model="passwordForm.currentPassword" label="Current Password" type="password"
                            placeholder="Enter current password" variant="outlined" class="mb-4" />

                        <v-text-field v-model="passwordForm.newPassword" label="New Password" type="password"
                            placeholder="Enter new password" variant="outlined" class="mb-4" />

                        <v-text-field v-model="passwordForm.confirmPassword" label="Confirm New Password"
                            type="password" placeholder="Confirm new password" variant="outlined" class="mb-4" />
                    </v-form>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="tonal" @click="closePasswordDialog">
                        Cancel
                    </v-btn>
                    <v-btn variant="flat" color="secondary-text" :loading="loading" :disabled="!passwordFormFilled"
                        @click="changePassword">
                        Update Password
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useMessagesStore, useErrorsStore } from '../../stores/messagesStore';

declare const definePageMeta: (meta: { layout: string, middleware: string }) => void;
definePageMeta({
    layout: 'profile',
    middleware: 'auth'
});

const authStore = useAuthStore();
const accountStore = useAccountStore();
const messages = useMessagesStore();
const errors = useErrorsStore();

const loading = ref(false);

const profile = ref({
    name: '',
    email: '',
});

onMounted(() => {
    profile.value.name = authStore.getUser?.username || '';
    profile.value.email = authStore.getUser?.email || '';
});

const passwordFormFilled = computed(() => {
    if (!passwordForm.value.currentPassword) return false;
    if (!passwordForm.value.newPassword) return false;
    if (!passwordForm.value.confirmPassword) return false;
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) return false;
    return true;
});

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const showPasswordDialog = ref(false);

const updateProfile = async () => {
    if (!profile.value.name?.trim()) {
        return;
    }

    if (profile.value.name?.trim() === authStore.getUser?.username) {
        return;
    }

    try {
        await accountStore.updateUserProfile({
            username: profile.value.name,
            email: profile.value.email
        });

        messages.add('Profile updated successfully');
    } catch (error: unknown) {
        if (error instanceof Error) {
            errors.add(error.message);
        } else {
            errors.add('Unknown error occurred');
        }
    }
};

const closePasswordDialog = () => {
    showPasswordDialog.value = false;
    passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };
};

const changePassword = async () => {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
        errors.add('New passwords do not match');
        return;
    }

    loading.value = true;

    try {
        await accountStore.updatePassword({
            currentPassword: passwordForm.value.currentPassword,
            newPassword: passwordForm.value.newPassword
        });
        messages.add('Password updated successfully');
        closePasswordDialog();
    } catch (error: unknown) {
        if (error instanceof Error) {
            errors.add(error.message);
        } else {
            errors.add('Unknown error occurred');
        }
    } finally {
        loading.value = false;
    }
};

</script>