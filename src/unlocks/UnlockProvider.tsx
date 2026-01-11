import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Image } from 'react-native';
import type { UnlockPayload } from './unlockManager';

type Ctx = {
  showUnlock: (u: UnlockPayload) => void;
};

const UnlockContext = createContext<Ctx | null>(null);

export function useUnlocks() {
  const ctx = useContext(UnlockContext);
  if (!ctx) throw new Error('useUnlocks must be used within UnlockProvider');
  return ctx;
}

export function UnlockProvider({
  children,
  onGoToGallery,
}: {
  children: React.ReactNode;
  onGoToGallery: () => void;
}) {
  const [current, setCurrent] = useState<UnlockPayload | null>(null);

  const showUnlock = useCallback((u: UnlockPayload) => {
    setCurrent(u);
  }, []);

  const close = useCallback(() => setCurrent(null), []);

  const value = useMemo(() => ({ showUnlock }), [showUnlock]);

  return (
    <UnlockContext.Provider value={value}>
      {children}

      <Modal visible={!!current} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{current?.title ?? ''}</Text>

            {current?.bird?.image ? (
              <Image source={current.bird.image} style={styles.bird} resizeMode="contain" />
            ) : (
              <View style={[styles.bird, { backgroundColor: 'rgba(0,0,0,0.08)' }]} />
            )}

            <Pressable
              onPress={() => {
                close();
                onGoToGallery();
              }}
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.92 : 1 }]}
            >
              <Text style={styles.btnText}>To Gallery</Text>
            </Pressable>

            <Pressable onPress={close} style={styles.closeHit}>
              <Text style={styles.closeX}>×</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </UnlockContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  card: {
    width: '88%',
    maxWidth: 360,
    backgroundColor: '#EFEFB7',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: '#1C3E10', marginBottom: 12 },
  bird: { width: 110, height: 110, marginBottom: 14 },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 12,
    backgroundColor: '#6DA9E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  closeHit: { position: 'absolute', right: 12, top: 8, padding: 8 },
  closeX: { fontSize: 22, fontWeight: '900', color: '#1C3E10' },
});
