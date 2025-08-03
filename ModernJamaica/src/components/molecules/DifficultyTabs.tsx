import React from 'react';
import { View, TouchableOpacity, StyleSheet, TextStyle } from 'react-native';
import { Typography } from '../atoms/Typography';
import { DifficultyLevel } from '../../types';
import { ModernDesign } from '../../design/modernDesignSystem';
import { soundManager, SoundType } from '../../utils/SoundManager';

interface DifficultyTabsProps {
  selectedDifficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  mode: 'challenge' | 'infinite';
}

export const DifficultyTabs: React.FC<DifficultyTabsProps> = ({
  selectedDifficulty,
  onDifficultyChange,
  mode,
}) => {
  const difficulties = [
    { level: DifficultyLevel.EASY, label: 'かんたん' },
    { level: DifficultyLevel.NORMAL, label: 'ふつう' },
    { level: DifficultyLevel.HARD, label: 'むずかしい' },
  ];

  const getTabStyle = (difficulty: DifficultyLevel) => {
    const isSelected = difficulty === selectedDifficulty;
    
    if (isSelected) {
      return [
        styles.tab,
        mode === 'challenge' 
          ? styles.selectedTabChallenge 
          : styles.selectedTabInfinite
      ];
    } else {
      return [styles.tab, styles.unselectedTab];
    }
  };

  const getTextStyle = (difficulty: DifficultyLevel): TextStyle => {
    const isSelected = difficulty === selectedDifficulty;
    if (isSelected) {
      return { ...styles.tabText, ...styles.selectedText };
    } else {
      return { ...styles.tabText, ...styles.unselectedText };
    }
  };

  const handleTabPress = (difficulty: DifficultyLevel) => {
    soundManager.play(SoundType.BUTTON);
    onDifficultyChange(difficulty);
  };

  return (
    <View style={styles.container}>
      {difficulties.map(({ level, label }) => (
        <TouchableOpacity
          key={level}
          style={getTabStyle(level)}
          onPress={() => handleTabPress(level)}
          activeOpacity={0.7}
        >
          <Typography
            variant="body2"
            style={getTextStyle(level)}
          >
            {label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: ModernDesign.colors.background.secondary,
    borderRadius: ModernDesign.borderRadius.xl,
    padding: ModernDesign.spacing[1],
    marginHorizontal: ModernDesign.spacing[4],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
  },
  tab: {
    flex: 1,
    paddingVertical: ModernDesign.spacing[3],
    paddingHorizontal: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTabChallenge: {
    backgroundColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.sm,
  },
  selectedTabInfinite: {
    backgroundColor: ModernDesign.colors.accent.purple,
    ...ModernDesign.shadows.sm,
  },
  unselectedTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    fontSize: ModernDesign.typography.fontSize.sm,
  },
  selectedText: {
    color: ModernDesign.colors.text.inverse,
  },
  unselectedText: {
    color: ModernDesign.colors.text.secondary,
  },
});