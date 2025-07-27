import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { COLORS } from '../constants';

import { NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  ModeSelection: undefined;
  Challenge: undefined;
  Infinite: undefined;
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
          
          {/* Hamburger Menu */}
          <TouchableOpacity 
            style={[styles.menuButton, showMenu && styles.menuButtonActive]}
            onPress={() => {
              Vibration.vibrate(50);
              setShowMenu(!showMenu);
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons 
              name={showMenu ? "close" : "more-vert"} 
              size={24} 
              color={showMenu ? COLORS.PRIMARY : COLORS.TEXT.PRIMARY} 
            />
          </TouchableOpacity>
        </View>
        
      </View>

      {/* Full Screen Menu Overlay */}
      {showMenu && (
        <>
          <Animated.View 
            style={[
              styles.fullScreenOverlay,
              {
                opacity: fadeAnim,
              }
            ]}
          >
            <TouchableOpacity 
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          </Animated.View>
          <Animated.View style={[
            styles.centeredMenu,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}>
              <TouchableOpacity 
                style={[styles.menuItem, styles.dangerMenuItem]}
                onPress={() => {
                  Vibration.vibrate(100);
                  setShowMenu(false);
                  Alert.alert(
                    '🛑 ゲーム中断',
                    'ゲームを中断してメニューに戻りますか？\n\n現在の進行状況は保存されません。',
                    [
                      { 
                        text: 'キャンセル', 
                        style: 'cancel',
                        onPress: () => {
                          Vibration.vibrate(30);
                        }
                      },
                      { 
                        text: '中断する', 
                        style: 'destructive',
                        onPress: () => {
                          Vibration.vibrate(200);
                          navigation.navigate('ModeSelection');
                        }
                      },
                    ],
                    { cancelable: false },
                  );
                }}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="exit-to-app" size={22} color={COLORS.DANGER} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemText, styles.dangerText]}>ゲーム中断</Text>
                  <Text style={styles.menuItemSubtext}>メニューに戻る</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, styles.lastMenuItem]}
                onPress={() => {
                  Vibration.vibrate(50);
                  setShowMenu(false);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemIcon}>
                  <MaterialIcons name="close" size={22} color={COLORS.TEXT.SECONDARY} />
                </View>
                <View style={styles.menuItemContent}>
                  <Text style={styles.menuItemText}>閉じる</Text>
                  <Text style={styles.menuItemSubtext}>ゲームを続ける</Text>
                </View>
              </TouchableOpacity>
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
  // Menu Styles
  menuButton: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  menuButtonActive: {
    backgroundColor: '#E3F2FD',
    transform: [{ scale: 0.95 }],
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
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
    width: 280,
    marginLeft: -140,
    marginTop: -120,
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 25,
    zIndex: 1000,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'transparent',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(208, 2, 27, 0.02)',
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuItemText: {
    fontSize: 18,
    color: COLORS.TEXT.PRIMARY,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  menuItemSubtext: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '400',
  },
  dangerText: {
    color: COLORS.DANGER,
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