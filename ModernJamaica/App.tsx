import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import mobileAds from 'react-native-google-mobile-ads';
import { ModeSelectionScreen } from './src/screens/ModeSelectionScreen';
import { ChallengeModeScreen } from './src/screens/ChallengeModeScreen';
import { InfiniteModeScreen } from './src/screens/InfiniteModeScreen';
import { ChallengeResultScreen } from './src/screens/ChallengeResultScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

function App() {
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
  }, []);

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="ModeSelection"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
          <Stack.Screen name="ChallengeMode" component={ChallengeModeScreen} />
          <Stack.Screen name="InfiniteMode" component={InfiniteModeScreen} />
          <Stack.Screen name="ChallengeResult" component={ChallengeResultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default App;
