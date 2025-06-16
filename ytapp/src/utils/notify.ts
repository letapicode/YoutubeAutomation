import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

/**
 * Display a desktop notification using the Tauri API.
 * Falls back to the Web Notification API if available.
 */
export async function notify(title: string, body: string) {
  let granted = await isPermissionGranted();
  if (!granted) {
    const result = await requestPermission();
    granted = result === 'granted';
  }
  if (granted) {
    sendNotification({ title, body });
    return;
  }

  // Fallback to the Web Notification API for non-Tauri environments
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}
