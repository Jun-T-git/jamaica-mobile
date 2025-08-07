import React, { useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
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
import { useSettingsStore } from '../store/settingsStore';
import { GameMode } from '../types';
import { soundManager, SoundType } from '../utils/SoundManager';

interface ModeSelectionScreenProps {
  navigation: any;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  navigation,
}) => {
  const { loadStoredData, highScores } = useGameStore();
  const { loadDisplayName, loadSoundSetting, displayName } = useSettingsStore();

  useEffect(() => {
    // ゲームデータを読み込み
    loadStoredData();
    // 表示名を読み込み（未設定の場合は自動生成）
    loadDisplayName();
    // 音声設定を読み込み
    loadSoundSetting();
  }, [loadStoredData, loadDisplayName, loadSoundSetting]);

  useEffect(() => {
    // 表示名の状態をログに出力（デバッグ用）
    console.log('🏠 ModeSelectionScreen: Current displayName:', displayName);
  }, [displayName]);

  const handleModeSelect = (mode: GameMode) => {
    // ゲームモード選択ボタン効果音
    soundManager.play(SoundType.BUTTON);

    // 難易度選択画面へ遷移
    navigation.navigate('DifficultySelection', { mode });
  };

  const handleRankingPress = () => {
    // ボタン効果音
    soundManager.play(SoundType.BUTTON);

    // ランキング画面へ遷移
    navigation.navigate('Ranking');
  };

  const handleSettingsPress = () => {
    // ボタン効果音
    soundManager.play(SoundType.BUTTON);

    // 設定画面へ遷移
    navigation.navigate('Settings');
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
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
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
                  時間内に何問解けるか挑戦
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
          </TouchableOpacity>
        </View>

        {/* セカンダリナビゲーション */}
        <View style={styles.secondaryNavigation}>
          <TouchableOpacity
            onPress={handleRankingPress}
            style={styles.navButton}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="leaderboard"
              size={20}
              color={ModernDesign.colors.text.tertiary}
            />
            <Typography variant="body2" style={styles.navButtonText}>
              スコア
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.navButton}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="settings"
              size={20}
              color={ModernDesign.colors.text.tertiary}
            />
            <Typography variant="body2" style={styles.navButtonText}>
              設定
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* バナー広告 */}
      <BannerAdView style={styles.bannerAd} />
    </SafeAreaView>
  );
};

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  header: {
    paddingTop: isSmallScreen
      ? ModernDesign.spacing[8]
      : ModernDesign.spacing[16],
    paddingBottom: ModernDesign.spacing[4],
    paddingHorizontal: isSmallScreen
      ? ModernDesign.spacing[4]
      : ModernDesign.spacing[6],
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: ModernDesign.spacing[4],
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
    paddingHorizontal: isSmallScreen
      ? ModernDesign.spacing[4]
      : ModernDesign.spacing[6],
    paddingTop: ModernDesign.spacing[8],
    paddingBottom: ModernDesign.spacing[4],
    gap: ModernDesign.spacing[4],
  },
  secondaryNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: isSmallScreen
      ? ModernDesign.spacing[4]
      : ModernDesign.spacing[6],
    paddingTop: ModernDesign.spacing[6],
    paddingBottom: ModernDesign.spacing[6],
    gap: ModernDesign.spacing[3],
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.xl,
    paddingHorizontal: ModernDesign.spacing[5],
    paddingVertical: ModernDesign.spacing[4], // タップしやすくするため縦幅を拡大
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    flex: 1, // 柔軟な幅調整
    maxWidth: 150, // 最大幅を制限
    flexDirection: 'row',
    gap: ModernDesign.spacing[2],
    minHeight: 48, // 最小タップ領域を確保
    ...ModernDesign.shadows.sm,
  },
  navButtonText: {
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    fontSize: ModernDesign.typography.fontSize.sm,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  modeButton: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['2xl'],
    padding: isSmallScreen ? ModernDesign.spacing[4] : ModernDesign.spacing[6],
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
    fontSize: isSmallScreen
      ? ModernDesign.typography.fontSize.xl
      : ModernDesign.typography.fontSize['2xl'],
  },
  modeDescription: {
    fontSize: ModernDesign.typography.fontSize.sm,
    lineHeight: ModernDesign.typography.fontSize.sm * 1.4,
    flexWrap: 'wrap',
  },
  modeArrow: {
    marginLeft: ModernDesign.spacing[2],
  },
  bannerAd: {
    // 通常のレイアウトフローに配置
  },
});
