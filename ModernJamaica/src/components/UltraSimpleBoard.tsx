import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants';
import { useGameStore } from '../store/gameStore';
import { GameMode, Operator } from '../types';

interface UltraSimpleBoardProps {
  gameInfo: {
    target: number;
    instruction: string;
  };
}

interface GridNode {
  value: number;
  row: number;
  col: number;
  isActive: boolean;
  nodeId: string;
}

export const UltraSimpleBoard: React.FC<UltraSimpleBoardProps> = ({
  gameInfo,
}) => {
  const {
    nodes,
    connectNodes,
    undoLastMove,
    canUndo,
    skipProblem,
    mode,
    challengeState,
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

    for (let col = minCol; col <= maxCol; col++) {
      if (!activeNodeCols.has(col) && !sameRowCols.has(col)) {
        if (col > 0 && sameRowCols.has(col - 1)) continue;
        if (col < 8 && sameRowCols.has(col + 1)) continue;

        const distanceFromMidpoint = Math.abs(col - midPoint);
        const distanceFromCenter = Math.abs(col - 4);
        const priority = -(distanceFromMidpoint * 100 + distanceFromCenter);
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

    // Haptic feedback for better user experience
    Vibration.vibrate(50);

    if (!firstNode) {
      setFirstNode(node);
    } else if (firstNode.nodeId === node.nodeId) {
      setFirstNode(null);
      setSelectedOperator(null);
    } else if (selectedOperator) {
      Vibration.vibrate(100);
      connectNodes(firstNode.nodeId, node.nodeId, selectedOperator);
      reset();
    } else {
      setFirstNode(node);
    }
  };

  const handleOperatorPress = (operator: Operator) => {
    if (!firstNode) return;

    // Haptic feedback for operator selection
    Vibration.vibrate(50);

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
      style.push({ ...styles.targetCell, backgroundColor: COLORS.CARD });
    }

    return style;
  };

  const operators = [
    { type: Operator.ADD, label: '+', color: '#10B981' },
    { type: Operator.SUBTRACT, label: '−', color: '#3B82F6' },
    { type: Operator.MULTIPLY, label: '×', color: '#F59E0B' },
    { type: Operator.DIVIDE, label: '÷', color: '#EF4444' },
  ];

  // Calculate edges between parent and child nodes
  const getEdges = () => {
    const edges: Array<{
      parentRow: number;
      parentCol: number;
      childRow: number;
      childCol: number;
      key: string;
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
          edges.push({
            parentRow,
            parentCol,
            childRow: leftChildRow,
            childCol: leftChildCol,
            key: `${node.id}-${leftChild.id}`,
          });

          edges.push({
            parentRow,
            parentCol,
            childRow: rightChildRow,
            childCol: rightChildCol,
            key: `${node.id}-${rightChild.id}`,
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

  // Calculate vertical spacing for better visual hierarchy
  const rowGap = actualCellSize * 0.9;

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
                    stroke={COLORS.TEXT.LIGHT}
                    strokeWidth={3}
                    opacity={0.3}
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
                    disabled={!node.isActive}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        !node.isActive && styles.inactiveCellText,
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
                  !firstNode && styles.disabledOperator,
                  { backgroundColor: op.color },
                ]}
                onPress={() => handleOperatorPress(op.type)}
                disabled={!firstNode}
              >
                <Text
                  style={[
                    styles.operatorText,
                    !firstNode && styles.disabledOperatorText,
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
                !canUndo() && styles.disabledIconButton,
              ]}
              onPress={undoLastMove}
              disabled={!canUndo()}
            >
              <MaterialIcons
                name="undo"
                size={24}
                color={canUndo() ? COLORS.TEXT.PRIMARY : COLORS.TEXT.LIGHT}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                styles.skipButton,
                mode === GameMode.CHALLENGE &&
                  challengeState?.skipCount === 0 &&
                  styles.disabledIconButton,
              ]}
              onPress={() => {
                if (mode === GameMode.CHALLENGE && challengeState) {
                  if (challengeState.skipCount <= 0) {
                    return;
                  }
                  Alert.alert(
                    'スキップ確認',
                    `問題をスキップしますか？\n（残り${challengeState.skipCount}回）`,
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: 'スキップ', onPress: skipProblem },
                    ],
                    { cancelable: false },
                  );
                } else {
                  Alert.alert(
                    'スキップ確認',
                    '問題をスキップしますか？',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: 'スキップ', onPress: skipProblem },
                    ],
                    { cancelable: false },
                  );
                }
              }}
              disabled={
                mode === GameMode.CHALLENGE && challengeState?.skipCount === 0
              }
            >
              <MaterialIcons
                name="skip-next"
                size={24}
                color={
                  mode === GameMode.CHALLENGE && challengeState?.skipCount === 0
                    ? COLORS.TEXT.LIGHT
                    : COLORS.TEXT.PRIMARY
                }
              />
              {mode === GameMode.CHALLENGE && challengeState && (
                <View style={styles.skipBadge}>
                  <Text style={styles.skipBadgeText}>
                    {challengeState.skipCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  gameArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Target - Clean and minimal
  targetContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  targetLabel: {
    fontSize: 14,
    color: COLORS.TEXT.SECONDARY,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  targetNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    textShadowColor: 'rgba(74, 144, 226, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
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
    backgroundColor: COLORS.CARD,
    borderColor: '#D1D5DB',
  },
  inactiveCell: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  selectedCell: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
    transform: [{ scale: 1.15 }],
    shadowColor: COLORS.PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  targetCell: {
    borderColor: COLORS.SUCCESS,
    borderWidth: 4,
    borderStyle: 'dashed' as 'dashed',
  },
  cellText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  inactiveCellText: {
    color: COLORS.TEXT.LIGHT,
  },
  selectedCellText: {
    color: COLORS.CARD,
  },
  // State indicator - minimal
  stateIndicator: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  selectionDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  pendingOperation: {
    fontSize: 20,
    color: COLORS.TEXT.SECONDARY,
    marginLeft: 8,
  },
  // Operation dock
  operationDock: {
    backgroundColor: COLORS.CARD,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  operatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  operatorButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  activeOperator: {
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  disabledOperator: {
    opacity: 0.4,
    backgroundColor: '#E5E7EB',
  },
  operatorText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.CARD,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  disabledOperatorText: {
    color: COLORS.TEXT.LIGHT,
  },
  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  disabledIconButton: {
    opacity: 0.4,
  },
  skipButton: {
    position: 'relative',
  },
  skipBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.DANGER,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBadgeText: {
    color: COLORS.CARD,
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
});
