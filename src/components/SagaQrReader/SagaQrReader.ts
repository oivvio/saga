import { defineComponent } from "vue";
import QrScanner from "qr-scanner";

interface IScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  downScaledWidth: number;
  downScaledHeight: number;
}

// // Bundling as a blob with webpack didn't work so we get the worker code separately
// QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";

// TODO, make this not be sprickan specific.
QrScanner.WORKER_PATH = "/sprickan/js/vendor/qr-scanner-worker.min.js";

export default defineComponent({
  name: "SagaQrReader",

  data() {
    return {
      loading: true,
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
      (result) => {
        console.log("decoded qr code:", result);
        const canvas = document.getElementById("qrcanvas");
        if (canvas) {
          canvas.style.backgroundColor = "green";
        }
      },

      (error) => {
        const canvas = document.getElementById("qrcanvas");
        console.log(error);
        if (canvas) {
          canvas.style.backgroundColor = "red";
        }
      }
    );

    qrScanner.start();
    //
    videoElement.addEventListener("canplay", () => {
      this.loading = false;
      const videoNominalWidth = videoElement.videoWidth;
      const actualWidth = videoElement.offsetWidth;
      const scalingFactor = actualWidth / videoNominalWidth;

      // (window as any).qrScanner = qrScanner;
      // const scanRegion = (qrScanner as any)._scanRegion as IScanRegion;
      // eslint-disable-next-line
      const scanRegion = (qrScanner as any)._scanRegion as IScanRegion;

      const canvas = document.getElementById("qrcanvas");
      // marker.setAttribute("id", "marker");
      if (canvas) {
        canvas.style.left = `${scanRegion.x * scalingFactor}px`;
        canvas.style.top = `${scanRegion.y * scalingFactor}px`;
        canvas.style.width = `${scanRegion.width * scalingFactor}px`;
        canvas.style.height = `${scanRegion.height * scalingFactor}px`;
        canvas.style.display = "block";
      }
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
