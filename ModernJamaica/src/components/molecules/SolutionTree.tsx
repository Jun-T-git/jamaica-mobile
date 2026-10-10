import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { ModernDesign } from '../../constants';
import { treeNodeVisuals, treeOperatorColor } from '../../design/treeNodeVisuals';
import { treeBoardGeometry, treeLeafX } from '../../design/treeBoardLayout';
import { SolutionTreeNode } from '../../utils/solutionExample';

type PlacedNode = { key: string; node: SolutionTreeNode; x: number; y: number; stepIndex?: number };
type Edge = { key: string; from: PlacedNode; to: PlacedNode; color: string; stepIndex: number };

const heightFromLeaves = (node: SolutionTreeNode): number =>
  node.left && node.right ? Math.max(heightFromLeaves(node.left), heightFromLeaves(node.right)) + 1 : 0;

/** 数字の位置と盤面の高さを固定し、解答の表示切替で葉が動かないようにする。 */
function layoutTree(root: SolutionTreeNode | null, numbers: number[], width: number, height: number) {
  const leaves = numbers.length;
  const { nodeSize, rowGap, leafY } = treeBoardGeometry(width, height, leaves);
  const nodes: PlacedNode[] = [];
  const edges: Edge[] = [];
  let nextLeaf = 0;
  let nextStep = 0;

  if (!root) {
    const initialNodes: PlacedNode[] = numbers.map((value, sourceIndex) => ({
      key: `leaf-${sourceIndex}`, node: { value, sourceIndex },
      x: treeLeafX(sourceIndex, width, leaves), y: leafY,
    }));
    return {
      nodes: initialNodes,
      edges, nodeSize,
    };
  }

  const visit = (node: SolutionTreeNode, key: string): PlacedNode => {
    const left = node.left ? visit(node.left, `${key}L`) : null;
    const right = node.right ? visit(node.right, `${key}R`) : null;
    const x = left && right ? (left.x + right.x) / 2 : treeLeafX(node.sourceIndex ?? nextLeaf, width, leaves);
    if (!left && !right) nextLeaf++;
    const y = leafY - heightFromLeaves(node) * rowGap;
    const stepIndex = left && right ? ++nextStep : undefined;
    const placed = { key, node, x, y, stepIndex };
    nodes.push(placed);
    if (left && right) {
      const color = treeOperatorColor(node.operator);
      edges.push({ key: `${key}L`, from: placed, to: left, color, stepIndex: stepIndex! });
      edges.push({ key: `${key}R`, from: placed, to: right, color, stepIndex: stepIndex! });
    }
    return placed;
  };
  visit(root, 'root');
  return { nodes, edges, nodeSize };
}

export function SolutionTree({ root, numbers, target, showAnswer, revealSteps = 4, expression, steps, maxHeight = 320 }: {
  root: SolutionTreeNode | null; numbers: number[]; target: number; showAnswer: boolean;
  revealSteps?: number; expression?: string; steps?: string[]; maxHeight?: number;
}) {
  const [width, setWidth] = useState(0);
  const layout = useMemo(() => width > 0 ? layoutTree(showAnswer ? root : null, numbers, width, maxHeight) : null,
    [root, numbers, width, maxHeight, showAnswer]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={showAnswer && root
        ? revealSteps < 4
          ? `ヒント${revealSteps}。${steps?.slice(0, revealSteps).join('。') ?? ''}`
          : `計算の木。${steps ? steps.join('。') : `${expression} = ${target}`}`
        : `計算の木の初期状態。目標${target}。数字${numbers.join('、')}。解答例は非表示`}
      onLayout={event => {
        const measured = Math.round(event.nativeEvent.layout.width);
        setWidth(previous => previous === measured ? previous : measured);
      }}
      style={[styles.container, { height: maxHeight }]}
    >
      {layout && <>
        <Svg width={width} height={maxHeight} style={StyleSheet.absoluteFill} pointerEvents="none">
          {layout.edges.filter(edge => edge.stepIndex <= revealSteps).map(edge => <Line key={edge.key} x1={edge.from.x} y1={edge.from.y} x2={edge.to.x} y2={edge.to.y}
            stroke={edge.color} strokeWidth={3} opacity={0.7} />)}
        </Svg>
        {layout.nodes.filter(placed => !placed.stepIndex || placed.stepIndex <= revealSteps).map(({ key, node, x, y }) => (
          <React.Fragment key={key}>
            <View style={[styles.node, {
              left: x - layout.nodeSize / 2,
              top: y - layout.nodeSize / 2,
              width: layout.nodeSize,
              height: layout.nodeSize,
              borderRadius: layout.nodeSize / 2,
            }]}>
              <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}
                style={[styles.value, { width: layout.nodeSize - 12 }]}>{node.value}</Text>
            </View>
            {node.operator && <View style={[styles.operatorBadge, { left: x - 10, top: y + layout.nodeSize / 2 + 2 }]}>
              <Text style={[styles.operator, { color: treeOperatorColor(node.operator) }]}>{node.operator}</Text>
            </View>}
          </React.Fragment>
        ))}
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', backgroundColor: ModernDesign.colors.background.primary, borderRadius: ModernDesign.borderRadius.lg },
  node: {
    position: 'absolute', ...treeNodeVisuals.frame, ...treeNodeVisuals.fill,
  },
  operatorBadge: { position: 'absolute', width: 20, height: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ModernDesign.colors.background.primary, borderRadius: 8 },
  operator: { fontSize: 12, lineHeight: 14, fontWeight: ModernDesign.typography.fontWeight.bold },
  value: { ...treeNodeVisuals.text },
});
