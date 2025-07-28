import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { adService } from '../../services/adService';
import { ModernDesign } from '../../constants';

interface AdDebugInfoProps {
  visible?: boolean;
}

export const AdDebugInfo: React.FC<AdDebugInfoProps> = ({ visible = __DEV__ }) => {
  const [debugInfo, setDebugInfo] = useState({
    bannerUnitId: '',
    interstitialUnitId: '',
    appId: '',
    isDevMode: __DEV__,
  });

  useEffect(() => {
    if (!visible) return;

    const updateDebugInfo = () => {
      setDebugInfo({
        bannerUnitId: adService.getBannerAdUnitId() || 'Not set',
        interstitialUnitId: 'Set in service',
        appId: 'ca-app-pub-9884011718535966~4581366468',
        isDevMode: __DEV__,
      });
    };

    updateDebugInfo();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 AdMob Debug Info</Text>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Mode:</Text>
        <Text style={[styles.value, debugInfo.isDevMode ? styles.testMode : styles.prodMode]}>
          {debugInfo.isDevMode ? 'TEST' : 'PRODUCTION'}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>App ID:</Text>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
          {debugInfo.appId}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Banner ID:</Text>
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="middle">
          {debugInfo.bannerUnitId}
        </Text>
      </View>
      
      <View style={styles.infoRow}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, styles.statusOk]}>
          ✅ Configured
        </Text>
      </View>

      <TouchableOpacity
        style={styles.testButton}
        onPress={() => {
          console.log('=== AdMob Configuration Test ===');
          console.log('App ID:', debugInfo.appId);
          console.log('Banner Unit ID:', debugInfo.bannerUnitId);
          console.log('Is Dev Mode:', debugInfo.isDevMode);
          console.log('====================================');
        }}
      >
        <Text style={styles.testButtonText}>📋 Log Config to Console</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: ModernDesign.borderRadius.lg,
    padding: ModernDesign.spacing[4],
    minWidth: 250,
    zIndex: 9999,
  },
  title: {
    fontSize: ModernDesign.typography.fontSize.sm,
    fontWeight: ModernDesign.typography.fontWeight.bold as any,
    color: ModernDesign.colors.accent.neon,
    marginBottom: ModernDesign.spacing[3],
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[2],
  },
  label: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  testMode: {
    color: ModernDesign.colors.warning,
    fontWeight: ModernDesign.typography.fontWeight.bold as any,
  },
  prodMode: {
    color: ModernDesign.colors.success,
    fontWeight: ModernDesign.typography.fontWeight.bold as any,
  },
  statusOk: {
    color: ModernDesign.colors.success,
  },
  testButton: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderRadius: ModernDesign.borderRadius.sm,
    padding: ModernDesign.spacing[2],
    marginTop: ModernDesign.spacing[3],
  },
  testButtonText: {
    fontSize: ModernDesign.typography.fontSize.xs,
    color: ModernDesign.colors.background.primary,
    textAlign: 'center',
    fontWeight: ModernDesign.typography.fontWeight.semibold as any,
  },
});