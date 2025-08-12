import firestore from '@react-native-firebase/firestore';
import { GameMode, DifficultyLevel } from '../types';
import {
  UserScoreDocument,
  RankingEntry,
  RankingQuery,
  ScoreSubmission,
  UserRankInfo,
  ChallengeScore,
} from '../types/ranking';
import { userService } from './userService';

export class RankingService {
  private static instance: RankingService;
  private readonly collectionName = 'userScores';

  private constructor() {}

  static getInstance(): RankingService {
    if (!RankingService.instance) {
      RankingService.instance = new RankingService();
    }
    return RankingService.instance;
  }

  /**
   * スコアを提出（チャレンジモードのみ対応）
   */
  async submitScore(submission: ScoreSubmission): Promise<boolean> {
    console.log('🔄 submitScore called with:', JSON.stringify(submission, null, 2));
    
    // チャレンジモードのみランキング対象
    if (submission.mode !== GameMode.CHALLENGE) {
      console.log('❌ Ranking is only available for Challenge mode');
      return false;
    }
    
    try {
      const userId = await userService.getUserId();
      console.log('👤 User ID:', userId);
      
      const docRef = firestore().collection(this.collectionName).doc(userId);
      console.log('📄 Document reference created for collection:', this.collectionName);

      // Transactionを使用してアトミックに更新
      const result = await firestore().runTransaction(async (transaction) => {
        const doc = await transaction.get(docRef);
        const now = Date.now();

        let userData: UserScoreDocument;
        let shouldUpdate = false;

        if (doc.exists()) {
          // 既存ユーザーのスコア更新
          userData = doc.data() as UserScoreDocument;
          
          // 現在のスコアと比較
          const currentScore = this.getCurrentScore(userData, submission.mode, submission.difficulty);
          
          if (submission.score > currentScore.score) {
            // 新記録の場合のみ更新
            this.updateScore(userData, submission);
            userData.lastUpdated = now;
            shouldUpdate = true;
          }
        } else {
          // 新規ユーザー
          userData = this.createNewUserDocument(userId, submission, now);
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          console.log('✅ Updating document with data:', JSON.stringify(userData, null, 2));
          transaction.set(docRef, userData);
          return true;
        } else {
          console.log('⏭️ No update needed - score not improved');
        }
        
        return false;
      });

      console.log('🎯 Transaction result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to submit score:', String(error));
      return false;
    }
  }

  /**
   * ランキングを取得（チャレンジモードのみ）
   */
  async getRanking(query: RankingQuery): Promise<RankingEntry[]> {
    console.log('📊 getRanking called with:', JSON.stringify(query, null, 2));
    
    // チャレンジモードのみランキング表示
    if (query.mode !== GameMode.CHALLENGE) {
      console.log('❌ Ranking is only available for Challenge mode');
      return [];
    }
    
    try {
      const { mode, difficulty, limit = 10 } = query;
      const fieldPath = this.getScoreFieldPath(mode, difficulty);
      console.log('🔍 Querying field path:', fieldPath);
      
      const snapshot = await firestore()
        .collection(this.collectionName)
        .orderBy(fieldPath, 'desc')
        .limit(limit)
        .get();

      console.log('📋 Retrieved documents count:', snapshot.size);

      const currentUserId = await userService.getUserId();
      
      const rankings = snapshot.docs.map((doc, index) => {
        const data = doc.data() as UserScoreDocument;
        const score = this.getScoreFromDocument(data, mode, difficulty);
        
        return {
          rank: index + 1,
          userId: data.userId,
          displayName: data.displayName,
          score: score.score,
          problemCount: score.problemCount,
          timestamp: score.timestamp,
          isCurrentUser: data.userId === currentUserId,
        };
      });

      console.log('🏆 Final rankings:', JSON.stringify(rankings, null, 2));
      return rankings;
    } catch (error) {
      console.error('❌ Failed to get ranking:', String(error));
      return [];
    }
  }

  /**
   * ユーザーの順位を取得（チャレンジモードのみ）
   */
  async getUserRank(mode: GameMode, difficulty: DifficultyLevel): Promise<UserRankInfo> {
    // チャレンジモードのみランキング対象
    if (mode !== GameMode.CHALLENGE) {
      return { rank: null, totalUsers: 0 };
    }
    try {
      const userId = await userService.getUserId();
      const userDoc = await firestore()
        .collection(this.collectionName)
        .doc(userId)
        .get();

      if (!userDoc.exists()) {
        return { rank: null, totalUsers: 0 };
      }

      const userData = userDoc.data() as UserScoreDocument;
      const userScore = this.getScoreFromDocument(userData, mode, difficulty);
      const fieldPath = this.getScoreFieldPath(mode, difficulty);

      // ユーザーより上位のユーザー数を取得
      const higherScoresSnapshot = await firestore()
        .collection(this.collectionName)
        .where(fieldPath, '>', userScore.score)
        .get();

      // 総ユーザー数を取得
      const totalUsersSnapshot = await firestore()
        .collection(this.collectionName)
        .get();

      const rank = higherScoresSnapshot.size + 1;
      const totalUsers = totalUsersSnapshot.size;
      const percentile = totalUsers > 0 ? Math.round((1 - (rank - 1) / totalUsers) * 100) : 0;

      return {
        rank,
        totalUsers,
        percentile,
      };
    } catch (error) {
      console.error('Failed to get user rank:', String(error));
      return { rank: null, totalUsers: 0 };
    }
  }

  /**
   * ユーザーのスコアドキュメントを取得
   */
  async getUserScoreDocument(): Promise<UserScoreDocument | null> {
    try {
      const userId = await userService.getUserId();
      const doc = await firestore()
        .collection(this.collectionName)
        .doc(userId)
        .get();

      return doc.exists() ? (doc.data() as UserScoreDocument) : null;
    } catch (error) {
      console.error('Failed to get user score document:', String(error));
      return null;
    }
  }

  /**
   * ユーザーの特定難易度のベストスコア記録を取得
   */
  async getUserBestScore(mode: GameMode, difficulty: DifficultyLevel): Promise<ChallengeScore | null> {
    try {
      const userDoc = await this.getUserScoreDocument();
      if (!userDoc) return null;

      // チャレンジモードのみ対応
      if (mode === GameMode.CHALLENGE) {
        const score = userDoc.challengeScores[difficulty];
        return score.score > 0 ? score : null;
      }

      return null;
    } catch (error) {
      console.error('Failed to get user best score:', String(error));
      return null;
    }
  }

  /**
   * ユーザーの表示名を更新
   */
  async updateDisplayName(newDisplayName: string): Promise<boolean> {
    console.log('🔄 updateDisplayName called with:', newDisplayName);
    
    try {
      const userId = await userService.getUserId();
      console.log('👤 User ID:', userId);
      
      const docRef = firestore().collection(this.collectionName).doc(userId);
      
      // ドキュメントが存在するかチェック
      const doc = await docRef.get();
      
      if (doc.exists()) {
        // 既存ドキュメントの表示名を更新
        await docRef.update({
          displayName: newDisplayName.trim(),
          lastUpdated: Date.now(),
        });
        console.log('✅ Display name updated successfully');
        return true;
      } else {
        console.log('📄 User document does not exist yet');
        // ドキュメントが存在しない場合は何もしない
        // （初回スコア提出時に正しい表示名が設定される）
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to update display name:', String(error));
      return false;
    }
  }

  /**
   * 新規ユーザードキュメントを作成
   */
  private createNewUserDocument(
    userId: string, 
    submission: ScoreSubmission, 
    timestamp: number
  ): UserScoreDocument {
    const emptyChallenge: ChallengeScore = { score: 0, timestamp: 0, problemCount: 0 };

    const userData: UserScoreDocument = {
      userId,
      displayName: submission.displayName,
      createdAt: timestamp,
      lastUpdated: timestamp,
      challengeScores: {
        easy: { ...emptyChallenge },
        normal: { ...emptyChallenge },
        hard: { ...emptyChallenge },
      },
    };

    this.updateScore(userData, submission);
    return userData;
  }

  /**
   * スコアを更新
   */
  private updateScore(userData: UserScoreDocument, submission: ScoreSubmission): void {
    // チャレンジモードのみ対応
    if (submission.mode === GameMode.CHALLENGE) {
      const scoreData: ChallengeScore = {
        score: submission.score,
        timestamp: submission.timestamp,
        problemCount: submission.problemCount,
      };
      userData.challengeScores[submission.difficulty] = scoreData;
    }
  }

  /**
   * 現在のスコアを取得
   */
  private getCurrentScore(
    userData: UserScoreDocument, 
    mode: GameMode, 
    difficulty: DifficultyLevel
  ): ChallengeScore {
    // チャレンジモードのみ対応
    return userData.challengeScores[difficulty];
  }

  /**
   * ドキュメントからスコアを取得
   */
  private getScoreFromDocument(
    userData: UserScoreDocument, 
    mode: GameMode, 
    difficulty: DifficultyLevel
  ): ChallengeScore {
    return this.getCurrentScore(userData, mode, difficulty);
  }

  /**
   * Firestoreクエリ用のフィールドパスを取得
   */
  private getScoreFieldPath(mode: GameMode, difficulty: DifficultyLevel): string {
    // チャレンジモードのみ対応
    return `challengeScores.${difficulty}.score`;
  }
}

// シングルトンインスタンスをエクスポート
export const rankingService = RankingService.getInstance();