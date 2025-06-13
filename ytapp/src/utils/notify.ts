import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/api/notification';

/**
 * Display a desktop notification using the Tauri API.
 */
export async function notify(title: string, body: string) {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === 'granted';
  }
  if (granted) {
    sendNotification({ title, body });
  }
}

