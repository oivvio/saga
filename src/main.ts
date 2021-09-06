import { Howl } from "howler";
import { createApp } from "vue";

import App from "./App.vue";
import { interpretStation } from "./station";
// import { initQR, scanQRCode } from "./qrscanner";
import { stations } from "./state";
import { store } from "./store";

// Set up our app
const app = createApp(App)
  .use(store)
  // .use(router)
  .mount("#app");

console.log(app);
