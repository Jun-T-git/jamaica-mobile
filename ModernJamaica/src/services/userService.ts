import { getAuth, signInAnonymously } from '@react-native-firebase/auth';

const DEFAULT_DISPLAY_NAME = 'プレイヤー';

export class UserService {
  private static instance: UserService;
  private signInPromise: Promise<string> | null = null;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Firebase匿名認証のUIDを取得（未サインインならサインインする）
   * Firestoreのセキュリティルールが request.auth.uid で本人確認するため、
   * ランキングの読み書きには端末内で生成したIDではなくこのUIDを使う
   */
  async getAuthUserId(): Promise<string> {
    const auth = getAuth();
    if (auth.currentUser) {
      return auth.currentUser.uid;
    }

    // 同時に複数回呼ばれても匿名アカウントを1つしか作らない
    if (!this.signInPromise) {
      this.signInPromise = signInAnonymously(auth)
        .then(credential => credential.user.uid)
        .finally(() => {
          this.signInPromise = null;
        });
    }

    return this.signInPromise;
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