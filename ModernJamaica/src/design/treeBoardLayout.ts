/** 本番盤面の木（上下端の円を含む）の高さ上限。重なり防止の最小間隔を優先する。 */
export const GAME_TREE_MAX_HEIGHT = 380;

/** 復習の練習盤面とヒント盤面で共有する座標。 */
export function treeBoardGeometry(width: number, height: number, leaves = 5) {
  const nodeSize = Math.min(54, Math.max(32, width / leaves - 4), Math.max(32, (height - 12 - 4 * 22) / 5));
  const rowGap = nodeSize + 22;
  const leafY = height - 6 - nodeSize / 2;
  return { nodeSize, rowGap, leafY };
}

export const treeLeafX = (index: number, width: number, leaves = 5) => ((index + 0.5) * width) / leaves;
