import { createApp } from "vue";

import { log } from "./utils";
import App from "./App.vue";
import { store, Mutations } from "./store";

store.commit(Mutations.loadGameConfig);

//const app = createApp(App).use(store).mount("#app");
createApp(App).use(store).mount("#app");

log("startup", process.env.NODE_ENV);
