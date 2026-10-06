import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { ModernDesign } from '../../constants';
import { treeBoardGeometry } from '../../design/treeBoardLayout';
import { treeNodeVisuals, treeOperatorColor } from '../../design/treeNodeVisuals';
import { PracticeNode } from '../../utils/reviewPractice';

export function PracticeTree({ nodes, selectedId, onNodePress, height }: {
  nodes: PracticeNode[]; selectedId: string | null; onNodePress: (id: string) => void; height: number;
}) {
  const [width, setWidth] = useState(0);
  const geometry = useMemo(() => treeBoardGeometry(width, height), [width, height]);
  const position = (node: PracticeNode) => ({
    x: ((node.column + 1) * width) / 10,
    y: geometry.leafY - node.level * geometry.rowGap,
  });
  const byId = new Map(nodes.map(node => [node.id, node]));

  return <View style={[styles.container, { height }]} onLayout={event => {
    const measured = Math.round(event.nativeEvent.layout.width);
    setWidth(previous => previous === measured ? previous : measured);
  }}>
    {width > 0 && <>
      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        {nodes.filter(node => node.leftId && node.rightId).flatMap(node => {
          const parent = position(node);
          return [node.leftId!, node.rightId!].map(childId => {
            const child = byId.get(childId);
            if (!child) return null;
            const point = position(child);
            return <Line key={`${node.id}-${childId}`} x1={parent.x} y1={parent.y} x2={point.x} y2={point.y}
              stroke={treeOperatorColor(node.operator)} strokeWidth={3} opacity={0.7} />;
          });
        })}
      </Svg>
      {nodes.map(node => {
        const { x, y } = position(node);
        const selected = node.id === selectedId;
        return <React.Fragment key={node.id}>
          <TouchableOpacity accessibilityRole="button"
            accessibilityLabel={`${node.id.startsWith('leaf-') ? `数字${Number(node.id.slice(5)) + 1}` : `計算結果${node.id.slice(5)}`}、${Math.round(node.value * 100) / 100}のノード`}
            accessibilityState={{ disabled: node.used, selected }} disabled={node.used}
            onPress={() => onNodePress(node.id)} style={[styles.node, node.used && styles.usedNode, selected && styles.selectedNode, {
              left: x - geometry.nodeSize / 2, top: y - geometry.nodeSize / 2,
              width: geometry.nodeSize, height: geometry.nodeSize, borderRadius: geometry.nodeSize / 2,
            }]}>
            <Text adjustsFontSizeToFit numberOfLines={1} minimumFontScale={0.5}
              style={[styles.value, node.used && styles.usedValue, selected && styles.selectedValue, { width: geometry.nodeSize - 12 }]}>
              {Math.round(node.value * 100) / 100}
            </Text>
          </TouchableOpacity>
          {node.operator && <View pointerEvents="none" style={[styles.operatorBadge, { left: x - 10, top: y + geometry.nodeSize / 2 + 2 }]}>
            <Text style={[styles.operator, { color: treeOperatorColor(node.operator) }]}>{node.operator === '-' ? '−' : node.operator}</Text>
          </View>}
        </React.Fragment>;
      })}
    </>}
  </View>;
}

const styles = StyleSheet.create({
  container: { width: '100%', position: 'relative', backgroundColor: ModernDesign.colors.background.primary, borderRadius: ModernDesign.borderRadius.lg },
  node: { position: 'absolute', ...treeNodeVisuals.frame, ...treeNodeVisuals.fill },
  usedNode: { backgroundColor: ModernDesign.colors.background.primary },
  selectedNode: { backgroundColor: ModernDesign.colors.accent.neon, borderColor: ModernDesign.colors.accent.neon },
  value: { ...treeNodeVisuals.text },
  usedValue: { color: ModernDesign.colors.text.disabled },
  selectedValue: { color: ModernDesign.colors.background.primary },
  operatorBadge: { position: 'absolute', width: 20, height: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: ModernDesign.colors.background.primary, borderRadius: 8 },
  operator: { fontSize: 12, lineHeight: 14, fontWeight: ModernDesign.typography.fontWeight.bold },
});
