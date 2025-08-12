import React, { ReactNode, useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModernDesign } from '../../constants';

interface SafeAreaLayoutProps {
  children: ReactNode;
  
  // SafeAreaの責務のみ - デバイス固有の計算
  edges?: Edge[];
  backgroundColor?: string;
  style?: ViewStyle;
  testID?: string;
}

/**
 * SafeArea専用レイアウトコンポーネント
 * 
 * 責務: デバイスのSafeAreaに対応したレイアウト提供
 * - ノッチ、ホームインジケーター、ステータスバーの回避
 * - 純粋にSafeAreaのパディング計算のみ
 * 
 * 管理しないもの:
 * - 広告表示（AdProviderの責務）
 * - StatusBar制御（StatusBarManagerの責務）
 * - 画面固有のコンテンツ（各画面の責務）
 */
export const SafeAreaLayout: React.FC<SafeAreaLayoutProps> = ({
  children,
  edges = ['top', 'bottom'], // Jamaica Mobile標準: 上下のみ
  backgroundColor = ModernDesign.colors.background.primary,
  style,
  testID,
}) => {
  const insets = useSafeAreaInsets();
  
  // SafeArea計算（メモ化で最適化）
  // この計算はデバイス固有なのでコンポーネントで管理
  const safeAreaStyle = useMemo((): ViewStyle => ({
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  }), [edges, insets]);
  
  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor }, 
        safeAreaStyle, 
        style
      ]} 
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaLayout;