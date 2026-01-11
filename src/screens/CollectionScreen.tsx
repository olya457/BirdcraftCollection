import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ImageBackground,
  Animated,
  FlatList,
  Dimensions,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { launchImageLibrary } from 'react-native-image-picker';

import { recordEvent } from '../unlocks/unlockManager';
import { useUnlocks } from '../unlocks/UnlockProvider';
import { Collection, loadCollections, saveCollections, uid } from '../storage/storage';

const BG = require('../assets/background.png');
const ICON_SEARCH = require('../assets/search.png');
const ICON_PLUS = require('../assets/plus.png');
const ICON_TRASH = require('../assets/trash.png');
const ICON_PIN = require('../assets/bookmark.png');
const ICON_PIN_ON = require('../assets/bookmark_on.png');

type Preset = { title: string; emoji: string };
const PRESETS: Preset[] = [
  { title: 'Common Birds', emoji: '🐦' },
  { title: 'Water & Wetland Birds', emoji: '🦆' },
  { title: 'Birds of Prey', emoji: '🦅' },
  { title: 'Farm & Familiar Birds', emoji: '🐔' },
  { title: 'Exotic & Symbolic Birds', emoji: '🦜' },
  { title: 'Night & Forest', emoji: '🦉' },
];

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Collection'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function normalize(s: string) { return (s || '').trim().toLowerCase(); }

function getPresetEmojiByTitle(title: string) {
  const t = normalize(title);
  const hit = PRESETS.find(p => normalize(p.title) === t);
  return hit ? hit.emoji : '🐦';
}

function ensurePresets(existing: Collection[]) {
  const byTitle = new Map(existing.map(c => [normalize(c.title), c]));
  const toAdd: Collection[] = [];
  for (const p of PRESETS) {
    if (!byTitle.has(normalize(p.title))) {
      toAdd.push({
        id: uid('col'),
        title: p.title,
        tag: '',
        coverUri: undefined,
        createdAtISO: new Date().toISOString(),
        notes: [],
      });
    }
  }
  return toAdd.length === 0 ? existing : [...toAdd, ...existing];
}

export default function CollectionScreen() {
  const navigation = useNavigation<Nav>();
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 700 || width <= 360;
  const { showUnlock } = useUnlocks();

  const [query, setQuery] = useState('');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [pinnedIds, setPinnedIds] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTag, setNewTag] = useState('');
  const [coverUri, setCoverUri] = useState<string | undefined>(undefined);

  const loadedRef = useRef(false);
  const appear = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const reload = useCallback(async () => {
    try {
      const list = await loadCollections();
      const withPresets = ensurePresets(list);
      setCollections(withPresets);
      loadedRef.current = true;
      if (withPresets.length !== list.length) saveCollections(withPresets).catch(() => {});
    } catch {}
  }, []);

  useFocusEffect(useCallback(() => {
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    reload();
  }, [reload, appear]));

  useEffect(() => {
    if (loadedRef.current) saveCollections(collections).catch(() => {});
  }, [collections]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    let list = q ? collections.filter(x => normalize(x.title).includes(q)) : collections;
    return [...list].sort((a, b) => (pinnedIds[b.id] ? 1 : 0) - (pinnedIds[a.id] ? 1 : 0));
  }, [collections, query, pinnedIds]);

  const openModal = () => {
    setModalOpen(true);
    modalAnim.setValue(0);
    Animated.timing(modalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setModalOpen(false);
      setNewName(''); setNewTag(''); setCoverUri(undefined);
    });
  };

  const pickCover = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.9 });
    if (res.assets?.[0]?.uri) setCoverUri(res.assets[0].uri);
  };

  const onCreate = async () => {
    if (!newName.trim()) return;
    const c: Collection = {
      id: uid('col'),
      title: newName.trim(),
      tag: newTag.trim(),
      coverUri,
      createdAtISO: new Date().toISOString(),
      notes: [],
    };
    setCollections(prev => [c, ...prev]);
    closeModal();
    const unlocks = await recordEvent({ type: 'COLLECTION_CREATED' });
    unlocks.forEach(showUnlock);
  };

  const androidOffset = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={{ flex: 1, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          
          <View style={[styles.header, { paddingVertical: isSmall ? 10 : 14, marginTop: androidOffset }]}>
            <Text style={[styles.headerTitle, { fontSize: isSmall ? 18 : 20 }]}>My Bird Collections</Text>
            <Pressable style={styles.plusBtn} onPress={openModal} hitSlop={10}>
              <Image source={ICON_PLUS} style={styles.plusIcon} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { paddingTop: isSmall ? 8 : 10 }]}>
            <View style={[styles.searchBar, { height: isSmall ? 40 : 44 }]}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search collections..."
                placeholderTextColor="rgba(255,255,255,0.65)"
                style={[styles.searchInput, { fontSize: isSmall ? 13 : 14 }]}
                autoCorrect={false}
              />
              <Image source={ICON_SEARCH} style={styles.searchIcon} />
            </View>
          </View>

          <FlatList
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingTop: 4,
              paddingBottom: isSmall ? 134 : 158, 
            }}
            data={filtered}
            keyExtractor={it => it.id}
            renderItem={({ item, index }) => (
              <Animated.View style={{ opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [12 + index * 2, 0] }) }] }}>
                <CollectionCard
                  isSmall={isSmall}
                  item={item}
                  pinned={!!pinnedIds[item.id]}
                  onPress={() => navigation.navigate('CollectionDetail', { collectionId: item.id })}
                  onDelete={() => {
                    Alert.alert('Delete?', 'Remove collection?', [
                      { text: 'Cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => setCollections(prev => prev.filter(c => c.id !== item.id)) }
                    ]);
                  }}
                  onTogglePin={() => setPinnedIds(p => ({ ...p, [item.id]: !p[item.id] }))}
                />
              </Animated.View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: isSmall ? 10 : 12 }} />}
          />

          {modalOpen && (
            <View style={styles.modalBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
              <Animated.View style={[styles.modalCard, { width: Math.min(width - 40, 380), opacity: modalAnim, transform: [{ translateY: modalAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { fontSize: isSmall ? 22 : 24 }]}>New Collection</Text>
                  <Pressable onPress={closeModal}><Text style={styles.modalCloseText}>×</Text></Pressable>
                </View>
                <Pressable onPress={pickCover} style={styles.addPhotoBox}>
                  {coverUri ? <Image source={{ uri: coverUri }} style={styles.addPhotoImg} /> : <Text style={styles.addPhotoText}>📷{"\n"}Add photo</Text>}
                </Pressable>
                <TextInput value={newName} onChangeText={setNewName} placeholder="Name" placeholderTextColor="#aaa" style={styles.modalInput} />
                <TextInput value={newTag} onChangeText={setNewTag} placeholder="Tag (optional)" placeholderTextColor="#aaa" style={styles.modalInput} />
                <Pressable onPress={onCreate} style={[styles.createBtn, !newName.trim() && { opacity: 0.5 }]}>
                  <Text style={styles.createText}>Create</Text>
                </Pressable>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function CollectionCard({ item, onPress, onDelete, onTogglePin, pinned, isSmall }: any) {
  const iconSize = isSmall ? 60 : 64;
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { width: iconSize, height: iconSize }]}>
          {item.coverUri ? <Image source={{ uri: item.coverUri }} style={styles.coverImg} /> : <Text style={{ fontSize: 28 }}>{getPresetEmojiByTitle(item.title)}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { fontSize: isSmall ? 18 : 20 }]} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.collectedText}>{item.notes.length} collected</Text>
        </View>
      </View>
      <View style={styles.rightActions}>
        <Pressable onPress={onTogglePin} hitSlop={10}>
          <Image source={pinned ? ICON_PIN_ON : ICON_PIN} style={styles.actionIcon} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Image source={ICON_TRASH} style={styles.actionIcon} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { backgroundColor: '#D8D23A', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#163B0F', fontWeight: '900' },
  plusBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#163B0F', alignItems: 'center', justifyContent: 'center' },
  plusIcon: { width: 18, height: 18, tintColor: '#fff' },
  searchWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  searchBar: { borderRadius: 18, backgroundColor: '#0B2F56', paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  searchInput: { color: '#fff', flex: 1 },
  searchIcon: { width: 18, height: 18, tintColor: '#fff' },
  card: { backgroundColor: '#EEF0B6', borderRadius: 18, flexDirection: 'row', alignItems: 'center', padding: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconBox: { borderRadius: 14, backgroundColor: '#86B4E8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  coverImg: { width: '100%', height: '100%' },
  cardTitle: { fontWeight: '900', color: '#153B0E' },
  collectedText: { color: '#1FA53C', fontWeight: '700', marginTop: 2 },
  rightActions: { flexDirection: 'row', gap: 12, marginLeft: 8 },
  actionIcon: { width: 22, height: 22, tintColor: '#2E6BA2' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#EFEFB7', borderRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  modalTitle: { fontWeight: '900', color: '#163B0F' },
  modalCloseText: { fontSize: 30, color: '#163B0F' },
  addPhotoBox: { width: '100%', height: 120, backgroundColor: '#6DA9E8', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 15, overflow: 'hidden' },
  addPhotoText: { textAlign: 'center', color: '#fff', fontWeight: '800' },
  addPhotoImg: { width: '100%', height: '100%' },
  modalInput: { backgroundColor: '#0B2F56', borderRadius: 12, color: '#fff', padding: 14, marginBottom: 10, fontWeight: '700' },
  createBtn: { backgroundColor: '#6DA9E8', padding: 16, borderRadius: 16, alignItems: 'center' },
  createText: { color: '#0B2F56', fontWeight: '900', fontSize: 18 },
});