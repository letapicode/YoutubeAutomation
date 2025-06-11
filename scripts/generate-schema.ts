import { promises as fs } from 'fs';
import path from 'path';

interface Field { name: string; ts: string; rs: string; optional?: boolean; }

const fields: Field[] = [
  { name: 'file', ts: 'string', rs: 'String' },
  { name: 'output', ts: 'string', rs: 'String', optional: true },
  { name: 'captions', ts: 'string', rs: 'String', optional: true },
  { name: 'captionOptions', ts: 'CaptionOptions', rs: 'CaptionOptions', optional: true },
  { name: 'background', ts: 'string', rs: 'String', optional: true },
  { name: 'intro', ts: 'string', rs: 'String', optional: true },
  { name: 'outro', ts: 'string', rs: 'String', optional: true },
  { name: 'watermark', ts: 'string', rs: 'String', optional: true },
  { name: 'watermarkPosition', ts: "'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'", rs: 'String', optional: true },
  { name: 'width', ts: 'number', rs: 'u32', optional: true },
  { name: 'height', ts: 'number', rs: 'u32', optional: true },
  { name: 'title', ts: 'string', rs: 'String', optional: true },
  { name: 'description', ts: 'string', rs: 'String', optional: true },
  { name: 'tags', ts: 'string[]', rs: 'Vec<String>', optional: true },
  { name: 'publishAt', ts: 'string', rs: 'String', optional: true },
];

function camelToSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

async function generateTs(outDir: string) {
  const lines = [
    "import { CaptionOptions } from '../features/processing';",
    '',
    'export interface GenerateParams {'
  ];
  for (const f of fields) {
    lines.push(`  ${f.name}${f.optional ? '?' : ''}: ${f.ts};`);
  }
  lines.push('}');
  lines.push('');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'generateParams.ts'), lines.join('\n'));
}

async function generateRs(outPath: string) {
  const lines = [
    'use serde::Deserialize;',
    '',
    '#[derive(Deserialize, Clone)]',
    '#[serde(rename_all = "camelCase")]',
    'pub struct GenerateParams {',
  ];
  for (const f of fields) {
    const name = camelToSnake(f.name);
    const ty = f.optional ? `Option<${f.rs}>` : f.rs;
    lines.push(`    pub ${name}: ${ty},`);
  }
  lines.push('}');
  lines.push('');
  await fs.writeFile(outPath, lines.join('\n'));
}

async function main() {
  const tsDir = path.join(__dirname, '../ytapp/src/types');
  const rsPath = path.join(__dirname, '../ytapp/src-tauri/src/schema.rs');
  await generateTs(tsDir);
  await generateRs(rsPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
