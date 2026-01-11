import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const QUESTIONS: Q[] = [
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
];

function pickRandom10(list: Q[]) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, 10);
}
export default function QuizScreen() {
  const { width, height } = Dimensions.get('window');
  const isSmall = height <= 720 || width <= 360;

  const [phase, setPhase] = useState<Phase>('intro');
  const [roundQuestions, setRoundQuestions] = useState<Q[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [paused, setPaused] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const appear = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  const question = roundQuestions[index];

  useFocusEffect(
    useCallback(() => {
      setPhase('intro');
      resetRoundState();
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

  const resetRoundState = () => {
    setRoundQuestions([]);
    setIndex(0);
    setScore(0);
    setSelected(null);
    setLocked(false);
    setTimeLeft(30);
    setPaused(false);
    setShowResult(false);
  };

  const startRound = () => {
    const picked = pickRandom10(QUESTIONS);
    setRoundQuestions(picked);
    setIndex(0);
    setScore(0);
    setPhase('quiz');
    runAppear();
    runCardIn();
  };

  useEffect(() => {
    if (phase !== 'quiz' || !question || paused || locked || showResult) return;
    if (timeLeft <= 0) { onSelect(-1); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, question, paused, locked, showResult, timeLeft]);

  const onSelect = (optionIndex: number) => {
    if (locked || paused || showResult) return;
    setLocked(true);
    const isCorrect = optionIndex === question?.correctIndex;
    setSelected(optionIndex >= 0 ? optionIndex : null);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (index + 1 >= roundQuestions.length && roundQuestions.length > 0) {
        setShowResult(true);
        Animated.timing(modalAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      } else {
        setIndex(prev => prev + 1);
        setSelected(null);
        setLocked(false);
        setTimeLeft(30);
        runCardIn();
      }
    }, 650);
  };

  const contentW = Math.min(width - 40, 400);
  const heroH = isSmall ? height * 0.35 : 340;
  const androidTopPadding = Platform.OS === 'android' ? 20 : 0;

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={[
          styles.header, 
          { height: isSmall ? 50 : 60 },
          Platform.OS === 'android' && { marginTop: 10 } 
        ]}>
          <Text style={styles.headerTitle}>
            {phase === 'intro' ? 'Bird Quiz' : `Q: ${index + 1}/10`}
          </Text>
          {phase === 'quiz' && (
            <View style={styles.headerRight}>
              <View style={styles.timerPill}><Text style={styles.timerText}>{timeLeft}s</Text></View>
              <Pressable onPress={() => { setPaused(true); modalAnim.setValue(1); }} style={styles.pauseBtn}>
                <Image source={ICON_PAUSE} style={styles.pauseIcon} />
              </Pressable>
            </View>
          )}
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: 15 + androidTopPadding } 
          ]} 
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View style={{ opacity: appear, alignItems: 'center', width: '100%' }}>
            {phase === 'intro' ? (
              <View style={styles.contentInner}>
                <Image source={HERO} style={{ width: contentW, height: heroH }} resizeMode="contain" />
                <View style={[styles.card, { width: contentW }]}>
                  <Text style={styles.cardText}>
                    Test your avian knowledge! 10 random questions, 30 seconds each. Can you identify them all?
                  </Text>
                  <Pressable onPress={startRound} style={styles.mainBtn}>
                    <Text style={styles.mainBtnText}>Start Quiz</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.contentInner}>
                <Animated.View style={[styles.card, { width: contentW, opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0,1], outputRange: [10, 0]}) }] }]}>
                  <Text style={styles.questionText}>{question?.q}</Text>
                </Animated.View>

                <View style={[styles.optionsWrap, { width: contentW }]}>
                  {question?.options.map((opt: string, i: number) => {
                    let bg = '#B9DDF7';
                    let textCol = '#0B2F56';
                    if (locked) {
                      if (i === question.correctIndex) { bg = '#42B34A'; textCol = '#fff'; }
                      else if (selected === i) { bg = '#E02424'; textCol = '#fff'; }
                    }
                    return (
                      <Pressable 
                        key={i} 
                        onPress={() => onSelect(i)} 
                        disabled={locked}
                        style={[styles.optionBtn, { backgroundColor: bg }]}
                      >
                        <Text style={[styles.optionText, { color: textCol }]}>{opt}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {(paused || showResult) && (
          <View style={styles.overlay}>
            <Animated.View style={[styles.modalCard, { opacity: modalAnim, transform: [{ scale: modalAnim.interpolate({ inputRange:[0,1], outputRange:[0.9, 1]}) }] }]}>
              <Text style={styles.modalTitle}>{showResult ? 'Quiz Finished' : 'Paused'}</Text>
              {showResult && (
                <View style={styles.scoreContainer}>
                   <Text style={styles.scoreText}>Your Score: {score}/10</Text>
                </View>
              )}
              <Pressable 
                onPress={() => {
                  if (showResult) setPhase('intro');
                  setPaused(false);
                  setShowResult(false);
                }} 
                style={styles.modalOkBtn}
              >
                <Text style={styles.modalOkText}>{showResult ? 'Ok' : 'Resume'}</Text>
              </Pressable>
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
  
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard: { backgroundColor: '#fff', padding: 25, borderRadius: 20, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#163B0F', marginBottom: 10 },
  scoreContainer: { backgroundColor: '#E9F3FF', padding: 15, borderRadius: 15, marginBottom: 20, width: '100%', alignItems: 'center' },
  scoreText: { fontSize: 18, fontWeight: '800', color: '#0B2F56' },
  modalOkBtn: { backgroundColor: '#163B0F', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 12 },
  modalOkText: { fontWeight: '900', color: '#fff' }
});