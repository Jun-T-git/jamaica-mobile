import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button } from '../atoms/Button';
import { Typography } from '../atoms/Typography';
import { ModernDesign } from '../../constants';
import { useSettingsStore } from '../../store/settingsStore';

interface Props { initialName: string; onClose: () => void; onShow: () => void }

export const NicknamePromptModal: React.FC<Props> = ({ initialName, onClose, onShow }) => {
  const registerNickname = useSettingsStore(state => state.registerNickname);
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const submitting = useRef(false);
  const close = () => { if (!submitting.current) onClose(); };
  const save = async () => {
    if (submitting.current || saved) return;
    submitting.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await registerNickname(name);
      if (result.status === 'invalid') setMessage(result.message);
      else if (result.status === 'storage_error') setMessage('保存を確認できませんでした。もう一度登録するか、あとで設定から変更してください。');
      else if (result.rankingSynced) onClose();
      else {
        setSaved(true);
        setMessage('この端末に保存しました。ランキングへの反映は確認できていません。次回のスコア送信には新しい名前を使います。');
      }
    } catch {
      setMessage('保存を確認できませんでした。あとで設定から変更できます。');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onShow={onShow} onRequestClose={close}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.card} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View accessibilityViewIsModal>
            <Typography variant="h4" textAlign="center">ニックネームをつけよう</Typography>
            <Typography variant="body2" color="secondary" style={styles.description}>
              スコアに表示するあなたの名前です。本名などの個人情報は入れないでください。
            </Typography>
            <Typography variant="body2" style={styles.hint}>名前はあとから「設定」でいつでも変更できます。</Typography>
            <TextInput accessibilityLabel="ニックネーム" value={name} onChangeText={setName}
              editable={!busy && !saved} style={styles.input} returnKeyType="done"
              autoCorrect={false} autoCapitalize="none" selectTextOnFocus onSubmitEditing={save} />
            <Typography variant="caption" color="secondary">20文字以内</Typography>
            {message !== '' && <View accessibilityLiveRegion="polite"><Typography variant="body2" style={styles.message}>{message}</Typography></View>}
            <View style={styles.actions}>
              {!saved && <Button icon="check" title={busy ? '登録中…' : 'この名前で登録'} onPress={save} variant="primary" disabled={busy} />}
              <Button icon="arrow-forward" title={saved ? 'ゲームを始める' : 'あとで設定する'} onPress={close} disabled={busy} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: ModernDesign.colors.background.primary, padding: ModernDesign.spacing[4] },
  card: { flexGrow: 0, width: '100%', maxWidth: 440, maxHeight: '90%', backgroundColor: ModernDesign.colors.background.tertiary, borderRadius: ModernDesign.borderRadius['2xl'] },
  content: { padding: ModernDesign.spacing[6] },
  description: { marginTop: ModernDesign.spacing[4] },
  hint: { marginTop: ModernDesign.spacing[3] },
  input: { marginTop: ModernDesign.spacing[5], marginBottom: ModernDesign.spacing[2], minHeight: 48, padding: ModernDesign.spacing[3], borderWidth: 1, borderColor: ModernDesign.colors.accent.neon, borderRadius: ModernDesign.borderRadius.lg, color: ModernDesign.colors.text.primary, fontSize: ModernDesign.typography.fontSize.lg },
  message: { marginTop: ModernDesign.spacing[4] },
  actions: { marginTop: ModernDesign.spacing[5], gap: ModernDesign.spacing[3] },
});
