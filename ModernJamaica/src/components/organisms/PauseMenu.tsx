import React from 'react';
import { Dialog } from '../molecules/Dialog';
import { ModernDesign } from '../../constants';
import { GameMode } from '../../types';

interface PauseMenuProps {
  visible: boolean;
  onClose: () => void;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  gameMode: GameMode;
  skipCount?: number;
  onSkip?: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  visible,
  onClose,
  onResume,
  onRestart,
  onHome,
  gameMode,
  skipCount,
  onSkip,
}) => {
  const showSkipButton = gameMode === GameMode.CHALLENGE && skipCount !== undefined && onSkip;

  const buttons = [
    {
      icon: 'play-arrow',
      title: 'ゲームを続ける',
      onPress: onResume,
      variant: 'primary' as const,
    },
    ...(showSkipButton ? [{
      icon: 'skip-next',
      title: `スキップ（残り${skipCount}回）`,
      onPress: onSkip!,
      disabled: skipCount === 0,
    }] : []),
    {
      icon: 'refresh',
      title: gameMode === GameMode.CHALLENGE ? '最初からやり直し' : '最初からやり直し',
      onPress: onRestart,
    },
    {
      icon: 'home',
      title: 'ホーム画面に戻る',
      onPress: onHome,
      variant: 'danger' as const,
    },
  ];

  return (
    <Dialog
      visible={visible}
      onClose={onClose}
      title="ポーズメニュー"
      icon="pause"
      iconColor={ModernDesign.colors.accent.neon}
      buttons={buttons}
      closeOnOverlayPress={false}
    />
  );
};

