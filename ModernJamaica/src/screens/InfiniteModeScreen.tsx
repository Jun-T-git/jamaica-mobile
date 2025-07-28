import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useGameStore } from '../store/gameStore';
import { UltraSimpleBoard } from '../components/UltraSimpleBoard';
import { GameStatus } from '../types';
import { COLORS, ModernDesign } from '../constants';

import { NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  ModeSelection: undefined;
  Challenge: undefined;
  Infinite: undefined;
  ChallengeResult: {
    finalScore: number;
    isNewHighScore: boolean;
    previousHighScore: number;
  };
};

interface InfiniteModeScreenProps {
  navigation: NavigationProp<RootStackParamList>;
}

export const InfiniteModeScreen: React.FC<InfiniteModeScreenProps> = ({ navigation }) => {
  const {
    targetNumber,
    gameStatus,
    infiniteStats,
    currentProblem,
    generateNewProblem,
    updateInfiniteStats,
  } = useGameStore();

  const [showMenu, setShowMenu] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [successAnim] = useState(new Animated.Value(0));
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentProblem]);

  // Menu animation effects
  useEffect(() => {
    if (showMenu) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showMenu, fadeAnim, scaleAnim]);

  // Track if we've processed correct answer for current problem
  const correctProcessedRef = useRef(false);
  
  // Handle correct answer
  useEffect(() => {
    if (gameStatus === GameStatus.CORRECT && !correctProcessedRef.current) {
      correctProcessedRef.current = true;
      
      const timeSpent = (Date.now() - startTimeRef.current) / 1000;
      updateInfiniteStats(true, timeSpent);
      
      // 成功アニメーションと触覚フィードバック
      Vibration.vibrate([0, 50, 100, 50]);
      
      // 成功アニメーション
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          delay: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        generateNewProblem();
        correctProcessedRef.current = false;
      });
    }
  }, [gameStatus, updateInfiniteStats, generateNewProblem, successAnim]);
  
  // Reset flag when problem changes
  useEffect(() => {
    if (gameStatus !== GameStatus.CORRECT) {
      correctProcessedRef.current = false;
    }
  }, [gameStatus]);



  if (!infiniteStats) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>連続正解</Text>
            <Text style={styles.statValue}>{infiniteStats.currentStreak}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>最高記録</Text>
            <Text style={styles.statValue}>{infiniteStats.longestStreak}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>平均時間</Text>
            <Text style={styles.statValue}>{Math.round(infiniteStats.averageTime)}秒</Text>
          </View>
          
          {/* Game Menu */}
          <TouchableOpacity 
            style={[styles.gameMenuButton, showMenu && styles.gameMenuButtonActive]}
            onPress={() => {
              Vibration.vibrate(50);
              setShowMenu(!showMenu);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.menuIconContainer}>
              <MaterialIcons 
                name={showMenu ? "close" : "menu"} 
                size={20} 
                color={ModernDesign.colors.text.primary} 
              />
            </View>
          </TouchableOpacity>
        </View>
        
      </View>

      {/* Professional Puzzle Game Pause Overlay */}
      {showMenu && (
        <>
          {/* Enhanced Backdrop with Blur Effect */}
          <Animated.View
            style={[
              styles.pauseBackdrop,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          </Animated.View>
          
          {/* Central Pause Menu Card */}
          <Animated.View
            style={[
              styles.pauseMenuCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Pause Icon Header */}
            <View style={styles.pauseHeader}>
              <View style={styles.pauseIconContainer}>
                <MaterialIcons
                  name="pause-circle-filled"
                  size={48}
                  color={ModernDesign.colors.accent.neon}
                />
              </View>
              <Text style={styles.pauseTitle}>練習を一時停止</Text>
            </View>

            {/* Action Buttons Grid */}
            <View style={styles.pauseActions}>
              {/* Resume - Primary Action */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.resumeButton]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setShowMenu(false);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="play-arrow"
                    size={32}
                    color={ModernDesign.colors.background.primary}
                  />
                </View>
                <Text style={styles.resumeButtonText}>続ける</Text>
              </TouchableOpacity>

              {/* Reset Statistics */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.secondaryButton]}
                onPress={() => {
                  Vibration.vibrate(75);
                  setShowMenu(false);
                  Alert.alert(
                    '統計リセット',
                    '練習の統計情報をリセットしますか？\n\n⚠️ 現在の記録が失われます',
                    [
                      {
                        text: 'キャンセル',
                        style: 'cancel',
                        onPress: () => Vibration.vibrate(30),
                      },
                      {
                        text: 'リセット',
                        style: 'destructive',
                        onPress: () => {
                          Vibration.vibrate(100);
                          // Add reset statistics logic here
                          setShowMenu(false);
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="refresh"
                    size={28}
                    color={ModernDesign.colors.text.primary}
                  />
                </View>
                <Text style={styles.secondaryButtonText}>統計リセット</Text>
              </TouchableOpacity>

              {/* Quit Game */}
              <TouchableOpacity
                style={[styles.pauseButton, styles.quitButton]}
                onPress={() => {
                  Vibration.vibrate(100);
                  setShowMenu(false);
                  Alert.alert(
                    '練習中断',
                    '練習を中断してメインメニューに戻りますか？\n\n✨ 統計情報が保存されます',
                    [
                      {
                        text: 'キャンセル',
                        style: 'cancel',
                        onPress: () => Vibration.vibrate(30),
                      },
                      {
                        text: '終了する',
                        style: 'destructive',
                        onPress: () => {
                          Vibration.vibrate(200);
                          navigation.goBack();
                        },
                      },
                    ],
                    { cancelable: false },
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.pauseButtonIcon}>
                  <MaterialIcons
                    name="home"
                    size={28}
                    color={ModernDesign.colors.error}
                  />
                </View>
                <Text style={styles.quitButtonText}>終了</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}

      <UltraSimpleBoard 
        gameInfo={{
          target: targetNumber,
          instruction: '最初の数字をタップしてください',
        }}
      />

      {/* Success Feedback Overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            opacity: successAnim,
            transform: [
              {
                scale: successAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <View style={styles.successContent}>
          <MaterialIcons name="check-circle" size={80} color={COLORS.SUCCESS} />
          <Text style={styles.successText}>正解！</Text>
        </View>
      </Animated.View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.CARD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Game Menu Styles
  gameMenuButton: {
    borderRadius: ModernDesign.borderRadius.full,
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    ...ModernDesign.shadows.base,
  },
  gameMenuButtonActive: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    transform: [{ scale: 0.95 }],
    ...ModernDesign.shadows.glow,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    zIndex: 999,
  },
  centeredMenu: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 300,
    marginLeft: -150,
    marginTop: -140,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.xl,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernDesign.spacing[6],
    paddingVertical: ModernDesign.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: ModernDesign.colors.border.subtle,
    backgroundColor: 'transparent',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(255, 107, 107, 0.05)',
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: ModernDesign.typography.fontSize.lg,
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
    marginBottom: ModernDesign.spacing[1],
  },
  menuItemSubtext: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.normal,
  },
  dangerText: {
    color: ModernDesign.colors.error,
  },
  // Professional Puzzle Game Pause Menu
  pauseBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 14, 26, 0.85)',
    zIndex: 999,
  },
  pauseMenuCard: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 320,
    marginLeft: -160,
    marginTop: -140,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.xl,
    zIndex: 1000,
    paddingVertical: ModernDesign.spacing[8],
    paddingHorizontal: ModernDesign.spacing[6],
  },
  pauseHeader: {
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[8],
  },
  pauseIconContainer: {
    marginBottom: ModernDesign.spacing[3],
    opacity: 0.9,
  },
  pauseTitle: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  pauseActions: {
    gap: ModernDesign.spacing[4],
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: ModernDesign.spacing[4],
    paddingHorizontal: ModernDesign.spacing[6],
    borderRadius: ModernDesign.borderRadius.xl,
    borderWidth: 2,
    ...ModernDesign.shadows.base,
  },
  resumeButton: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.glow,
  },
  secondaryButton: {
    backgroundColor: ModernDesign.colors.background.secondary,
    borderColor: ModernDesign.colors.border.medium,
  },
  quitButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: ModernDesign.colors.error,
  },
  pauseButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  resumeButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.background.primary,
    textAlign: 'center',
  },
  secondaryButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.text.primary,
    textAlign: 'center',
  },
  quitButtonText: {
    flex: 1,
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.error,
    textAlign: 'center',
  },
  // Success Feedback Styles
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  successContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginTop: 10,
  },
});