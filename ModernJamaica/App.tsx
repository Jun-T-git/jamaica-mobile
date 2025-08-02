import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import mobileAds from 'react-native-google-mobile-ads';
import { SplashScreen } from './src/screens/SplashScreen';
import { ModeSelectionScreen } from './src/screens/ModeSelectionScreen';
import DifficultySelectionScreen from './src/screens/DifficultySelectionScreen';
import { ChallengeModeScreen } from './src/screens/ChallengeModeScreen';
import { InfiniteModeScreen } from './src/screens/InfiniteModeScreen';
import { ChallengeResultScreen } from './src/screens/ChallengeResultScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useSettingsStore } from './src/store/settingsStore';
import { GameMode, DifficultyLevel } from './src/types';

type RootStackParamList = {
  Splash: undefined;
  ModeSelection: undefined;
  DifficultySelection: { mode: GameMode };
  ChallengeMode: { difficulty: DifficultyLevel };
  InfiniteMode: { difficulty: DifficultyLevel };
  ChallengeResult: {
    finalScore: number;
    isNewHighScore: boolean;
    previousHighScore: number;
    mode?: 'challenge' | 'infinite';
    difficulty?: DifficultyLevel;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const { loadSoundSetting } = useSettingsStore();

  useEffect(() => {
    // AdMob SDKの初期化
    mobileAds()
      .initialize()
      .then(() => {
        console.log('AdMob SDK initialized');
      })
      .catch((error) => {
        console.error('AdMob SDK initialization error:', error);
      });

    // 音声設定の読み込み
    loadSoundSetting();
  }, [loadSoundSetting]);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
          <Stack.Screen name="DifficultySelection" component={DifficultySelectionScreen} />
          <Stack.Screen name="ChallengeMode" component={ChallengeModeScreen} />
          <Stack.Screen name="InfiniteMode" component={InfiniteModeScreen} />
          <Stack.Screen name="ChallengeResult" component={ChallengeResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default App;
