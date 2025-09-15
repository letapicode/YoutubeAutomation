/**
 * Translate an SRT subtitle file using Argos Translate.
 * The returned promise resolves with the path to the translated file.
 */
// Running external binaries from the Tauri WebView must go through the process plugin
import { Command } from '@tauri-apps/plugin-shell';

export async function translateSrt(
  input: string,
  target: string,
  fromLang: string = 'en',
): Promise<string> {
  const output = input.replace(/\.srt$/, `.${target}.srt`);

  // Spawn the external Argos Translate process
  const command = new Command('argos-translate', [
    '--input-file',
    input,
    '--output-file',
    output,
    '--from-lang',
    fromLang,
    '--to-lang',
    target,
  ]);

  const result = await command.execute();

  if (result.code === 0) {
    return output;
  } else {
    throw new Error(`translation failed with code ${result.code}: ${result.stderr}`);
  }
}
