import { createApp } from "vue";
import App from "./App.vue";
import { store, Mutations } from "../store";

store.commit(Mutations.loadGameConfig);

const app = createApp(App);
app.mount("#app");
