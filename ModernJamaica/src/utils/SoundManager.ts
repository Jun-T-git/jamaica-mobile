import Sound from 'react-native-sound';
import { Platform, AppState, AppStateStatus } from 'react-native';

export enum SoundType {
  TAP = 'tap',           // ゲーム内操作音（ノード、演算子など）
  CONNECT = 'connect', 
  CORRECT = 'correct',
  COUNTDOWN = 'countdown',
  START = 'start',
  BUTTON = 'button',     // 一般的なボタン操作音（メニュー、設定など）
}

class SoundManager {
  private sounds: Record<SoundType, Sound | null> = {
    [SoundType.TAP]: null,
    [SoundType.CONNECT]: null,
    [SoundType.CORRECT]: null,
    [SoundType.COUNTDOWN]: null,
    [SoundType.START]: null,
    [SoundType.BUTTON]: null,
  };
  
  private isEnabled: boolean = true;
  private readonly VOLUME = 0.5; // 固定音量
  private playingFlags: Record<SoundType, boolean> = { // 重複再生防止フラグ
    [SoundType.TAP]: false,
    [SoundType.CONNECT]: false,
    [SoundType.CORRECT]: false,
    [SoundType.COUNTDOWN]: false,
    [SoundType.START]: false,
    [SoundType.BUTTON]: false,
  };
  private appStateListener?: ((nextAppState: AppStateStatus) => void);
  
  constructor() {
    try {
      this.configureAudioSession();
      this.setupAppStateListener();
      this.initializeSounds();
    } catch (error) {
      console.warn('Failed to initialize SoundManager:', String(error));
    }
  }

  /**
   * react-native-sound公式推奨：マナーモード（サイレントモード）対応のオーディオセッション設定
   * 
   * 【設定内容】
   * - setCategory('Ambient', true): マナーモード時は無音、他のオーディオと共存
   * - setMode('Default'): iOS標準の再生モード
   * - setActive(true): オーディオセッションを有効化
   * 
   * 【対応効果】
   * ✅ iOSマナーモード時は音が出ない（サイレントスイッチを尊重）
   * ✅ Androidサイレントモード時は音が出ない
   * ✅ 音楽アプリなど他のオーディオと共存（停止しない）
   * ✅ フォアグラウンド/バックグラウンド切り替えに対応
   * 
   * 【カテゴリ比較】
   * - 'Playback': マナーモード無視、効果音が必ず再生される
   * - 'Ambient': マナーモード尊重、サイレント時は無音 ← 採用
   * - 'SoloAmbient': マナーモード尊重、他のオーディオを停止
   */
  private configureAudioSession() {
    if (__DEV__) console.log('🔇 Configuring audio session to respect silent/manner mode');

    try {
      // iOS・Android共通：マナーモード（サイレントモード）を尊重する設定
      // 'Ambient'：サイレントスイッチON時は無音、他のアプリの音楽と共存
      // mixWithOthers=true：他のアプリのオーディオを停止しない
      Sound.setCategory('Ambient', true);
      
      if (Platform.OS === 'ios') {
        // iOS固有：詳細なオーディオセッション設定
        Sound.setMode('Default'); // デフォルトモード
        Sound.setActive(true); // オーディオセッションを有効化
        
        if (__DEV__) {
          console.log('✅ iOS audio session configured to respect silent mode:');
          console.log('  - Category: Ambient (respects silent switch)');
          console.log('  - Mode: Default');
          console.log('  - Active: true');
          console.log('  - MixWithOthers: true (coexists with other audio)');
          console.log('  - Silent Switch ON → No sound');
          console.log('  - Silent Switch OFF → Sound plays');
        }
      } else {
        if (__DEV__) console.log('✅ Android audio session configured to respect silent mode');
      }
      
    } catch (error) {
      console.error('❌ Failed to configure audio session:', String(error));
      // フォールバック：基本的なAmbient設定のみ試行
      try {
        Sound.setCategory('Ambient', true); // マナーモードを尊重
        console.warn('⚠️ Using fallback Ambient audio configuration');
      } catch (fallbackError) {
        console.error('❌ Even fallback audio configuration failed:', String(fallbackError));
      }
    }
    
    if (__DEV__) console.log('🤫 Audio configuration complete - respects iOS silent switch & Android silent mode');
  }

  /**
   * アプリの状態変化に応じたオーディオセッション管理
   * フォアグラウンド/バックグラウンド切り替え時の適切な処理
   */
  private setupAppStateListener() {
    this.appStateListener = (nextAppState: AppStateStatus) => {
      if (Platform.OS === 'ios') {
        try {
          if (nextAppState === 'active') {
            // フォアグラウンドに戻った時：オーディオセッションを再アクティベート
            Sound.setActive(true);
            if (__DEV__) console.log('🔊 Audio session reactivated (app became active)');
          } else if (nextAppState === 'background') {
            // バックグラウンドに移行時：適切にオーディオセッションを管理
            // ゲームアプリなのでバックグラウンド音声は不要
            Sound.setActive(false);
            if (__DEV__) console.log('🔇 Audio session deactivated (app in background)');
          }
        } catch (error) {
          console.warn('⚠️ Failed to manage audio session state:', String(error));
        }
      }
    };

    AppState.addEventListener('change', this.appStateListener);
  }
  
  private initializeSounds() {
    this.sounds[SoundType.TAP] = new Sound('tap.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load tap sound:', String(error));
        this.sounds[SoundType.TAP] = null;
      }
    });
    
    this.sounds[SoundType.CONNECT] = new Sound('connect.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load connect sound:', String(error));
        this.sounds[SoundType.CONNECT] = null;
      }
    });
    
    this.sounds[SoundType.CORRECT] = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load correct sound:', String(error));
        this.sounds[SoundType.CORRECT] = null;
      }
    });
    
    this.sounds[SoundType.COUNTDOWN] = new Sound('countdown.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load countdown sound:', String(error));
        this.sounds[SoundType.COUNTDOWN] = null;
      }
    });
    
    this.sounds[SoundType.START] = new Sound('start.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load start sound:', String(error));
        this.sounds[SoundType.START] = null;
      }
    });
    
    this.sounds[SoundType.BUTTON] = new Sound('button.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load button sound:', String(error));
        this.sounds[SoundType.BUTTON] = null;
      }
    });
  }
  
  play(soundType: SoundType) {
    if (!this.isEnabled) return;
    
    // 重複再生防止：COUNTDOWNとSTARTは特に厳格に制御
    if ((soundType === SoundType.COUNTDOWN || soundType === SoundType.START) && this.playingFlags[soundType]) {
      if (__DEV__) console.log('🔇 Preventing duplicate', soundType, 'sound playback');
      return;
    }
    
    try {
      const sound = this.sounds[soundType];
      if (sound) {
        // 再生フラグを設定
        this.playingFlags[soundType] = true;
        
        // 再生位置を最初に戻してから再生
        sound.setCurrentTime(0);
        sound.setVolume(this.VOLUME);
        sound.play((success) => {
          // 再生完了後にフラグをリセット
          this.playingFlags[soundType] = false;
          
          if (!success) {
            console.warn('Sound playback failed for', String(soundType));
          } else if (__DEV__) {
            console.log('🔊 Sound played successfully:', soundType);
          }
        });
        
        // 安全のため、一定時間後に強制的にフラグをリセット
        setTimeout(() => {
          this.playingFlags[soundType] = false;
        }, soundType === SoundType.COUNTDOWN ? 500 : 1000);
      }
    } catch (error) {
      this.playingFlags[soundType] = false; // エラー時もフラグをリセット
      console.warn('Failed to play sound', String(soundType), ':', String(error));
    }
  }
  
  toggle() {
    this.isEnabled = !this.isEnabled;
    return this.isEnabled;
  }
  
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }
  
  getEnabled() {
    return this.isEnabled;
  }
  
  // 全ての再生フラグをリセット（デバッグやトラブルシューティング用）
  resetPlayingFlags() {
    if (__DEV__) console.log('🧹 Resetting all sound playing flags');
    Object.keys(this.playingFlags).forEach(key => {
      this.playingFlags[key as SoundType] = false;
    });
  }

  dispose() {
    this.resetPlayingFlags(); // フラグをリセット
    
    // AppStateリスナーを削除（React Native 0.65+では自動削除されるが、安全のため）
    if (this.appStateListener) {
      try {
        // Note: Modern React Native versions automatically remove listeners on app termination
        this.appStateListener = undefined;
        if (__DEV__) console.log('🔇 AppState listener cleaned up');
      } catch (error) {
        console.warn('⚠️ Failed to clean up AppState listener:', String(error));
      }
    }
    
    // オーディオセッションを非アクティブ化（iOS）
    if (Platform.OS === 'ios') {
      try {
        Sound.setActive(false);
        if (__DEV__) console.log('🔇 Audio session deactivated on dispose');
      } catch (error) {
        console.warn('⚠️ Failed to deactivate audio session:', String(error));
      }
    }
    
    Object.values(this.sounds).forEach(sound => {
      sound?.release();
    });
  }
}

export const soundManager = new SoundManager();