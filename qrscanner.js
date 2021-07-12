window.initQR = function () {
  let canvasElement = document.getElementById("qr-canvas");
  window.qr = {
    video: document.createElement("video"),
    canvasElement: canvasElement,
    canvas: canvasElement.getContext("2d"),
    scanning: false,
  };
};

window.scanQRCode = function (callback) {
  let qr = window.qr;
  window.qrcode.callback = callback;
  navigator.mediaDevices
    .getUserMedia({ video: { facingMode: "environment" } })
    .then(function (stream) {
      qr.scanning = true;
      qr.canvasElement.hidden = false;
      qr.video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
      qr.video.srcObject = stream;
      qr.video.play();
      tick();
      scan();
    });
};

function tick() {
  qr.canvasElement.height = qr.video.videoHeight;
  qr.canvasElement.width = qr.video.videoWidth;
  qr.canvas.drawImage(
    qr.video,
    0,
    0,
    qr.canvasElement.width,
    qr.canvasElement.height
  );
  qr.scanning && requestAnimationFrame(tick);
}

function scan() {
  try {
    qrcode.decode();
  } catch (e) {
    setTimeout(scan, 300);
  }
}
