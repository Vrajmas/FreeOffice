import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

function base64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    result += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(result);
}

export function installAndroidBridge() {
  if (Capacitor.getPlatform() !== 'android') return;
  window.desktop = {
    open: () => new Promise<OpenedFile | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = import.meta.env.VITE_APP_KIND === 'sheet' ? '.xlsx,.csv' : '.docx';
      input.onchange = async () => {
        const file = input.files?.[0];
        resolve(file ? { name: file.name, path: '', bytes: new Uint8Array(await file.arrayBuffer()) } : null);
      };
      input.oncancel = () => resolve(null);
      input.click();
    }),
    save: async ({ name, bytes }) => {
      const file = await Filesystem.writeFile({
        path: name, data: base64(bytes), directory: Directory.Cache,
      });
      await Share.share({ title: name, url: file.uri, dialogTitle: 'Save or share file' });
      return name;
    },
    onExternalOpen: () => () => {},
  };
}
