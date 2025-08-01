import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { soundManager } from '../utils/SoundManager';

interface SettingsStore {
  soundEnabled: boolean;
  toggleSound: () => Promise<void>;
  loadSoundSetting: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  soundEnabled: true,
  
  toggleSound: async () => {
    const newState = soundManager.toggle();
    set({ soundEnabled: newState });
    
    try {
      // AsyncStorageに保存
      await AsyncStorage.setItem('@sound_enabled', JSON.stringify(newState));
    } catch (error) {
      console.warn('Failed to save sound setting:', error);
    }
  },
  
  loadSoundSetting: async () => {
    try {
      const saved = await AsyncStorage.getItem('@sound_enabled');
      if (saved !== null) {
        const enabled = JSON.parse(saved);
        soundManager.setEnabled(enabled);
        set({ soundEnabled: enabled });
      }
    } catch (error) {
      console.warn('Failed to load sound setting:', error);
    }
  },
}));