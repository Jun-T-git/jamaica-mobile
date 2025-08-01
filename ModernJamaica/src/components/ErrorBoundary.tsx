import React, { Component, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '../constants';
import { soundManager, SoundType } from '../utils/SoundManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // エラー画面リセットボタン効果音
    soundManager.play(SoundType.BUTTON);
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <MaterialIcons name="error-outline" size={80} color={COLORS.DANGER} />
            <Text style={styles.title}>エラーが発生しました</Text>
            <Text style={styles.message}>
              申し訳ございません。予期せぬエラーが発生しました。
            </Text>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>もう一度試す</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT.PRIMARY,
    marginTop: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: COLORS.TEXT.SECONDARY,
    textAlign: 'center',
    marginBottom: 30,
  },
  errorDetails: {
    backgroundColor: 'rgba(208, 2, 27, 0.1)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    maxWidth: '90%',
  },
  errorText: {
    fontSize: 12,
    color: COLORS.DANGER,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: COLORS.CARD,
    fontSize: 16,
    fontWeight: 'bold',
  },
});