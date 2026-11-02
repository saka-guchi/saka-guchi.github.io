# UI検証スクリプト群 (UI Verification Suite)

本ディレクトリは、UIリファクタリング時における「意図しないレイアウト崩れ・コントラスト低下・位置ずれ」を機械的に検出・防止するための自動検証ツール群です。

---

## 4ステップ検証フロー

改修前後の品質を保証するため、サブ段階ごとに以下の順序で実行します。

### 前提条件
Vite開発サーバー（ポート3000）が起動していること：
```bash
cd junior-vet-exam-chart
npm run dev
```

---

### Step 1. 決定論的スクリーンショットの撮影
時計API（2026-11-02 固定）、乱数固定、全CSSアニメーション/トランジション停止の状態で5テーマ×2ビューポートの画像を保存します。
```bash
node scripts/ui-verify/capture-deterministic.mjs docs/step1b_b
```

### Step 2. ピクセル差分のしきい値比較（ヒートマップ生成）
`pixelmatch`（しきい値0.1、アンチエイリアス除外）を用いて変更前後のピクセル差分を計算し、差分領域をハイライトしたヒートマップPNGを `docs/diff_heatmaps/` に出力します。
```bash
node scripts/ui-verify/compare-pixels-threshold.mjs docs/step1b_a docs/step1b_b
```
- **合否基準**: 見た目を変えない置換において差分 **1% 未満** であること。

### Step 3. 主要要素位置（getBoundingClientRect）の比較
主要要素（35個）の絶対座標（top, left, width, height）を計測・比較し、4px以上移動した要素を抽出します。
```bash
# 1. 現在の要素座標を計測保存
node scripts/ui-verify/measure-element-bounds.mjs docs/element_bounds_step1b_b.json

# 2. 直前サブ段階の記録と比較
node scripts/ui-verify/compare-element-bounds.mjs docs/element_bounds_step1b_a.json docs/element_bounds_step1b_b.json
```
- **合否基準**: 見た目を変えない置換において4px以上移動した要素が **0件** であること。

### Step 4. axe-core コントラスト・アクセシビリティスキャン
全5テーマについて、WCAG AA基準（コントラスト比 4.5:1 以上）の違反要素および判定不能（incomplete）要素を一覧化します。
```bash
node scripts/ui-verify/scan-axe-contrast.mjs
```

---

## スクリプト一覧
| ファイル | 役割 |
|---|---|
| `capture-deterministic.mjs` | 時計・乱数・アニメーションを決定論的に固定してスクリーンショット撮影 |
| `compare-pixels-threshold.mjs` | pixelmatchによるしきい値付きピクセル比較とヒートマップ生成 |
| `measure-element-bounds.mjs` | 主要要素の座標（top/left/width/height）をJSONに保存 |
| `compare-element-bounds.mjs` | 2つの要素座標JSONを比較し4px以上移動した要素を報告 |
| `scan-axe-contrast.mjs` | axe-coreによるWCAG AAコントラストスキャン |
