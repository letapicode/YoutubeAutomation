import assert from 'assert';
import fs from 'fs/promises';
import { parseCsv } from '../src/utils/csv';

(async () => {
  const path = '/tmp/test.csv';
  await fs.writeFile(path, 'file,title,description,tags,publish_at\na.mp4,Title A,Desc,"t1,t2",2024-01-01T00:00:00Z\n');
  const rows = await parseCsv(path);
  assert.strictEqual(rows.length, 1);
  assert.strictEqual(rows[0].file, 'a.mp4');
  assert.deepStrictEqual(rows[0].tags, ['t1', 't2']);
  console.log('csv parser tests passed');
})();
