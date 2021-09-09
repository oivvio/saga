import { defineComponent } from "vue";

// rxjs docs says that this is the way but it does not work.
// So we pinned rxjs to an older version (6.6.7) to get it to work
import { Subject } from "rxjs";
import { distinctUntilKeyChanged, filter, tap } from "rxjs/operators";

import QrScanner from "qr-scanner";

import { store, Mutations } from "../../store";
import { log, getLastUrlSegment } from "../../utils";
import { runStation } from "../../engine";

interface IScanRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  downScaledWidth: number;
  downScaledHeight: number;
}

interface IDecodeSubjectValue {
  codeContent: string;
  canvas: HTMLCanvasElement;
  // component: any;
}
// // Bundling as a blob with webpack didn't work so we get the worker code separately
// QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";

// TODO, make this not be sprickan specific.
QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";

// export default defineComponent({
const Component = defineComponent({
  name: "SagaQrReader",

  data() {
    return {
      loading: true,
      result: "",
      error: "",
      //onDecodeSubject: new Subject<[string, HTMLCanvasElement]>(),
      onDecodeSubject: new Subject<IDecodeSubjectValue>(),
    };
  },

  setup(props) {
    console.log("props: ", props);
  },

  // Most setup happens here where we have access to this
  mounted() {
    console.log("on mounted");

    // Get the video element
    const videoElement = <HTMLVideoElement>document.getElementById("qrvideo");

    // Setup the scanner

    let qrScanner: QrScanner | null = new QrScanner(
      videoElement,
      (codeContent) => {
        const canvas = <HTMLCanvasElement>document.getElementById("qrcanvas");

        if (canvas) {
          this.onDecodeSubject.next({ codeContent, canvas });
        }
      }

      // (error) => {
      //   const canvas = document.getElementById("qrcanvas");
      // }
    );

    // Start the scanner
    qrScanner.start();

    // Wait for the scanner to get ready
    // events canplay, playing and canplaythrough works in firefox desktop
    // on google chrome durationchange and loadedmetadata
    videoElement.addEventListener("canplay", () => {
      this.loading = false;
      const videoNominalWidth = videoElement.videoWidth;
      const actualWidth = videoElement.offsetWidth;
      const scalingFactor = actualWidth / videoNominalWidth;

      // eslint-disable-next-line
      const scanRegion = (qrScanner as any)._scanRegion as IScanRegion;

      // position the scanRegion marker
      const canvas = document.getElementById("qrcanvas");
      if (canvas) {
        canvas.style.left = `${scanRegion.x * scalingFactor}px`;
        canvas.style.top = `${scanRegion.y * scalingFactor}px`;
        canvas.style.width = `${scanRegion.width * scalingFactor}px`;
        canvas.style.height = `${scanRegion.height * scalingFactor}px`;
        canvas.style.display = "block";
      }
    });

    // capture these methods so we can use them in the rx pipeline
    const qrCodeIsValid = this.qrCodeIsValid;
    const getStationId = this.getStationId;

    // Setup our RxJS listener
    this.onDecodeSubject
      // only process when the code changes
      .pipe(distinctUntilKeyChanged("codeContent"))

      // filter out codes that are not valid
      .pipe(filter((value) => qrCodeIsValid(value.codeContent)))

      // process what is left
      .subscribe({
        next: (value: IDecodeSubjectValue) => {
          // make the scanRegion marker green
          value.canvas.style.backgroundColor = "green";

          // Hide the QR reader
          store.commit(Mutations.hideQRScanner);

          // Hide the option to start the QR reader
          store.commit(Mutations.hideButtonToOpenQRScanner);

          // Get the stationId
          const stationId = getStationId(value.codeContent);

          // feed the stationId to our engine
          if (stationId) {
            // remove the video/qrScanner
            if (qrScanner !== null) {
              qrScanner.destroy();
              qrScanner = null;
            }
            runStation(stationId);
          }
        },
      });
  },

  // unmounted() {
  //   console.log("RADAC");
  // },

  methods: {
    // Extract stationId from the raw contents of a scanned qr code
    getStationId(codeContent: string): string | undefined {
      const baseUrl = this.$store.state.gameConfig?.baseUrl;

      // Basic assumption is that there is no stationId in the qr code
      let result = undefined;

      if (baseUrl && codeContent.startsWith(baseUrl)) {
        //Now extract the stationId
        result = getLastUrlSegment(new URL(codeContent));
      }
      return result;
    },

    // Pass content of scanned qrcode.
    // Returns true if qrcode expresss valid stationId in current game
    qrCodeIsValid(codeContent: string): boolean {
      // Basic assumption is that qr code is not valid
      let result = false;

      const stationId = this.getStationId(codeContent);
      const stations = this.$store.state.gameConfig?.stations;

      // Check that station id is in current game
      if (stations && stationId && stationId in stations) {
        result = true;
      }
      return result;
    },

    // onInit() {
    //   console.log("in onInit");
    // },
  },
});

export default Component;
