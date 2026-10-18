import React, { useEffect, useMemo, useState } from 'react';
import { Alert, AppState, Modal, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { adService } from '../../services/adService';
import { analyticsService } from '../../services/analyticsService';
import { useGameStore } from '../../store/gameStore';
import { useMonetizationStore } from '../../store/monetizationStore';
import { canReview } from '../../utils/monetizationPolicy';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { ReviewGame } from './ReviewGame';

const isMissed = (result: string) => result !== 'correct';
const resultLabel = (result: string) => result === 'correct' ? '正解' : result === 'skipped' ? 'スキップ' : '未解答';

export function ProblemReviewCard({ onPurchase, onOpenChange, disabled = false }: {
  onPurchase: () => void;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
}) {
  const problems = useGameStore(state => state.reviewProblems);
  const { hasRemovedAds, reviewExpiresAt, rewardBusy } = useMonetizationStore();
  const [now, setNow] = useState(Date.now());
  const [open, setOpen] = useState(false);
  const [screen, setScreen] = useState<'list' | 'detail'>('list');
  const [filter, setFilter] = useState<'all' | 'missed'>('all');
  const [index, setIndex] = useState(0);
  const { height } = useWindowDimensions();
  const allowed = canReview(hasRemovedAds, reviewExpiresAt, now);
  const missedCount = problems.filter(item => isMissed(item.result)).length;
  const visibleIndexes = useMemo(() => problems.map((_, i) => i).filter(i => filter === 'all' || isMissed(problems[i].result)), [filter, problems]);
  const position = visibleIndexes.indexOf(index);
  const problem = problems[index];
  const setVisible = (visible: boolean) => { setOpen(visible); onOpenChange(visible); };
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    const subscription = AppState.addEventListener('change', () => setNow(Date.now()));
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  useEffect(() => {
    if (problems.length) analyticsService.logEvent('review_offer_viewed', { problem_count: problems.length });
  }, [problems.length]);
  const openReview = () => {
    const state = useMonetizationStore.getState();
    setNow(Date.now());
    setScreen('list');
    setFilter('all');
    setVisible(true);
    analyticsService.logEvent('review_opened', {
      access: state.hasRemovedAds ? 'purchase' : canReview(state.hasRemovedAds, state.reviewExpiresAt, Date.now()) ? 'reward' : 'locked',
      problem_count: problems.length,
    });
  };
  const showProblem = (problemIndex: number) => { setIndex(problemIndex); setScreen('detail'); };
  const watch = async (problemIndex: number) => {
    const result = await adService.showRewardForReview();
    if (result === 'earned') { setNow(Date.now()); showProblem(problemIndex); }
    if (result === 'cancelled') Alert.alert('解答例はまだ解放されていません', '広告の視聴が完了すると、その時点から1時間見放題になります。');
    if (result === 'unavailable') Alert.alert('今は広告を再生できません', '通信状況を確認し、少し時間をおいてお試しください。ゲームはそのまま続けられます。');
  };
  const openProblem = (problemIndex: number) => {
    if (rewardBusy) return;
    if (!isMissed(problems[problemIndex].result) || canReview(hasRemovedAds, reviewExpiresAt, Date.now())) {
      showProblem(problemIndex);
      return;
    }
    Alert.alert('広告を見て問題を開く', '1回の視聴で、解けなかった問題を1時間見放題。ヒント・答えも使えます。', [
      { text: 'キャンセル', style: 'cancel' },
      { text: '広告を見る', onPress: () => { watch(problemIndex).catch(error => console.error('Rewarded review failed:', error)); } },
    ]);
  };
  const move = (offset: number) => openProblem(visibleIndexes[position + offset]);
  if (!problems.length) return null;
  return (
    <>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={`解答例を見る・復習する。全${problems.length}問、解けなかった${missedCount}問`}
        accessibilityState={{ disabled: disabled || rewardBusy }} disabled={disabled || rewardBusy} onPress={openReview} activeOpacity={0.8}>
        <Card padding={4} style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.cardHeadingText}>
              <Typography variant="body1" style={styles.cardTitle}>解答例を見る・復習する</Typography>
              <Typography variant="body2" color="secondary">全{problems.length}問 · 解けなかった{missedCount}問</Typography>
            </View>
            <MaterialIcons name="chevron-right" size={28} color={ModernDesign.colors.accent.neon} />
          </View>
        </Card>
      </TouchableOpacity>
      {!hasRemovedAds && <TouchableOpacity accessibilityRole="button" onPress={onPurchase} disabled={disabled || rewardBusy}
        accessibilityState={{ disabled: disabled || rewardBusy }} style={styles.purchaseLink}>
        <Typography variant="caption" style={styles.purchaseLinkTitle}>広告なしでヒント・答えを見る →</Typography>
      </TouchableOpacity>}
      <Modal visible={open} animationType="slide" onRequestClose={() => { if (!rewardBusy) setVisible(false); }}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              {screen === 'detail' && <TouchableOpacity accessibilityRole="button" accessibilityLabel="問題一覧に戻る"
                onPress={() => setScreen('list')} style={styles.iconButton}>
                <MaterialIcons name="arrow-back" size={24} color={ModernDesign.colors.text.primary} />
              </TouchableOpacity>}
              <Typography variant="h6">{screen === 'list' ? '問題一覧' : `問題 ${index + 1}`}</Typography>
              {screen === 'detail' && <Typography variant="caption" style={[styles.statusText, problem?.result === 'correct' ? styles.correctText : styles.missedText]}>
                前回 {resultLabel(problem?.result ?? '')}
              </Typography>}
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="リザルトに戻る" disabled={rewardBusy}
              onPress={() => setVisible(false)} style={styles.iconButton}>
              <MaterialIcons name="close" size={24} color={ModernDesign.colors.text.primary} />
            </TouchableOpacity>
          </View>
          {screen === 'list' ? <ScrollView contentContainerStyle={styles.listContent}>
            <View style={styles.filters}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="すべての問題" accessibilityState={{ selected: filter === 'all' }} onPress={() => setFilter('all')}
                style={[styles.filterButton, filter === 'all' && styles.activeFilter]}><Typography variant="body2">すべて {problems.length}</Typography></TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="解けなかった問題のみ" accessibilityState={{ selected: filter === 'missed' }} onPress={() => setFilter('missed')}
                style={[styles.filterButton, filter === 'missed' && styles.activeFilter]}><Typography variant="body2">解けなかった {missedCount}</Typography></TouchableOpacity>
            </View>
            {!hasRemovedAds && <TouchableOpacity accessibilityRole="button" accessibilityLabel="広告削除プランを見る"
              disabled={rewardBusy} onPress={() => { setVisible(false); onPurchase(); }} style={styles.listPurchaseLink}>
              <MaterialIcons name="block" size={19} color={ModernDesign.colors.accent.neon} />
              <Typography variant="body2" style={styles.listPurchaseText}>広告なしで復習する</Typography>
              <Typography variant="caption" color="secondary">買い切り</Typography>
              <MaterialIcons name="chevron-right" size={21} color={ModernDesign.colors.text.secondary} />
            </TouchableOpacity>}
            {visibleIndexes.map(problemIndex => {
              const item = problems[problemIndex];
              const locked = isMissed(item.result) && !allowed;
              const rewardUnlocked = isMissed(item.result) && !hasRemovedAds && allowed;
              return <TouchableOpacity key={problemIndex} accessibilityRole="button"
                accessibilityLabel={`問題${problemIndex + 1}、${resultLabel(item.result)}、目標${item.problem.target}、数字${item.problem.numbers.join('、')}${locked ? '、広告視聴で1時間見放題' : rewardUnlocked ? '、見放題中' : ''}`}
                disabled={rewardBusy} onPress={() => openProblem(problemIndex)} style={styles.listRow}>
                <View style={styles.rowContent}>
                  <View style={styles.rowTop}>
                    <Typography variant="body2" style={styles.rowTitle}>問題 {problemIndex + 1}</Typography>
                    <Typography variant="caption" style={[styles.statusText, item.result === 'correct' ? styles.correctText : styles.missedText]}>
                      {resultLabel(item.result)}
                    </Typography>
                  </View>
                  <Typography variant="body2" color="secondary">目標 {item.problem.target} · {item.problem.numbers.join(' · ')}</Typography>
                  {locked && <View style={styles.adBadge}>
                    <MaterialIcons name="ondemand-video" size={15} color={ModernDesign.colors.accent.neon} />
                    <Typography variant="caption" style={styles.adBadgeText}>広告視聴で1時間見放題</Typography>
                  </View>}
                  {rewardUnlocked && <View style={styles.adBadge}>
                    <MaterialIcons name="check-circle-outline" size={15} color={ModernDesign.colors.accent.mint} />
                    <Typography variant="caption" style={styles.rewardUnlockedText}>見放題中</Typography>
                  </View>}
                </View>
                <MaterialIcons name="chevron-right" size={24} color={ModernDesign.colors.text.secondary} />
              </TouchableOpacity>;
            })}
            {visibleIndexes.length === 0 && <Typography color="secondary" textAlign="center">解けなかった問題はありません。</Typography>}
            <Typography variant="caption" color="secondary" textAlign="center" style={styles.listNote}>次のプレイを始めると、この一覧は切り替わります。</Typography>
          </ScrollView> : <ScrollView contentContainerStyle={styles.detailContent}>
            {problem && <>
              <ReviewGame key={index} problem={problem.problem} boardHeight={Math.max(260, Math.min(320, height - 390))} />
              {visibleIndexes.length > 1 && <View style={styles.pagination}>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="前の問題" accessibilityState={{ disabled: position <= 0 }}
                  onPress={() => move(-1)} disabled={position <= 0} style={[styles.pageButton, position <= 0 && styles.disabled]}>
                  <MaterialIcons name="chevron-left" size={22} color={ModernDesign.colors.text.primary} /><Typography variant="body2">前へ</Typography>
                </TouchableOpacity>
                <Typography variant="body2" color="secondary" style={styles.pageCount}>{position + 1} / {visibleIndexes.length}</Typography>
                <TouchableOpacity accessibilityRole="button" accessibilityLabel="次の問題" accessibilityState={{ disabled: position >= visibleIndexes.length - 1 }}
                  onPress={() => move(1)} disabled={position >= visibleIndexes.length - 1} style={[styles.pageButton, position >= visibleIndexes.length - 1 && styles.disabled]}>
                  <Typography variant="body2">次へ</Typography><MaterialIcons name="chevron-right" size={22} color={ModernDesign.colors.text.primary} />
                </TouchableOpacity>
              </View>}
            </>}
          </ScrollView>}
        </SafeAreaView>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({
  card: { width: '100%', minHeight: 88, justifyContent: 'center' },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: ModernDesign.spacing[2] },
  cardHeadingText: { flex: 1, gap: ModernDesign.spacing[1] },
  cardTitle: { fontSize: ModernDesign.typography.fontSize.lg, fontWeight: ModernDesign.typography.fontWeight.semibold },
  purchaseLink: { minHeight: 36, justifyContent: 'center', alignItems: 'center' },
  purchaseLinkTitle: { color: ModernDesign.colors.accent.neon, fontWeight: ModernDesign.typography.fontWeight.semibold },
  listNote: { marginTop: ModernDesign.spacing[3] },
  modal: { flex: 1, backgroundColor: ModernDesign.colors.background.primary },
  header: { minHeight: 56, paddingHorizontal: ModernDesign.spacing[4], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[2] },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontWeight: ModernDesign.typography.fontWeight.semibold },
  correctText: { color: ModernDesign.colors.accent.mint },
  missedText: { color: ModernDesign.colors.accent.coral },
  listContent: { paddingHorizontal: ModernDesign.spacing[4], paddingTop: ModernDesign.spacing[3], paddingBottom: ModernDesign.spacing[8], gap: ModernDesign.spacing[2] },
  filters: { flexDirection: 'row', gap: ModernDesign.spacing[2], marginBottom: ModernDesign.spacing[2] },
  filterButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: ModernDesign.spacing[4], borderRadius: 20, backgroundColor: ModernDesign.colors.background.secondary },
  activeFilter: { backgroundColor: ModernDesign.colors.background.tertiary, borderWidth: 1, borderColor: ModernDesign.colors.accent.neon },
  listPurchaseLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[1],
    marginBottom: ModernDesign.spacing[2] },
  listPurchaseText: { color: ModernDesign.colors.accent.neon, fontWeight: ModernDesign.typography.fontWeight.semibold },
  listRow: { minHeight: 68, paddingHorizontal: ModernDesign.spacing[4], paddingVertical: ModernDesign.spacing[2], borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.tertiary, flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[2] },
  rowContent: { flex: 1, gap: ModernDesign.spacing[1] },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[3] },
  rowTitle: { fontWeight: ModernDesign.typography.fontWeight.semibold },
  adBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[1],
    paddingHorizontal: ModernDesign.spacing[2], paddingVertical: 3, borderRadius: ModernDesign.borderRadius.sm,
    backgroundColor: ModernDesign.colors.background.secondary },
  adBadgeText: { color: ModernDesign.colors.accent.neon },
  rewardUnlockedText: { color: ModernDesign.colors.accent.mint },
  detailContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: ModernDesign.spacing[4], paddingVertical: ModernDesign.spacing[2], gap: ModernDesign.spacing[3] },
  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageButton: { minWidth: 80, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[1] },
  pageCount: { textAlign: 'center' },
  disabled: { opacity: 0.35 },
});
