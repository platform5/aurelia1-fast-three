function addTargetInfo(target: any, infoName: string, key: string | number | symbol) {
  if (!target[`_${infoName}`]) target[`_${infoName}`] = [];
  target[`_${infoName}`].push(key);
}

export const fromApiOnly = <T>(target: T, key: keyof T, descriptor?: PropertyDescriptor): void | any => {
  if (descriptor) descriptor.writable = true;
  addTargetInfo(target, 'fromApiOnly', key);
  if (descriptor) return descriptor;
}