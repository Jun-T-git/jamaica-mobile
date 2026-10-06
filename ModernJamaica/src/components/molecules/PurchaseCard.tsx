import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ModernDesign } from '../../constants';
import { useMonetizationStore } from '../../store/monetizationStore';
import { Typography } from '../atoms/Typography';

/** 設定内の小さな入口。購入や復元は共通の購入画面で行う。 */
export function PurchaseCard({ onPress }: { onPress: () => void }) {
  const hasRemovedAds = useMonetizationStore(state => state.hasRemovedAds);
  return (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.8}
      accessibilityRole="button" accessibilityHint="特典の詳細と購入の復元を開きます">
      <MaterialIcons name={hasRemovedAds ? 'check-circle' : 'block'} size={24}
        color={hasRemovedAds ? ModernDesign.colors.accent.mint : ModernDesign.colors.accent.neon} />
      <View style={styles.text}>
        <Typography style={styles.title}>{hasRemovedAds ? '広告なし・解答例見放題' : '広告を削除する'}</Typography>
        <Typography variant="body2" color="secondary">
          {hasRemovedAds ? '購入済み · 特典を利用中' : '買い切りで、解答例もずっと見放題'}
        </Typography>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={ModernDesign.colors.text.secondary} />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[3],
    padding: ModernDesign.spacing[4], margin: ModernDesign.spacing[4],
    borderRadius: ModernDesign.borderRadius.xl, backgroundColor: ModernDesign.colors.background.tertiary,
    borderWidth: 1, borderColor: ModernDesign.colors.border.subtle },
  text: { flex: 1, minWidth: 0, gap: ModernDesign.spacing[1] },
  title: { fontWeight: ModernDesign.typography.fontWeight.semibold },
});
