# みならい獣医さんの中学受験カルテ (Junior Vet Exam Chart / MASTER 100)

中学受験向け学習Webアプリケーション — 過去問 満点トレーナー

小学生がタブレット（iPad / Android）で自学自習できるように設計された、中学受験向け過去問満点習得支援システムです。

---

## 🌟 主な特徴

1. **Recall First（想起優先学習）**
   - 選択肢をすぐに見せず、まずは自力で思い出させる時間を設けます。
   - 選択肢に頼らず自力想起できた場合に最も高い習得度を獲得できます。
2. **Skillベースの習得モデル (M0〜M6)**
   - 「問題の丸暗記」ではなく、出題意図である本質的な能力（Skill）に分解。
   - 初見の転用問題（未見問題）で満点を取れる力を段階的に鍛えます。
3. **10種類の問題形式を完全サポート**
   - Recall Card / Delayed Choice / Multiple Choice / Why Choice / Next Step / Ordering / Diagram Touch / Matching / Numeric Answer / Self Check
4. **著作権保護と教材パック分離方式**
   - 過去問の著作権を保護するため、公開コードにはオリジナル作成のサンプル教材のみを同梱。
   - 実物の過去問データはローカルで「教材パック（ZIP）」として作成し、ブラウザ（IndexedDB）に取り込んで完全オフラインで学習します。

---

## 🚀 起動・開発・テスト

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 開発サーバーの起動
```bash
npm run dev
```

### 3. ビルド
```bash
npm run build
```

### 4. 単体テスト & 部品テスト
```bash
npm test
```

---

## 📦 教材パック（非公開）の作成と読み込み

### 1. 教材パックのビルド手順
```bash
# 1. PDFページ画像を200dpi PNGに展開
npm run pack:pages -- --subject rika

# 2. 回答欄一覧（Inventory）の検証
npm run pack:inventory -- --subject rika

# 3. 図表の自動切り抜き (WebP)
npm run pack:crop -- --subject rika

# 4. カバレッジ検査（第15章全11項目）
npm run pack:check -- --subject rika

# 5. 教材パックZIPの作成
npm run pack:build
```

### 2. アプリへの読み込み
1. アプリを起動し、右上の「⋯」メニューから「設定」画面を開きます。
2. 「教材パックの管理」エリアの「📁 教材パック（.zip）を選択して読み込む」をクリックします。
3. `content-private/dist-pack/master100-pack-yasuda-2024-1.0.0.zip` を選択します。
4. IndexedDBに自動保存され、オフラインでも学習可能になります。

---

## 🏫 別の学校・年度を追加する手順

1. `content-private/source-pdf/` に対象の学校・教科のPDFを配置します。
   - `<examId>-<subject>-mondai.pdf`
   - `<examId>-<subject>-kaito.pdf`
2. 上記の `pack:pages`, `pack:inventory`, `pack:crop`, `pack:check`, `pack:build` 手順を実行します。
3. 各学校・年度ごとに一意の `examId`（例: `shibuya-2024`）が割り当てられるため、既存の学習履歴に影響を与えることなく追加・切り替えが可能です。

---

## 💾 学習履歴のバックアップと復旧

- **書き出し**: 設定画面の「📥 履歴を書き出し（JSON）」ボタンから、現在の習得状況（Attempt, Mastery）をダウンロードできます。
- **初期化**: 設定画面の「⚠️ 学習履歴を初期化」から、2段階の確認を経て安全に初期化できます。

