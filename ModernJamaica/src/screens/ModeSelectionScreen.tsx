import React, { useEffect } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Logo } from '../components/atoms/Logo';
import { Typography } from '../components/atoms/Typography';
import { AppScreen } from '../components/layouts/AppScreen';
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
  const { loadStoredData } = useGameStore();
  const { loadDisplayName, loadSoundSetting, displayName } = useSettingsStore();
  const { height: screenHeight } = useWindowDimensions();

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
    <AppScreen 
      testID="mode-selection-screen"
      contentContainerStyle={styles.screenContainer}
    >
      {/* Header section with Flexbox layout */}
      <View style={styles.headerSection}>
        <Logo 
          size={Math.max(80, Math.min(120, Math.floor(screenHeight * 0.14)))} 
        />
        <Typography 
          variant="h3" 
          textAlign="center" 
          style={styles.title}
          numberOfLines={1}
          adjustsFontSizeToFit={Platform.OS === 'ios'}
          minimumFontScale={0.7}
        >
          ジャマイカの木
        </Typography>
        <Typography
          variant="body1"
          color="secondary"
          textAlign="center"
          style={styles.subtitle}
          numberOfLines={1}
          adjustsFontSizeToFit={Platform.OS === 'ios'}
          minimumFontScale={0.8}
        >
          数字をつなける計算パズル
        </Typography>
      </View>

      {/* Mode buttons section with Flexbox */}
      <View style={styles.modeSection}>
        {/* Challenge Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.CHALLENGE)}
          style={styles.modeButton}
          activeOpacity={0.8}
        >
          <View style={styles.modeButtonContent}>
            <View style={styles.modeIconBox}>
              <MaterialIcons
                name="timer"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextBox}>
              <Typography 
                variant="h4" 
                style={styles.modeTitle}
                numberOfLines={1}
                adjustsFontSizeToFit={Platform.OS === 'ios'}
                minimumFontScale={0.7}
              >
                チャレンジモード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                numberOfLines={1}
                adjustsFontSizeToFit={Platform.OS === 'ios'}
                minimumFontScale={0.8}
              >
                時間内に何問解けるか挑戦
              </Typography>
            </View>
            <MaterialIcons
              name="arrow-forward-ios"
              size={20}
              color={ModernDesign.colors.text.tertiary}
            />
          </View>
        </TouchableOpacity>

        {/* Practice Mode Button */}
        <TouchableOpacity
          onPress={() => handleModeSelect(GameMode.INFINITE)}
          style={styles.modeButton}
          activeOpacity={0.8}
        >
          <View style={styles.modeButtonContent}>
            <View style={styles.modeIconBox}>
              <MaterialIcons
                name="all-inclusive"
                size={28}
                color={ModernDesign.colors.accent.neon}
              />
            </View>
            <View style={styles.modeTextBox}>
              <Typography 
                variant="h4" 
                style={styles.modeTitle}
                numberOfLines={1}
                adjustsFontSizeToFit={Platform.OS === 'ios'}
                minimumFontScale={0.7}
              >
                練習モード
              </Typography>
              <Typography
                variant="body2"
                color="secondary"
                numberOfLines={1}
                adjustsFontSizeToFit={Platform.OS === 'ios'}
                minimumFontScale={0.8}
              >
                自分のペースでじっくり練習
              </Typography>
            </View>
            <MaterialIcons
              name="arrow-forward-ios"
              size={20}
              color={ModernDesign.colors.text.tertiary}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer navigation section with Flexbox */}
      <View style={styles.footerSection}>
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

    </AppScreen>
  );
};

const styles = StyleSheet.create({
  // Main container - Optimized spacing
  screenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  // Header section - Clean spacing
  headerSection: {
    alignItems: 'center',
    paddingHorizontal: ModernDesign.spacing[5],
    paddingTop: ModernDesign.spacing[6],
    paddingBottom: ModernDesign.spacing[4],
    gap: ModernDesign.spacing[3],
  },
  
  // Mode selection - Better visual balance
  modeSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: ModernDesign.spacing[5],
    gap: ModernDesign.spacing[4],
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  
  // Footer - Refined spacing
  footerSection: {
    flexDirection: 'row',
    paddingHorizontal: ModernDesign.spacing[5],
    paddingVertical: ModernDesign.spacing[5],
    paddingBottom: ModernDesign.spacing[6],
    gap: ModernDesign.spacing[3],
  },
  
  // Typography
  title: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.black,
    fontSize: ModernDesign.typography.fontSize['3xl'],
  },
  
  subtitle: {
    color: ModernDesign.colors.text.tertiary,
    fontSize: ModernDesign.typography.fontSize.base,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  
  // Mode button styling
  modeButton: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['3xl'],
    paddingVertical: ModernDesign.spacing[5],
    paddingHorizontal: ModernDesign.spacing[5],
    minHeight: 90,
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.base,
  },
  
  // Mode button content
  modeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[4],
  },
  
  // Icon box styling
  modeIconBox: {
    width: 56,
    height: 56,
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  
  // Text container
  modeTextBox: {
    flex: 1,
    gap: ModernDesign.spacing[1],
  },
  
  // Mode title - More prominent
  modeTitle: {
    fontWeight: ModernDesign.typography.fontWeight.bold,
    fontSize: ModernDesign.typography.fontSize['2xl'],
    color: ModernDesign.colors.text.primary,
  },
  
  // Navigation buttons - Improved visual
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ModernDesign.spacing[2],
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius['2xl'],
    paddingHorizontal: ModernDesign.spacing[5],
    paddingVertical: ModernDesign.spacing[3],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    minHeight: 52,
    maxWidth: 160,
    ...ModernDesign.shadows.sm,
  },
  
  navButtonText: {
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    fontSize: ModernDesign.typography.fontSize.base,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
});
