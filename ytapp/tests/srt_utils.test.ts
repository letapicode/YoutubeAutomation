import assert from 'assert';
import { parseTime, formatTime } from '../src/utils/srt';

(async () => {
  // parseTime tests
  assert.strictEqual(parseTime('00:00:00,000'), 0);
  assert.strictEqual(parseTime('00:00:01,500'), 1500);
  assert.strictEqual(parseTime('01:02:03,004'), 3723004);
  assert.strictEqual(parseTime('not a time'), 0);

  // formatTime tests
  assert.strictEqual(formatTime(0), '00:00:00,000');
  assert.strictEqual(formatTime(1500), '00:00:01,500');
  assert.strictEqual(formatTime(3723004), '01:02:03,004');
  assert.strictEqual(formatTime(-1000), '00:00:00,000');

  console.log('srt utils tests passed');
})();
