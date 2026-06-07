# BetterCrewLink OBS オーバーレイ fork版

このリポジトリは、`OhMyGuus/BetterCrewlink-obs` をフォークしたものです。

BetterCrewLink の状態を OBS ブラウザソース上に表示するための Web オーバーレイをベースに、表示調整や独自修正を行うために管理しています。

元リポジトリ:

- https://github.com/OhMyGuus/BetterCrewlink-obs

本家公開版:

- https://obs.bettercrewlink.app

BetterCrewLink 本体からボイスサーバー経由で送られてくるプレイヤー状態を受け取り、発話状態、死亡状態、プレイヤー名、アバターなどを描画します。

## このforkでの主な変更

- 発話中のアバター枠を `border-color` の直接切り替えではなく、`avatar-talking` クラス付与で制御するように変更
- 通常表示用の薄い枠を `avatar-show-border` クラスで制御
- CSS側から発話状態の見た目を調整しやすいように整理

## 使い方

BetterCrewLink 側で OBS ブラウザーオーバーレイを有効にすると、設定画面に OBS ブラウザソース用 URL が表示されます。

OBS の「ブラウザ」ソースにその URL を設定すると、BetterCrewLink の状態がオーバーレイとして表示されます。

## 開発

依存関係をインストールします。

```bash
yarn install
```

開発サーバーを起動します。

```bash
yarn start
```

ブラウザで http://localhost:3000 を開くと確認できます。

## ビルド

本番用の静的ファイルを生成します。

```bash
yarn build
```

生成物は `build` フォルダに出力されます。

## テスト

```bash
yarn test
```

## 注意

このリポジトリは OBS オーバーレイの表示側です。

BetterCrewLink 本体のボイス処理やゲーム状態取得は、BetterCrewLink 本体側のリポジトリで管理されています。

アバター画像や帽子などの素材は、主に `BetterCrewLink-Hats` 側の素材を参照します。
