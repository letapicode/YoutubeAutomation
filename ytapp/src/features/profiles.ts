import { invoke } from '@tauri-apps/api/core';
import type { Profile } from '../schema';

export async function listProfiles(): Promise<string[]> {
  return await invoke('profile_list');
}

export async function getProfile(name: string): Promise<Profile> {
  return await invoke('profile_get', { name });
}

export async function saveProfile(name: string, profile: Profile): Promise<void> {
  await invoke('profile_save', { name, profile });
}

export async function deleteProfile(name: string): Promise<void> {
  await invoke('profile_delete', { name });
}
