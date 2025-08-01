import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { GameStat } from '../molecules/GameStat';
import { GameMenuButton } from '../molecules/GameMenuButton';
import { COLORS } from '../../constants';

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
          />
        ))}
        
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
  );
};

const styles = StyleSheet.create({
  container: {
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
    alignItems: 'center',
    minHeight: 60, // 十分な高さを確保
    paddingVertical: 4, // 上下にパディングを追加
  },
});