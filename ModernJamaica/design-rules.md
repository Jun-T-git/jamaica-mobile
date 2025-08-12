React Native でのモバイルアプリ開発において、デバイス対応で気をつけるべきポイントをお伝えします。

## 画面サイズとレスポンシブ対応

**Dimensions の活用**

```javascript
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
```

**相対的なサイズ指定**

- 固定値ではなく、画面幅の％や flex を使用
- `width: '80%'`や`flex: 1`を積極的に活用

## セーフエリア対応

**react-native-safe-area-context の導入**

```javascript
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
```

iPhone のノッチやホームインジケーター、Android のステータスバーに対応するため必須です。

## フォントサイズとスケーリング

**PixelRatio を考慮**

```javascript
import { PixelRatio } from 'react-native';
const fontScale = PixelRatio.getFontScale();
```

**アクセシビリティ設定への対応**
ユーザーがシステム設定で文字サイズを変更している場合も考慮しましょう。

## レイアウトシステムの活用

**Flexbox の適切な使用**

- `flexDirection`, `justifyContent`, `alignItems`を適切に設定
- `flexWrap: 'wrap'`で複数行対応

**KeyboardAvoidingView の実装**
キーボード表示時のレイアウト崩れを防ぐため重要です。

## プラットフォーム固有の対応

**Platform.select の活用**

```javascript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: { shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 4 },
    }),
  },
});
```
