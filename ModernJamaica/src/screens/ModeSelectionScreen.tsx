import React, { useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Logo } from '../components/atoms/Logo';
import { Typography } from '../components/atoms/Typography';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { GameMode, DifficultyLevel } from '../types';
import { soundManager, SoundType } from '../utils/SoundManager';

interface ModeSelectionScreenProps {
  navigation: any;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  navigation,
}) => {
  const { loadStoredData, highScores } = useGameStore();

  useEffect(() => {
    loadStoredData();
  }, [loadStoredData]);

  const handleModeSelect = (mode: GameMode) => {
    // ゲームモード選択ボタン効果音
    soundManager.play(SoundType.BUTTON);
    
    // 難易度選択画面へ遷移
    navigation.navigate('DifficultySelection', { mode });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ModernDesign.colors.background.primary}
      />

      {/* Header with logo and typography */}
      <View style={styles.header}>
        <Logo size={100} style={styles.logo} />
        <Typography variant="h4" textAlign="center" style={styles.title}>
          ジャマイカの木
        </Typography>
        <Typography
          variant="body1"
          color="secondary"
          textAlign="center"
          style={styles.subtitle}
        >
          数字をつなげる計算パズル
        </Typography>
      </View>

      {/* Game Mode Selection */}
      <View style={styles.modesContainer}>
        {/* Challenge Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.CHALLENGE)}
          style={styles.modeButton}
          activeOpacity={0.8}
        >
          <View style={styles.modeContent}>
            <View style={styles.modeIconContainer}>
              <MaterialIcons
                name="timer"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextContainer}>
              <Typography variant="h4" style={styles.modeTitle}>
                チャレンジモード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                style={styles.modeDescription}
              >
                時間制限内に何問解けるか挑戦
              </Typography>
            </View>
            <View style={styles.modeArrow}>
              <MaterialIcons
                name="arrow-forward-ios"
                size={20}
                color={ModernDesign.colors.text.tertiary}
              />
            </View>
          </View>
          {highScores.challenge[DifficultyLevel.NORMAL] > 0 && (
            <View style={styles.statsBadge}>
              <MaterialIcons
                name="emoji-events"
                size={16}
                color={ModernDesign.colors.accent.gold}
              />
              <Typography
                variant="caption"
                color="secondary"
                style={styles.statsText}
              >
                ベスト: {highScores.challenge[DifficultyLevel.NORMAL].toLocaleString()}点
              </Typography>
            </View>
          )}
        </TouchableOpacity>

        {/* Infinite Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.INFINITE)}
          style={styles.modeButton}
          activeOpacity={0.8}
        >
          <View style={styles.modeContent}>
            <View style={styles.modeIconContainer}>
              <MaterialIcons
                name="all-inclusive"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextContainer}>
              <Typography variant="h4" style={styles.modeTitle}>
                練習モード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                style={styles.modeDescription}
              >
                自分のペースでじっくり練習
              </Typography>
            </View>
            <View style={styles.modeArrow}>
              <MaterialIcons
                name="arrow-forward-ios"
                size={20}
                color={ModernDesign.colors.text.tertiary}
              />
            </View>
          </View>
          {highScores.infinite[DifficultyLevel.NORMAL] > 0 && (
            <View style={styles.statsBadge}>
              <MaterialIcons
                name="local-fire-department"
                size={16}
                color={ModernDesign.colors.accent.coral}
              />
              <Typography
                variant="caption"
                color="secondary"
                style={styles.statsText}
              >
                ベスト: {highScores.infinite[DifficultyLevel.NORMAL]}問
              </Typography>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* バナー広告 */}
      <BannerAdView style={styles.bannerAd} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  header: {
    paddingTop: ModernDesign.spacing[16],
    paddingBottom: ModernDesign.spacing[12],
    paddingHorizontal: ModernDesign.spacing[6],
    alignItems: 'center',
  },
  logo: {
    marginBottom: ModernDesign.spacing[4],
  },
  title: {
    marginBottom: ModernDesign.spacing[2], // マージンを少し縮小
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.black,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: ModernDesign.typography.fontSize.lg,
  },
  modesContainer: {
    flex: 1,
    paddingHorizontal: ModernDesign.spacing[6],
    paddingTop: ModernDesign.spacing[8],
    paddingBottom: ModernDesign.spacing[24], // 広告スペースを確保
    gap: ModernDesign.spacing[4],
  },
  modeButton: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['2xl'],
    padding: ModernDesign.spacing[6],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.base,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ModernDesign.spacing[4],
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    marginBottom: ModernDesign.spacing[1],
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    fontSize: ModernDesign.typography.fontSize['2xl'],
  },
  modeDescription: {
    fontSize: ModernDesign.typography.fontSize.sm,
    lineHeight: ModernDesign.typography.fontSize.sm * 1.3,
  },
  modeArrow: {
    marginLeft: ModernDesign.spacing[2],
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ModernDesign.spacing[4],
    paddingTop: ModernDesign.spacing[4],
    borderTopWidth: 1,
    borderTopColor: ModernDesign.colors.border.subtle,
    gap: ModernDesign.spacing[2],
  },
  statsText: {
    fontSize: ModernDesign.typography.fontSize.xs,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  bannerAd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
