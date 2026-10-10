import React, { useMemo, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { ProblemData } from '../../types';
import { createPracticeNodes, combinePracticeNodes, practiceHistoryFromHint, PracticeNode, PracticeOperator } from '../../utils/reviewPractice';
import { findSolutionExample } from '../../utils/solutionExample';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';
import { PracticeTree } from './PracticeTree';
import { SolutionTree } from './SolutionTree';

const operators: { value: PracticeOperator; label: string; color: string }[] = [
  { value: '+', label: '+', color: ModernDesign.colors.accent.mint },
  { value: '-', label: '−', color: ModernDesign.colors.accent.coral },
  { value: '×', label: '×', color: ModernDesign.colors.accent.gold },
  { value: '÷', label: '÷', color: ModernDesign.colors.accent.purple },
];

export function ReviewGame({ problem, boardHeight }: {
  problem: ProblemData; boardHeight: number;
}) {
  const [history, setHistory] = useState<PracticeNode[][]>(() => [createPracticeNodes(problem.numbers)]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [operator, setOperator] = useState<PracticeOperator | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [previewStage, setPreviewStage] = useState(0);
  const nodes = history[history.length - 1];
  const solution = useMemo(() => previewStage > 0 ? findSolutionExample(problem) : null,
    [previewStage, problem]);
  const preview = previewStage > 0 && !!solution;

  const selectNode = (id: string) => {
    if (!selectedId) { setSelectedId(id); setFeedback(null); return; }
    if (selectedId === id) { setSelectedId(null); setOperator(null); return; }
    if (!operator) { setSelectedId(id); return; }
    const move = combinePracticeNodes(nodes, selectedId, id, operator, problem.target);
    if (move) {
      setHistory(previous => [...previous, move.nodes]);
      setFeedback(move.result === 'correct' ? '正解！' : move.result === 'wrong' ? '目標とちがいます。戻してやり直そう' : null);
    } else {
      setFeedback('その計算はできません');
    }
    setSelectedId(null);
    setOperator(null);
  };
  const undo = () => {
    if (history.length > 1) setHistory(previous => previous.slice(0, -1));
    setSelectedId(null); setOperator(null); setFeedback(null);
  };
  const reset = () => {
    setHistory([createPracticeNodes(problem.numbers)]);
    setSelectedId(null); setOperator(null); setFeedback(null);
  };
  const continueFromHint = () => {
    if (!solution || previewStage < 1 || previewStage > 3) return;
    const hintHistory = practiceHistoryFromHint(problem.numbers, problem.target, solution.tree, previewStage);
    if (!hintHistory) {
      setFeedback('ヒントを練習に反映できませんでした');
      return;
    }
    setHistory(hintHistory);
    setSelectedId(null);
    setOperator(null);
    setFeedback(null);
    setPreviewStage(0);
  };

  return <View style={styles.container}>
    <Card padding={4} style={styles.boardCard}>
      <View style={styles.targetRow}>
        <Typography variant="body2" color="secondary">つくる数　{problem.target}</Typography>
        {!!feedback && <Typography variant="caption" style={feedback === '正解！' ? styles.success : styles.error} numberOfLines={1}>{feedback}</Typography>}
      </View>
      <View style={{ height: boardHeight }}>
        <View pointerEvents={preview ? 'none' : 'auto'} style={[StyleSheet.absoluteFill, preview && styles.hidden]}>
          <PracticeTree nodes={nodes} selectedId={selectedId} onNodePress={selectNode} height={boardHeight} />
        </View>
        {preview && <View style={StyleSheet.absoluteFill}>
          <SolutionTree root={solution.tree} numbers={problem.numbers} target={problem.target} showAnswer
            revealSteps={previewStage} expression={solution.expression} steps={solution.steps} maxHeight={boardHeight} />
        </View>}
      </View>
    </Card>

    <View style={styles.practiceControls}>
      {previewStage === 0 ? <>
        <View style={styles.operatorRow}>
          {operators.map(item => <TouchableOpacity key={item.value} accessibilityRole="button" accessibilityLabel={`${item.label}で計算`}
            accessibilityState={{ disabled: !selectedId, selected: operator === item.value }} disabled={!selectedId}
            onPress={() => setOperator(current => current === item.value ? null : item.value)}
            style={[styles.operatorButton, { borderColor: item.color }, operator === item.value && { backgroundColor: item.color }, !selectedId && styles.disabled]}>
            <Typography variant="h6" style={{ color: operator === item.value ? ModernDesign.colors.background.primary : item.color }}>{item.label}</Typography>
          </TouchableOpacity>)}
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="1手戻す" accessibilityState={{ disabled: history.length <= 1 }}
            disabled={history.length <= 1} onPress={undo} style={[styles.actionButton, history.length <= 1 && styles.disabled]}>
            <MaterialIcons name="undo" size={20} color={ModernDesign.colors.text.primary} /><Typography variant="body2">戻す</Typography>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="最初から解き直す" onPress={reset} style={styles.actionButton}>
            <MaterialIcons name="refresh" size={20} color={ModernDesign.colors.text.primary} /><Typography variant="body2">最初から</Typography>
          </TouchableOpacity>
        </View>
      </> : <View style={styles.previewActions}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={previewStage === 4 ? '練習に戻る' : '自分の手順に戻る'}
          onPress={() => setPreviewStage(0)} style={styles.previewAction}>
          <MaterialIcons name="undo" size={18} color={ModernDesign.colors.accent.neon} />
          <Typography variant="body2" style={styles.returnText}>{previewStage === 4 ? '練習に戻る' : '自分の手順に戻る'}</Typography>
        </TouchableOpacity>
        {previewStage < 4 && <TouchableOpacity accessibilityRole="button" accessibilityLabel="ヒントの続きから解く"
          onPress={continueFromHint} style={[styles.previewAction, styles.continueAction]}>
          <MaterialIcons name="edit" size={18} color={ModernDesign.colors.background.primary} />
          <Typography variant="body2" style={styles.continueText}>ヒントの続きから解く</Typography>
        </TouchableOpacity>}
      </View>}
    </View>

    <View style={styles.hintRow}>
      {[1, 2, 3, 4].map(stage => <TouchableOpacity key={stage} accessibilityRole="button"
        accessibilityLabel={stage === 4 ? '答え' : `ヒント${stage}`} accessibilityState={{ selected: previewStage === stage }}
        onPress={() => setPreviewStage(current => current === stage ? 0 : stage)}
        style={[styles.hintButton, previewStage === stage && styles.activeHint]}>
        <Typography variant="body2" style={previewStage === stage ? styles.activeHintText : undefined}>{stage === 4 ? '答え' : `ヒント${stage}`}</Typography>
      </TouchableOpacity>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: ModernDesign.spacing[2] },
  boardCard: { gap: ModernDesign.spacing[2] },
  targetRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[2] },
  success: { color: ModernDesign.colors.accent.mint },
  error: { color: ModernDesign.colors.error, flexShrink: 1 },
  hidden: { opacity: 0 },
  practiceControls: { minHeight: 88, justifyContent: 'center' },
  operatorRow: { minHeight: 44, flexDirection: 'row', justifyContent: 'center', gap: ModernDesign.spacing[3] },
  operatorButton: { width: 56, height: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: ModernDesign.borderRadius.lg },
  disabled: { opacity: 0.4 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', gap: ModernDesign.spacing[6] },
  actionButton: { minHeight: 44, minWidth: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[1] },
  previewActions: { minHeight: 88, alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[1] },
  previewAction: { minHeight: 40, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[1], borderRadius: ModernDesign.borderRadius.lg },
  continueAction: { minHeight: 44, backgroundColor: ModernDesign.colors.accent.neon },
  continueText: { color: ModernDesign.colors.background.primary },
  returnText: { color: ModernDesign.colors.accent.neon },
  hintRow: { flexDirection: 'row', justifyContent: 'space-between', gap: ModernDesign.spacing[1] },
  hintButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: ModernDesign.borderRadius.lg, backgroundColor: ModernDesign.colors.background.secondary },
  activeHint: { backgroundColor: ModernDesign.colors.accent.neon },
  activeHintText: { color: ModernDesign.colors.background.primary, fontWeight: ModernDesign.typography.fontWeight.semibold },
});
