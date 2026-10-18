import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllMeals, getAllWeights, getProfile, saveMeal, saveProfile, saveWeight } from './db';
import { todayKey } from './dates';
import type { Meal, Profile, WeightEntry } from './types';

interface BackupFile {
  app: 'calmon' | 'bentometer';
  version: 1;
  exportedAt: string;
  profile: Profile | null;
  meals: Meal[];
  /** Added with the Stats tab; older backups don't have it. */
  weights?: WeightEntry[];
}

/** Write all data to a JSON file and open the share sheet. Photos are not included. */
export async function exportBackup(): Promise<number> {
  const data: BackupFile = {
    app: 'calmon',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await getProfile(),
    meals: (await getAllMeals()).map((m) => ({ ...m, photoUri: null })),
    weights: await getAllWeights(),
  };
  const file = new File(Paths.cache, `calmon-${todayKey()}.json`);
  file.create({ overwrite: true });
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Save CalMon backup' });
  return data.meals.length;
}

/** Merge meals from a backup file (same ids are overwritten). Returns the number imported, or null if cancelled. */
export async function importBackup(): Promise<number | null> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/*', '*/*'], copyToCacheDirectory: true });
  if (res.canceled || !res.assets?.[0]) return null;
  const text = await new File(res.assets[0].uri).text();
  const data = JSON.parse(text) as BackupFile;
  // Backups made before the rename to CalMon are tagged 'bentometer'.
  if ((data.app !== 'calmon' && data.app !== 'bentometer') || !Array.isArray(data.meals))
    throw new Error('This is not a CalMon backup file.');
  if (data.profile) await saveProfile(data.profile);
  for (const m of data.meals) await saveMeal({ ...m, photoUri: null });
  for (const w of data.weights ?? []) await saveWeight(w);
  return data.meals.length;
}
