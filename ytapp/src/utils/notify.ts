export async function notify(title: string, body: string) {
  // Attempt to use the Web Notification API.
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
      return;
    }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body });
      }
    }
  }
}

