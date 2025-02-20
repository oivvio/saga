import { createApp } from "vue";
import App from "./App.vue";
import { store, Mutations } from "./store";

import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

// Google analytics.
import VueGtag from "vue-gtag";

store.commit(Mutations.loadGameConfig);
store.commit(Mutations.loadFrozenState);

const app = createApp(App);

app
  .use(VueGtag, {
    config: { id: "G-Q5BQD339E7" },
  })
  .use(store);

Sentry.init({
  app,
  dsn: "https://fd54b1e4e88549b582f17c1f3f6bc45c@o1082459.ingest.sentry.io/6090985",
  integrations: [
    new Integrations.BrowserTracing({
      tracingOrigins: [
        "localhost",
        "localhost:8080",
        "sprickan.kulturhusetstadsteatern.se",
        /^\//,
      ],
    }),
  ],
  trackComponents: true,
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

app.mount("#app");
