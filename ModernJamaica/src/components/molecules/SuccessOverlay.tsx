import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../../constants';

interface SuccessOverlayProps {
  visible: boolean;
  animationValue: Animated.Value;
  message?: string;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  animationValue,
  message = '正解！',
}) => {
  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: animationValue,
          transform: [
            {
              scale: animationValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0.8, 1.2],
              }),
            },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <MaterialIcons name="check-circle" size={80} color={COLORS.SUCCESS} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.SUCCESS,
    marginTop: 10,
  },
});