import React, { useState } from 'react';
import {
  Alert,
  ImageBackground,
  Pressable,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetAllData } from '../storage/storage';

const BG = require('../assets/background.png');

type RowProps = {
  leftEmoji: string;
  title: string;
  right?: React.ReactNode;
  onPress?: () => void;
};

function Row({ leftEmoji, title, right, onPress }: RowProps) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        onPress ? (pressed ? { opacity: 0.92 } : null) : null,
      ]}
    >
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Text style={styles.iconEmoji}>{leftEmoji}</Text>
        </View>
        <Text style={styles.rowText} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {right ? <View style={styles.rowRight}>{right}</View> : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 700 || width <= 360;

  const [notificationsOn, setNotificationsOn] = useState(true);

  const onShare = async () => {
    try {
      await Share.share({ message: 'Check out this app!' });
    } catch {
    
    }
  };

  const onReset = () => {
    Alert.alert(
      'Reset All Data?',
      'This will erase all your birds, photos, and notes. Are you sure you want to start over?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAllData();
              Alert.alert('Done', 'All data has been reset.');
            } catch {
              Alert.alert('Error', 'Failed to reset data.');
            }
          },
        },
      ]
    );
  };
  const androidTopPadding = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        

        <View style={[
          styles.header, 
          { 
            paddingVertical: isSmall ? 12 : 14,
            marginTop: Platform.OS === 'android' ? 10 : 0 
          }
        ]}>
          <Text style={[styles.headerTitle, { fontSize: isSmall ? 20 : 22 }]}>Settings</Text>
        </View>

        <View style={[
          styles.content, 
          { 
            paddingHorizontal: isSmall ? 14 : 16,
            paddingTop: 14 + androidTopPadding 
          }
        ]}>
          <Row
            leftEmoji="🔔"
            title="Notifications"
            right={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ false: 'rgba(0,0,0,0.18)', true: '#2E6BA2' }}
                thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                ios_backgroundColor="rgba(0,0,0,0.18)"
              />
            }
          />

          <Row leftEmoji="📤" title="Share the App" onPress={onShare} />

          <Row leftEmoji="♻️" title="Reset All Data" onPress={onReset} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  header: {
    backgroundColor: '#D8D23A',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  headerTitle: { color: '#163B0F', fontWeight: '900' },

  content: {
    gap: 12,
  },

  row: {
    backgroundColor: '#EEF0B6',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#86B4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconEmoji: {
    fontSize: 20,
    fontWeight: '900',
  },

  rowText: {
    color: '#163B0F',
    fontWeight: '900',
    fontSize: 17,
  },

  rowRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});