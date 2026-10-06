import { RouteProp, useIsFocused } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ProblemReviewCard } from '../components/molecules/ProblemReviewCard';
import { getDifficultyConfig } from '../config/difficulty';
import { getGameModeConfig } from '../config/gameMode';
import { RANKING_CONFIG } from '../config/ranking';
import { COLORS, ModernDesign } from '../constants';
import { adService } from '../services/adService';
import { analyticsService } from '../services/analyticsService';
import { rankingService } from '../services/rankingService';
import { reviewService } from '../services/reviewService';
import { useGameStore } from '../store/gameStore';
import { useMonetizationStore } from '../store/monetizationStore';
import { useStatsStore } from '../store/statsStore';
import { DifficultyLevel, GameMode } from '../types';
import { PurchaseSource } from '../types/purchase';
import { UserRankInfo } from '../types/ranking';
import { getScoreTierProgress } from '../utils/scoreTier';

type RootStackParamList = {
  ModeSelection: undefined;
  Settings: undefined;
  Purchase: { source: PurchaseSource };
  ChallengeMode: { difficulty: DifficultyLevel };
  InfiniteMode: { difficulty: DifficultyLevel };
  ChallengeResult: {
    finalScore: number;
    isNewHighScore: boolean;
    previousHighScore: number;
    mode?: 'challenge' | 'infinite';
    difficulty?: DifficultyLevel;
  };
};

interface ChallengeResultScreenProps {
  navigation: StackNavigationProp<RootStackParamList>;
  route: RouteProp<RootStackParamList, 'ChallengeResult'>;
}

export const ChallengeResultScreen: React.FC<ChallengeResultScreenProps> = ({ navigation, route }) => {
  const { finalScore, isNewHighScore, previousHighScore, mode = 'challenge', difficulty } = route.params;
  const gameMode = mode === 'infinite' ? GameMode.INFINITE : GameMode.CHALLENGE;
  const { initGame, gameState, isSubmittingScore } = useGameStore();
  const currentDifficulty = difficulty || gameState.difficulty;
  const difficultyConfig = getDifficultyConfig(currentDifficulty);
  const config = getGameModeConfig(gameMode);
  const gamesPlayed = useStatsStore(state => state.stats.gamesPlayed);
  const rewardBusy = useMonetizationStore(state => state.rewardBusy);
  const sessionId = useGameStore(state => state.gameSessionId);
  const isFocused = useIsFocused();
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rankInfo, setRankInfo] = useState<UserRankInfo | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => { adService.recordCompletedGame(sessionId); }, [sessionId]);
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !rewardBusy });
    return navigation.addListener('beforeRemove', event => {
      if (useMonetizationStore.getState().rewardBusy) event.preventDefault();
    });
  }, [navigation, rewardBusy]);
  useEffect(() => {
    if (!isFocused || !isNewHighScore || reviewOpen || rewardBusy || isLeaving) return;
    const timer = setTimeout(() => {
      reviewService.maybeRequestReview({ isNewHighScore, gamesPlayed });
    }, 3500);
    return () => clearTimeout(timer);
  }, [isFocused, isNewHighScore, gamesPlayed, reviewOpen, rewardBusy, isLeaving]);
  useEffect(() => {
    if (gameMode !== GameMode.CHALLENGE || isSubmittingScore) return;
    let isCancelled = false;
    rankingService.getUserRank(gameMode, currentDifficulty).then(info => {
      if (!isCancelled) setRankInfo(info);
    });
    return () => { isCancelled = true; };
  }, [gameMode, currentDifficulty, isSubmittingScore]);

  const handleRetry = async () => {
    if (leavingRef.current || useMonetizationStore.getState().rewardBusy) return;
    leavingRef.current = true;
    setIsLeaving(true);
    try {
      analyticsService.logEvent('result_action', { action: 'retry' });
      await initGame(gameMode, currentDifficulty);
      navigation.replace(gameMode === GameMode.CHALLENGE ? 'ChallengeMode' : 'InfiniteMode', { difficulty: currentDifficulty });
    } catch (error) {
      leavingRef.current = false;
      console.error('Error in handleRetry:', error);
      setIsLeaving(false);
    }
  };
  const handleBackToMenu = async () => {
    if (leavingRef.current || useMonetizationStore.getState().rewardBusy) return;
    leavingRef.current = true;
    setIsLeaving(true);
    analyticsService.logEvent('result_action', { action: 'menu' });
    await adService.showInterstitialOnMenu();
    navigation.replace('ModeSelection');
  };

  const correctCount = gameState.correctCount || 0;
  const averageSolveTime = correctCount > 0 ? gameState.totalSolveTime / correctCount : null;
  const breakdownRows = gameMode === GameMode.CHALLENGE
    ? [
      { label: '基本スコア', value: gameState.scoreBreakdown.base },
      { label: 'スピード', value: gameState.scoreBreakdown.time },
      { label: '目標値', value: gameState.scoreBreakdown.target },
      { label: 'コンボ', value: gameState.scoreBreakdown.combo },
      { label: '達成', value: gameState.finalBonus },
    ].filter(row => row.value > 0)
    : [];
  const isRankingTallying = !!rankInfo?.rank && rankInfo.totalUsers < RANKING_CONFIG.MIN_PARTICIPANTS;
  const topPercent = rankInfo?.rank && !isRankingTallying
    ? Math.max(1, Math.ceil((rankInfo.rank / rankInfo.totalUsers) * 100))
    : null;
  const tier = gameMode === GameMode.CHALLENGE && finalScore > 0
    ? getScoreTierProgress(currentDifficulty, finalScore)
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.summary}>
            <Text style={[styles.eyebrow, isNewHighScore && styles.recordText]}>
              {isNewHighScore ? '自己ベスト更新' : 'プレイ終了'}
            </Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreValue, compact && styles.compactScore]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>
                {mode === 'infinite' ? finalScore : finalScore.toLocaleString()}
              </Text>
              <Text style={styles.scoreUnit}>{mode === 'infinite' ? '問' : '点'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{config.display.headerLabel} · {difficultyConfig.label.ja}</Text>
              {!isNewHighScore && previousHighScore > 0 && <Text style={styles.metaText}>
                ベスト {mode === 'infinite' ? previousHighScore : previousHighScore.toLocaleString()}{mode === 'infinite' ? '問' : '点'}
              </Text>}
            </View>
            {!!rankInfo?.rank && <Text style={styles.rankText}>
              {isRankingTallying ? 'ランキングにエントリー · 集計中' : '全国 ' + rankInfo.rank.toLocaleString() + '位 / ' + rankInfo.totalUsers.toLocaleString() + '人' +
                (topPercent !== null ? ' · 上位' + topPercent + '%' : '')}
            </Text>}
          </View>

          {correctCount > 0 && <View style={styles.recordSection}>
            <Text style={styles.recordHeading}>今回の記録</Text>
            <View style={styles.statsRow}>
              {gameMode === GameMode.CHALLENGE && <View style={styles.stat}>
                <Text style={styles.statValue}>{correctCount}問</Text>
                <Text style={styles.statLabel}>正解</Text>
              </View>}
              <View style={styles.stat}>
                <Text style={styles.statValue}>{averageSolveTime === null ? '—' : averageSolveTime.toFixed(1) + '秒'}</Text>
                <Text style={styles.statLabel}>平均回答時間</Text>
              </View>
              {gameMode === GameMode.CHALLENGE && <View style={styles.stat}>
                <Text style={styles.statValue}>{gameState.maxCombo || 0}</Text>
                <Text style={styles.statLabel}>最大コンボ</Text>
              </View>}
            </View>
            {tier && <Text style={styles.tierText}>基準スコア · {tier.current?.label ?? 'ランクなし'} · {tier.next
              ? tier.next.label + 'まであと' + tier.remaining.toLocaleString() + '点' : '最高ランク到達'}</Text>}
            {breakdownRows.length > 0 && <View style={styles.breakdown}>
              <Text style={styles.breakdownHeading}>スコア内訳</Text>
              <Text style={styles.breakdownText}>{breakdownRows.map(row => row.label + ' +' + row.value.toLocaleString()).join('  ·  ')}</Text>
            </View>}
          </View>}

          <View style={styles.bottomGroup}>
            <ProblemReviewCard onPurchase={() => navigation.navigate('Purchase', { source: 'result_review' })}
              onOpenChange={setReviewOpen} disabled={isLeaving} />
            <View style={styles.actionRow}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="もう一度プレイ" disabled={isLeaving || rewardBusy}
                accessibilityState={{ disabled: isLeaving || rewardBusy }} onPress={handleRetry}
                style={[styles.retryButton, (isLeaving || rewardBusy) && styles.disabled]}>
                <MaterialIcons name="replay" size={20} color={ModernDesign.colors.background.primary} />
                <Text style={styles.retryText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>もう一度</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="ホームに戻る" disabled={isLeaving || rewardBusy}
                accessibilityState={{ disabled: isLeaving || rewardBusy }} onPress={handleBackToMenu}
                style={[styles.menuButton, (isLeaving || rewardBusy) && styles.disabled]}>
                <MaterialIcons name="home" size={20} color={ModernDesign.colors.text.primary} />
                <Text style={styles.menuText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>ホームに戻る</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: ModernDesign.spacing[4], paddingTop: ModernDesign.spacing[6], paddingBottom: ModernDesign.spacing[4] },
  content: { flexGrow: 1, width: '100%', maxWidth: 420, alignSelf: 'center', gap: ModernDesign.spacing[4] },
  summary: { alignItems: 'center', gap: ModernDesign.spacing[1], paddingVertical: ModernDesign.spacing[2] },
  eyebrow: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.base, fontWeight: ModernDesign.typography.fontWeight.semibold },
  recordText: { color: ModernDesign.colors.accent.gold },
  scoreRow: { maxWidth: '100%', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: ModernDesign.spacing[1] },
  scoreValue: { flexShrink: 1, color: ModernDesign.colors.accent.neon, fontSize: 56, lineHeight: 66, fontWeight: ModernDesign.typography.fontWeight.black },
  compactScore: { fontSize: 48, lineHeight: 58 },
  scoreUnit: { color: ModernDesign.colors.text.primary, fontSize: ModernDesign.typography.fontSize.lg, fontWeight: ModernDesign.typography.fontWeight.bold },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: ModernDesign.spacing[3] },
  metaText: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.sm },
  rankText: { color: ModernDesign.colors.accent.gold, fontSize: ModernDesign.typography.fontSize.sm, marginTop: ModernDesign.spacing[1] },
  bottomGroup: { marginTop: 'auto', gap: ModernDesign.spacing[2], paddingTop: ModernDesign.spacing[4] },
  actionRow: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  retryButton: { width: '48.5%', minHeight: 50, borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.accent.neon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[2] },
  retryText: { flexShrink: 1, color: ModernDesign.colors.background.primary, fontSize: ModernDesign.typography.fontSize.base, fontWeight: ModernDesign.typography.fontWeight.bold },
  menuButton: { width: '48.5%', minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[2],
    backgroundColor: ModernDesign.colors.background.secondary, borderRadius: ModernDesign.borderRadius.lg,
    borderWidth: 1, borderColor: ModernDesign.colors.border.subtle },
  menuText: { flexShrink: 1, color: ModernDesign.colors.text.primary, fontSize: ModernDesign.typography.fontSize.base },
  disabled: { opacity: 0.45 },
  recordSection: { borderTopWidth: 1, borderColor: ModernDesign.colors.border.subtle, paddingTop: ModernDesign.spacing[4], gap: ModernDesign.spacing[3] },
  recordHeading: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.sm, fontWeight: ModernDesign.typography.fontWeight.semibold },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { flex: 1, gap: ModernDesign.spacing[1] },
  statValue: { color: ModernDesign.colors.text.primary, fontSize: ModernDesign.typography.fontSize.base, fontWeight: ModernDesign.typography.fontWeight.semibold },
  statLabel: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.xs },
  tierText: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.xs },
  breakdown: { gap: ModernDesign.spacing[1] },
  breakdownHeading: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.xs },
  breakdownText: { color: ModernDesign.colors.text.secondary, fontSize: ModernDesign.typography.fontSize.xs, lineHeight: 19 },
});
