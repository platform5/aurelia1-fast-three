import { ImageHelpers } from './../../../aurelia-resources';

export interface UxFileItem /*extends File*/ {
  name: string;
  filename? : string; // reference to the file ID stored in the file system, if any
  type: string; // mime-type
  previewData ? : string; // preview generated on upload, so that we can immediately display the image in the list
  toUpload?: boolean;
  previews?: {[key: string]: any};
  blobs?: {[key: string]: any};
  replaced?: Blob;
  index?: number;
}

export class FileUpload {

  static generatePreviews(files: Array<UxFileItem>, formats = ['320:320'], defaultPreviewFormat = '320:320', quality = 0.6) {
    let promises = [];
    promises.push(Promise.resolve());
    for (let file of files) {
      if (!file.previewData) {
        if (file.type === 'image/jpg' || file.type === 'image/jpeg' || file.type === 'image/gif' || file.type === 'image/png') {
          promises.push(FileUpload.generateImagePreviews(file, formats, defaultPreviewFormat, quality));
        } else if (file.type.substr(0, 6) === 'audio/') {
          // tslint:disable-next-line
          file.previewData = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='currentColor'><path d='M12 3v9.28a4.39 4.39 0 0 0-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z'></path></svg>";
        } else {
          //file.previewData = 'data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3v9.28a4.39 4.39 0 0 0-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"></path></svg>';
        }
      }
    }
    return Promise.all(promises);
  }

  static generateImagePreviews(file, formats = ['320:320'], defaultPreviewFormat = '320:320', quality = 0.6) {
    if (formats.length === 0) return Promise.resolve(file);
    if (!file.previews) file.previews = {};
    if (!file.blobs) file.blobs = {};

    const original = file.replaced ? file.replaced : file;

    return ImageHelpers.exifRotation(original).then((exifRotation) => {

      let promise = Promise.resolve();
      if (exifRotation > 2) {
          // we must rotate the original file
          promise = ImageHelpers.open(original).then((myimage) => {
              let angle = ImageHelpers.exifRotation2Degrees(exifRotation);
              myimage.rotate(angle);
              return myimage.toBlob();
          }).then((blob) => {
            original.fixedOrientationBlob = blob;
          });
      }

      promise.then(() => {
        return new Promise((resolve, reject) => {
          try {
            var reader = new FileReader();
            reader.onload = (e) => {
              let previewPromises = [];
              for (let format of formats) {
                let createPreview = (e: any): Promise<any> => {
                  return ImageHelpers.open((e as any).target.result).then((myimage) => {
                    myimage.exportQuality = quality;
                    myimage.mimetype = 'image/jpeg';
                    if (format.indexOf(':') !== -1) {
                      myimage.cover(
                        parseInt(format.split(':')[0], 10),
                        parseInt(format.split(':')[1], 10));
                      file.previews[format] = myimage.toDataUrl();
                      myimage.toBlob().then((blob) => {
                        file.blobs[format] = blob;
                      });
                    } else {
                      myimage.resize(parseInt(format, 10), ImageHelpers.AUTO);
                      myimage.toBlob().then((blob) => {
                        file.blobs[format] = blob;
                      });
                    }
                  });
                }
                previewPromises.push(createPreview(e));
              }
              Promise.all(previewPromises).then(() => {
                if (file.previews[defaultPreviewFormat]) {
                  file.previewData = file.previews[defaultPreviewFormat]
                } else {
                  file.previewData = file.previews[Object.keys(file.previews)[0]];
                }
                resolve(file);
              }).catch(reject);
            }
            let fileToRead = original.fixedOrientationBlob || original;
            reader.readAsDataURL((fileToRead as File));
          } catch (e) {
            console.error('catch', e);
            reject(e);
          }
        });
      });
      return promise;
    });
  }
}