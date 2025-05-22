import { defineVuetifyConfiguration } from "vuetify-nuxt-module/custom-configuration";

export default defineVuetifyConfiguration({
  defaults: {
    global: {
      flat: true,
      ripple: false,
      rounded: "lg",
    },
    VCard: {
      border: true,
    },
    VAppBar: {
      border: false,
      rounded: false,
    },
    VFooter: {
      border: false,
      rounded: false,
    },
    VExpansionPanels: {
      border: true,
      rounded: false,
    },
    VBtn: {
      rounded: "md",
    },
  },
  theme: {
    defaultTheme: "dark",
    themes: {
      light: {
        colors: {
          primary: "#006A71",
          secondary: "#48A6A7",
          background: "#ffffff",
          surface: "#ffffff",
          "secondary-text": "#003a3d",
          error: "#dc2626",
          border: "#e5e7eb",
          panels: "#f6f6f6",
        },
      },
      dark: {
        colors: {
          primary: "#1f2937",
          secondary: "#374151",
          background: "#111827",
          surface: "#111827",
          "secondary-text": "#b3b4b7",
          error: "#dc2626",
          border: "#374151",
          panels: "#1a212f",
        },
      },
    },
  },
});
