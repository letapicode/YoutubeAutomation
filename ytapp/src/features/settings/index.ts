import { invoke } from '@tauri-apps/api/core';

export interface Settings {
    intro?: string;
    outro?: string;
    background?: string;
    captionFont?: string;
    captionFontPath?: string;
    captionStyle?: string;
    captionSize?: number;
    captionColor?: string;
    captionBg?: string;
    showGuide?: boolean;
}

export async function loadSettings(): Promise<Settings> {
    return await invoke('load_settings');
}

export async function saveSettings(settings: Settings): Promise<void> {
    await invoke('save_settings', { settings });
}
