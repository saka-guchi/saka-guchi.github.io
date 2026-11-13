# 原本表示ピンチイン・アウト（Pinch to Zoom）設計書

## 1. 概要 (Overview)
- **目的**: Androidタブレット等のタッチ端末で原本（問題用紙・解答用紙）を表示している際、指での2本指ピンチイン・アウト操作によって、画面全体（viewport）ではなく原本表示領域のみを直感的に拡大縮小できるようにする。
- **対象コンポーネント**:
  1. `ExamProblemViewer.tsx`: 本番認定試験（`FinalChallengePage`）および振り返り（`ExamReviewPage`）の原本ビューア
  2. `OriginalScanModal.tsx`: 単元学習画面（`StudyPage`）の原本スキャン確認モーダル

## 2. 背景と課題
- 現状、拡大縮小ボタン（🔍 +, 🔍 -, 全体表示）は備わっているが、タッチ端末特有のピンチ操作への独自ハンドリングがないため、ブラウザ標準のピンチズームが発動し、ヘッダーや操作UIを含む画面全体が拡大されてしまう。
- 児童や保護者が原本の細かい文字や図表を確認する際、直感的に指でピンチして原本だけを拡大・縮小できる体験が求められている。

## 3. 代替案の検討 (Approaches)
- **案A: カスタムフック `usePinchToZoom` による統一実装（採用）**
  - 原本コンテナに非パッシブ（`passive: false`）なタッチイベントリスナーを登録し、2本指操作時のみ `e.preventDefault()` を呼んでブラウザ全体の拡大を抑止しつつ、指の距離比率に応じてズーム倍率を更新する。
  - 1本指スクロール（パン）はブラウザのネイティブスクロール（`touch-action: pan-x pan-y`）を維持。
  - 既存のズーム状態（`zoom` / `scanZoom`）と完全連動。
- **案B: 20%ステップの簡易ピンチ判定**
  - ピンチしきい値ごとにボタン押下相当の処理を呼ぶ。操作の滑らかさに欠け、指の追従性が悪いため不採用。

## 4. 詳細仕様 (Detailed Design)

### 4.1 カスタムフック `usePinchToZoom`
- ファイル: `junior-vet-exam-chart/src/utils/use-pinch-to-zoom.ts`
- インターフェース:
```typescript
export interface UsePinchToZoomOptions {
  zoom: number;
  onZoomChange: (newZoom: number | ((prev: number) => number)) => void;
  minZoom?: number; // デフォルト 100
  maxZoom?: number; // デフォルト 200 (ExamProblemViewer) または 220 (OriginalScanModal)
}

export function usePinchToZoom<T extends HTMLElement = HTMLDivElement>(
  options: UsePinchToZoomOptions
): {
  containerRef: React.RefObject<T | null>;
};
```
- 内部ロジック:
  1. コンテナ要素への `touchstart`, `touchmove`, `touchend`, `touchcancel` リスナー登録（`touchmove` は `{ passive: false }`）。
  2. `touchstart`: `e.touches.length === 2` のとき、2点間の初期距離 $d_0 = \text{hypot}(x_2 - x_1, y_2 - y_1)$ と初期ズーム $z_0 = \text{zoom}$ を ref に記録。
  3. `touchmove`: `e.touches.length === 2` のとき、`e.cancelable` であれば `e.preventDefault()` を呼び出しブラウザ全体のズームを抑止。現在の距離 $d_1$ から倍率比率 $r = d_1 / d_0$ を算出し、新しいズーム $z_1 = \text{Math.round}(\text{Math.max}(\text{minZoom}, \text{Math.min}(\text{maxZoom}, z_0 \times r)))$ を `onZoomChange` へ伝達。
  4. 1本指時は `preventDefault()` せず、標準スクロールを維持。

### 4.2 コンポーネントへの適用
- `OriginalScanModal.tsx`:
  - 原本コンテナ要素（`overflow: 'auto'`）に `usePinchToZoom` の `containerRef` をアタッチ。
  - `touchAction: 'pan-x pan-y'` スタイルを付与。
- `ExamProblemViewer.tsx`:
  - 原本表示領域（`.pageWrapper` または `.scanImageContainer` / `.scanSpreadContainer`）に `usePinchToZoom` をアタッチ。
  - 単ページ表示・見開き表示の両方でピンチズームが自然に動作。

## 5. テスト計画
- `usePinchToZoom.test.ts`:
  - 2本指タッチ移動で `onZoomChange` が適切な倍率で呼ばれること
  - 2本指操作時に `e.preventDefault()` が呼ばれること
  - 1本指操作時は `preventDefault` が呼ばれず、ズームも変化しないこと
  - minZoom / maxZoom の境界内に収まること
- 既存テストスイートの全グリーン確認（`npm test`）
