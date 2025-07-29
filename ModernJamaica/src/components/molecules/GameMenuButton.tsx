import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';

interface GameMenuButtonProps {
  isActive: boolean;
  onPress: () => void;
  iconName?: string;
  activeIconName?: string;
  style?: ViewStyle;
}

export const GameMenuButton: React.FC<GameMenuButtonProps> = ({
  isActive,
  onPress,
  iconName = 'more-vert',
  activeIconName = 'close',
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        isActive && styles.buttonActive,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={isActive ? activeIconName : iconName}
          size={20}
          color={ModernDesign.colors.text.primary}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: ModernDesign.components.button.iconButton.size,
    height: ModernDesign.components.button.iconButton.size,
    borderRadius: ModernDesign.components.button.iconButton.borderRadius,
    backgroundColor: ModernDesign.colors.glass.background,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
    ...ModernDesign.shadows.base,
  },
  buttonActive: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    transform: [{ scale: 0.95 }],
    ...ModernDesign.shadows.glow,
  },
  iconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});