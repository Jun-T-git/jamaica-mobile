import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSettingsStore } from '../../store/settingsStore';
import { ModernDesign } from '../../constants';
import { soundManager, SoundType } from '../../utils/SoundManager';

interface SoundToggleButtonProps {
  size?: number;
  style?: ViewStyle;
}

export const SoundToggleButton: React.FC<SoundToggleButtonProps> = ({ 
  size = 24, 
  style 
}) => {
  const { soundEnabled, toggleSound } = useSettingsStore();
  
  const handlePress = () => {
    // 音声設定ボタンは常に効果音を再生（ユーザーフィードバックのため）
    soundManager.play(SoundType.BUTTON);
    toggleSound();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={soundEnabled ? 'volume-up' : 'volume-off'}
        size={size}
        color={soundEnabled ? ModernDesign.colors.text.primary : ModernDesign.colors.text.tertiary}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: ModernDesign.spacing[2],
    borderRadius: ModernDesign.borderRadius.md,
    backgroundColor: ModernDesign.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32,
  },
});