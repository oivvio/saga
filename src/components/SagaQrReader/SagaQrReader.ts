import { defineComponent } from "vue";

import QrScanner from "qr-scanner";

// Bundling as a blob with webpack didn't work so we get the worker code separately
QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";

export default defineComponent({
  name: "SagaQrReader",

  data() {
    return {
      result: "",
      error: "",
    };
  },

  setup(props) {
    console.log("props: ", props);
  },

  mounted() {
    console.log("on mounted");

    const videoElement = <HTMLVideoElement>document.getElementById("qrvideo");

    // events canplay, playing and canplaythrough works in firefox desktop
    // on google chrome durationchange and loadedmetadata
    //eventNames.forEach((eventName) => {
    const qrScanner = new QrScanner(
      videoElement,
      (result) => console.log("decoded qr code:", result),
      (error) => console.log("There was an error: ", error)
    );

    qrScanner.start();
    //
    videoElement.addEventListener("canplay", () => {
      console.log("canplay ", videoElement.videoWidth);
      (window as any).qrScanner = qrScanner;

      const canvas = (qrScanner as any).$canvas;
      console.log("_scanRegion:", (qrScanner as any)._scanRegion);
      console.log("canvas:", canvas);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(0, 0, 150, 75);

      const qr = <HTMLVideoElement>document.getElementById("qrreader");
      const marker = document.createElement("p");
      marker.setAttribute("id", "marker");
      // marker.style.width = "300px";
      // marker.style.height = "300px";

      qr.appendChild(marker);
      // videoElement.style.display = "none";

      // debugger;
    });
  },

  methods: {
    onDecode(result: string) {
      console.log(result);
      // this.result = result;
    },

    onInit() {
      console.log("in onInit");
    },
  },
});
