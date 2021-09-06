import { createApp } from "vue";
import App from "./App.vue";
import { store } from "./store";
// Set up our app
const app = createApp(App)
    .use(store)
    // .use(router)
    .mount("#app");
console.log(app);
//# sourceMappingURL=main.js.map