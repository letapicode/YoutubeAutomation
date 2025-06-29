import { readdirSync } from 'fs';
import path from 'path';

(async () => {
  const files = [...new Set([
    ...readdirSync(__dirname),
    'notify.test.ts',
    'cli_generate_cancel.test.ts',
    'cli_upload_cancel.test.ts',
  ])]
    .filter(f => f.endsWith('.test.ts'))
    .sort();
  for (const f of files) {
    try {
      await import(path.join(__dirname, f));
    } catch (err) {
      console.error(err);
    }
  }
})();
