import { getState } from "./state";
/* eslint-disable @typescript-eslint/no-var-requires */
import QrScanner from "qr-scanner";

// Bundling as a blob with webpack didn't work so we get the worker code separately
QrScanner.WORKER_PATH = "/js/vendor/qr-scanner-worker.min.js";

// TODO
export function initQR(): void {
  const videoElement = <HTMLVideoElement>document.getElementById("qr-video");
  let state = getState();
  videoElement.addEventListener("loadeddata", () => {
    console.log("video is up");

    state.user.QRScannerIsDisplayed = true;

    console.log("w3 ", videoElement.videoWidth);
    console.log("h3 ", videoElement.videoHeight);

    setTimeout(() => {
      console.log("w4 ", videoElement.videoWidth);
      console.log("h4 ", videoElement.videoHeight);
    }, 2000);
  });

  const qrScanner = new QrScanner(
    videoElement,
    (result) => console.log("decoded qr code:", result),
    (error) => console.log("There was an error: ", error)
  );
  qrScanner.start();
}

// TODO

export function scanQRCode(callback: (stationId: string) => void): void {}

//const qr = QRScanner();

// export function initQR(): void {
//   const canvasElement = <HTMLCanvasElement>document.getElementById("qr-canvas");
//   (window as any).qr = {
//     video: document.createElement("video"),
//     canvasElement: canvasElement,
//     canvas: canvasElement.getContext("2d"),
//     scanning: false,
//   };
// }

// export function scanQRCode(callback: (stationId: string) => void): void {
//   // let state = getState(); // For debugging
//   const qr = (window as any).qr;
//   (window as any).qrcode.callback = callback;
//   navigator.mediaDevices
//     .getUserMedia({ video: { facingMode: "environment" } })
//     .then(function (stream) {
//       qr.scanning = true;
//       qr.canvasElement.hidden = false;
//       qr.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
//       qr.video.srcObject = stream;
//       qr.video.play();
//       tick();
//       scan();
//     });
// }

// function tick() {
//   const qr = (window as any).qr;
//   qr.canvasElement.height = qr.video.videoHeight;
//   qr.canvasElement.width = qr.video.videoWidth;
//   qr.canvas.drawImage(
//     qr.video,
//     0,
//     0,
//     qr.canvasElement.width,
//     qr.canvasElement.height
//   );
//   qr.scanning && requestAnimationFrame(tick);
// }

// function scan() {
//   try {
//     (window as any).qrcode.decode();
//   } catch (e) {
//     setTimeout(scan, 300);
//   }
// }
