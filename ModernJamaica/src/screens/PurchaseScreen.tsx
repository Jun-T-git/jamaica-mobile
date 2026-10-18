import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Button } from '../components/atoms/Button';
import { Typography } from '../components/atoms/Typography';
import { ModernDesign } from '../constants';
import { LINKS } from '../config/links';
import { analyticsService } from '../services/analyticsService';
import { purchaseService } from '../services/purchaseService';
import { useMonetizationStore } from '../store/monetizationStore';
import { PurchaseSource } from '../types/purchase';

type PurchaseRoutes = { Purchase: { source: PurchaseSource } };
interface Props {
  navigation: StackNavigationProp<PurchaseRoutes, 'Purchase'>;
  route: RouteProp<PurchaseRoutes, 'Purchase'>;
}

function Benefit({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.benefit}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.benefitIcon}>
        <MaterialIcons name={icon} size={32} color={ModernDesign.colors.accent.mint} />
      </View>
      <Typography variant="body1" textAlign="center" style={styles.benefitTitle}>{title}</Typography>
      <Typography variant="body2" textAlign="center" color="secondary">{description}</Typography>
    </View>
  );
}

export function PurchaseScreen({ navigation, route }: Props) {
  const source = route.params.source;
  const { width, fontScale } = useWindowDimensions();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { hasRemovedAds, price, productStatus, purchaseBusy, purchaseOperation, pendingPurchase } = useMonetizationStore();
  const [notice, setNotice] = useState<string | null>(null);
  const ownedOnEntry = useRef(hasRemovedAds);
  const mounted = useRef(true);
  const closeLogged = useRef(false);
  const isLoading = productStatus === 'idle' || productStatus === 'loading';
  const canPurchase = !hasRemovedAds && !purchaseBusy && productStatus === 'available' && !!price && purchaseService.supported;

  useEffect(() => {
    mounted.current = true;
    analyticsService.logEvent('purchase_offer_viewed', { source, layout: 'visual_benefits_v2' });
    purchaseService.loadProduct();
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (closeLogged.current) return;
      closeLogged.current = true;
      analyticsService.logEvent('purchase_offer_closed', { source, owned: useMonetizationStore.getState().hasRemovedAds });
    });
    return () => { mounted.current = false; unsubscribe(); };
  }, [navigation, source]);

  const purchase = async () => {
    if (!canPurchase || useMonetizationStore.getState().purchaseBusy) return;
    setNotice(null);
    try {
      await purchaseService.purchase(source);
      // 成功・承認待ちはストアの状態をそのまま表示。キャンセルは静かに元の画面へ。
    } catch {
      if (mounted.current) setNotice('購入を完了できませんでした。通信状況を確認して、もう一度お試しください。');
    }
  };
  const restore = async () => {
    if (useMonetizationStore.getState().purchaseBusy) return;
    setNotice(null);
    try {
      const owned = await purchaseService.restore(source);
      if (mounted.current && !owned) setNotice('購入が見つかりませんでした。購入時と同じApple Accountでサインインしているか確認してください。');
    } catch {
      if (mounted.current) setNotice('購入を復元できませんでした。通信状況を確認し、もう一度お試しください。');
    }
  };
  const back = () => navigation.goBack();
  const heading = hasRemovedAds
    ? ownedOnEntry.current ? '広告なしで利用中です' : '広告なしになりました'
    : '広告を削除';

  return (
    <SafeAreaView style={styles.screen} edges={Platform.OS === 'ios' ? ['left', 'right', 'bottom'] : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={back} accessibilityRole="button" accessibilityLabel="購入画面を閉じる" style={styles.headerAction}>
          <MaterialIcons name="close" size={24} color={ModernDesign.colors.text.primary} />
          <Typography variant="body2">閉じる</Typography>
        </TouchableOpacity>
        <TouchableOpacity onPress={restore} disabled={purchaseBusy || !purchaseService.supported}
          accessibilityRole="button" accessibilityState={{ disabled: purchaseBusy || !purchaseService.supported }}
          style={styles.headerAction}>
          <Typography variant="body2" color="secondary">{purchaseOperation === 'restore' ? '復元中…' : '購入を復元'}</Typography>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Typography variant="h5" textAlign="center" style={styles.heading}>{heading}</Typography>
        </View>

        <View style={[styles.benefits, (width < 360 || fontScale > 1.2) && styles.stackedBenefits]}>
          <Benefit icon="block" title="広告なし" description="全画面広告を削除" />
          <Benefit icon="menu-book" title="未正解の復習も" description="動画なし・時間制限なし" />
        </View>
        <Typography variant="caption" textAlign="center" color="secondary">対象は今回プレイした問題。{ '\n' }次のプレイで一覧が切り替わります。</Typography>

        <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: detailsOpen }}
          onPress={() => setDetailsOpen(value => !value)} style={styles.detailsToggle}>
          <Typography variant="body2" color="secondary">特典・復元について</Typography>
          <MaterialIcons name={detailsOpen ? 'expand-less' : 'expand-more'} size={22} color={ModernDesign.colors.text.secondary} />
        </TouchableOpacity>
        {detailsOpen && (
          <View style={styles.details}>
            <View style={styles.comparison}>
              <Typography variant="body2" style={styles.benefitTitle}>解けなかった問題のヒント・解答例</Typography>
              <Typography variant="body2" color="secondary">無料：動画広告1回で、その後1時間見放題</Typography>
              <Typography variant="body2" color="secondary">購入後：動画広告なし・時間制限なし</Typography>
              <Typography variant="caption" color="secondary">正解した問題の復習は無料で利用できます。</Typography>
            </View>
            <View style={styles.comparison}>
              <Typography variant="caption" color="secondary">購入履歴はAppleが管理します。</Typography>
              <Typography variant="caption" color="secondary">再インストール・機種変更後も同じアカウントで復元できます。</Typography>
            </View>
            <TouchableOpacity accessibilityRole="link" style={styles.help} onPress={() => {
              Linking.openURL(LINKS.SUPPORT_FORM).catch(() => setNotice('お問い合わせページを開けませんでした。'));
            }}><Typography variant="body2" color="secondary">購入についてのお問い合わせ ↗</Typography></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerInner}>
        {!hasRemovedAds && notice && <View accessibilityLiveRegion="polite" style={styles.notice}><Typography variant="body2">{notice}</Typography></View>}
        {!hasRemovedAds && pendingPurchase && (
          <View accessibilityLiveRegion="polite" style={styles.notice}>
            <Typography variant="body2">購入の承認を待っています。承認されると特典が有効になります。待っている間も無料で遊べます。</Typography>
          </View>
        )}
          {hasRemovedAds ? (
            <>
              <Typography variant="body2" textAlign="center" style={styles.owned}>購入済み · 月額料金なし</Typography>
              <Button icon="check" title={source === 'result_review' ? 'リザルトに戻る' : '元の画面に戻る'} onPress={back} variant="primary" />
            </>
          ) : (
            <>
              <View style={styles.priceBlock} accessibilityLiveRegion="polite">
                {isLoading ? (
                  <View style={styles.loading}><ActivityIndicator color={ModernDesign.colors.accent.neon} /><Typography variant="body2" color="secondary">価格を確認しています…</Typography></View>
                ) : productStatus === 'available' && price ? (
                  <Typography variant="h5" textAlign="center">{price}<Typography variant="body2" color="secondary"> / 買い切り</Typography></Typography>
                ) : (
                  <Typography variant="body2" textAlign="center" color="secondary">
                    {productStatus === 'error' ? '価格を取得できませんでした。通信状況をご確認ください。' : '現在購入できません。時間をおいてお試しください。'}
                  </Typography>
                )}
                <Typography variant="caption" textAlign="center" color="secondary">買い切り・月額料金なし・自動更新なし</Typography>
              </View>
              {!isLoading && productStatus !== 'available' ? (
                <Button icon="refresh" title="価格を再読み込み" onPress={() => purchaseService.loadProduct()} disabled={purchaseBusy || !purchaseService.supported} />
              ) : (
                <Button icon="shopping-bag" title={purchaseOperation === 'purchase' ? '購入を確認中…' : purchaseOperation === 'restore' ? '購入を復元中…' : price && !isLoading ? `${price}で購入する` : '価格を確認中…'}
                  onPress={purchase} variant="primary" disabled={!canPurchase} />
              )}
              <TouchableOpacity accessibilityRole="button" onPress={back} style={styles.continue}>
                <Typography variant="body2" color="secondary">今は無料で続ける</Typography>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ModernDesign.colors.background.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: ModernDesign.spacing[4] },
  headerAction: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: ModernDesign.spacing[2], paddingHorizontal: ModernDesign.spacing[2] },
  content: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 560, alignSelf: 'center', padding: ModernDesign.spacing[5], gap: ModernDesign.spacing[4] },
  hero: { alignItems: 'center', gap: ModernDesign.spacing[3], marginBottom: ModernDesign.spacing[2] },
  heading: { fontWeight: ModernDesign.typography.fontWeight.bold },
  benefits: { flexDirection: 'row', gap: ModernDesign.spacing[3] },
  stackedBenefits: { flexDirection: 'column' },
  benefit: { flex: 1, paddingVertical: ModernDesign.spacing[5], paddingHorizontal: ModernDesign.spacing[2], gap: ModernDesign.spacing[2], alignItems: 'center', backgroundColor: ModernDesign.colors.background.tertiary, borderRadius: ModernDesign.borderRadius.xl },
  benefitIcon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: ModernDesign.spacing[2] },
  benefitTitle: { fontWeight: ModernDesign.typography.fontWeight.semibold },
  detailsToggle: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ModernDesign.spacing[2] },
  details: { padding: ModernDesign.spacing[4], gap: ModernDesign.spacing[2], borderRadius: ModernDesign.borderRadius.lg, backgroundColor: ModernDesign.colors.background.tertiary },
  comparison: { gap: ModernDesign.spacing[2] },
  notice: { padding: ModernDesign.spacing[3], borderRadius: ModernDesign.borderRadius.lg, backgroundColor: ModernDesign.colors.background.tertiary },
  help: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ModernDesign.colors.border.subtle, paddingHorizontal: ModernDesign.spacing[5], paddingTop: ModernDesign.spacing[3] },
  footerInner: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: ModernDesign.spacing[2] },
  priceBlock: { gap: ModernDesign.spacing[1], paddingBottom: ModernDesign.spacing[2] },
  loading: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: ModernDesign.spacing[2], minHeight: 40 },
  continue: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  owned: { color: ModernDesign.colors.accent.mint, paddingBottom: ModernDesign.spacing[2] },
});
