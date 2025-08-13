import { readTextFile } from '@tauri-apps/plugin-fs';

export interface CsvRow {
  file: string;
  title?: string;
  description?: string;
  tags?: string[];
  publishAt?: string;
}

// Split a CSV row while handling quoted fields.
function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

/**
 * Read a CSV file mapping file paths to metadata.
 * Expected columns: file,title,description,tags,publish_at.
 */
export async function parseCsv(path: string): Promise<CsvRow[]> {
  const data = await readTextFile(path);
  const lines = data.split(/\r?\n/).filter((l: string) => l.trim().length);
  if (!lines.length) return [];
  const header = parseLine(lines[0]).map(h => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const file = cols[idx('file')]?.trim();
    if (!file) continue;
    const row: CsvRow = { file };
    const t = idx('title');
    if (t >= 0 && cols[t]) row.title = cols[t];
    const d = idx('description');
    if (d >= 0 && cols[d]) row.description = cols[d];
    const tg = idx('tags');
    if (tg >= 0 && cols[tg]) {
      row.tags = cols[tg].split(',').map(s => s.trim()).filter(Boolean);
    }
    const p = idx('publish_at');
    if (p >= 0 && cols[p]) row.publishAt = cols[p];
    rows.push(row);
  }
  return rows;
}
