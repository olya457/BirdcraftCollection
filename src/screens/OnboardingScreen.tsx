import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
  Animated,
  Dimensions,
  ImageSourcePropType,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const BG: ImageSourcePropType = require('../assets/background.png');
const ONBOARD_1: ImageSourcePropType = require('../assets/onboard1.png');
const ONBOARD_2: ImageSourcePropType = require('../assets/onboard2.png');
const ONBOARD_3: ImageSourcePropType = require('../assets/onboard3.png');

type Step = 0 | 1 | 2;

const STEPS: Array<{
  image: ImageSourcePropType;
  title: string;
  text: string;
  button: string;
}> = [
  {
    image: ONBOARD_1,
    title: 'Welcome to Birdwatcher Collection',
    text:
      'Step into a quiet kind of adventure.\n' +
      'Every walk, window view, or park visit can\n' +
      'become a tiny discovery. Bird sightings\n' +
      'collect and help you turn quick finds\n' +
      'into a personal bird world you can grow\n' +
      'day by day.',
    button: 'Next',
  },
  {
    image: ONBOARD_2,
    title: 'Turn Sightings Into Stories',
    text:
      'Create collections for the birds you meet —\n' +
      'sparrows, bullfinch, eagle, duck, or\n' +
      'your own custom finds. Add photos, mark the\n' +
      'spot on the map, and write the little details\n' +
      'that make each encounter memorable.',
    button: 'Next',
  },
  {
    image: ONBOARD_3,
    title: 'Learn, Unlock, and Challenge Yourself',
    text:
      "Write your first note and a new bird joins\n" +
      "your gallery. Keep exploring to unlock\n" +
      "more illustrations, build a tag-powered\n" +
      "knowledge library, and test yourself in\n" +
      "quick 30-second quiz rounds.",
    button: 'Start Exploring',
  },
];

const LIFT_PX = 20; 

export default function OnboardingScreen({ navigation }: Props) {
  const { width, height } = Dimensions.get('window');

  const isSmall = useMemo(() => height <= 700 || width <= 360, [height, width]);
  const isVerySmall = useMemo(() => height <= 640 || width <= 340, [height, width]);

  const [step, setStep] = useState<Step>(0);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateY = useRef(new Animated.Value(0)).current;

  const animateToStep = (next: Step) => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 10,
        duration: 140,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(next);
      contentTranslateY.setValue(10);

      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const onSkip = () => navigation.replace('MainTabs');

  const onNext = () => {
    if (step < 2) animateToStep((step + 1) as Step);
    else navigation.replace('MainTabs');
  };

  const data = STEPS[step];

  const cardW = Math.min(width * 0.88, 360);
  const cardPad = isVerySmall ? 14 : 16;
  const titleSize = isVerySmall ? 16 : isSmall ? 17 : 18;
  const textSize = isVerySmall ? 11.5 : isSmall ? 12 : 12.5;
  const btnH = isVerySmall ? 46 : 52;

  const heroMaxH = isVerySmall ? height * 0.48 : isSmall ? height * 0.52 : height * 0.58;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <Pressable onPress={onSkip} hitSlop={10} style={styles.skipPill}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
              paddingBottom: 18 + LIFT_PX, 
            },
          ]}
        >
          <Animated.Image
            source={data.image}
            resizeMode="contain"
            style={[
              styles.hero,
              {
                width,
                maxHeight: heroMaxH,
              },
            ]}
          />

          <View style={[styles.card, { width: cardW, padding: cardPad }]}>
            <Text style={[styles.cardTitle, { fontSize: titleSize }]} numberOfLines={2}>
              {data.title}
            </Text>

            <Text style={[styles.cardText, { fontSize: textSize }]}>{data.text}</Text>

            <View style={styles.dotsRow}>
              <View style={[styles.dot, step === 0 && styles.dotActive]} />
              <View style={[styles.dot, step === 1 && styles.dotActive]} />
              <View style={[styles.dot, step === 2 && styles.dotActive]} />
            </View>

            <Pressable
              onPress={onNext}
              style={({ pressed }) => [
                styles.primaryBtn,
                { height: btnH, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              <Text style={styles.primaryBtnText}>{data.button}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  topRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    alignItems: 'flex-end',
  },
  skipPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  skipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  hero: {
    alignSelf: 'center',
    marginBottom: 10,
  },

  card: {
    backgroundColor: '#D7E35A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  cardTitle: {
    color: '#2E4B22',
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },

  cardText: {
    color: 'rgba(0,0,0,0.78)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 10,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 26,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  dotActive: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  primaryBtn: {
    borderRadius: 12,
    backgroundColor: '#6DA9E8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
