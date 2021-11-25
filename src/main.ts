import { createApp } from "vue";
import App from "./App.vue";
import { store, Mutations } from "./store";

store.commit(Mutations.loadGameConfig);

createApp(App).use(store).mount("#app");
