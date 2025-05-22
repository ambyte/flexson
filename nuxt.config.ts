// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  debug: false,

  ssr: true,

  future: {
    compatibilityVersion: 4,
  },

  // when enabling ssr option you need to disable inlineStyles and maybe devLogs
  features: {
    inlineStyles: false,
    devLogs: false,
  },

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    ssr: {
      noExternal: ["vuetify"],
    },
  },

  css: [],
  modules: [
    "@nuxt/fonts",
    "vuetify-nuxt-module",
    "@nuxt/eslint",
    "@pinia/nuxt",
  ],

  vuetify: {
    moduleOptions: {
      // check https://nuxt.vuetifyjs.com/guide/server-side-rendering.html
      ssrClientHints: {
        reloadOnFirstRequest: false,
        viewportSize: true,
        prefersColorScheme: false,

        prefersColorSchemeOptions: {
          useBrowserThemeOnly: false,
        },
      },

      // /* If customizing sass global variables ($utilities, $reset, $color-pack, $body-font-family, etc) */
      // disableVuetifyStyles: true,
      // styles: {
      //   configFile: "assets/settings.scss",
      // },
    },
  },

  app: {
    head: {
      title: "Flexson",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content: "Flexson is a JSON file management application",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
    pageTransition: false,
    keepalive: true,
  },

  runtimeConfig: {
    nitro: {
      envPrefix: "APP_",
    },
    jwtSecret: "default_secret_change_in_production",
    mongoUri: "mongodb://admin:password@127.0.0.1:27017",
    mongoDb: "flexsondb",
    adminUsername: "admin",
    adminPassword: "password",
    // Token settings
    accessTokenLifetime: "15m",
    refreshTokenLifetime: "1d",
    public: {
      disableRegistration: "true",
      tokenRefreshThreshold: "2m",
      baseURL: "http://localhost:3000",
    },
  },
});
