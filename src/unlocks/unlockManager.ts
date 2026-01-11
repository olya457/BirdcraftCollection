import AsyncStorage from '@react-native-async-storage/async-storage';

export type UnlockKey =
  | 'FIRST_BIRD_LOGGED'
  | 'FIRST_QUIZ_DONE'
  | 'FIVE_IN_ONE_NEST'
  | 'PERFECT_10_10'
  | 'FIVE_COLLECTIONS_FILLED'
  | 'THREE_BIRDS_STARTED'
  | 'ONE_PHOTO_ADDED'
  | 'ONE_LOCATION_PINNED'
  | 'TEN_TOTAL_OBS'
  | 'TWENTYFIVE_TOTAL_OBS'
  | 'THREE_QUIZ_SESSIONS'
  | 'EIGHT_OF_TEN';

export type UnlockEvent =
  | { type: 'COLLECTION_CREATED' }
  | { type: 'OBS_SAVED'; collectionId: string; hasPhoto?: boolean; hasLocation?: boolean }
  | { type: 'QUIZ_FINISHED'; score: number; total: number };

export type Bird = {
  id: string;
  title: string;
  image: any; 
  rare?: boolean;
};

export type UnlockPayload = {
  key: UnlockKey;
  title: string;
  bird: Bird;
};

const STORAGE = {
  STATS: 'bc_stats_v1',
  UNLOCKED_BIRDS: 'bc_unlocked_birds_v1',
  UNLOCKED_KEYS: 'bc_unlocked_keys_v1',
};

type Stats = {
  collectionsCreated: number;
  observationsTotal: number;
  observationsByCollection: Record<string, number>;
  quizSessions: number;
  firstQuizDone: boolean;
  firstBirdLogged: boolean;
  photoAddedOnce: boolean;
  locationPinnedOnce: boolean;
};

const defaultStats: Stats = {
  collectionsCreated: 0,
  observationsTotal: 0,
  observationsByCollection: {},
  quizSessions: 0,
  firstQuizDone: false,
  firstBirdLogged: false,
  photoAddedOnce: false,
  locationPinnedOnce: false,
};
export const BIRDS: Bird[] = [
  { id: 'bird_01', title: 'Eagle', image: require('../assets/bird_01.png') },
  { id: 'bird_02', title: 'Blue Jay', image: require('../assets/bird_02.png') },
  { id: 'bird_03', title: 'Owl', image: require('../assets/bird_03.png') },
  { id: 'bird_04', title: 'Robin', image: require('../assets/bird_04.png') },
  { id: 'bird_rare_01', title: 'Golden Falcon', image: require('../assets/bird_rare_01.png'), rare: true },
];

type UnlockMeta = { title: string; birdIds: string[] };
const UNLOCK_MAP: Record<UnlockKey, UnlockMeta> = {
  FIRST_BIRD_LOGGED: { title: 'First Bird Logged', birdIds: ['bird_01'] },
  FIRST_QUIZ_DONE: { title: 'First Quiz Done', birdIds: ['bird_02'] },
  FIVE_IN_ONE_NEST: { title: '5 in One Nest', birdIds: ['bird_03'] },
  PERFECT_10_10: { title: '10/10 Perfect Quiz', birdIds: ['bird_rare_01'] },
  FIVE_COLLECTIONS_FILLED: { title: '5 Collections Filled', birdIds: ['bird_03'] },
  THREE_BIRDS_STARTED: { title: '3 Birds Started', birdIds: ['bird_02'] },
  ONE_PHOTO_ADDED: { title: '1 Photo Added', birdIds: ['bird_01'] },
  ONE_LOCATION_PINNED: { title: '1 Location Pinned', birdIds: ['bird_02'] },
  TEN_TOTAL_OBS: { title: '10 Total Observations', birdIds: ['bird_03'] },
  TWENTYFIVE_TOTAL_OBS: { title: '25 Total Observations', birdIds: ['bird_04', 'bird_02'] },

  THREE_QUIZ_SESSIONS: { title: '3 Quiz Sessions', birdIds: ['bird_01'] },
  EIGHT_OF_TEN: { title: '8/10 Quiz Score', birdIds: ['bird_03'] },
};

async function loadJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function saveJSON<T>(key: string, val: T) {
  await AsyncStorage.setItem(key, JSON.stringify(val));
}

async function ensureBirdUnlocked(birdId: string) {
  const unlocked = await loadJSON<string[]>(STORAGE.UNLOCKED_BIRDS, []);
  if (unlocked.includes(birdId)) return false;
  unlocked.push(birdId);
  await saveJSON(STORAGE.UNLOCKED_BIRDS, unlocked);
  return true;
}

async function ensureKeyUnlocked(key: UnlockKey) {
  const keys = await loadJSON<UnlockKey[]>(STORAGE.UNLOCKED_KEYS, []);
  if (keys.includes(key)) return false;
  keys.push(key);
  await saveJSON(STORAGE.UNLOCKED_KEYS, keys);
  return true;
}

function findBird(birdId: string): Bird {
  const b = BIRDS.find((x) => x.id === birdId);
  return b ?? { id: birdId, title: 'Bird', image: null };
}

async function unlockMany(key: UnlockKey): Promise<UnlockPayload[]> {
  const meta = UNLOCK_MAP[key];
  if (!meta) return [];

  const keyNew = await ensureKeyUnlocked(key);

  if (!keyNew) return [];

  const payloads: UnlockPayload[] = [];

  for (const birdId of meta.birdIds) {
    const birdNew = await ensureBirdUnlocked(birdId);
    if (birdNew) {
      payloads.push({ key, title: meta.title, bird: findBird(birdId) });
    }
  }

  return payloads;
}

export async function recordEvent(ev: UnlockEvent): Promise<UnlockPayload[]> {
  const stats = await loadJSON<Stats>(STORAGE.STATS, defaultStats);

  if (ev.type === 'COLLECTION_CREATED') {
    stats.collectionsCreated += 1;
  }

  if (ev.type === 'OBS_SAVED') {
    stats.observationsTotal += 1;
    stats.observationsByCollection[ev.collectionId] =
      (stats.observationsByCollection[ev.collectionId] ?? 0) + 1;

    if (!stats.firstBirdLogged) stats.firstBirdLogged = true;
    if (ev.hasPhoto && !stats.photoAddedOnce) stats.photoAddedOnce = true;
    if (ev.hasLocation && !stats.locationPinnedOnce) stats.locationPinnedOnce = true;
  }

  if (ev.type === 'QUIZ_FINISHED') {
    stats.quizSessions += 1;
    if (!stats.firstQuizDone) stats.firstQuizDone = true;
  }

  await saveJSON(STORAGE.STATS, stats);
  const unlocks: UnlockPayload[] = [];

  if (stats.firstBirdLogged) unlocks.push(...(await unlockMany('FIRST_BIRD_LOGGED')));

  if (stats.collectionsCreated >= 3) unlocks.push(...(await unlockMany('THREE_BIRDS_STARTED')));

  if (stats.observationsTotal >= 10) unlocks.push(...(await unlockMany('TEN_TOTAL_OBS')));

  if (stats.observationsTotal >= 25) unlocks.push(...(await unlockMany('TWENTYFIVE_TOTAL_OBS')));

  if (stats.photoAddedOnce) unlocks.push(...(await unlockMany('ONE_PHOTO_ADDED')));


  if (stats.locationPinnedOnce) unlocks.push(...(await unlockMany('ONE_LOCATION_PINNED')));
  if (stats.firstQuizDone) unlocks.push(...(await unlockMany('FIRST_QUIZ_DONE')));


  if (stats.quizSessions >= 3) unlocks.push(...(await unlockMany('THREE_QUIZ_SESSIONS')));

  if (ev.type === 'QUIZ_FINISHED') {
    const { score, total } = ev;

    if (total === 10 && score === 10) {
      unlocks.push(...(await unlockMany('PERFECT_10_10')));
    }

    if (total > 0 && score / total >= 0.8) {
      unlocks.push(...(await unlockMany('EIGHT_OF_TEN')));
    }
  }

  const maxInOne = Math.max(0, ...Object.values(stats.observationsByCollection));
  if (maxInOne >= 5) unlocks.push(...(await unlockMany('FIVE_IN_ONE_NEST')));

  const collectionsWithAtLeastOne = Object.values(stats.observationsByCollection).filter((v) => v >= 1).length;
  if (collectionsWithAtLeastOne >= 5) unlocks.push(...(await unlockMany('FIVE_COLLECTIONS_FILLED')));

  return unlocks;
}

export async function getUnlockedBirdIds(): Promise<string[]> {
  return loadJSON<string[]>(STORAGE.UNLOCKED_BIRDS, []);
}

export async function getUnlockedBirds(): Promise<Bird[]> {
  const ids = await getUnlockedBirdIds();
  return ids.map(findBird);
}

export async function getUnlockedKeys(): Promise<UnlockKey[]> {
  return loadJSON<UnlockKey[]>(STORAGE.UNLOCKED_KEYS, []);
}
