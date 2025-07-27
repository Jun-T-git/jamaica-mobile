import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useGameStore } from '../store/gameStore';
import { GameMode } from '../types';
import { COLORS } from '../constants';

interface ModeSelectionScreenProps {
  navigation: any;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ navigation }) => {
  const { initGame, loadStoredData, challengeHighScore, infiniteStats } = useGameStore();

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const handleModeSelect = (mode: GameMode) => {
    initGame(mode);
    navigation.navigate(mode === GameMode.CHALLENGE ? 'ChallengeMode' : 'InfiniteMode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />
      
      <View style={styles.header}>
        <Text style={styles.title}>モダンジャマイカ</Text>
        <Text style={styles.subtitle}>5つの数字で目標を作ろう！</Text>
      </View>

      <View style={styles.modesContainer}>
        <TouchableOpacity
          style={[styles.modeCard, styles.challengeCard]}
          onPress={() => handleModeSelect(GameMode.CHALLENGE)}
          activeOpacity={0.8}
        >
          <Text style={styles.modeTitle}>チャレンジモード</Text>
          <Text style={styles.modeDescription}>
            時間制限内に何問解けるか挑戦！
          </Text>
          <View style={styles.modeFeatures}>
            <View style={styles.featureRow}>
              <MaterialIcons name="timer" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>制限時間あり</Text>
            </View>
            <View style={styles.featureRow}>
              <MaterialIcons name="gps-fixed" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>スコア競争</Text>
            </View>
            <View style={styles.featureRow}>
              <MaterialIcons name="autorenew" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>リセット機能</Text>
            </View>
          </View>
          {challengeHighScore > 0 && (
            <View style={styles.highScoreContainer}>
              <MaterialIcons name="emoji-events" size={20} color={COLORS.CARD} />
              <Text style={styles.highScoreText}>ハイスコア: {challengeHighScore}問</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeCard, styles.infiniteCard]}
          onPress={() => handleModeSelect(GameMode.INFINITE)}
          activeOpacity={0.8}
        >
          <Text style={styles.modeTitle}>無限に遊ぶモード</Text>
          <Text style={styles.modeDescription}>
            自分のペースでじっくり練習
          </Text>
          <View style={styles.modeFeatures}>
            <View style={styles.featureRow}>
              <MaterialIcons name="all-inclusive" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>時間制限なし</Text>
            </View>
            <View style={styles.featureRow}>
              <MaterialIcons name="bar-chart" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>統計記録</Text>
            </View>
            <View style={styles.featureRow}>
              <MaterialIcons name="lightbulb-outline" size={16} color={COLORS.CARD} />
              <Text style={styles.modeFeature}>ヒント機能</Text>
            </View>
          </View>
          {infiniteStats && infiniteStats.longestStreak > 0 && (
            <View style={styles.highScoreContainer}>
              <MaterialIcons name="local-fire-department" size={20} color={COLORS.CARD} />
              <Text style={styles.highScoreText}>最長連続正解: {infiniteStats.longestStreak}問</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton}>
          <MaterialIcons name="settings" size={20} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.footerButtonText}>設定</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <MaterialIcons name="assessment" size={20} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.footerButtonText}>統計</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton}>
          <MaterialIcons name="info" size={20} color={COLORS.TEXT.SECONDARY} />
          <Text style={styles.footerButtonText}>情報</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT.SECONDARY,
  },
  modesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
    gap: 20,
  },
  modeCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  challengeCard: {
    borderWidth: 2,
    borderColor: COLORS.CHALLENGE_MODE.PRIMARY,
  },
  infiniteCard: {
    borderWidth: 2,
    borderColor: COLORS.INFINITE_MODE.PRIMARY,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 16,
    color: COLORS.TEXT.SECONDARY,
    marginBottom: 16,
  },
  modeFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeFeature: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
  },
  highScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  highScoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.CARD,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  footerButtonText: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
  },
});