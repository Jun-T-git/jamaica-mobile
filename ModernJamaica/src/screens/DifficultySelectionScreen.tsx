import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Typography } from '../components/atoms/Typography';

import { getDifficultyConfig } from '../config/difficulty';
import { ModernDesign } from '../constants';
import { useGameStore } from '../store/gameStore';
import { DifficultyLevel, GameMode } from '../types';
import { soundManager, SoundType } from '../utils/SoundManager';

// ナビゲーション型定義
type RootStackParamList = {
  DifficultySelection: { mode: GameMode };
  ChallengeMode: { difficulty: DifficultyLevel };
  InfiniteMode: { difficulty: DifficultyLevel };
};

type DifficultySelectionRouteProp = RouteProp<
  RootStackParamList,
  'DifficultySelection'
>;
type DifficultySelectionNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DifficultySelection'
>;

interface DifficultyCardProps {
  difficulty: DifficultyLevel;
  onPress: () => void;
}

const DifficultyCard: React.FC<DifficultyCardProps> = ({
  difficulty,
  onPress,
}) => {
  const config = getDifficultyConfig(difficulty);
  const { label, theme } = config;
  const route = useRoute<DifficultySelectionRouteProp>();
  const { mode } = route.params;
  const highScores = useGameStore((state) => state.highScores);

  const getIconName = () => {
    switch (difficulty) {
      case DifficultyLevel.EASY:
        return 'sentiment-satisfied';
      case DifficultyLevel.NORMAL:
        return 'sentiment-neutral';
      case DifficultyLevel.HARD:
        return 'sentiment-very-dissatisfied';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.difficultyButton}
      activeOpacity={0.8}
    >
      <View style={styles.difficultyContent}>
        <View
          style={[
            styles.difficultyIconContainer,
            { backgroundColor: theme.primary + '20' },
          ]}
        >
          <MaterialIcons name={getIconName()} size={32} color={theme.primary} />
        </View>
        <View style={styles.difficultyTextContainer}>
          <Typography variant="body1" style={styles.difficultyTitle}>
            {label.ja}
          </Typography>
        </View>
        <View style={styles.difficultyArrow}>
          <MaterialIcons
            name="arrow-forward-ios"
            size={20}
            color={ModernDesign.colors.text.tertiary}
          />
        </View>
      </View>
      {highScores[mode][difficulty] > 0 && (
        <View style={styles.statsBadge}>
          <MaterialIcons
            name={mode === GameMode.CHALLENGE ? "emoji-events" : "local-fire-department"}
            size={16}
            color={mode === GameMode.CHALLENGE ? ModernDesign.colors.accent.gold : ModernDesign.colors.accent.neon}
          />
          <Typography
            variant="caption"
            color="secondary"
            style={styles.statsText}
          >
            ベスト: {mode === GameMode.CHALLENGE 
              ? `${highScores[mode][difficulty].toLocaleString()}点`
              : `${highScores[mode][difficulty]}問`
            }
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
};

const DifficultySelectionScreen: React.FC = () => {
  const navigation = useNavigation<DifficultySelectionNavigationProp>();
  const route = useRoute<DifficultySelectionRouteProp>();
  const { mode } = route.params;
  const initGame = useGameStore(state => state.initGame);

  const handleDifficultySelect = async (difficulty: DifficultyLevel) => {
    soundManager.play(SoundType.BUTTON);

    // ゲームを初期化
    await initGame(mode, difficulty);

    // 対応する画面に遷移
    if (mode === GameMode.CHALLENGE) {
      navigation.navigate('ChallengeMode', { difficulty });
    } else {
      navigation.navigate('InfiniteMode', { difficulty });
    }
  };

  const handleBack = () => {
    soundManager.play(SoundType.BUTTON);
    navigation.goBack();
  };

  const modeLabel =
    mode === GameMode.CHALLENGE ? 'チャレンジモード' : '練習モード';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ModernDesign.colors.background.primary}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={ModernDesign.colors.text.primary}
          />
        </TouchableOpacity>
        <Typography variant="body1" style={styles.modeTitle}>
          {modeLabel}
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Typography variant="h4" textAlign="center" style={styles.title}>
          難易度を選択
        </Typography>

        <View style={styles.difficultyContainer}>
          <DifficultyCard
            difficulty={DifficultyLevel.EASY}
            onPress={() => handleDifficultySelect(DifficultyLevel.EASY)}
          />

          <DifficultyCard
            difficulty={DifficultyLevel.NORMAL}
            onPress={() => handleDifficultySelect(DifficultyLevel.NORMAL)}
          />

          <DifficultyCard
            difficulty={DifficultyLevel.HARD}
            onPress={() => handleDifficultySelect(DifficultyLevel.HARD)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60,
    backgroundColor: ModernDesign.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  headerSpacer: {
    width: 44,
  },
  modeTitle: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: ModernDesign.spacing[8],
    paddingBottom: ModernDesign.spacing[6],
  },
  title: {
    marginBottom: ModernDesign.spacing[8],
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    letterSpacing: ModernDesign.typography.letterSpacing.tight,
  },
  difficultyContainer: {
    gap: ModernDesign.spacing[4],
  },
  difficultyButton: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius.xl,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    minHeight: 88,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 56,
  },
  difficultyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyTextContainer: {
    flex: 1,
    paddingVertical: 2,
  },
  difficultyTitle: {
    color: ModernDesign.colors.text.primary,
    marginBottom: 4,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
  difficultyDescription: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.sm,
  },
  difficultyArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
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
});

export default DifficultySelectionScreen;
