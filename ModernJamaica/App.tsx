import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ModeSelectionScreen } from './src/screens/ModeSelectionScreen';
import { ChallengeModeScreen } from './src/screens/ChallengeModeScreen';
import { InfiniteModeScreen } from './src/screens/InfiniteModeScreen';
import { ErrorBoundary } from './src/components/ErrorBoundary';

const Stack = createStackNavigator();

function App() {
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
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default App;
