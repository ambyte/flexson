<template>
    <NuxtLayout name="default">
        <v-container max-width="1200">
            <v-row>
                <v-col cols="12" md="3">
                    <v-card class="pa-2">
                        <v-list>
                            <v-list-item to="/profile/account" :active="$route.path === '/profile/account'"
                                class="mb-2">
                                <template #prepend>
                                    <v-icon>mdi-account</v-icon>
                                </template>
                                <v-list-item-title>Account</v-list-item-title>
                            </v-list-item>

                            <v-list-item to="/profile/apikeys" :active="$route.path === '/profile/apikeys'">
                                <template #prepend>
                                    <v-icon>mdi-key</v-icon>
                                </template>
                                <v-list-item-title>API Keys</v-list-item-title>
                            </v-list-item>
                        </v-list>
                    </v-card>
                </v-col>

                <v-col cols="12" md="9">
                    <v-card class="profile-content">
                        <v-card-text>
                            <slot />
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </NuxtLayout>
</template>