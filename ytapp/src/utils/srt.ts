export function parseTime(time: string): number {
  const m = time.match(/(\d+):(\d+):(\d+),(\d+)/);
  if (!m) return 0;
  const [, h, mnt, s, ms] = m;
  return (
    parseInt(h, 10) * 3600000 +
    parseInt(mnt, 10) * 60000 +
    parseInt(s, 10) * 1000 +
    parseInt(ms, 10)
  );
}

export function formatTime(ms: number): string {
  if (ms < 0) ms = 0;
  const h = Math.floor(ms / 3600000);
  ms %= 3600000;
  const mnt = Math.floor(ms / 60000);
  ms %= 60000;
  const s = Math.floor(ms / 1000);
  const msec = ms % 1000;
  return (
    String(h).padStart(2, '0') +
    ':' +
    String(mnt).padStart(2, '0') +
    ':' +
    String(s).padStart(2, '0') +
    ',' +
    String(msec).padStart(3, '0')
  );
}

/**
 * Shift all timestamps in an SRT file by the given offset in seconds.
 * Returns the path to the output file.
 */
export async function shiftSrt(
  input: string,
  offset: number,
  output?: string
): Promise<string> {
  const fs = await import('fs/promises');
  const data = await fs.readFile(input, 'utf-8');
  const lines = data.split(/\r?\n/);
  const re = /(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/;
  const outLines = lines.map((l) => {
    const m = l.match(re);
    if (!m) return l;
    const start = parseTime(m[1]) + offset * 1000;
    const end = parseTime(m[2]) + offset * 1000;
    return formatTime(start) + ' --> ' + formatTime(end);
  });
  const dest = output || input;
  await fs.writeFile(dest, outLines.join('\n'));
  return dest;
}
