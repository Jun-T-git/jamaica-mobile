import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@user_id';
const DEFAULT_DISPLAY_NAME = 'プレイヤー';

export class UserService {
  private static instance: UserService;
  private userId: string | null = null;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * ユーザーIDを取得（存在しない場合は生成）
   */
  async getUserId(): Promise<string> {
    if (this.userId) {
      return this.userId;
    }

    try {
      // AsyncStorageから既存のIDを取得
      const stored = await AsyncStorage.getItem(USER_ID_KEY);
      
      if (stored) {
        this.userId = stored;
        return stored;
      }

      // 新しいIDを生成
      const newUserId = this.generateUserId();
      await AsyncStorage.setItem(USER_ID_KEY, newUserId);
      this.userId = newUserId;
      
      return newUserId;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      // エラー時は一時的なIDを返す
      const tempId = this.generateUserId();
      this.userId = tempId;
      return tempId;
    }
  }

  /**
   * 新しいユーザーIDを生成
   * 形式: user_{timestamp}_{random}
   */
  private generateUserId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `user_${timestamp}_${random}`;
  }

  /**
   * ユーザーが初回ユーザーかどうかを判定
   */
  async isFirstTimeUser(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(USER_ID_KEY);
      return stored === null;
    } catch (error) {
      console.error('Failed to check first time user:', error);
      return true; // エラー時は初回ユーザーとして扱う
    }
  }

  /**
   * ユーザーIDをリセット（デバッグ用）
   */
  async resetUserId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(USER_ID_KEY);
      this.userId = null;
    } catch (error) {
      console.error('Failed to reset user ID:', error);
    }
  }

  /**
   * デフォルトの表示名を生成
   */
  generateDefaultDisplayName(): string {
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    return `${DEFAULT_DISPLAY_NAME}${randomNum}`;
  }

  /**
   * 表示名のバリデーション
   */
  validateDisplayName(name: string): { isValid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { isValid: false, error: '名前を入力してください' };
    }

    const trimmed = name.trim();
    
    if (trimmed.length > 20) {
      return { isValid: false, error: '名前は20文字以内で入力してください' };
    }

    // 不適切な文字列のチェック（基本的な例）
    const inappropriateWords = ['admin', 'system', 'bot'];
    if (inappropriateWords.some(word => trimmed.toLowerCase().includes(word))) {
      return { isValid: false, error: 'この名前は使用できません' };
    }

    return { isValid: true };
  }
}

// シングルトンインスタンスをエクスポート
export const userService = UserService.getInstance();