#!/bin/sh

# Xcode Cloud 用ブートストラップ（クローン直後・依存解決前に実行）。
# Xcode Cloud は React Native(node) と CocoaPods を自動では用意しないため、
# ここで導入する。これが無いと Pods 未生成のまま archive され
# 「Unable to open base configuration reference file ... Pods-*.xcconfig」で失敗する。
#
# 配置: ci_scripts/ はワークスペースと同じディレクトリ(ModernJamaica/ios/)に置く。
# CWD はこのスクリプトのあるディレクトリ、リポジトリルートは $CI_PRIMARY_REPOSITORY_PATH。

set -e

echo "--- ci_post_clone: Node / CocoaPods を導入 ---"

# Node（RN の JS バンドルに必要）
brew install node

# JS 依存
cd "$CI_PRIMARY_REPOSITORY_PATH/ModernJamaica"
npm ci

# CocoaPods（Podfile の post_install が fmt の consteval 互換パッチを適用する）
brew install cocoapods
cd ios
pod install

echo "--- ci_post_clone: 完了 ---"
