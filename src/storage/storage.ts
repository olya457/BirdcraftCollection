import AsyncStorage from '@react-native-async-storage/async-storage';

export type Note = {
  id: string;
  title: string;        
  location?: string;
  tag?: string;         
  dateISO: string;
  photoUri?: string;    
  birdKey?: string;      
};

export type Collection = {
  id: string;
  title: string;
  tag: string;
  coverUri?: string;   
  coverKey?: string;     
  createdAtISO: string;
  notes: Note[];
  pinned?: boolean;    
};

export const COLLECTIONS_KEY = 'bird_collections_v2';
export const RESET_TICK_KEY = 'bird_reset_tick_v1';
export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export function formatShortDate(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export async function loadCollections(): Promise<Collection[]> {
  const raw = await AsyncStorage.getItem(COLLECTIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Collection[];
  } catch {
    return [];
  }
}

export async function saveCollections(list: Collection[]) {
  await AsyncStorage.setItem(COLLECTIONS_KEY, JSON.stringify(list));
}

export async function resetAllData(): Promise<void> {
  await AsyncStorage.removeItem(COLLECTIONS_KEY);
  const raw = await AsyncStorage.getItem(RESET_TICK_KEY);
  const current = raw ? Number(raw) || 0 : 0;
  await AsyncStorage.setItem(RESET_TICK_KEY, String(current + 1));
}

export async function getResetTick(): Promise<number> {
  const raw = await AsyncStorage.getItem(RESET_TICK_KEY);
  return raw ? Number(raw) || 0 : 0;
}
