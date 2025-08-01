import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { useGameStore } from '../../store/gameStore';
import { GameMode, Operator } from '../../types';
import { Dialog } from '../molecules/Dialog';
import { soundManager, SoundType } from '../../utils/SoundManager';

interface GameBoardProps {
  gameInfo: {
    target: number;
    instruction: string;
  };
  disabled?: boolean;
}

interface GridNode {
  value: number;
  row: number;
  col: number;
  isActive: boolean;
  nodeId: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameInfo,
  disabled = false,
}) => {
  const {
    nodes,
    connectNodes,
    undoLastMove,
    canUndo,
    skipProblem,
    gameState,
  } = useGameStore();

  const [grid, setGrid] = useState<(GridNode | null)[][]>([]);
  const [nodePositions, setNodePositions] = useState<
    Record<string, { row: number; col: number }>
  >({});
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const [firstNode, setFirstNode] = useState<GridNode | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );
  const [animatedValue] = useState(new Animated.Value(0));
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [skipMessage, setSkipMessage] = useState('');

  // Update dimensions on screen resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions(Dimensions.get('window'));
    };
    const subscription = Dimensions.addEventListener(
      'change',
      updateDimensions,
    );
    return () => subscription?.remove();
  }, []);

  const { width: screenWidth } = dimensions;
  const containerPadding = screenWidth * 0.05;
  const availableWidth = screenWidth - containerPadding * 2;
  const cellSize = Math.floor(availableWidth * 0.095);
  const actualNodeSize = cellSize * 1.6;

  // Animate selection feedback
  useEffect(() => {
    if (firstNode) {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      animatedValue.setValue(0);
    }
  }, [firstNode, animatedValue]);

  // Find valid position for calculated node
  const findValidPosition = (
    currentGrid: (GridNode | null)[][],
    targetRow: number,
    leftCol: number,
    rightCol: number,
    allNodes: any[],
  ): number => {
    const minCol = Math.min(leftCol, rightCol);
    const maxCol = Math.max(leftCol, rightCol);

    const activeNodeCols = new Set<number>();
    allNodes.forEach(node => {
      if (!node.isUsed) {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 9; c++) {
            if (currentGrid[r]?.[c]?.nodeId === node.id) {
              activeNodeCols.add(c);
            }
          }
        }
      }
    });

    const sameRowCols = new Set<number>();
    for (let c = 0; c < 9; c++) {
      if (currentGrid[targetRow]?.[c]) {
        sameRowCols.add(c);
      }
    }

    const candidates: Array<{ col: number; priority: number }> = [];
    const midPoint = (leftCol + rightCol) / 2;

    // 全グリッド範囲で検索（0-8列）
    for (let col = 0; col < 9; col++) {
      if (!activeNodeCols.has(col) && !sameRowCols.has(col)) {
        // 隣接禁止チェック
        if (col > 0 && sameRowCols.has(col - 1)) continue;
        if (col < 8 && sameRowCols.has(col + 1)) continue;

        // 優先度計算：中点からの距離を最優先、中央からの距離を次に考慮
        const distanceFromMidpoint = Math.abs(col - midPoint);
        const distanceFromCenter = Math.abs(col - 4);
        
        // 元の範囲内の位置にボーナスを与える
        const inRangeBonus = (col >= minCol && col <= maxCol) ? 1000 : 0;
        
        const priority = inRangeBonus - (distanceFromMidpoint * 100 + distanceFromCenter);
        candidates.push({ col, priority });
      }
    }

    candidates.sort((a, b) => b.priority - a.priority);
    return candidates.length > 0 ? candidates[0].col : -1;
  };

  // Initialize grid
  useEffect(() => {
    const newGrid: (GridNode | null)[][] = Array(5)
      .fill(null)
      .map(() => Array(9).fill(null));

    const newPositions = { ...nodePositions };

    // Bottom row: leaf nodes
    const leafNodes = nodes.filter(n => n.isLeaf);
    leafNodes.forEach((node, index) => {
      if (index < 5) {
        if (!newPositions[node.id]) {
          const positions = [0, 2, 4, 6, 8];
          const col = positions[index];
          newPositions[node.id] = { row: 0, col };
        }

        const pos = newPositions[node.id];
        newGrid[pos.row][pos.col] = {
          value: node.value,
          row: pos.row,
          col: pos.col,
          isActive: !node.isUsed,
          nodeId: node.id,
        };
      }
    });

    // Higher rows: internal nodes
    const internalNodes = nodes.filter(n => !n.isLeaf);
    internalNodes.forEach(node => {
      if (newPositions[node.id]) {
        const pos = newPositions[node.id];
        newGrid[pos.row][pos.col] = {
          value: node.value,
          row: pos.row,
          col: pos.col,
          isActive: !node.isUsed,
          nodeId: node.id,
        };
      } else {
        const leftChild = nodes.find(n => n.id === node.leftChildId);
        const rightChild = nodes.find(n => n.id === node.rightChildId);

        if (leftChild && rightChild) {
          const leftPos = newPositions[leftChild.id];
          const rightPos = newPositions[rightChild.id];

          if (leftPos && rightPos) {
            const newRow = Math.max(leftPos.row, rightPos.row) + 1;
            if (newRow < 5) {
              const targetCol = findValidPosition(
                newGrid,
                newRow,
                leftPos.col,
                rightPos.col,
                nodes,
              );

              if (targetCol !== -1 && !newGrid[newRow][targetCol]) {
                newPositions[node.id] = { row: newRow, col: targetCol };
                newGrid[newRow][targetCol] = {
                  value: node.value,
                  row: newRow,
                  col: targetCol,
                  isActive: !node.isUsed,
                  nodeId: node.id,
                };
              } else if (targetCol === -1) {
                // フォールバック：有効な位置が見つからない場合でも強制的に配置
                console.warn(`No valid position found for node ${node.id}, attempting fallback placement`);
                
                // 空いている最初の位置を探す
                for (let col = 0; col < 9; col++) {
                  if (!newGrid[newRow][col]) {
                    newPositions[node.id] = { row: newRow, col };
                    newGrid[newRow][col] = {
                      value: node.value,
                      row: newRow,
                      col,
                      isActive: !node.isUsed,
                      nodeId: node.id,
                    };
                    break;
                  }
                }
              }
            }
          }
        }
      }
    });

    setNodePositions(newPositions);
    setGrid(newGrid);
  }, [nodes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset positions when starting a new problem
  useEffect(() => {
    if (nodes.length === 5 && nodes.every(n => n.isLeaf)) {
      setNodePositions({});
    }
  }, [nodes]);

  const handleNodePress = (node: GridNode) => {
    if (!node.isActive) return;

    // ノードタップ時は特別な効果音（TAP）を使用
    soundManager.play(SoundType.TAP);

    if (!firstNode) {
      setFirstNode(node);
    } else if (firstNode.nodeId === node.nodeId) {
      setFirstNode(null);
      setSelectedOperator(null);
    } else if (selectedOperator) {
      connectNodes(firstNode.nodeId, node.nodeId, selectedOperator);
      reset();
    } else {
      setFirstNode(node);
    }
  };

  const handleOperatorPress = (operator: Operator) => {
    if (!firstNode) return;

    // 演算子ボタンタップ時は特別な効果音（TAP）を使用
    soundManager.play(SoundType.TAP);

    if (selectedOperator === operator) {
      setSelectedOperator(null);
    } else {
      setSelectedOperator(operator);
    }
  };

  const reset = () => {
    setFirstNode(null);
    setSelectedOperator(null);
  };

  const getNodeStyle = (node: GridNode | null) => {
    if (!node) return [styles.emptyCell];

    let style = [styles.filledCell];

    if (!node.isActive) {
      style.push(styles.inactiveCell);
    } else if (firstNode?.nodeId === node.nodeId) {
      style.push(styles.selectedCell);
    } else if (firstNode && selectedOperator) {
      style.push({ ...styles.targetCell, backgroundColor: ModernDesign.colors.background.secondary });
    }

    return style;
  };

  const operators = [
    { type: Operator.ADD, label: '+', color: ModernDesign.colors.accent.mint },
    { type: Operator.SUBTRACT, label: '−', color: ModernDesign.colors.accent.coral },
    { type: Operator.MULTIPLY, label: '×', color: ModernDesign.colors.accent.gold },
    { type: Operator.DIVIDE, label: '÷', color: ModernDesign.colors.accent.purple },
  ];

  // Get operator color based on operator type
  const getOperatorColor = (operator?: Operator): string => {
    switch (operator) {
      case Operator.ADD:
        return ModernDesign.colors.accent.mint;
      case Operator.SUBTRACT:
        return ModernDesign.colors.accent.coral;
      case Operator.MULTIPLY:
        return ModernDesign.colors.accent.gold;
      case Operator.DIVIDE:
        return ModernDesign.colors.accent.purple;
      default:
        return ModernDesign.colors.border.medium;
    }
  };

  // Calculate edges between parent and child nodes
  const getEdges = () => {
    const edges: Array<{
      parentRow: number;
      parentCol: number;
      childRow: number;
      childCol: number;
      key: string;
      color: string;
    }> = [];

    const internalNodes = nodes.filter(n => !n.isLeaf);
    internalNodes.forEach(node => {
      const leftChild = nodes.find(n => n.id === node.leftChildId);
      const rightChild = nodes.find(n => n.id === node.rightChildId);

      if (leftChild && rightChild) {
        let parentRow = -1,
          parentCol = -1;
        let leftChildRow = -1,
          leftChildCol = -1;
        let rightChildRow = -1,
          rightChildCol = -1;

        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 9; c++) {
            if (grid[r]?.[c]?.nodeId === node.id) {
              parentRow = r;
              parentCol = c;
            }
            if (grid[r]?.[c]?.nodeId === leftChild.id) {
              leftChildRow = r;
              leftChildCol = c;
            }
            if (grid[r]?.[c]?.nodeId === rightChild.id) {
              rightChildRow = r;
              rightChildCol = c;
            }
          }
        }

        if (parentRow !== -1 && leftChildRow !== -1 && rightChildRow !== -1) {
          const edgeColor = getOperatorColor(node.operator);
          
          edges.push({
            parentRow,
            parentCol,
            childRow: leftChildRow,
            childCol: leftChildCol,
            key: `${node.id}-${leftChild.id}`,
            color: edgeColor,
          });

          edges.push({
            parentRow,
            parentCol,
            childRow: rightChildRow,
            childCol: rightChildCol,
            key: `${node.id}-${rightChild.id}`,
            color: edgeColor,
          });
        }
      }
    });

    return edges;
  };

  const edges = getEdges();

  // Grid layout constants
  const GRID_COLS = 9;
  const GRID_ROWS = 5;
  const cellGap = screenWidth * 0.02;
  const gridPadding = screenWidth * 0.03;

  // Calculate grid dimensions
  const totalCellWidth = availableWidth - gridPadding * 2;
  const cellTotalSize =
    (totalCellWidth - cellGap * (GRID_COLS - 1)) / GRID_COLS;
  const actualCellSize = Math.min(cellTotalSize, cellSize);

  // Calculate vertical spacing - consistent spacing between all rows
  const rowGap = actualCellSize * 1.0;

  // Grid container dimensions
  const gridContainerWidth =
    actualCellSize * GRID_COLS + cellGap * (GRID_COLS - 1);
  const gridContainerHeight =
    actualCellSize * GRID_ROWS + rowGap * (GRID_ROWS - 1);

  // Calculate node position
  const getNodePosition = (row: number, col: number) => {
    const x = col * (actualCellSize + cellGap);
    const y = (GRID_ROWS - 1 - row) * (actualCellSize + rowGap);
    return { x, y };
  };

  // Calculate center position for SVG lines
  const getNodeCenterPosition = (row: number, col: number) => {
    const pos = getNodePosition(row, col);
    return {
      x: pos.x + actualCellSize / 2,
      y: pos.y + actualCellSize / 2,
    };
  };


  return (
    <View style={styles.container}>
      <View style={styles.gameArea}>
        {/* Target - Prominent but minimal */}
        <View style={styles.targetContainer}>
          <Text style={styles.targetLabel}>つくる数</Text>
          <Text style={styles.targetNumber}>{gameInfo.target}</Text>
        </View>

        {/* Main Game Grid */}
        <View style={styles.gridWrapper}>
          <View
            style={[
              styles.gridInner,
              { width: gridContainerWidth, height: gridContainerHeight },
            ]}
          >
            {/* SVG overlay for edges */}
            <Svg
              style={StyleSheet.absoluteFillObject}
              viewBox={`0 0 ${gridContainerWidth} ${gridContainerHeight}`}
              pointerEvents="none"
            >
              {edges.map(edge => {
                const parentPos = getNodeCenterPosition(
                  edge.parentRow,
                  edge.parentCol,
                );
                const childPos = getNodeCenterPosition(
                  edge.childRow,
                  edge.childCol,
                );

                return (
                  <Line
                    key={edge.key}
                    x1={parentPos.x}
                    y1={parentPos.y}
                    x2={childPos.x}
                    y2={childPos.y}
                    stroke={edge.color}
                    strokeWidth={3}
                    opacity={0.7}
                  />
                );
              })}
            </Svg>

            {/* Render grid nodes */}
            {grid.map((rowData, row) =>
              rowData.map((node, col) => {
                if (!node) return null;
                const pos = getNodePosition(row, col);

                return (
                  <TouchableOpacity
                    key={node.nodeId}
                    style={[
                      styles.absoluteCell,
                      styles.cellContainer,
                      getNodeStyle(node),
                      {
                        left: pos.x - (actualNodeSize - actualCellSize) / 2,
                        top: pos.y - (actualNodeSize - actualCellSize) / 2,
                        width: actualNodeSize,
                        height: actualNodeSize,
                        borderRadius: actualNodeSize / 2,
                      },
                    ]}
                    onPress={() => handleNodePress(node)}
                    disabled={!node.isActive || disabled}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        !node.isActive && styles.inactiveCellText,
                        disabled && styles.disabledCellText,
                        firstNode?.nodeId === node.nodeId &&
                          styles.selectedCellText,
                      ]}
                    >
                      {Math.round(node.value * 100) / 100}
                    </Text>
                  </TouchableOpacity>
                );
              }),
            )}
          </View>
        </View>

        {/* Current State Indicator - Visual only */}
        <View style={styles.stateIndicator}>
          {firstNode && (
            <Animated.View
              style={[
                styles.selectionDisplay,
                {
                  opacity: animatedValue,
                  transform: [{ scale: animatedValue }],
                },
              ]}
            >
              <Text style={styles.selectedNumber}>{firstNode.value}</Text>
              {selectedOperator && (
                <Text style={styles.pendingOperation}>{selectedOperator}</Text>
              )}
            </Animated.View>
          )}
        </View>

        {/* Operations - Bottom dock style */}
        <View style={styles.operationDock}>
          <View style={styles.operatorRow}>
            {operators.map(op => (
              <TouchableOpacity
                key={op.type}
                style={[
                  styles.operatorButton,
                  selectedOperator === op.type && styles.activeOperator,
                  (!firstNode || disabled) && styles.disabledOperator,
                  selectedOperator === op.type && { backgroundColor: op.color },
                  firstNode && selectedOperator !== op.type && !disabled && { borderColor: op.color },
                  (!firstNode || disabled) && { borderColor: `${op.color}40` }, // 25% opacity for disabled state
                ]}
                onPress={() => handleOperatorPress(op.type)}
                disabled={!firstNode || disabled}
              >
                <Text
                  style={[
                    styles.operatorText,
                    firstNode && selectedOperator !== op.type && !disabled && { color: op.color },
                    selectedOperator === op.type && { color: ModernDesign.colors.background.primary },
                    (!firstNode || disabled) && { color: `${op.color}60` }, // 37.5% opacity for disabled text
                  ]}
                >
                  {op.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.iconButton,
                (!canUndo() || disabled) && styles.disabledIconButton,
              ]}
              onPress={() => {
                // Undoボタンタップ時は特別な効果音（TAP）を使用
                soundManager.play(SoundType.TAP);
                undoLastMove();
              }}
              disabled={!canUndo() || disabled}
            >
              <MaterialIcons
                name="undo"
                size={24}
                color={canUndo() && !disabled ? ModernDesign.colors.text.primary : ModernDesign.colors.text.disabled}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                styles.skipButton,
                (disabled || (gameState?.mode === GameMode.CHALLENGE &&
                  gameState?.skipCount === 0)) &&
                  styles.disabledIconButton,
              ]}
              onPress={() => {
                // スキップボタンタップ時は特別な効果音（TAP）を使用
                soundManager.play(SoundType.TAP);
                
                if (gameState?.mode === GameMode.CHALLENGE) {
                  if (gameState.skipCount <= 0) {
                    return;
                  }
                  setSkipMessage(`問題をスキップしますか？\n（残り${gameState.skipCount}回）`);
                } else {
                  setSkipMessage('問題をスキップしますか？');
                }
                setShowSkipDialog(true);
              }}
              disabled={
                disabled || (gameState?.mode === GameMode.CHALLENGE && gameState?.skipCount === 0)
              }
            >
              <MaterialIcons
                name="skip-next"
                size={24}
                color={
                  gameState?.mode === GameMode.CHALLENGE && gameState?.skipCount === 0
                    ? ModernDesign.colors.text.disabled
                    : ModernDesign.colors.text.primary
                }
              />
              {gameState?.mode === GameMode.CHALLENGE && gameState && (
                <View style={styles.skipBadge}>
                  <Text style={styles.skipBadgeText}>
                    {gameState.skipCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Skip Confirmation Dialog */}
      <Dialog
        visible={showSkipDialog}
        title="スキップ確認"
        message={skipMessage}
        icon="skip-next"
        iconColor={ModernDesign.colors.accent.neon}
        buttons={[
          {
            icon: 'skip-next',
            title: 'スキップ',
            variant: 'danger',
            onPress: () => {
              setShowSkipDialog(false);
              skipProblem();
            },
          },
          {
            icon: 'close',
            title: 'キャンセル',
            onPress: () => setShowSkipDialog(false),
          },
        ]}
        onClose={() => setShowSkipDialog(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[3],
  },
  // Target - Clean and minimal
  targetContainer: {
    alignItems: 'center',
    paddingVertical: ModernDesign.spacing[6],
    backgroundColor: ModernDesign.colors.background.tertiary,
    marginHorizontal: ModernDesign.spacing[2],
    borderRadius: ModernDesign.borderRadius.xl,
    marginBottom: ModernDesign.spacing[4],
  },
  targetLabel: {
    fontSize: ModernDesign.typography.fontSize.sm,
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
    marginBottom: ModernDesign.spacing[1],
    letterSpacing: ModernDesign.typography.letterSpacing.wide,
  },
  targetNumber: {
    fontSize: ModernDesign.typography.fontSize['5xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.neon,
  },
  // Grid
  gridWrapper: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  gridInner: {
    position: 'relative',
  },
  absoluteCell: {
    position: 'absolute',
  },
  cellContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  filledCell: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderColor: ModernDesign.colors.border.subtle,
  },
  inactiveCell: {
    backgroundColor: ModernDesign.colors.background.primary,
    borderColor: ModernDesign.colors.border.subtle,
  },
  selectedCell: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
    transform: [{ scale: 1.15 }],
    ...ModernDesign.shadows.glow,
  },
  targetCell: {
    borderColor: ModernDesign.colors.accent.neon,
    borderWidth: 3,
    borderStyle: 'dashed' as 'dashed',
  },
  cellText: {
    fontSize: ModernDesign.typography.fontSize.xl,
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
  },
  inactiveCellText: {
    color: ModernDesign.colors.text.disabled,
  },
  disabledCellText: {
    color: ModernDesign.colors.text.tertiary,
    opacity: 0.6,
  },
  selectedCellText: {
    color: ModernDesign.colors.background.primary,
  },
  // State indicator - minimal
  stateIndicator: {
    alignItems: 'center',
    minHeight: ModernDesign.spacing[10],
    justifyContent: 'center',
    marginBottom: ModernDesign.spacing[5],
  },
  selectionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernDesign.colors.glass.background,
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[2],
    borderRadius: ModernDesign.borderRadius.full,
    borderWidth: 1,
    borderColor: ModernDesign.colors.glass.border,
  },
  selectedNumber: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.accent.neon,
  },
  pendingOperation: {
    fontSize: ModernDesign.typography.fontSize.xl,
    color: ModernDesign.colors.text.secondary,
    marginLeft: ModernDesign.spacing[2],
  },
  // Operation dock
  operationDock: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius['2xl'],
    paddingVertical: ModernDesign.spacing[4],
    paddingHorizontal: ModernDesign.spacing[3],
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.lg,
  },
  operatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: ModernDesign.spacing[4],
  },
  operatorButton: {
    width: 56,
    height: 56,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ModernDesign.colors.background.secondary,
    borderWidth: 2,
    borderColor: ModernDesign.colors.border.medium,
    ...ModernDesign.shadows.base,
  },
  activeOperator: {
    transform: [{ scale: 1.1 }],
    borderColor: ModernDesign.colors.accent.neon,
    ...ModernDesign.shadows.glow,
  },
  disabledOperator: {
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  operatorText: {
    fontSize: ModernDesign.typography.fontSize['2xl'],
    fontWeight: ModernDesign.typography.fontWeight.bold,
    color: ModernDesign.colors.text.primary,
  },
  disabledOperatorText: {
    color: ModernDesign.colors.text.disabled,
  },
  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  iconButton: {
    width: ModernDesign.spacing[12],
    height: ModernDesign.spacing[12],
    borderRadius: ModernDesign.borderRadius.lg,
    backgroundColor: ModernDesign.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ModernDesign.colors.border.subtle,
    ...ModernDesign.shadows.sm,
  },
  disabledIconButton: {
    opacity: 0.3,
  },
  skipButton: {
    position: 'relative',
  },
  skipBadge: {
    position: 'absolute',
    top: -ModernDesign.spacing[2],
    right: -ModernDesign.spacing[2],
    backgroundColor: ModernDesign.colors.error,
    width: ModernDesign.spacing[5],
    height: ModernDesign.spacing[5],
    borderRadius: ModernDesign.spacing[5] / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBadgeText: {
    color: ModernDesign.colors.text.primary,
    fontSize: ModernDesign.typography.fontSize.xs,
    fontWeight: ModernDesign.typography.fontWeight.bold,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
});
