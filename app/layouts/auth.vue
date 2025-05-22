<template>
  <v-app>
    <v-main>
      <v-container class="fill-height">
        <v-row justify="center" align="center">
          <v-col cols="12" class="text-center" style="max-width: 500px;">
            <div class="text-center mb-8">
              <h1 class="text-h3 font-weight-bold text-primary">Flexson</h1>
              <p class="text-medium-emphasis mt-2">Manage your JSON files with ease</p>
            </div>
            <v-card class="pa-8 mx-auto" width="500">
              <slot />
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>