import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GameStat } from '../molecules/GameStat';
import { GameMenuButton } from '../molecules/GameMenuButton';
import { SoundToggleButton } from '../atoms/SoundToggleButton';
import { COLORS, ModernDesign } from '../../constants';

interface GameStatData {
  label: string;
  value: string | number;
  icon?: string;
  variant?: 'default' | 'timer' | 'streak' | 'compact';
  iconColor?: string;
  iconBackgroundColor?: string;
  labelColor?: string;
  valueColor?: string;
}

interface GameHeaderProps {
  stats: GameStatData[];
  onMenuPress: () => void;
  showMenu?: boolean;
  menuDisabled?: boolean;
  menuIcon?: string;
  style?: ViewStyle;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  stats,
  onMenuPress,
  showMenu = false,
  menuDisabled = false,
  menuIcon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statsRow}>
        <View style={styles.statsGroup}>
          {stats.map((stat, index) => (
            <GameStat
            key={`${stat.label}-${index}`}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            variant={stat.variant}
            iconColor={stat.iconColor}
            iconBackgroundColor={stat.iconBackgroundColor}
            labelColor={stat.labelColor}
            valueColor={stat.valueColor}
            style={styles.stat}
            />
          ))}
        </View>
        
        <View style={styles.rightButtons}>
          <SoundToggleButton size={20} style={styles.soundButton} />
          <GameMenuButton
            isActive={showMenu}
            disabled={menuDisabled}
            onPress={() => {
              onMenuPress();
            }}
            iconName={menuIcon || 'more-vert'}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: ModernDesign.spacing[3],
    paddingVertical: ModernDesign.spacing[2],
    backgroundColor: COLORS.CARD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60, // 十分な高さを確保
    paddingVertical: 4, // 上下にパディングを追加
  },
  statsGroup: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ModernDesign.spacing[1],
  },
  stat: {
    flex: 1,
    minWidth: 0,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[1],
    marginLeft: ModernDesign.spacing[2],
    flexShrink: 0,
  },
  soundButton: {
    backgroundColor: 'transparent',
  },
});
