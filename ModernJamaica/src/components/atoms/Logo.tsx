import React from 'react';
import { Image, StyleSheet, View, ViewStyle } from 'react-native';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

export const Logo: React.FC<LogoProps> = ({ size = 120, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image 
        source={require('../../assets/images/logo.png')}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    // 画像の背景色がアプリと同じ#1A1B23なので、追加のスタイリングは不要
  },
});