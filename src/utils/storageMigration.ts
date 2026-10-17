import AsyncStorage from '@react-native-async-storage/async-storage';

export async function migrateStorageKeys(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const kamraKeys = keys.filter((k) => k.toLowerCase().startsWith('kamra.') || k.toLowerCase().startsWith('kamra-'));
    for (const oldKey of kamraKeys) {
      const newKey = oldKey.replace(/^kamra[.-]/i, 'mychat.');
      const val = await AsyncStorage.getItem(oldKey);
      if (val !== null) {
        const existing = await AsyncStorage.getItem(newKey);
        if (existing === null) {
          await AsyncStorage.setItem(newKey, val);
        }
        await AsyncStorage.removeItem(oldKey);
      }
    }
  } catch (e) {
    console.warn('Storage migration error:', e);
  }
}
