// import { Howl } from "howler";
import { createApp } from "vue";

import App from "./App.vue";
// import { interpretStation } from "./station";
// import { initQR, scanQRCode } from "./qrscanner";
// import { stations } from "./state";

import { store, Mutations } from "./store";

store.commit(Mutations.loadGameConfig);

//Exctract the configUrl that should have been passed as a query argument

// const gameConfig = await loadGameConfig(new URL(configUrl));

const app = createApp(App)
  // .provide("gameConfig", gameConfig)
  .use(store)
  // .use(router)
  .mount("#app");

console.log(app);

// var text = await main();
// console.log(text);
//
//

// Set up our app
