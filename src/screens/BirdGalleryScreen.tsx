import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Dimensions,
  ImageBackground,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  loadCollections,
  getResetTick,
  RESET_TICK_KEY,
  type Collection,
} from '../storage/storage';

const BG = require('../assets/background.png');

type BirdCard = { id: string; name: string; emoji: string };
type CategoryGallery = { id: string; title: string; icon: string; birds: BirdCard[] };
type FavoriteState = Record<string, boolean>;

const INITIAL_CATEGORIES: CategoryGallery[] = [
  {
    id: 'cat_common',
    title: 'Common Birds',
    icon: '🐦',
    birds: [
      { id: 'c1', name: 'Sparrow', emoji: '🐦' },
      { id: 'c2', name: 'Pigeon', emoji: '🐦' },
      { id: 'c3', name: 'Crow', emoji: '🐦' },
      { id: 'c4', name: 'Robin', emoji: '🐦' },
      { id: 'c5', name: 'Starling', emoji: '🐦' },
    ],
  },
  {
    id: 'cat_water',
    title: 'Water & Wetland Birds',
    icon: '🦆',
    birds: [
      { id: 'w1', name: 'Duck', emoji: '🦆' },
      { id: 'w2', name: 'Swan', emoji: '🦢' },
      { id: 'w3', name: 'Heron', emoji: '🪶' },
      { id: 'w4', name: 'Kingfisher', emoji: '🐟' },
    ],
  },
  {
    id: 'cat_prey',
    title: 'Birds of Prey',
    icon: '🦅',
    birds: [
      { id: 'p1', name: 'Eagle', emoji: '🦅' },
      { id: 'p2', name: 'Hawk', emoji: '🦅' },
      { id: 'p3', name: 'Falcon', emoji: '🦅' },
      { id: 'p4', name: 'Owl Hunter', emoji: '🦉' },
      { id: 'p5', name: 'Kite', emoji: '🦅' },
    ],
  },
  {
    id: 'cat_farm',
    title: 'Farm & Familiar Birds',
    icon: '🐓',
    birds: [
      { id: 'f1', name: 'Chicken', emoji: '🐓' },
      { id: 'f2', name: 'Rooster', emoji: '🐔' },
      { id: 'f3', name: 'Turkey', emoji: '🦃' },
      { id: 'f4', name: 'Goose', emoji: '🪿' },
    ],
  },
  {
    id: 'cat_exotic',
    title: 'Exotic & Symbolic Birds',
    icon: '🦜',
    birds: [
      { id: 'e1', name: 'Parrot', emoji: '🦜' },
      { id: 'e2', name: 'Toucan', emoji: '🦜' },
      { id: 'e3', name: 'Peacock', emoji: '🦚' },
      { id: 'e4', name: 'Crane', emoji: '🪶' },
    ],
  },
  {
    id: 'cat_night',
    title: 'Night & Forest',
    icon: '🦉',
    birds: [
      { id: 'n1', name: 'Owl', emoji: '🦉' },
      { id: 'n2', name: 'Nightjar', emoji: '🌙' },
      { id: 'n3', name: 'Woodpecker', emoji: '🌲' },
      { id: 'n4', name: 'Raven', emoji: '🖤' },
    ],
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getTotalSavedBirds(collections: Collection[]) {
  return collections.reduce((acc, c) => acc + (c.notes?.length || 0), 0);
}

export default function BirdGalleryScreen() {
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 700 || width <= 360;

  const [totalSaved, setTotalSaved] = useState(0);
  const [favorites, setFavorites] = useState<FavoriteState>({});
  const [resetTick, setResetTick] = useState(0);

  const appear = useRef(new Animated.Value(0)).current;

  const reloadProgress = useCallback(async () => {
    try {
      const list = await loadCollections();
      const total = getTotalSavedBirds(list);
      setTotalSaved(total);
      if (!list || list.length === 0 || total === 0) setFavorites({});
    } catch {
      setTotalSaved(0);
      setFavorites({});
    }
  }, []);

  const reloadResetTick = useCallback(async () => {
    try {
      const t = await getResetTick();
      setResetTick(t);
    } catch {}
  }, []);

  const runAppear = useCallback(() => {
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [appear]);

  useEffect(() => {
    runAppear();
    reloadProgress();
    reloadResetTick();
  }, [reloadProgress, reloadResetTick, runAppear]);

  useEffect(() => {
    setTotalSaved(0);
    setFavorites({});
    runAppear();
    reloadProgress();
  }, [resetTick, reloadProgress, runAppear]);

  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const raw = await AsyncStorage.getItem(RESET_TICK_KEY);
        const t = raw ? Number(raw) || 0 : 0;
        if (t !== resetTick) setResetTick(t);
      } catch {}
    }, 1200);
    return () => clearInterval(id);
  }, [resetTick]);

  const toggleFavorite = (birdId: string) => {
    setFavorites(prev => ({ ...prev, [birdId]: !prev[birdId] }));
  };

  const columns = isSmall ? 3 : 4;
  const gap = isSmall ? 10 : 12;
  const hPad = isSmall ? 14 : 16;
  const cardSize = Math.floor((width - hPad * 2 - gap * (columns - 1)) / columns);
  const androidTopPadding = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={{ flex: 1, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          <FlatList
            data={INITIAL_CATEGORIES}
            keyExtractor={item => item.id}
            contentContainerStyle={{
              paddingHorizontal: hPad,
              paddingTop: (isSmall ? 14 : 16) + androidTopPadding,
              paddingBottom: isSmall ? 100 + 28 : 100 + 34,
            }}
            renderItem={({ item, index }) => {
              const unlockedCount = clamp(totalSaved, 0, item.birds.length);
              
              return (
                <Animated.View style={[styles.section, {
                  opacity: appear,
                  transform: [{ translateY: appear.interpolate({ 
                    inputRange: [0, 1], 
                    outputRange: [14 + (index * 10), 0] 
                  }) }]
                }]}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionIcon, { fontSize: isSmall ? 20 : 22 }]}>{item.icon}</Text>
                    <Text style={[styles.sectionTitle, { fontSize: isSmall ? 20 : 22 }]}>{item.title}</Text>
                  </View>

                  <View style={[styles.grid, { gap }]}>
                    {item.birds.map((bird, i) => {
                      const unlocked = i < unlockedCount;
                      const fav = !!favorites[bird.id];

                      if (!unlocked) {
                        return (
                          <View key={bird.id} style={[styles.lockedCard, { width: cardSize, height: cardSize, borderRadius: isSmall ? 16 : 18 }]}>
                            <Text style={{ fontSize: isSmall ? 24 : 26 }}>🔒</Text>
                            <Text style={styles.lockedLabel} numberOfLines={1}>Locked</Text>
                          </View>
                        );
                      }

                      return (
                        <Pressable
                          key={bird.id}
                          onPress={() => toggleFavorite(bird.id)}
                          style={({ pressed }) => [
                            styles.card,
                            { width: cardSize, height: cardSize, borderRadius: isSmall ? 16 : 18, opacity: pressed ? 0.9 : 1 },
                            fav && styles.favoriteCard,
                          ]}
                        >
                          <Text style={{ fontSize: isSmall ? 32 : 34 }}>{bird.emoji}</Text>
                          <Text style={[styles.birdName, { fontSize: isSmall ? 12 : 13 }]} numberOfLines={1}>{bird.name}</Text>
                          <View style={[styles.favoriteBadge, fav ? styles.favoriteBadgeOn : styles.favoriteBadgeOff]}>
                            <Text style={styles.favoriteBadgeText}>{fav ? '★' : '☆'}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.progressText}>
                    Opened {unlockedCount} of {item.birds.length} 
                    <Text style={{ opacity: 0.5 }}> (Saved: {totalSaved})</Text>
                  </Text>
                </Animated.View>
              );
            }}
            ItemSeparatorComponent={() => <View style={{ height: isSmall ? 18 : 22 }} />}
          />
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  section: { backgroundColor: 'rgba(242, 244, 195, 0.85)', borderRadius: 20, padding: 15 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionIcon: { marginTop: Platform.OS === 'ios' ? 2 : 0 },
  sectionTitle: { fontWeight: '900', color: '#163B0F', flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { backgroundColor: '#86B4E8', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  favoriteCard: { backgroundColor: '#9EE6A0', borderWidth: 3, borderColor: '#1FA53C' },
  birdName: { marginTop: 6, fontWeight: '900', color: '#163B0F', textAlign: 'center', paddingHorizontal: 4 },
  favoriteBadge: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  favoriteBadgeOn: { backgroundColor: '#1FA53C' },
  favoriteBadgeOff: { backgroundColor: 'rgba(0,0,0,0.1)' },
  favoriteBadgeText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  lockedCard: { backgroundColor: '#BDC3C7', alignItems: 'center', justifyContent: 'center' },
  lockedLabel: { marginTop: 4, fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.4)' },
  progressText: { marginTop: 12, fontWeight: '800', color: '#163B0F', fontSize: 13 },
});