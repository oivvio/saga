import { createApp } from "vue";
import App from "./App.vue";
// import "./registerServiceWorker";
// import router from "./router";
// import store from "./store";
const app = createApp(App)
    // .use(store)
    // .use(router)
    .mount("#app");
console.log(app.$data.a);
//# sourceMappingURL=main.js.map