import { Directory, File, Paths } from 'expo-file-system';
import { addDays, todayKey } from './dates';
import { clearOldPhotos, getSetting, setSetting } from './db';
import { deletePhoto } from './image';

/** Photos are kept for meals from the last week; older meals keep their data but lose the picture. */
export const PHOTO_KEEP_DAYS = 7;
/** Photo files not attached to any meal (e.g. an abandoned draft) are removed after this long. */
const ORPHAN_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const LAST_RUN_KEY = 'photo_cleanup_day';

/**
 * Delete photos of meals older than a week, plus stray photo files. Runs at most once a day,
 * on the first app start of that day. Returns how many photo files were deleted.
 */
export async function cleanupOldPhotosDaily(): Promise<number> {
  const today = todayKey();
  if ((await getSetting(LAST_RUN_KEY)) === today) return 0;

  const cutoff = addDays(today, -PHOTO_KEEP_DAYS);
  const { removed, kept } = await clearOldPhotos(cutoff);
  for (const uri of removed) deletePhoto(uri);

  let orphans = 0;
  const dir = new Directory(Paths.document, 'photos');
  if (dir.exists) {
    const fileName = (uri: string) => uri.split('/').pop();
    const keep = new Set(kept.map(fileName));
    const now = Date.now();
    for (const entry of dir.list()) {
      if (!(entry instanceof File) || keep.has(fileName(entry.uri))) continue;
      const modified = entry.info().modificationTime ?? now;
      if (now - modified > ORPHAN_MAX_AGE_MS) {
        deletePhoto(entry.uri);
        orphans++;
      }
    }
  }

  await setSetting(LAST_RUN_KEY, today);
  return removed.length + orphans;
}
