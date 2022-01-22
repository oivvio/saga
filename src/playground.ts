import { createApp } from "vue";
import App from "./App.vue";
import { store, Mutations } from "./store";

import * as Sentry from "@sentry/vue";
import { Integrations } from "@sentry/tracing";

store.commit(Mutations.loadGameConfig);

const app = createApp(App);

app.use(store);
app.mount("#app");
