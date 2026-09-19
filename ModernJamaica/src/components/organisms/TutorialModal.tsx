import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../atoms/Button';
import { ModernDesign } from '../../constants';
import { analyticsService } from '../../services/analyticsService';
import { soundManager, SoundType } from '../../utils/SoundManager';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

type NodeVariant = 'default' | 'selected' | 'target' | 'result';

const SampleNode: React.FC<{ value: number; variant?: NodeVariant }> = ({
  value,
  variant = 'default',
}) => (
  <View
    style={[
      styles.node,
      variant === 'selected' && styles.nodeSelected,
      variant === 'target' && styles.nodeTarget,
      variant === 'result' && styles.nodeResult,
    ]}
  >
    <Text
      style={[
        styles.nodeText,
        variant === 'selected' && styles.nodeTextSelected,
      ]}
    >
      {value}
    </Text>
  </View>
);

const SampleOperator: React.FC<{ label: string; color: string }> = ({
  label,
  color,
}) => (
  <View style={[styles.operator, { backgroundColor: color }]}>
    <Text style={styles.operatorText}>{label}</Text>
  </View>
);

// 例題: 4 × 4 + 3 + 2 − 1 = 20
const StepGoal = () => (
  <View style={styles.illustration}>
    <View style={styles.targetCard}>
      <Text style={styles.targetLabel}>つくる数</Text>
      <Text style={styles.targetNumber}>20</Text>
    </View>
    <View style={styles.nodeRow}>
      {[4, 4, 3, 2, 1].map((value, index) => (
        <SampleNode key={index} value={value} />
      ))}
    </View>
  </View>
);

const StepConnect = () => (
  <View style={styles.illustration}>
    <View style={styles.tapRow}>
      <View style={styles.tapItem}>
        <SampleNode value={4} variant="selected" />
        <Text style={styles.tapOrder}>① 数字</Text>
      </View>
      <View style={styles.tapItem}>
        <SampleOperator label="×" color={ModernDesign.colors.accent.gold} />
        <Text style={styles.tapOrder}>② 記号</Text>
      </View>
      <View style={styles.tapItem}>
        <SampleNode value={4} variant="target" />
        <Text style={styles.tapOrder}>③ 数字</Text>
      </View>
    </View>
    <MaterialIcons
      name="arrow-downward"
      size={24}
      color={ModernDesign.colors.text.tertiary}
    />
    <SampleNode value={16} variant="result" />
  </View>
);

const StepComplete = () => (
  <View style={styles.illustration}>
    <View style={styles.formulaList}>
      {[
        { left: 4, op: '×', right: 4, result: 16 },
        { left: 16, op: '+', right: 3, result: 19 },
        { left: 2, op: '−', right: 1, result: 1 },
        { left: 19, op: '+', right: 1, result: 20 },
      ].map((row, index, rows) => (
        <View key={index} style={styles.formulaRow}>
          <Text style={styles.formulaText}>
            {row.left} {row.op} {row.right} =
          </Text>
          <Text
            style={[
              styles.formulaResult,
              index === rows.length - 1 && styles.formulaResultFinal,
            ]}
          >
            {row.result}
          </Text>
          {index === rows.length - 1 && (
            <MaterialIcons
              name="check-circle"
              size={20}
              color={ModernDesign.colors.success}
            />
          )}
        </View>
      ))}
    </View>
  </View>
);

const STEPS = [
  {
    title: '5つの数字をぜんぶ使おう',
    description:
      '5つの数字を1回ずつ全部使って、\n「つくる数」と同じ数を作るパズルです。',
    Illustration: StepGoal,
  },
  {
    title: '数字 → 記号 → 数字 の順にタップ',
    description:
      '2つの数字が計算されて、新しい数字になります。\nできた数字は、また次の計算に使えます。',
    Illustration: StepConnect,
  },
  {
    title: '最後の1つが「つくる数」なら正解！',
    description:
      'まちがえても「戻す」ボタンでやり直せます。\n速く、連続で正解するほど高得点！',
    Illustration: StepComplete,
  },
];

/**
 * 遊び方チュートリアル（3ステップ）
 * 初回起動時に自動表示し、メニューの「遊び方」からいつでも見返せる
 */
export const TutorialModal: React.FC<TutorialModalProps> = ({
  visible,
  onClose,
}) => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (visible) {
      setStepIndex(0);
      analyticsService.logEvent('tutorial_begin');
    }
  }, [visible]);

  const isLastStep = stepIndex === STEPS.length - 1;
  const { title, description, Illustration } = STEPS[stepIndex];

  const handleNext = () => {
    soundManager.play(SoundType.BUTTON);

    if (isLastStep) {
      analyticsService.logEvent('tutorial_complete');
      onClose();
    } else {
      setStepIndex(stepIndex + 1);
    }
  };

  const handleSkip = () => {
    soundManager.play(SoundType.BUTTON);
    analyticsService.logEvent('tutorial_skip', { step: stepIndex + 1 });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.stepCount}>
              遊び方 {stepIndex + 1}/{STEPS.length}
            </Text>
            {!isLastStep && (
              <TouchableOpacity
                onPress={handleSkip}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.skipText}>スキップ</Text>
              </TouchableOpacity>
            )}
          </View>

          <Illustration />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>

          <View style={styles.dots}>
            {STEPS.map((_, index) => (
              <View
                key={index}
                style={[styles.dot, index === stepIndex && styles.dotActive]}
              />
            ))}
          </View>

          <Button
            icon={isLastStep ? 'play-arrow' : 'arrow-forward'}
            title={isLastStep ? 'はじめる' : '次へ'}
            onPress={handleNext}
            variant="primary"
          />
        </View>
      </View>
    </Modal>
  );
};

const NODE_SIZE = 48;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ModernDesign.spacing[5],
    backgroundColor: ModernDesign.colors.background.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: ModernDesign.spacing[5],
    borderRadius: ModernDesign.borderRadius['2xl'],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    backgroundColor: ModernDesign.colors.background.tertiary,
    ...ModernDesign.shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[4],
  },
  stepCount: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    color: ModernDesign.colors.accent.neon,
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  skipText: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.tertiary,
  },
  illustration: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ModernDesign.spacing[3],
    marginBottom: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.xl,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  targetCard: {
    alignItems: 'center',
    paddingVertical: ModernDesign.spacing[2],
    paddingHorizontal: ModernDesign.spacing[8],
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.tertiary,
  },
  targetLabel: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.secondary,
  },
  targetNumber: {
    fontSize: ModernDesign.typography.fontSize['4xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.neon,
  },
  nodeRow: {
    flexDirection: 'row',
    gap: ModernDesign.spacing[2],
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: ModernDesign.colors.border.subtle,
    backgroundColor: ModernDesign.colors.background.tertiary,
  },
  nodeSelected: {
    borderColor: ModernDesign.colors.accent.neon,
    backgroundColor: ModernDesign.colors.accent.neon,
  },
  nodeTarget: {
    borderStyle: 'dashed',
    borderColor: ModernDesign.colors.accent.neon,
  },
  nodeResult: {
    borderColor: ModernDesign.colors.accent.gold,
  },
  nodeText: {
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
  },
  nodeTextSelected: {
    color: ModernDesign.colors.background.primary,
  },
  operator: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorText: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.background.primary,
  },
  tapRow: {
    flexDirection: 'row',
    gap: ModernDesign.spacing[5],
  },
  tapItem: {
    alignItems: 'center',
    gap: ModernDesign.spacing[1],
  },
  tapOrder: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.secondary,
  },
  formulaList: {
    gap: ModernDesign.spacing[2],
  },
  formulaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernDesign.spacing[2],
  },
  formulaText: {
    width: 96,
    textAlign: 'right',
    fontSize: ModernDesign.typography.fontSize.lg,
    color: ModernDesign.colors.text.secondary,
  },
  formulaResult: {
    minWidth: 32,
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
  },
  formulaResultFinal: {
    color: ModernDesign.colors.accent.neon,
  },
  title: {
    fontSize: ModernDesign.typography.fontSize.lg,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
    textAlign: 'center',
    marginBottom: ModernDesign.spacing[2],
  },
  description: {
    minHeight: 66,
    fontSize: ModernDesign.typography.fontSize.sm,
    lineHeight: ModernDesign.typography.fontSize.sm * 1.6,
    color: ModernDesign.colors.text.secondary,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: ModernDesign.spacing[2],
    marginVertical: ModernDesign.spacing[4],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ModernDesign.colors.border.medium,
  },
  dotActive: {
    width: 20,
    backgroundColor: ModernDesign.colors.accent.neon,
  },
});
