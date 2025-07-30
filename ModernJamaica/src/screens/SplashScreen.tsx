import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Animated,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Logo } from '../components/atoms/Logo';
import { ModernDesign } from '../constants';

type RootStackParamList = {
  Splash: undefined;
  ModeSelection: undefined;
};

interface SplashScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // ロゴのエレガントなアニメーション
    const logoAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        delay: 200,
        useNativeDriver: true,
      }),
    ]);

    logoAnimation.start();

    // 2秒後にメイン画面へ遷移
    const timer = setTimeout(() => {
      navigation.replace('ModeSelection');
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ModernDesign.colors.background.primary}
      />
      
      <View style={styles.content}>
        {/* ロゴアニメーション */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Logo size={150} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ModernDesign.spacing[6],
  },
  logoContainer: {
    // ロゴを中央に配置
  },
});