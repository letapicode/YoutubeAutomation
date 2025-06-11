/**
 * Translate an SRT subtitle file using Argos Translate.
 * The returned promise resolves with the path to the translated file.
 */
import { spawn } from 'child_process';

export function translateSrt(
  input: string,
  target: string,
  fromLang = 'en',
): Promise<string> {
  const output = input.replace(/\.srt$/, `.${target}.srt`);
  return new Promise((resolve, reject) => {
    const child = spawn('argos-translate', [
      '--input-file', input,
      '--output-file', output,
      '--from-lang', fromLang,
      '--to-lang', target,
    ]);
    child.on('exit', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error('translation failed'));
    });
  });
}
