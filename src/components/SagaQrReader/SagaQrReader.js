import { defineComponent } from "vue";
import QrScanner from "qr-scanner";
// Bundling as a blob with webpack didn't work so we get the worker code separately
// QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";
// TODO, make this not be sprickan specific.
QrScanner.WORKER_PATH = "/sprickan/js/vendor/qr-scanner-worker.min.js";
export default defineComponent({
    name: "SagaQrReader",
    data() {
        return {
            result: "",
            error: "",
            foo: "bar",
        };
    },
    setup(props) {
        console.log("props: ", props);
    },
    mounted() {
        console.log("on mounted");
        const videoElement = document.getElementById("qrvideo");
        // events canplay, playing and canplaythrough works in firefox desktop
        // on google chrome durationchange and loadedmetadata
        //eventNames.forEach((eventName) => {
        const qrScanner = new QrScanner(videoElement, (result) => {
            console.log("decoded qr code:", result);
            const canvas = document.getElementById("qrcanvas");
            if (canvas) {
                canvas.style.backgroundColor = "green";
            }
        }, (error) => {
            const canvas = document.getElementById("qrcanvas");
            if (canvas) {
                canvas.style.backgroundColor = "red";
            }
        });
        qrScanner.start();
        //
        videoElement.addEventListener("canplay", () => {
            const videoNominalWidth = videoElement.videoWidth;
            const actualWidth = videoElement.offsetWidth;
            const scalingFactor = actualWidth / videoNominalWidth;
            window.qrScanner = qrScanner;
            const scanRegion = qrScanner._scanRegion;
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
        onDecode(result) {
            console.log(result);
            // this.result = result;
        },
        onInit() {
            console.log("in onInit");
        },
    },
});
//# sourceMappingURL=SagaQrReader.js.map