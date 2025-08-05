import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { Typography } from '../components/atoms/Typography';
import { BannerAdView } from '../components/molecules/BannerAdView';
import { ModernDesign } from '../design/modernDesignSystem';
import { useSettingsStore } from '../store/settingsStore';
import { soundManager, SoundType } from '../utils/SoundManager';

interface SettingsScreenProps {
  navigation: any;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  navigation,
}) => {
  const {
    displayName,
    updateDisplayNameWithFirebase,
    loadDisplayName,
    soundEnabled,
    toggleSound,
  } = useSettingsStore();
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDisplayName();
  }, [loadDisplayName]);

  useEffect(() => {
    setNewDisplayName(displayName);
  }, [displayName]);

  const handleBack = () => {
    soundManager.play(SoundType.BUTTON);
    navigation.goBack();
  };

  const handleEditName = () => {
    setEditingName(true);
    setNewDisplayName(displayName);
  };

  const handleCancelEdit = () => {
    setEditingName(false);
    setNewDisplayName(displayName);
  };

  const handleSaveName = async () => {
    if (newDisplayName.trim() === displayName) {
      setEditingName(false);
      return;
    }

    setIsUpdating(true);
    try {
      const success = await updateDisplayNameWithFirebase(newDisplayName);

      if (success) {
        setEditingName(false);
        soundManager.play(SoundType.SUCCESS);
      } else {
        Alert.alert('エラー', 'ニックネームの更新に失敗しました');
      }
    } catch (error) {
      console.error('Failed to update display name:', error);
      Alert.alert('エラー', 'ニックネームの更新に失敗しました');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSoundToggle = () => {
    soundManager.play(SoundType.BUTTON);
    toggleSound();
  };

  // 設定項目の種類を定義
  type SettingItemType = 'editable' | 'readonly' | 'toggle';

  const renderSettingRow = (
    icon: string,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void,
    type: SettingItemType = 'readonly',
  ) => {
    const isInteractive = onPress !== undefined;
    const showChevron = type === 'editable';

    return (
      <TouchableOpacity
        style={[
          styles.settingRow,
          type === 'editable' && styles.editableRow,
          type === 'toggle' && styles.toggleRow,
          type === 'readonly' && styles.readonlyRow,
        ]}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={isInteractive ? 0.7 : 1}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingTitleRow}>
            <View style={styles.titleWithIcon}>
              <MaterialIcons
                name={icon}
                size={20}
                color={
                  type === 'editable'
                    ? ModernDesign.colors.accent.neon
                    : type === 'toggle'
                    ? ModernDesign.colors.accent.neon
                    : ModernDesign.colors.text.tertiary
                }
                style={styles.inlineTitleIcon}
              />
              <Typography
                variant="body1"
                style={[
                  styles.settingTitle,
                  type === 'editable' && styles.editableTitle,
                  type === 'readonly' && styles.readonlyTitle,
                ]}
              >
                {title}
              </Typography>
            </View>
            <View style={styles.settingRight}>
              {rightElement}
              {showChevron && (
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={ModernDesign.colors.accent.neon}
                  style={styles.editIcon}
                />
              )}
            </View>
          </View>
          {subtitle && (
            <Typography variant="caption" style={styles.settingSubtitle}>
              {subtitle}
            </Typography>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderNicknameRow = () => {
    if (editingName) {
      return (
        <View style={styles.nicknameEditRow}>
          <View style={styles.nicknameEditContent}>
            <View style={styles.editTitleRow}>
              <MaterialIcons
                name="person"
                size={20}
                color={ModernDesign.colors.accent.neon}
                style={styles.inlineTitleIcon}
              />
              <Typography variant="body1" style={styles.settingTitle}>
                ニックネーム
              </Typography>
            </View>

            <View style={styles.inlineInputSection}>
              <TextInput
                style={styles.inlineNicknameInput}
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                placeholder="ニックネームを入力"
                placeholderTextColor={ModernDesign.colors.text.tertiary}
                maxLength={20}
                autoFocus
                editable={!isUpdating}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <View style={styles.inlineEditButtons}>
                <TouchableOpacity
                  style={[styles.inlineButton, styles.cancelButton]}
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <MaterialIcons
                    name="close"
                    size={16}
                    color={ModernDesign.colors.text.secondary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.inlineButton,
                    styles.saveButton,
                    (isUpdating || newDisplayName.trim().length === 0) &&
                      styles.disabledInlineButton,
                  ]}
                  onPress={handleSaveName}
                  disabled={isUpdating || newDisplayName.trim().length === 0}
                >
                  <MaterialIcons
                    name="check"
                    size={16}
                    color={ModernDesign.colors.text.inverse}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.editHints}>
              <Typography variant="caption" style={styles.characterCounter}>
                {newDisplayName.length}/20文字
              </Typography>
              <Typography variant="caption" style={styles.editHint}>
                ランキングに表示されるあなたの名前です。他のプレイヤーも見ることができます。
              </Typography>
            </View>
          </View>
        </View>
      );
    }

    return renderSettingRow(
      'person',
      'ニックネーム',
      'ランキングに表示されるあなたの名前です。他のプレイヤーも見ることができます。',
      <Typography
        variant="body2"
        style={styles.currentValue}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {displayName}
      </Typography>,
      handleEditName,
      'editable',
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ModernDesign.colors.background.primary}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={ModernDesign.colors.text.primary}
          />
        </TouchableOpacity>
        <Typography variant="body1" style={styles.headerTitle}>
          設定
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.settingsList}>
          {renderNicknameRow()}

          {renderSettingRow(
            soundEnabled ? 'volume-up' : 'volume-off',
            '効果音',
            'ボタンのタップ音、ゲーム中のサウンドエフェクト、成功時の効果音などをオン・オフできます。',
            <View style={styles.switchContainer}>
              <View
                style={[
                  styles.switchTrack,
                  soundEnabled ? styles.switchTrackOn : styles.switchTrackOff,
                ]}
              >
                <View
                  style={[
                    styles.switchThumb,
                    soundEnabled ? styles.switchThumbOn : styles.switchThumbOff,
                  ]}
                />
              </View>
            </View>,
            handleSoundToggle,
            'toggle',
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BannerAdView style={styles.bannerAd} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.primary,
  },

  // ヘッダー
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 60,
    backgroundColor: ModernDesign.colors.background.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: ModernDesign.colors.background.secondary,
  },
  headerTitle: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    letterSpacing: ModernDesign.typography.letterSpacing.normal,
  },
  headerSpacer: {
    width: 44,
  },

  // スクロール
  scrollView: {
    flex: 1,
  },

  // 設定リスト
  settingsList: {
    marginTop: ModernDesign.spacing[6],
  },

  // 設定行
  settingRow: {
    paddingHorizontal: ModernDesign.spacing[5],
    paddingVertical: ModernDesign.spacing[5],
    minHeight: 72,
    backgroundColor: ModernDesign.colors.background.primary,
    borderBottomWidth: 0.5,
    borderBottomColor: ModernDesign.colors.border.subtle,
  },
  settingContent: {
    flex: 1,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ModernDesign.spacing[2],
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inlineTitleIcon: {
    marginRight: ModernDesign.spacing[3],
  },
  settingTitle: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
    fontSize: ModernDesign.typography.fontSize.lg,
  },
  settingSubtitle: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.sm,
    lineHeight: ModernDesign.typography.fontSize.sm * 1.5,
    marginLeft: ModernDesign.spacing[8], // アイコン + マージン分のインデント
    paddingRight: ModernDesign.spacing[3],
    opacity: 0.8,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentValue: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.lg,
    marginRight: ModernDesign.spacing[3],
    maxWidth: 140, // 長いニックネームでレイアウトが崩れるのを防ぐ
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  // スイッチ型トグル
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackOn: {
    backgroundColor: ModernDesign.colors.accent.neon,
    alignItems: 'flex-end',
  },
  switchTrackOff: {
    backgroundColor: ModernDesign.colors.background.tertiary,
    alignItems: 'flex-start',
  },
  switchThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  switchThumbOn: {
    backgroundColor: ModernDesign.colors.text.primary,
  },
  switchThumbOff: {
    backgroundColor: ModernDesign.colors.text.secondary,
  },
  chevron: {
    marginLeft: ModernDesign.spacing[1],
  },
  editIcon: {
    marginLeft: ModernDesign.spacing[2],
  },

  // 項目タイプ別スタイル
  editableRow: {
    backgroundColor: ModernDesign.colors.background.primary,
  },
  editableTitle: {
    color: ModernDesign.colors.text.primary,
    fontWeight: ModernDesign.typography.fontWeight.semibold,
  },

  toggleRow: {
    backgroundColor: ModernDesign.colors.background.primary,
  },

  readonlyRow: {
    backgroundColor: ModernDesign.colors.background.primary,
  },
  readonlyTitle: {
    color: ModernDesign.colors.text.secondary,
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },

  // インライン編集
  nicknameEditRow: {
    paddingHorizontal: ModernDesign.spacing[5],
    paddingVertical: ModernDesign.spacing[5],
    minHeight: 100,
    backgroundColor: ModernDesign.colors.background.secondary,
    borderBottomWidth: 0.5,
    borderBottomColor: ModernDesign.colors.border.subtle,
  },
  nicknameEditContent: {
    flex: 1,
  },
  editTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: ModernDesign.spacing[3],
  },
  inlineInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: ModernDesign.spacing[2],
    marginBottom: ModernDesign.spacing[2],
  },
  inlineNicknameInput: {
    flex: 1,
    backgroundColor: ModernDesign.colors.background.tertiary,
    borderRadius: ModernDesign.borderRadius.lg,
    paddingHorizontal: ModernDesign.spacing[4],
    paddingVertical: ModernDesign.spacing[3],
    fontSize: ModernDesign.typography.fontSize.lg,
    color: ModernDesign.colors.text.primary,
    borderWidth: 2,
    borderColor: ModernDesign.colors.accent.neon,
    marginRight: ModernDesign.spacing[3],
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  inlineEditButtons: {
    flexDirection: 'row',
    gap: ModernDesign.spacing[2],
  },
  inlineButton: {
    width: 36,
    height: 36,
    borderRadius: ModernDesign.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  cancelButton: {
    backgroundColor: ModernDesign.colors.background.secondary,
    borderColor: ModernDesign.colors.border.subtle,
  },
  saveButton: {
    backgroundColor: ModernDesign.colors.accent.neon,
    borderColor: ModernDesign.colors.accent.neon,
  },
  disabledInlineButton: {
    opacity: 0.5,
  },
  editHints: {
    marginTop: ModernDesign.spacing[3],
    marginLeft: ModernDesign.spacing[8], // アイコン分のインデント
  },
  characterCounter: {
    color: ModernDesign.colors.accent.neon,
    fontSize: ModernDesign.typography.fontSize.xs,
    marginBottom: ModernDesign.spacing[1],
    fontWeight: ModernDesign.typography.fontWeight.medium,
  },
  editHint: {
    color: ModernDesign.colors.text.secondary,
    fontSize: ModernDesign.typography.fontSize.xs,
    lineHeight: ModernDesign.typography.fontSize.xs * 1.4,
    opacity: 0.7,
  },

  // その他
  bottomSpacer: {
    height: ModernDesign.spacing[20], // 広告分のスペース
  },
  bannerAd: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
