import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Animated,
  ImageSourcePropType,
  Dimensions,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Loader'>;
const BG: ImageSourcePropType = require('../assets/background.png');
const LOGO: ImageSourcePropType = require('../assets/logo.png');

export default function LoaderScreen({ navigation }: Props) {
  const { width, height } = Dimensions.get('window');
  const isSmall = useMemo(() => height <= 700 || width <= 360, [height, width]);
  const isVerySmall = useMemo(() => height <= 640 || width <= 340, [height, width]);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        speed: 14,
        bounciness: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
    const t = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 3000);

    return () => clearTimeout(t);
  }, [navigation, logoOpacity, logoScale, logoTranslateY]);

  const logoSize = useMemo(() => {
    if (isVerySmall) return Math.min(width * 0.55, 180);
    if (isSmall) return Math.min(width * 0.6, 220);
    return Math.min(width * 0.62, 260);
  }, [isSmall, isVerySmall, width]);

  const titleSize = isVerySmall ? 20 : isSmall ? 22 : 26;
  const subSize = isVerySmall ? 12 : isSmall ? 13 : 14;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <View style={[styles.root, { paddingHorizontal: isVerySmall ? 16 : 24 }]}>
        <Animated.Image
          source={LOGO}
          style={[
            styles.logo,
            {
              width: logoSize,
              height: logoSize,
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { translateY: logoTranslateY },
              ],
            },
          ]}
          resizeMode="contain"
        />

        <Text style={[styles.title, { fontSize: titleSize }]}>Loading...</Text>

        <ActivityIndicator
          size={Platform.OS === 'ios' ? 'large' : 'large'}
          style={{ marginTop: isVerySmall ? 8 : 10 }}
        />

        <Text style={[styles.sub, { fontSize: subSize }]}>
        </Text>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  logo: {
    marginBottom: 10,
  },
  title: {
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  sub: {
    opacity: 0.8,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 320,
  },
});
