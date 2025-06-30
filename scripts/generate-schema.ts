import { writeFileSync } from 'fs';

interface Field {
  name: string;
  type: string;
  optional?: boolean;
}

function toSnake(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const captionOptions: Field[] = [
  { name: 'font', type: 'string', optional: true },
  { name: 'fontPath', type: 'string', optional: true },
  { name: 'style', type: 'string', optional: true },
  { name: 'size', type: 'number', optional: true },
  { name: 'position', type: 'string', optional: true },
  { name: 'color', type: 'string', optional: true },
  { name: 'background', type: 'string', optional: true },
];

const generateParams: Field[] = [
  { name: 'file', type: 'string' },
  { name: 'output', type: 'string', optional: true },
  { name: 'captions', type: 'string', optional: true },
  { name: 'captionOptions', type: 'CaptionOptions', optional: true },
  { name: 'background', type: 'string', optional: true },
  { name: 'intro', type: 'string', optional: true },
  { name: 'outro', type: 'string', optional: true },
  { name: 'watermark', type: 'string', optional: true },
  { name: 'watermarkPosition', type: 'string', optional: true },
  { name: 'watermarkOpacity', type: 'f32', optional: true },
  { name: 'watermarkScale', type: 'f32', optional: true },
  { name: 'width', type: 'number', optional: true },
  { name: 'height', type: 'number', optional: true },
  { name: 'fps', type: 'number', optional: true },
  { name: 'title', type: 'string', optional: true },
  { name: 'description', type: 'string', optional: true },
  { name: 'tags', type: 'string[]', optional: true },
  { name: 'publishAt', type: 'string', optional: true },
  { name: 'thumbnail', type: 'string', optional: true },
  { name: 'privacy', type: 'string', optional: true },
  { name: 'playlistId', type: 'string', optional: true },
];

const profile: Field[] = generateParams.filter(
  (f) => f.name !== 'file' && f.name !== 'output',
);

function tsType(f: Field): string {
  if (f.type === 'f32') return 'number';
  return f.type;
}

function rustType(f: Field): string {
  const t = f.type;
  if (t === 'string') return 'String';
  if (t === 'number') return 'u32';
  if (t === 'f32') return 'f32';
  if (t === 'string[]') return 'Vec<String>';
  if (t === 'CaptionOptions') return 'CaptionOptions';
  return t;
}

function writeTs() {
  const lines: string[] = [];
  lines.push('export interface CaptionOptions {');
  for (const f of captionOptions) {
    lines.push(`  ${f.name}${f.optional ? '?' : ''}: ${tsType(f)};`);
  }
  lines.push('}\n');
  lines.push('export interface Profile {');
  for (const f of profile) {
    lines.push(`  ${f.name}${f.optional ? '?' : ''}: ${tsType(f)};`);
  }
  lines.push('}\n');
  lines.push('export interface GenerateParams {');
  for (const f of generateParams) {
    lines.push(`  ${f.name}${f.optional ? '?' : ''}: ${tsType(f)};`);
  }
  lines.push('}\n');
  writeFileSync('ytapp/src/schema.ts', lines.join('\n'));
}

function writeRust() {
  const lines: string[] = [];
  lines.push('use serde::{Deserialize, Serialize};');
  lines.push('');
  lines.push('#[derive(Serialize, Deserialize, Clone, Default)]');
  lines.push('pub struct CaptionOptions {');
  for (const f of captionOptions) {
    const field = toSnake(f.name);
    const attr = field === f.name ? '' : `    #[serde(rename = "${f.name}")]\n`;
    lines.push(`${attr}    pub ${field}: ${f.optional ? 'Option<' + rustType(f) + '>' : rustType(f)},`);
  }
  lines.push('}');
  lines.push('');
  lines.push('#[derive(Serialize, Deserialize, Clone, Default)]');
  lines.push('pub struct Profile {');
  for (const f of profile) {
    const field = toSnake(f.name);
    const attr = field === f.name ? '' : `    #[serde(rename = "${f.name}")]\n`;
    lines.push(`${attr}    pub ${field}: ${f.optional ? 'Option<' + rustType(f) + '>' : rustType(f)},`);
  }
  lines.push('}');
  lines.push('');
  lines.push('#[derive(Serialize, Deserialize, Clone)]');
  lines.push('pub struct GenerateParams {');
  for (const f of generateParams) {
    const field = toSnake(f.name);
    const attr = field === f.name ? '' : `    #[serde(rename = "${f.name}")]\n`;
    lines.push(`${attr}    pub ${field}: ${f.optional ? 'Option<' + rustType(f) + '>' : rustType(f)},`);
  }
  lines.push('}');
  writeFileSync('ytapp/src-tauri/src/schema.rs', lines.join('\n'));
}

writeTs();
writeRust();
console.log('Schema generated');
