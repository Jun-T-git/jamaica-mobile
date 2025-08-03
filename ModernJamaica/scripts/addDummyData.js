// Firebase Admin SDK を使用したダミーデータ追加スクリプト
// 使用方法: node scripts/addDummyData.js

const admin = require('firebase-admin');

// サービスアカウントキーが必要
// Firebase Console → プロジェクト設定 → サービスアカウント → 新しい秘密鍵を生成
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ダミーデータ
const dummyUsers = [
  {
    userId: "user_dummy_001",
    displayName: "マスタープレイヤー",
    scores: { easy: 5000, normal: 6000, hard: 7000 }
  },
  {
    userId: "user_dummy_002", 
    displayName: "チャレンジャー",
    scores: { easy: 3500, normal: 4500, hard: 5500 }
  },
  {
    userId: "user_dummy_003",
    displayName: "初心者くん",
    scores: { easy: 1000, normal: 1500, hard: 2000 }
  },
  {
    userId: "user_dummy_004",
    displayName: "中級プレイヤー",
    scores: { easy: 2500, normal: 3000, hard: 3500 }
  },
  {
    userId: "user_dummy_005",
    displayName: "上級者さん",
    scores: { easy: 4000, normal: 5000, hard: 6000 }
  }
];

async function addDummyData() {
  const batch = db.batch();
  const now = Date.now();

  dummyUsers.forEach(user => {
    const docRef = db.collection('userScores').doc(user.userId);
    const data = {
      userId: user.userId,
      displayName: user.displayName,
      createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // 過去30日のランダム
      lastUpdated: now,
      challengeScores: {
        easy: {
          score: user.scores.easy,
          timestamp: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000), // 過去7日のランダム
          problemCount: Math.floor(user.scores.easy / 200) // スコアに応じた問題数
        },
        normal: {
          score: user.scores.normal,
          timestamp: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          problemCount: Math.floor(user.scores.normal / 200)
        },
        hard: {
          score: user.scores.hard,
          timestamp: now - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          problemCount: Math.floor(user.scores.hard / 200)
        }
      }
    };
    batch.set(docRef, data);
  });

  try {
    await batch.commit();
    console.log('✅ ダミーデータの追加が完了しました！');
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

addDummyData();