
import { getLogger, Logger } from 'aurelia-logging';
let log: Logger;
log = getLogger('helpers:image');

export class ImageHelpers {

  static AUTO: 'auto';

  image: HTMLImageElement;
  mimetype: string = 'image/png';
  imageAsCanvas: HTMLCanvasElement;
  exportQuality = 0.6;

  static open(file: File | Blob | string): Promise<ImageHelpers> {
    let promise;
    if (typeof file === 'string') {
      if (file.indexOf('data:image/') === 0) {
        promise = ImageHelpers.openB64(file);
      } else {
        promise = ImageHelpers.openFileUrl(file);
      }
    } else if (file instanceof File || file instanceof Blob) {
      promise = ImageHelpers.openFile(file);
    } else {
      promise = Promise.reject('Invalid file');
    }
    return promise.then((instance: ImageHelpers) => {
      let ctx = instance.createCtx(null, null);
      ctx.drawImage(instance.image, 0, 0);
      instance.imageAsCanvas = ctx.canvas;
      return instance;
    });
  }

  static openB64(src: string): Promise<ImageHelpers> {
    return new Promise((resolve, reject) => {
      let instance = new ImageHelpers();
      instance.image = new Image();
      instance.image.onload = () => {
        resolve(instance);
      }
      instance.mimetype = ImageHelpers.mimetypeFromB64(src);
      if (instance.mimetype === null) {
        return reject(new Error('Undetectable mimetype'));
      }
      instance.image.src = src;
    });
  }

  static openFile(file: File | Blob): Promise<ImageHelpers> {
    return new Promise((resolve, reject) => {
      try {
        
        var reader = new FileReader();
        reader.onload = (e) => {
          let src = (e as any).target.result;
          let instance = new ImageHelpers();
          instance.image = new Image();
          instance.image.onload = () => {
            ImageHelpers.mimetypeFromFile(file).then((mimetype) => {
              if (mimetype === null) return reject(new Error('Undetectable mimetype'));
              resolve(instance);
            });
          }
          instance.image.src = src;
        }
        reader.readAsDataURL(file);
      } catch (e) {
        reject(e);
      }
    });
  }

  static openFileUrl(url: string): Promise<ImageHelpers> {
    return Promise.reject('Not yet implemented');
  }

  static mimetypeFromB64(src: string): string|null {
    let match = src.match(/(.*)image\/([a-z]{3,4})(.*)/);
    if (match) {
      return 'image/' + match[2];
    } else {
      return null;
    }
  }

  static mimetypeFromFile(file: File | Blob): Promise<string|null> {
    return new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.onload = (e) => {
        let type = '';
        let dv = new DataView((e.target as any).result);
        let nume1 = dv.getUint8(0);
        let nume2 = dv.getUint8(1);
        var hex = nume1.toString(16) + nume2.toString(16) ;
  
        switch (hex){
          case '8950':
            type = 'image/png';
            break;
          case '4749':
            type = 'image/gif';
            break;
          case '424d':
            type = 'image/bmp';
            break;
          case 'ffd8':
            type = 'image/jpeg';
            break;
          default:
            type = null;
            break;
        }
        resolve(type);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  static exifRotation(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      var reader = new FileReader();
        reader.onload = (e) => {
  
        var view = new DataView((e.target as any).result);
        if (view.getUint16(0, false) != 0xFFD8)
        {
            return resolve(-2);
        }
        var length = view.byteLength, offset = 2;
        while (offset < length) 
        {
            if (view.getUint16(offset + 2, false) <= 8) return resolve(-1);
            var marker = view.getUint16(offset, false);
            offset += 2;
            if (marker == 0xFFE1) 
            {
                if (view.getUint32(offset += 2, false) != 0x45786966) 
                {
                    return resolve(-1);
                }

                var little = view.getUint16(offset += 6, false) == 0x4949;
                offset += view.getUint32(offset + 4, little);
                var tags = view.getUint16(offset, little);
                offset += 2;
                for (var i = 0; i < tags; i++)
                {
                    if (view.getUint16(offset + (i * 12), little) == 0x0112)
                    {
                        return resolve(view.getUint16(offset + (i * 12) + 8, little));
                    }
                }
            }
            else if ((marker & 0xFF00) != 0xFF00)
            {
                break;
            }
            else
            { 
                offset += view.getUint16(offset, false);
            }
        }
        return resolve(-1);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  static exifRotation2Degrees(rotation: number): number {
    switch (rotation) {
        case 1: return 0;
        case 2: return 0;
        case 3: return -180;
        case 4: return -180;
        case 5: return 90;
        case 6: return 90;
        case 7: return -90;
        case 8: return -90;
        default: return 0;
    }
  }

  createCtx(width: number | null, height: number | null): CanvasRenderingContext2D {
    if (width === null) width = this.image.width;
    if (height === null) height = this.image.height;
    let canvas = (document.createElement(`canvas`) as HTMLCanvasElement);
    canvas.setAttribute('width', width.toString());
    canvas.setAttribute('height', height.toString());
    var ctx = canvas.getContext('2d');
    if (this.mimetype === 'image/jpeg' || this.mimetype === 'image/jpg') {
        ctx.fillStyle = 'rgb(255, 255, 255)';
        ctx.fillRect(0, 0, width, height);
    }
    (ctx as any).imageSmoothingEnabled = true;
    (ctx as any).imageSmoothingQuality = 'high';
    return ctx;
  }

  cover(width, height) {
    if (!this.imageAsCanvas || !this.imageAsCanvas.width || !this.imageAsCanvas.height) throw new Error('Image not ready for cover');
    let originalRatio = this.imageAsCanvas.width / this.imageAsCanvas.height;
    let finalRatio = width / height;
    let ctx = this.createCtx(width, height);
    let x = 0;
    let y = 0;
    let sx = 0;
    let sy = 0;
    let swidth = 0;
    let sheight = 0;

    if (originalRatio === finalRatio) {
      // only resize
      swidth = this.imageAsCanvas.width;
      sheight = this.imageAsCanvas.height;
    } else if (originalRatio > finalRatio) {
      // keep height, crop width
      sheight = this.imageAsCanvas.height;
      swidth = width * this.imageAsCanvas.height / height;
      sx = (this.imageAsCanvas.width - swidth) / 2;
    } else {
      // keep width, crop height
      swidth = this.imageAsCanvas.width;
      sheight = height * this.imageAsCanvas.width / width;
      sy = (this.imageAsCanvas.height - sheight) / 2;
    }

    /*this.imageAsCanvas.width = width;
    this.imageAsCanvas.height = height;*/
    ctx.drawImage(this.imageAsCanvas, sx, sy, swidth, sheight, x, y, width, height);
    this.imageAsCanvas = ctx.canvas;
  }

  resize(width, height) {
    if (!this.imageAsCanvas || !this.imageAsCanvas.width || !this.imageAsCanvas.height) throw new Error('Image not ready for resize');
    if (width === ImageHelpers.AUTO && height === ImageHelpers.AUTO) {
      throw new Error('Width and height cannot be AUTO together');
    }
    if (height === ImageHelpers.AUTO) {
      height = width / this.imageAsCanvas.width * this.imageAsCanvas.height;
    }
    if (width === ImageHelpers.AUTO) {
      width = height / this.imageAsCanvas.height * this.imageAsCanvas.width;
    }
    return this.cover(width, height);
  }

  rotate(angle: number) {
    if (angle === 0) return;
    if (!this.imageAsCanvas || !this.imageAsCanvas.width || !this.imageAsCanvas.height) throw new Error('Image not ready for cover');
    // only accept 90° rotations
    let mod = Math.abs(angle % 90);
    if (mod !== 0) throw new Error('Rotation can only be performed for 90° multiples');
    let flip = false; //(angle % 180 !== 0);
    let width = flip ? this.imageAsCanvas.height : this.imageAsCanvas.width;
    let height = flip ? this.imageAsCanvas.width : this.imageAsCanvas.height;

    let ctx = this.createCtx(width, height);
    ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.rotate(angle / 180 * Math.PI);
    ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
    ctx.drawImage(this.imageAsCanvas, 0, 0);
    this.imageAsCanvas = ctx.canvas;
  }

  toDataUrl(): string {
    let dataUrl = this.imageAsCanvas.toDataURL(this.mimetype, this.exportQuality);
    return dataUrl;
  }

  toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
        this.imageAsCanvas.toBlob((blob) => {
            resolve(blob);
        }, this.mimetype, this.exportQuality);
    });

  }
}
