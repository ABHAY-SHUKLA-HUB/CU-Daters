const LEGACY_KEY_MAPPINGS = [
  ['cudaters_users', 'seeudaters_users'],
  ['cudaters_chats', 'seeudaters_chats'],
  ['cudaters_reports', 'seeudaters_reports'],
  ['cudaters_activity_logs', 'seeudaters_activity_logs'],
  ['cudaters_current', 'seeudaters_current'],
  ['cu-daters_users', 'seeudaters_users'],
  ['cu-daters_chats', 'seeudaters_chats'],
  ['cu-daters_reports', 'seeudaters_reports'],
  ['cu-daters_activity_logs', 'seeudaters_activity_logs'],
  ['cu-daters_current', 'seeudaters_current'],
];

const MIGRATION_FLAG = 'seeudaters_storage_migrated_v1';

export function migrateLegacyLocalStorageKeys() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  const alreadyMigrated = window.localStorage.getItem(MIGRATION_FLAG) === 'true';
  if (alreadyMigrated) {
    return;
  }

  for (const [legacyKey, newKey] of LEGACY_KEY_MAPPINGS) {
    const legacyValue = window.localStorage.getItem(legacyKey);
    const currentValue = window.localStorage.getItem(newKey);

    if (legacyValue !== null && (currentValue === null || currentValue === '')) {
      window.localStorage.setItem(newKey, legacyValue);
    }
  }

  window.localStorage.setItem(MIGRATION_FLAG, 'true');
}
