import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

type Q = {
  id: string;
  q: string;
  options: [string, string, string];
  correctIndex: 0 | 1 | 2;
};

type Phase = 'intro' | 'quiz';

const BG = require('../assets/background.png');
const HERO = require('../assets/onboard1.png');
const ICON_PAUSE = require('../assets/pause.png');

const LEVELS_TOTAL = 10;
const QUESTIONS_PER_LEVEL = 10;
const ROUND_TIME_SEC = 30;

const QUESTION_BANK: Q[] = [
  { id: 'q1', q: 'Which bird is most closely associated with the “honk” call and often travels in V-shaped flocks?', options: ['Duck', 'Goose', 'Sparrow'], correctIndex: 1 },
  { id: 'q2', q: 'Which bird is famous for its ability to rotate its head far more than most other birds?', options: ['Owl', 'Chicken', 'Swan'], correctIndex: 0 },
  { id: 'q3', q: 'Which bird is most likely to be seen swimming on ponds and dabbling for food near the surface?', options: ['Eagle', 'Duck', 'Woodpecker'], correctIndex: 1 },
  { id: 'q4', q: 'Which bird is best known for powerful soaring flight and keen eyesight used for hunting?', options: ['Eagle', 'Titmouse', 'Goose'], correctIndex: 0 },
  { id: 'q5', q: 'Which bird is most commonly kept for eggs and is found on farms worldwide?', options: ['Chicken', 'Flamingo', 'Hawk'], correctIndex: 0 },
  { id: 'q6', q: 'Which bird is best known for having a bright pink coloration in many species due to its diet?', options: ['Parrot', 'Flamingo', 'Penguin'], correctIndex: 1 },
  { id: 'q7', q: 'Which bird is most strongly associated with pecking tree trunks to find insects?', options: ['Swan', 'Woodpecker', 'Goose'], correctIndex: 1 },
  { id: 'q8', q: 'Which bird is often used as a symbol of peace and is commonly depicted in art as white?', options: ['Pelican', 'Dove', 'Crow'], correctIndex: 1 },
  { id: 'q9', q: 'Which bird is flightless and adapted for swimming with flipper-like wings?', options: ['Penguin', 'Peacock', 'Sparrow'], correctIndex: 0 },
  { id: 'q10', q: 'Which bird is known for a large, colorful tail display used in courtship?', options: ['Goose', 'Peacock', 'Duck'], correctIndex: 1 },

  { id: 'q11', q: 'Which bird commonly mimics sounds and human speech better than many other birds?', options: ['Parrot', 'Eagle', 'Turkey'], correctIndex: 0 },
  { id: 'q12', q: 'Which bird is a raptor that is active mostly at night and hunts using silent flight?', options: ['Swan', 'Owl', 'Chicken'], correctIndex: 1 },
  { id: 'q13', q: 'Which bird often builds large nests on rooftops or tall structures and is linked with wetlands?', options: ['Stork', 'Titmouse', 'Penguin'], correctIndex: 0 },
  { id: 'q14', q: 'Which bird is especially known for long migrations and catching insects in flight with fast turns?', options: ['Swallow', 'Chicken', 'Vulture'], correctIndex: 0 },
  { id: 'q15', q: 'Which bird is commonly seen in cities, is highly intelligent, and belongs to the corvid family?', options: ['Pelican', 'Crow', 'Flamingo'], correctIndex: 1 },
  { id: 'q16', q: 'Which bird has a broad, flat bill adapted for filtering or grabbing food from water?', options: ['Duck', 'Eagle', 'Owl'], correctIndex: 0 },
  { id: 'q17', q: 'Which bird is most associated with a deep “gobble” sound and is often seen in festive meals in some countries?', options: ['Turkey', 'Swan', 'Dove'], correctIndex: 0 },
  { id: 'q18', q: 'Which bird is known for standing on one leg and feeding in shallow water by sweeping its bill?', options: ['Flamingo', 'Hawk', 'Sparrow'], correctIndex: 0 },
  { id: 'q19', q: 'Which bird is a large seabird famous for a throat pouch used when catching fish?', options: ['Titmouse', 'Pelican', 'Peacock'], correctIndex: 1 },
  { id: 'q20', q: 'Which bird is small, often yellow-and-blue in Europe, and frequently visits feeders in winter?', options: ['Goose', 'Eagle', 'Titmouse'], correctIndex: 2 },
  { id: 'q21', q: 'Which bird is best known for gliding on water with a long neck and is often found on lakes?', options: ['Swan', 'Woodpecker', 'Parrot'], correctIndex: 0 },
  { id: 'q22', q: 'Which bird hunts by circling high on rising air currents and is often a scavenger?', options: ['Vulture', 'Duck', 'Robin'], correctIndex: 0 },
  { id: 'q23', q: 'Which bird is known for a red breast in many regions and often appears in winter-themed imagery?', options: ['Robin', 'Penguin', 'Stork'], correctIndex: 0 },
  { id: 'q24', q: 'Which bird is typically associated with strong legs, a long bill, and catching fish while standing still in water?', options: ['Heron', 'Turkey', 'Dove'], correctIndex: 0 },
  { id: 'q25', q: 'Which bird group is best known for exceptionally sharp talons used to grab prey?', options: ['Raptors', 'Songbirds', 'Waterfowl'], correctIndex: 0 },
  { id: 'q26', q: 'Which bird’s streamlined body and webbed feet make it especially adapted for swimming?', options: ['Woodpecker', 'Duck', 'Hawk'], correctIndex: 1 },
  { id: 'q27', q: 'Which bird is commonly described as having iridescent green-blue plumage and a fan-shaped tail display?', options: ['Peacock', 'Goose', 'Sparrow'], correctIndex: 0 },
  { id: 'q28', q: 'Which bird is most likely to be kept as a domestic bird that crows at dawn?', options: ['Swan', 'Rooster', 'Pelican'], correctIndex: 1 },
  { id: 'q29', q: 'Which bird is best known for catching insects at dusk with rapid, acrobatic flight and long wings?', options: ['Swallow', 'Chicken', 'Penguin'], correctIndex: 0 },
  { id: 'q30', q: 'Which bird is widely considered one of the most powerful fliers for long-distance ocean travel, using dynamic soaring?', options: ['Albatross', 'Titmouse', 'Duck'], correctIndex: 0 },
];

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLevelQuestions(bank: Q[], count: number) {
  if (bank.length <= count) return shuffle(bank).slice(0, count);
  const picked = shuffle(bank).slice(0, count);
  return shuffle(picked);
}

export default function QuizScreen() {
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 720 || width <= 360;

  const [phase, setPhase] = useState<Phase>('intro');

  const [level, setLevel] = useState(1);
  const [roundQuestions, setRoundQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);

  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_TIME_SEC);
  const [paused, setPaused] = useState(false);

  const [showResult, setShowResult] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const appear = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const question = roundQuestions[index];

  useFocusEffect(
    useCallback(() => {
      setPhase('intro');
      resetAll();
      runAppear();
    }, [])
  );

  const runAppear = () => {
    appear.setValue(0);
    Animated.timing(appear, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  const runCardIn = () => {
    cardAnim.setValue(0);
    Animated.timing(cardAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  const openModal = () => {
    modalAnim.setValue(0);
    Animated.timing(modalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const resetLevelState = () => {
    setRoundQuestions([]);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setLocked(false);
    setRoundTimeLeft(ROUND_TIME_SEC);
    setPaused(false);
    setShowLevelComplete(false);
  };

  const resetAll = () => {
    setLevel(1);
    resetLevelState();
    setShowResult(false);
  };

  const startLevel = (nextLevel: number) => {
    const picked = buildLevelQuestions(QUESTION_BANK, QUESTIONS_PER_LEVEL);
    setRoundQuestions(picked);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setLocked(false);
    setRoundTimeLeft(ROUND_TIME_SEC);
    setPaused(false);
    setShowLevelComplete(false);
    setShowResult(false);
    setLevel(nextLevel);
    setPhase('quiz');
    runAppear();
    runCardIn();
  };

  const finishLevelOrGame = () => {
    if (level < LEVELS_TOTAL) {
      setShowLevelComplete(true);
      openModal();
    } else {
      setShowResult(true);
      openModal();
    }
  };

  useEffect(() => {
    if (phase !== 'quiz') return;
    if (!roundQuestions.length) return;
    if (paused) return;
    if (showResult || showLevelComplete) return;

    if (roundTimeLeft <= 0) {
      setLocked(true);
      finishLevelOrGame();
      return;
    }

    const t = setTimeout(() => setRoundTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, roundQuestions.length, paused, showResult, showLevelComplete, roundTimeLeft]);

  const onSelect = (optionIndex: number) => {
    if (paused || showResult || showLevelComplete) return;
    if (!question) return;

    setLocked(true);
    const isCorrect = optionIndex === question.correctIndex;
    setSelected(optionIndex);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      const lastQuestion = index + 1 >= roundQuestions.length && roundQuestions.length > 0;

      if (lastQuestion) {
        finishLevelOrGame();
      } else {
        setIndex(prev => prev + 1);
        setSelected(null);
        setLocked(false);
        runCardIn();
      }
    }, 550);
  };

  const contentW = Math.min(width - 40, 400);
  const heroH = isSmall ? height * 0.35 : 340;
  const androidTopPadding = Platform.OS === 'android' ? 20 : 0;

  const headerTitle = useMemo(() => {
    if (phase === 'intro') return 'Bird Quiz';
    return `Level ${level} • Q ${index + 1}/${QUESTIONS_PER_LEVEL}`;
  }, [phase, level, index]);

  const timeLabel = `${roundTimeLeft}s`;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[styles.header, { height: isSmall ? 50 : 60 }, Platform.OS === 'android' && { marginTop: 10 }]}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>

          {phase === 'quiz' && (
            <View style={styles.headerRight}>
              <View style={styles.timerPill}>
                <Text style={styles.timerText}>{timeLabel}</Text>
              </View>
              <Pressable
                onPress={() => {
                  setPaused(true);
                  openModal();
                }}
                style={styles.pauseBtn}
              >
                <Image source={ICON_PAUSE} style={styles.pauseIcon} />
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 15 + androidTopPadding }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: appear, alignItems: 'center', width: '100%' }}>
            {phase === 'intro' ? (
              <View style={styles.contentInner}>
                <Image source={HERO} style={{ width: contentW, height: heroH }} resizeMode="contain" />
                <View style={[styles.card, { width: contentW }]}>
                  <Text style={styles.cardText}>
                    10 levels. 10 questions each. You have 30 seconds per level (round) to answer as many questions as you can.
                  </Text>
                  <Pressable onPress={() => startLevel(1)} style={styles.mainBtn}>
                    <Text style={styles.mainBtnText}>Start</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.contentInner}>
                <Animated.View
                  style={[
                    styles.card,
                    {
                      width: contentW,
                      opacity: cardAnim,
                      transform: [
                        {
                          translateY: cardAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [10, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text style={styles.questionText}>{question?.q}</Text>
                </Animated.View>

                <View style={[styles.optionsWrap, { width: contentW }]}>
                  {question?.options.map((opt: string, i: number) => {
                    let bg = '#B9DDF7';
                    let textCol = '#0B2F56';

                    if (locked) {
                      if (i === question.correctIndex) {
                        bg = '#42B34A';
                        textCol = '#fff';
                      } else if (selected === i) {
                        bg = '#E02424';
                        textCol = '#fff';
                      }
                    }

                    return (
                      <Pressable
                        key={`${question.id}_${i}`}
                        onPress={() => onSelect(i)}
                        disabled={locked || paused || showResult || showLevelComplete || roundTimeLeft <= 0}
                        style={[styles.optionBtn, { backgroundColor: bg, opacity: roundTimeLeft <= 0 ? 0.7 : 1 }]}
                      >
                        <Text style={[styles.optionText, { color: textCol }]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.levelHint, { width: contentW }]}>
                  Score: {score} • Time: {timeLabel}
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {(paused || showLevelComplete || showResult) && (
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: modalAnim,
                  transform: [
                    {
                      scale: modalAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.modalTitle}>
                {showResult ? 'All Levels Complete' : showLevelComplete ? `Level ${level} Complete` : 'Paused'}
              </Text>

              {(showLevelComplete || showResult) && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>
                    {showResult ? `Final Level Score: ${score}/${QUESTIONS_PER_LEVEL}` : `Level Score: ${score}/${QUESTIONS_PER_LEVEL}`}
                  </Text>
                </View>
              )}

              {paused && !showLevelComplete && !showResult && (
                <Pressable
                  onPress={() => {
                    setPaused(false);
                  }}
                  style={styles.modalOkBtn}
                >
                  <Text style={styles.modalOkText}>Resume</Text>
                </Pressable>
              )}

              {showLevelComplete && (
                <Pressable
                  onPress={() => {
                    const next = level + 1;
                    startLevel(next);
                  }}
                  style={styles.modalOkBtn}
                >
                  <Text style={styles.modalOkText}>Next Level</Text>
                </Pressable>
              )}

              {showResult && (
                <Pressable
                  onPress={() => {
                    setPhase('intro');
                    resetAll();
                    runAppear();
                  }}
                  style={styles.modalOkBtn}
                >
                  <Text style={styles.modalOkText}>Back to Menu</Text>
                </Pressable>
              )}

              {(paused || showLevelComplete) && (
                <Pressable
                  onPress={() => {
                    setPhase('intro');
                    resetAll();
                    runAppear();
                  }}
                  style={styles.modalSecondaryBtn}
                >
                  <Text style={styles.modalSecondaryText}>Exit</Text>
                </Pressable>
              )}
            </Animated.View>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#163B0F', fontWeight: '900', fontSize: 18 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerPill: { backgroundColor: '#8CCBFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  timerText: { fontWeight: '900', color: '#0B2F56' },
  pauseBtn: { backgroundColor: '#163B0F', padding: 6, borderRadius: 8 },
  pauseIcon: { width: 18, height: 18, tintColor: '#fff' },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 60,
  },
  contentInner: { alignItems: 'center', width: '100%' },
  card: { backgroundColor: '#D8D23A', padding: 18, borderRadius: 20, marginBottom: 15 },
  cardText: { color: '#163B0F', fontWeight: '800', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  questionText: { color: '#163B0F', fontWeight: '900', fontSize: 17, textAlign: 'center' },
  mainBtn: { backgroundColor: '#B9DDF7', marginTop: 15, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  mainBtnText: { color: '#0B2F56', fontWeight: '900', fontSize: 18 },
  optionsWrap: { gap: 10 },
  optionBtn: { height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  optionText: { fontWeight: '900', fontSize: 18 },
  levelHint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#E9F3FF',
    fontWeight: '900',
  },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#163B0F', marginBottom: 10 },
  scoreContainer: { backgroundColor: '#E9F3FF', padding: 15, borderRadius: 15, marginBottom: 16, width: '100%', alignItems: 'center' },
  scoreText: { fontSize: 18, fontWeight: '800', color: '#0B2F56' },
  modalOkBtn: { backgroundColor: '#163B0F', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  modalOkText: { fontWeight: '900', color: '#fff' },
  modalSecondaryBtn: { marginTop: 10, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12, backgroundColor: '#B9DDF7' },
  modalSecondaryText: { fontWeight: '900', color: '#0B2F56' },
});
