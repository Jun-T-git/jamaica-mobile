/* eslint-env jest */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock vector icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

global.__DEV__ = true;