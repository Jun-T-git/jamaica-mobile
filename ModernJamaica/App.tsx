import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import mobileAds, { MaxAdContentRating } from 'react-native-google-mobile-ads';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { SplashScreen } from './src/screens/SplashScreen';
import { ModeSelectionScreen } from './src/screens/ModeSelectionScreen';
import DifficultySelectionScreen from './src/screens/DifficultySelectionScreen';
import { ChallengeModeScreen } from './src/screens/ChallengeModeScreen';
import { InfiniteModeScreen } from './src/screens/InfiniteModeScreen';
import { ChallengeResultScreen } from './src/screens/ChallengeResultScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
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
  Ranking: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function App() {
  const { loadSoundSetting } = useSettingsStore();

  useEffect(() => {
    // AdMob SDKの初期化
    // 家族向けの数字パズルゲームのため、配信される広告コンテンツを
    // G レーティング（全年齢対象）以下に制限してから初期化する。
    // これを設定しないと成人向け（T/MA）広告が配信され得る。
    mobileAds()
      .setRequestConfiguration({
        maxAdContentRating: MaxAdContentRating.G,
      })
      .then(() => mobileAds().initialize())
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
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
            <Stack.Screen name="Ranking" component={RankingScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

export default App;
