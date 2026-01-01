# ラブラドール学習帳 (Labrador Vocab) 総合仕様書

**Version:** 50.0
**Date:** 2026-01-01
**Target Platform:** Web / PWA (iOS, Android Support)
**Architecture:** Multi-Page Application (MPA) / Static Hosting (GitHub Pages)

---

## 1. プロダクト概要

### 1.1 コンセプト
「ラブラドール学習帳」は、NGSL等の英単語リストを効率的に記憶し、自分だけの単語帳として育成できるWebアプリケーションである。
ラブラドール・レトリーバーとの触れ合いや、学習者の習熟度（レベル）に応じたアダプティブな出題形式により、学習意欲の維持・向上を図る。

### 1.2 アーキテクチャ変更 (v50)
Pythonによる単一HTML生成方式を廃止し、GitHub Pagesでの運用に適した**静的ファイル構成（MPA）**へ移行した。
画面ごとにHTMLファイルを分割し、共通のCSS/JSで制御する。

### 1.3 ファイル構成
| ファイル名 | 役割 |
| :--- | :--- |
| `index.html` | ホーム画面（エントリーポイント）。 |
| `priming.html` | 事前学習画面。 |
| `quiz.html` | クイズ出題画面。 |
| `result.html` | 回答結果画面。 |
| `list.html` | 単語一覧画面。 |
| `settings.html` | 詳細設定画面。 |
| `css/style.css` | 全画面共通のスタイル定義。 |
| `js/app.js` | 全画面共通のロジック（データ管理、SRS計算、Lottie制御）。 |
| `words.csv` | 学習データソース（初回起動時に非同期読み込み）。 |
| `Dog.json` | Lottieアニメーションデータ。 |

---

## 2. データ管理仕様

### 2.1 データフロー
1.  **初期化 (Initial Load)**:
    - アプリ初回アクセス時、`words.csv` を `fetch()` で取得・パースする。
    - パースしたデータを `localStorage` に「マスターデータ」として保存する。
2.  **永続化 (Persistence)**:
    - 学習記録の更新、単語の追加・編集は `localStorage` (`lab_data_v30`) に対して行う。
    - 2回目以降の起動は `localStorage` を参照する。
3.  **画面間連携 (Session)**:
    - クイズの出題キューや途中経過、回答結果は `sessionStorage` (`lab_session`) を介して次の画面へ引き渡す。

### 2.2 データモデル (Word Object)
```javascript
{
  "id": number,           // 一意のID (連番 or タイムスタンプ)
  "en": string,           // 英単語
  "ja": string,           // 日本語訳
  "pos": string,          // 品詞
  "ex": string,           // 例文
  "exJa": string,         // 例文訳
  "stats": {              // 学習記録
    "level": number,      // 0(未)〜5(完)
    "nextReview": number, // 次回学習可能日時 (UNIX ms)
    "interval": number    // 復習間隔 (日)
  }
}
