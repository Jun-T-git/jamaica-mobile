import Sound from 'react-native-sound';

export enum SoundType {
  TAP = 'tap',
  CONNECT = 'connect', 
  CORRECT = 'correct',
}

class SoundManager {
  private sounds: Record<SoundType, Sound | null> = {
    [SoundType.TAP]: null,
    [SoundType.CONNECT]: null,
    [SoundType.CORRECT]: null,
  };
  
  private isEnabled: boolean = true;
  private readonly VOLUME = 0.5; // 固定音量
  
  constructor() {
    try {
      Sound.setCategory('Playback');
      this.initializeSounds();
    } catch (error) {
      console.warn('Failed to initialize SoundManager:', error);
    }
  }
  
  private initializeSounds() {
    this.sounds[SoundType.TAP] = new Sound('tap.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load tap sound:', error);
        this.sounds[SoundType.TAP] = null;
      }
    });
    
    this.sounds[SoundType.CONNECT] = new Sound('connect.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load connect sound:', error);
        this.sounds[SoundType.CONNECT] = null;
      }
    });
    
    this.sounds[SoundType.CORRECT] = new Sound('success.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.warn('Failed to load correct sound:', error);
        this.sounds[SoundType.CORRECT] = null;
      }
    });
  }
  
  play(soundType: SoundType) {
    if (!this.isEnabled) return;
    
    try {
      const sound = this.sounds[soundType];
      if (sound) {
        // 再生位置を最初に戻してから再生
        sound.setCurrentTime(0);
        sound.setVolume(this.VOLUME);
        sound.play((success) => {
          if (!success) {
            console.warn(`Sound playback failed for ${soundType}`);
          }
        });
      }
    } catch (error) {
      console.warn(`Failed to play sound ${soundType}:`, error);
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
  
  dispose() {
    Object.values(this.sounds).forEach(sound => {
      sound?.release();
    });
  }
}

export const soundManager = new SoundManager();