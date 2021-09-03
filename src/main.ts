import { createApp } from "vue";
import App from "./App.vue";
const app = createApp(App)
  // .use(store)
  // .use(router)
  // .use(VueQrcodeReader)
  .mount("#app");

console.log((app.$data as any).a);
