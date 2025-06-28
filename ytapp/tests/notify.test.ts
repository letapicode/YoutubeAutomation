import assert from 'assert';
const notif = require('@tauri-apps/plugin-notification');

(async () => {
  let sent: any = undefined;
  notif.isPermissionGranted = async () => true;
  notif.requestPermission = async () => 'granted';
  notif.sendNotification = (opts: any) => { sent = opts; };
  (global as any).window = {};
  const { notify } = await import('../src/utils/notify');
  await notify('Title', 'Body');
  assert.deepStrictEqual(sent, { title: 'Title', body: 'Body' });
  console.log('notify via tauri passed');
})();

(async () => {
  let sent = false;
  let constructed: any = undefined;
  notif.isPermissionGranted = async () => false;
  notif.requestPermission = async () => 'denied';
  notif.sendNotification = () => { sent = true; };
  class FakeNotification {
    static permission = 'granted';
    static async requestPermission() { return 'granted'; }
    constructor(public title: string, public opts: any) {
      constructed = { title, opts };
    }
  }
  (global as any).window = { Notification: FakeNotification };
  const { notify } = await import('../src/utils/notify');
  await notify('Title', 'Body');
  assert.strictEqual(sent, false);
  assert.deepStrictEqual(constructed, { title: 'Title', opts: { body: 'Body' } });
  console.log('notify web fallback passed');
})();
