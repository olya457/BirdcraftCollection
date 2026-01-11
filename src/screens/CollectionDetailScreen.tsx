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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { launchImageLibrary } from 'react-native-image-picker';

import { recordEvent } from '../unlocks/unlockManager';
import { useUnlocks } from '../unlocks/UnlockProvider';

import {
  Collection,
  Note,
  formatShortDate,
  loadCollections,
  saveCollections,
  uid,
} from '../storage/storage';

const BG = require('../assets/background.png');
const ICON_TRASH = require('../assets/trash.png');

type Props = NativeStackScreenProps<RootStackParamList, 'CollectionDetail'>;
const CustomKeyboard = ({ onKeyPress, onDelete, onSpace }: any) => {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  return (
    <View style={styles.kbContainer}>
      {rows.map((row, i) => (
        <View key={i} style={styles.kbRow}>
          {row.map(key => (
            <Pressable key={key} style={styles.kbKey} onPress={() => onKeyPress(key)}>
              <Text style={styles.kbKeyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <View style={styles.kbRow}>
        <Pressable style={[styles.kbKey, { flex: 3 }]} onPress={onSpace}>
          <Text style={styles.kbKeyText}>Space</Text>
        </Pressable>
        <Pressable style={styles.kbKey} onPress={onDelete}>
          <Text style={styles.kbKeyText}>⌫</Text>
        </Pressable>
        <View style={styles.kbKey}>
          <Text style={styles.kbKeyText}>✓</Text>
        </View>
      </View>
    </View>
  );
};

export default function CollectionDetailScreen({ route, navigation }: Props) {
  const { collectionId } = route.params;
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 720;
  const { showUnlock } = useUnlocks();

  const [all, setAll] = useState<Collection[]>([]);
  const loadedRef = useRef(false);
  const appear = useRef(new Animated.Value(0)).current;
  const [animalName, setAnimalName] = useState('');
  const [location, setLocation] = useState('');
  const [tag, setTag] = useState('');
  const [activeField, setActiveField] = useState<'name' | 'loc' | 'tag'>('name');

  const runAppear = useCallback(() => {
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [appear]);

  const collection = useMemo(
    () => all.find(x => x.id === collectionId) ?? null,
    [all, collectionId]
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await loadCollections();
        if (mounted) {
          setAll(list);
          loadedRef.current = true;
          runAppear();
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [runAppear]);

  useEffect(() => {
    if (!loadedRef.current) return;
    saveCollections(all).catch(() => {});
  }, [all]);

  const [modalOpen, setModalOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);

  const canSave = animalName.trim().length > 0;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const handleType = (char: string) => {
    if (activeField === 'name') setAnimalName(prev => prev + char);
    if (activeField === 'loc') setLocation(prev => prev + char);
    if (activeField === 'tag') setTag(prev => prev + char);
  };

  const handleDelete = () => {
    if (activeField === 'name') setAnimalName(prev => prev.slice(0, -1));
    if (activeField === 'loc') setLocation(prev => prev.slice(0, -1));
    if (activeField === 'tag') setTag(prev => prev.slice(0, -1));
  };

  const openModal = () => {
    setModalOpen(true);
    modalAnim.setValue(0);
    Animated.timing(modalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const closeModal = () => {
    Animated.timing(modalAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setModalOpen(false);
      setAnimalName(''); setLocation(''); setTag(''); setPhotoUri(undefined);
    });
  };

  const pickPhoto = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.9 });
    if (res.assets?.[0]?.uri) setPhotoUri(res.assets[0].uri);
  };

  const saveNote = async () => {
    if (!collection || !canSave) return;
    const n: Note = {
      id: uid('note'),
      title: animalName.trim(),
      location: location.trim(),
      tag: tag.trim(),
      dateISO: new Date().toISOString(),
      photoUri,
    };
    setAll(prev => prev.map(c => (c.id === collection.id ? { ...c, notes: [n, ...c.notes] } : c)));
    closeModal();
    try {
      const unlocks = await recordEvent({
        type: 'OBS_SAVED',
        collectionId: collection.id,
        hasPhoto: !!photoUri,
        hasLocation: !!location.trim(),
      });
      unlocks.forEach(showUnlock);
    } catch {}
  };

  if (!collection) return null;

  return (
    <ImageBackground source={BG} style={styles.bg}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Animated.View style={{ flex: 1, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
          
          <View style={[styles.header, { marginTop: Platform.OS === 'android' ? 20 : 0 }]}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
              <Text style={styles.backTxt}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle} numberOfLines={1}>{collection.title}</Text>
            <Pressable onPress={openModal} style={styles.addBtn} hitSlop={10}>
              <Text style={styles.addTxt}>＋</Text>
            </Pressable>
          </View>

          <FlatList
            data={collection.notes}
            keyExtractor={it => it.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <NoteCard note={item} onDelete={() => {
                Alert.alert('Delete?', 'Remove note?', [
                  { text: 'No' },
                  { text: 'Yes', onPress: () => setAll(prev => prev.map(c => c.id === collection.id ? { ...c, notes: c.notes.filter(n => n.id !== item.id) } : c)) }
                ]);
              }} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />

          {modalOpen && (
            <View style={styles.modalBackdrop}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
              <Animated.View style={[styles.modalCard, { width: width * 0.95, opacity: modalAnim }]}>
                <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Observation</Text>
                    <Pressable onPress={closeModal}><Text style={styles.closeX}>×</Text></Pressable>
                  </View>

                  <Pressable onPress={pickPhoto} style={styles.photoBox}>
                    {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoImg} /> : <Text style={styles.photoIcon}>📷</Text>}
                  </Pressable>

                  <TextInput 
                    showSoftInputOnFocus={false}
                    onFocus={() => setActiveField('name')}
                    value={animalName} 
                    placeholder="Bird Name" 
                    placeholderTextColor="#999" 
                    style={[styles.input, activeField === 'name' && styles.inputActive]} 
                  />
                  <TextInput 
                    showSoftInputOnFocus={false}
                    onFocus={() => setActiveField('loc')}
                    value={location} 
                    placeholder="Location" 
                    placeholderTextColor="#999" 
                    style={[styles.input, activeField === 'loc' && styles.inputActive]} 
                  />
                  <TextInput 
                    showSoftInputOnFocus={false}
                    onFocus={() => setActiveField('tag')}
                    value={tag} 
                    placeholder="Description/Notes" 
                    placeholderTextColor="#999" 
                    style={[styles.input, { height: 60 }, activeField === 'tag' && styles.inputActive]} 
                    multiline 
                  />

                  <Pressable onPress={saveNote} disabled={!canSave} style={[styles.saveBtn, !canSave && { opacity: 0.5 }]}>
                    <Text style={styles.saveBtnText}>Save Note</Text>
                  </Pressable>

                  <CustomKeyboard 
                    onKeyPress={handleType} 
                    onDelete={handleDelete} 
                    onSpace={() => handleType(' ')} 
                  />
                </ScrollView>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function NoteCard({ note, onDelete }: any) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardThumb}>
          {note.photoUri ? <Image source={{ uri: note.photoUri }} style={styles.cardImg} /> : <Text style={{fontSize: 24}}>🕊️</Text>}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{note.title}</Text>
          <Text style={styles.cardLoc}>{note.location || 'Unknown location'}</Text>
        </View>
        <Pressable onPress={onDelete} hitSlop={10}>
          <Image source={ICON_TRASH} style={styles.trashIcon} />
        </Pressable>
      </View>
      {!!note.tag && <Text style={styles.cardTag}>{note.tag}</Text>}
      <Text style={styles.cardDate}>{formatShortDate(note.dateISO)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  header: { backgroundColor: '#D8D23A', padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#163B0F', fontWeight: '900', fontSize: 18, flex: 1, textAlign: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#163B0F', alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  addBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#163B0F', alignItems: 'center', justifyContent: 'center' },
  addTxt: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  listContent: { padding: 15, paddingBottom: 40 },
  card: { backgroundColor: '#EEF0B6', borderRadius: 20, padding: 15 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardThumb: { width: 60, height: 60, borderRadius: 15, backgroundColor: '#86B4E8', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%' },
  cardTitle: { fontWeight: '900', color: '#153B0E', fontSize: 17 },
  cardLoc: { color: '#1FA53C', fontWeight: '700', fontSize: 13 },
  cardTag: { marginTop: 8, color: '#0B2F56', fontSize: 14 },
  cardDate: { marginTop: 8, color: '#777', fontSize: 11, fontWeight: '700' },
  trashIcon: { width: 20, height: 20, tintColor: '#2E6BA2' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  modalCard: { backgroundColor: '#EFEFB7', borderRadius: 25, padding: 15, maxHeight: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#163B0F' },
  closeX: { fontSize: 32, color: '#163B0F' },
  photoBox: { width: '100%', height: 100, backgroundColor: '#6DA9E8', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 10, overflow: 'hidden' },
  photoIcon: { fontSize: 30 },
  photoImg: { width: '100%', height: '100%' },
  input: { backgroundColor: '#0B2F56', borderRadius: 15, color: '#fff', padding: 12, marginBottom: 10, fontWeight: '700', fontSize: 14, borderWidth: 2, borderColor: 'transparent' },
  inputActive: { borderColor: '#1FA53C' },
  saveBtn: { backgroundColor: '#1FA53C', padding: 14, borderRadius: 15, alignItems: 'center', marginBottom: 15 },
  saveBtnText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  
  kbContainer: { width: '100%', paddingVertical: 5, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 15 },
  kbRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  kbKey: { 
    backgroundColor: '#1E1E1E', 
    marginHorizontal: 2, 
    paddingVertical: 10, 
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3
  },
  kbKeyText: { color: '#fff', fontWeight: 'bold', fontSize: 15 }
});