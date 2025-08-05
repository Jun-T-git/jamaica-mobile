import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { soundManager } from '../utils/SoundManager';
import { userService } from '../services/userService';
import { rankingService } from '../services/rankingService';

interface SettingsStore {
  soundEnabled: boolean;
  displayName: string;
  isDisplayNameSet: boolean;
  toggleSound: () => Promise<void>;
  loadSoundSetting: () => Promise<void>;
  setDisplayName: (name: string) => Promise<boolean>;
  updateDisplayNameWithFirebase: (name: string) => Promise<boolean>;
  loadDisplayName: () => Promise<void>;
  resetDisplayName: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, _get) => ({
  soundEnabled: true,
  displayName: '',
  isDisplayNameSet: false,
  
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

  setDisplayName: async (name: string) => {
    try {
      // バリデーション
      const validation = userService.validateDisplayName(name);
      if (!validation.isValid) {
        console.warn('Invalid display name:', validation.error);
        return false;
      }

      const trimmedName = name.trim();
      
      // AsyncStorageに保存
      await AsyncStorage.setItem('@display_name', trimmedName);
      await AsyncStorage.setItem('@display_name_set', 'true');
      
      set({ 
        displayName: trimmedName,
        isDisplayNameSet: true,
      });
      
      return true;
    } catch (error) {
      console.warn('Failed to save display name:', error);
      return false;
    }
  },

  loadDisplayName: async () => {
    try {
      const [savedName, isSet] = await Promise.all([
        AsyncStorage.getItem('@display_name'),
        AsyncStorage.getItem('@display_name_set'),
      ]);

      if (savedName && isSet === 'true') {
        set({
          displayName: savedName,
          isDisplayNameSet: true,
        });
      } else {
        // 初回ユーザーの場合はデフォルト名を生成
        const defaultName = userService.generateDefaultDisplayName();
        set({
          displayName: defaultName,
          isDisplayNameSet: false,
        });
      }
    } catch (error) {
      console.warn('Failed to load display name:', error);
      // エラー時はデフォルト名を設定
      const defaultName = userService.generateDefaultDisplayName();
      set({
        displayName: defaultName,
        isDisplayNameSet: false,
      });
    }
  },

  updateDisplayNameWithFirebase: async (name: string) => {
    try {
      // バリデーション
      const validation = userService.validateDisplayName(name);
      if (!validation.isValid) {
        console.warn('Invalid display name:', validation.error);
        return false;
      }

      const trimmedName = name.trim();
      
      // ローカル設定を更新
      await AsyncStorage.setItem('@display_name', trimmedName);
      await AsyncStorage.setItem('@display_name_set', 'true');
      
      set({ 
        displayName: trimmedName,
        isDisplayNameSet: true,
      });

      // Firebaseの表示名も更新
      await rankingService.updateDisplayName(trimmedName);
      
      return true;
    } catch (error) {
      console.warn('Failed to update display name with Firebase:', error);
      return false;
    }
  },

  resetDisplayName: async () => {
    try {
      await AsyncStorage.removeItem('@display_name');
      await AsyncStorage.removeItem('@display_name_set');
      
      const defaultName = userService.generateDefaultDisplayName();
      set({
        displayName: defaultName,
        isDisplayNameSet: false,
      });
    } catch (error) {
      console.warn('Failed to reset display name:', error);
    }
  },
}));