import { readdirSync } from 'fs';
import path from 'path';

(async () => {
  const files = readdirSync(__dirname)
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
