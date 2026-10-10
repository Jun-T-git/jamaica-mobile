import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Logo } from '../components/atoms/Logo';
import { Typography } from '../components/atoms/Typography';
import { TutorialModal } from '../components/organisms/TutorialModal';
import { ModernDesign } from '../constants';
import { useMonetizationStore } from '../store/monetizationStore';
import { useGameStore } from '../store/gameStore';
import { useSettingsStore } from '../store/settingsStore';
import { GameMode } from '../types';
import { soundManager, SoundType } from '../utils/SoundManager';

const TUTORIAL_COMPLETED_KEY = '@jamaica_tutorial_completed';

interface ModeSelectionScreenProps {
  navigation: any;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({
  navigation,
}) => {
  const hasRemovedAds = useMonetizationStore(state => state.hasRemovedAds);
  const { loadStoredData } = useGameStore();
  const { height: windowHeight } = useWindowDimensions();
  const compact = windowHeight < 750;
  const { loadDisplayName, loadSoundSetting, displayName } = useSettingsStore();
  const [showTutorial, setShowTutorial] = useState(false);

  // 初回起動時は遊び方を自動で表示
  useEffect(() => {
    AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY)
      .then(completed => {
        if (completed !== 'true') setShowTutorial(true);
      })
      .catch(() => {});
  }, []);

  const handleTutorialClose = () => {
    setShowTutorial(false);
    AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true').catch(() => {});
  };

  const handleTutorialPress = () => {
    soundManager.play(SoundType.BUTTON);
    setShowTutorial(true);
  };

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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      {!hasRemovedAds && (
        <View style={styles.purchaseEntryRow}>
          <TouchableOpacity style={styles.purchaseEntry} activeOpacity={0.8}
            onPress={() => navigation.navigate('Purchase', { source: 'menu' })}
            accessibilityRole="button" accessibilityLabel="広告を削除する。買い切り特典を見る">
            <MaterialIcons name="block" size={18} color={ModernDesign.colors.accent.neon} />
            <Typography variant="body2" style={styles.purchaseEntryText}>広告を削除</Typography>
            <Typography variant="caption" color="secondary">買い切り</Typography>
          </TouchableOpacity>
        </View>
      )}
      {/* Header with logo and typography */}
      <View style={[styles.header, compact && styles.compactHeader]}>
        <Logo
          size={compact ? 72 : 100}
          style={compact ? styles.compactLogo : styles.logo}
        />
        <Typography variant="h4" textAlign="center" style={[styles.title, compact && styles.compactTitle]}>
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
      <View style={[styles.modesContainer, compact && styles.compactModesContainer]}>
        {/* Challenge Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.CHALLENGE)}
          style={[styles.modeButton, compact && styles.compactModeButton]}
          activeOpacity={0.8}
        >
          <View style={styles.modeContent}>
            <View style={[styles.modeIconContainer, compact && styles.compactModeIconContainer]}>
              <MaterialIcons
                name="timer"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextContainer}>
              <Typography variant="h4" style={[styles.modeTitle, compact && styles.compactModeTitle]}>
                チャレンジモード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                style={[styles.modeDescription, compact && styles.compactModeDescription]}
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
        </TouchableOpacity>

        {/* Infinite Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.INFINITE)}
          style={[styles.modeButton, compact && styles.compactModeButton]}
          activeOpacity={0.8}
        >
          <View style={styles.modeContent}>
            <View style={[styles.modeIconContainer, compact && styles.compactModeIconContainer]}>
              <MaterialIcons
                name="all-inclusive"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextContainer}>
              <Typography variant="h4" style={[styles.modeTitle, compact && styles.compactModeTitle]}>
                練習モード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                style={[styles.modeDescription, compact && styles.compactModeDescription]}
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
      <View style={[styles.secondaryNavigation, compact && styles.compactSecondaryNavigation]}>
        <TouchableOpacity
          onPress={handleTutorialPress}
          style={styles.navButton}
          activeOpacity={0.8}
        >
          <MaterialIcons
            name="help-outline"
            size={20}
            color={ModernDesign.colors.text.tertiary}
          />
          <Typography variant="body2" style={styles.navButtonText}>
            遊び方
          </Typography>
        </TouchableOpacity>

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

      <TutorialModal visible={showTutorial} onClose={handleTutorialClose} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  purchaseEntryRow: { alignItems: 'flex-end', paddingHorizontal: ModernDesign.spacing[5] },
  purchaseEntry: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[2], paddingHorizontal: ModernDesign.spacing[3] },
  purchaseEntryText: { color: ModernDesign.colors.accent.neon },
  header: {
    paddingTop: ModernDesign.spacing[6],
    paddingBottom: ModernDesign.spacing[4],
    paddingHorizontal: ModernDesign.spacing[6],
    alignItems: 'center',
  },
  compactHeader: {
    paddingTop: ModernDesign.spacing[3],
    paddingBottom: ModernDesign.spacing[2],
  },
  logo: {
    marginBottom: ModernDesign.spacing[4],
  },
  compactLogo: {
    marginBottom: ModernDesign.spacing[2],
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
  compactTitle: {
    fontSize: ModernDesign.typography.fontSize['3xl'],
  },
  modesContainer: {
    paddingHorizontal: ModernDesign.spacing[6],
    paddingTop: ModernDesign.spacing[8],
    paddingBottom: ModernDesign.spacing[8],
    gap: ModernDesign.spacing[4],
  },
  compactModesContainer: {
    paddingTop: ModernDesign.spacing[3],
    paddingBottom: ModernDesign.spacing[3],
    gap: ModernDesign.spacing[3],
  },
  secondaryNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ModernDesign.spacing[2],
    paddingHorizontal: ModernDesign.spacing[6],
    paddingTop: ModernDesign.spacing[6],
    paddingBottom: ModernDesign.spacing[6],
    backgroundColor: ModernDesign.colors.background.primary,
  },
  compactSecondaryNavigation: {
    paddingTop: ModernDesign.spacing[2],
    paddingBottom: ModernDesign.spacing[3],
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.xl,
    paddingHorizontal: ModernDesign.spacing[2],
    paddingVertical: ModernDesign.spacing[4], // タップしやすくするため縦幅を拡大
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    flex: 1, // 3つのボタンを等幅で並べる
    flexDirection: 'row',
    gap: ModernDesign.spacing[1],
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
    padding: ModernDesign.spacing[6],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.base,
  },
  compactModeButton: {
    padding: ModernDesign.spacing[4],
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
    flexShrink: 0,
  },
  compactModeIconContainer: {
    width: 48,
    height: 48,
    marginRight: ModernDesign.spacing[3],
  },
  modeTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  modeTitle: {
    marginBottom: ModernDesign.spacing[1],
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    fontSize: ModernDesign.typography.fontSize['2xl'],
  },
  compactModeTitle: {
    fontSize: ModernDesign.typography.fontSize.xl,
    lineHeight: ModernDesign.typography.fontSize.xl * 1.25,
  },
  modeDescription: {
    fontSize: ModernDesign.typography.fontSize.sm,
    lineHeight: ModernDesign.typography.fontSize.sm * 1.3,
  },
  compactModeDescription: {
    fontSize: ModernDesign.typography.fontSize.xs,
    lineHeight: ModernDesign.typography.fontSize.xs * 1.3,
  },
  modeArrow: {
    marginLeft: ModernDesign.spacing[2],
  },
});
