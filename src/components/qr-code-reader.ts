import { bindingMode, bindable, customElement } from 'aurelia-framework';
import { Global } from '../global';
import jsQR, { QRCode } from 'jsqr'
import { Point } from 'jsqr/dist/locator'

@customElement('qr-code-reader')
export class QrCodeReader {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) public codedata: string;
  @bindable public validate: (params: IValidateParams) => Promise<boolean>;
  private startScanning: boolean = false;
  public hasVideoAccess: boolean = true;
  public hasQrCodeFound: boolean = false;
  public qrValid: boolean = false;
  private canvasElement: HTMLCanvasElement;
  private canvasContext: CanvasRenderingContext2D | null;
  private video: HTMLVideoElement;
  private reqAnim: any;
  private lastCodeData: string = undefined;

  constructor(public global: Global) {

  }
  
  public async attached () {
    this.initQrReader()
  }
  public async detached () {
      this.disableCamera()
  }

  public startQrReader() {
    this.startScanningUpdate(true);
  }
  public StopQrReader() {
    this.startScanningUpdate(false);
  }
  
  startScanningUpdate(newValue) {
    if (newValue) { 
      this.startScanning = true;
      this.reqAnim = requestAnimationFrame(this.drawVideoFrame.bind(this));
    } else {
      this.startScanning = false;
      window.cancelAnimationFrame(this.reqAnim);
    }
  }

  private initQrReader () {
    this.hasVideoAccess = true
    this.hasQrCodeFound = false
    this.canvasElement = document.getElementById('qr-reader-canvas') as HTMLCanvasElement
    this.canvasContext = this.canvasElement.getContext('2d')
    if (this.canvasContext && navigator.mediaDevices) {
      this.video = document.createElement('video')
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(async (stream: MediaStream) => {
          this.video.srcObject = stream
          // no full screen for iOS
          this.video.setAttribute('playsinline', 'true')
          await this.video.play()
          this.video.playbackRate = 0.5
          this.reqAnim = requestAnimationFrame(this.drawVideoFrame.bind(this))
        }).catch(async () => {
          this.hasVideoAccess = false
        })
    } else {
      this.hasVideoAccess = false
    }
  }
  private drawLine (begin: Point, end: Point, color: string): void {
    if (this.canvasContext) {
      this.canvasContext.beginPath()
      this.canvasContext.moveTo(begin.x, begin.y)
      this.canvasContext.lineTo(end.x, end.y)
      this.canvasContext.lineWidth = 3
      this.canvasContext.strokeStyle = color
      this.canvasContext.stroke()
    }
  }
  private drawVideoFrame (): void {
    if (!this.canvasContext) {
      // we can't draw video frame
      return
    }
    if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
      // draw video frame from camera and mark found QR code in frame
      this.canvasElement.height = this.video.videoHeight
      this.canvasElement.width = this.video.videoWidth
      this.canvasContext.drawImage(this.video, 0, 0, this.canvasElement.width, this.canvasElement.height)
      const imageData: ImageData = this.canvasContext.getImageData(0, 0,
        this.canvasElement.width, this.canvasElement.height)
      const code: QRCode | null = jsQR(imageData.data, imageData.width, imageData.height)
      if (code) {
        if (this.lastCodeData != code.data) { // check if already scanned
          // draw rectangle around found code in video frame
          const color = this.qrValid ? '#409e26' : '#FF3B58'
          this.drawLine(code.location.topLeftCorner, code.location.topRightCorner, color)
          this.drawLine(code.location.topRightCorner, code.location.bottomRightCorner, color)
          this.drawLine(code.location.bottomRightCorner, code.location.bottomLeftCorner, color)
          this.drawLine(code.location.bottomLeftCorner, code.location.topLeftCorner, color)
          // QR code found
          this.codedata = code.data;
          this.lastCodeData = code.data;
          this.hasQrCodeFound = true;
          this.validate({ data: this.codedata }).then(async (result: boolean) => {
              this.qrValid = result
              this.startScanning = false;
              // this.qrValid = true;
          }).catch(() => undefined)
            // if (this.codedata){
            //   this.qrValid = true;
            // }
        } else {
          setTimeout(() => {
            this.lastCodeData = undefined;
            // this.codedata = '';
          }, 10000);
        }
      } else {
        // no QR code found
        this.hasQrCodeFound = false
        this.codedata = ''
      }
    }

    if (this.startScanning) {
      setTimeout(() => {
        console.log('qrDataChanged');
        this.reqAnim = requestAnimationFrame(this.drawVideoFrame.bind(this))
      }, 50);
    }

  }

  disableCamera() {
    if (this.video) {
      window.cancelAnimationFrame(this.reqAnim);
      this.video.pause()
      this.video.src = ''
      const stream = this.video.srcObject as any;
      const tracks = stream.getTracks();
      tracks.forEach(function(track) {
      track.stop();
      });
      this.video.srcObject = null;
    }
  }

}

interface IValidateParams {
  data: string
}
