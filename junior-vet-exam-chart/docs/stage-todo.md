# 段階別 UI/UX・デザイン改善 TODO リスト

本ドキュメントは、段階1（トークン化）の完了後、段階2〜5および将来のパフォーマンス改善において実施するタスク・未解決課題を集約・管理するものです。

---

## 段階2: 色の役割固定・夜空テーマダーク対応・コントラスト適正化

### 1. 夜空テーマ（ダークモード）固定ライト背景のトークン化・適正化
夜空テーマ（Dark）適用時に、CSSモジュールやインラインスタイルで明るい背景（白、薄黄、薄緑、薄青等）がハードコードされているため、白飛びやコントラスト低下、文字の視認性悪化（例: `_unmasteredAccordionBtn` の文字 `#fde68a` が背景 `#fffbeb`）が生じている箇所（計 105 箇所）を、セマンティックなサーフェストークン（`var(--surface)`, `var(--surface-sunken)`, `var(--accent-*-bg)` 等）へ置き換えます。

#### 固定ライト背景の検出一覧（全 105 件）
| No | ファイル | 行 | 種別 | コード抜粋 |
|---|---|---|---|---|
| 1 | src/components/AnimatedVetPet.module.css | 164 | 白背景 (#ffffff) | `background: #ffffff;` |
| 2 | src/components/AnimatedVetPet.tsx | 97 | 白背景 (#ffffff) | `fill="#FFFFFF"` |
| 3 | src/components/AnimatedVetPet.tsx | 117 | 白背景 (#ffffff) | `<circle cx="21" cy="24" r="0.8" fill="#FFFFFF" />` |
| 4 | src/components/AnimatedVetPet.tsx | 121 | 白背景 (#ffffff) | `<circle cx="35" cy="24" r="0.8" fill="#FFFFFF" />` |
| 5 | src/components/AnimatedVetPet.tsx | 138 | 白背景 (#ffffff) | `<rect x="0" y="0" width="7" height="4" rx="1.5" fill="#FFFFFF" stroke="#3B82F6" strokeWidth="0.8" />` |
| 6 | src/components/AnimatedVetPet.tsx | 158 | 白背景 (#ffffff) | `<ellipse cx="14" cy="42" rx="4.5" ry="3.5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />` |
| 7 | src/components/AppUpdateBanner.module.css | 70 | 白背景 (#ffffff) | `background: #ffffff;` |
| 8 | src/components/AppUpdateBanner.module.css | 87 | スレートライト背景 (#f8fafc) | `background: #f8fafc;` |
| 9 | src/components/DoctorCertificateModal.module.css | 15 | 琥珀ライト背景 (#fffbeb) | `background: linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, var(--accent-gold-bg) 100%);` |
| 10 | src/components/DoctorCertificateModal.module.css | 154 | 白背景 (#ffffff) | `background: #ffffff;` |
| 11 | src/components/DoctorCertificateModal.module.css | 207 | 白背景 (#ffffff) | `background: #ffffff;` |
| 12 | src/components/ErrorBoundary.tsx | 46 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 13 | src/components/ErrorBoundary.tsx | 78 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 14 | src/components/FinalExamHistoryModal.tsx | 85 | 白背景 (#ffffff) | `background: 'var(--surface, #ffffff)',` |
| 15 | src/components/FinalExamHistoryModal.tsx | 287 | ゴールドライト背景 (#fef3c7) | `background: '#fef3c7',` |
| 16 | src/components/formats/Formats.module.css | 30 | 青ライト背景 (#eff6ff) | `background: #eff6ff;` |
| 17 | src/components/formats/QuestionRenderer.tsx | 375 | 琥珀ライト背景 (#fffbeb) | `background: '#fffbeb',` |
| 18 | src/components/ParentDashboardModal.module.css | 38 | 白背景 (#ffffff) | `background: #ffffff !important;` |
| 19 | src/components/ParentDashboardModal.module.css | 118 | 白背景 (#ffffff) | `background: #ffffff;` |
| 20 | src/components/ParentDashboardModal.module.css | 165 | スレートライト背景 (#f8fafc) | `background: #f8fafc;` |
| 21 | src/components/ParentDashboardModal.tsx | 352 | スレートライト背景 (#f8fafc) | `background: 'var(--bg-primary, #f8fafc)',` |
| 22 | src/components/ParentDashboardModal.tsx | 370 | 白背景 (#ffffff) | `background: 'var(--surface, #ffffff)',` |
| 23 | src/components/ParentDashboardModal.tsx | 385 | 緑ライト背景 (#f0fdf4) | `background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',` |
| 24 | src/components/ParentDashboardModal.tsx | 403 | 白背景 (#ffffff) | `background: 'var(--surface, #ffffff)',` |
| 25 | src/components/ParentDashboardModal.tsx | 482 | 白背景 (#ffffff) | `background: activeTab === tab.id ? 'var(--surface, #ffffff)' : 'transparent',` |
| 26 | src/components/ParentDashboardModal.tsx | 525 | 緑ライト背景 (#f0fdf4) | `<div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(34, 197, 94, 0.08)' }}>` |
| 27 | src/components/ParentDashboardModal.tsx | 536 | 青ライト背景 (#eff6ff) | `<div style={{ background: '#eff6ff', border: '1.5px solid #93c5fd', borderRadius: '12px', padding: '12px', textAlign: 'center', boxShadow: '0 2px 6px rgba(59, 130, 246, 0.08)' }}>` |
| 28 | src/components/ParentDashboardModal.tsx | 547 | ゴールドライト背景 (#fef3c7) | `<div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>` |
| 29 | src/components/ParentDashboardModal.tsx | 558 | ピンクライト背景 (#fdf2f8) | `<div style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>` |
| 30 | src/components/ParentDashboardModal.tsx | 720 | 白背景 (#ffffff) | `<circle cx={p.x} cy={p.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />` |
| 31 | src/components/ParentDashboardModal.tsx | 745 | 琥珀ライト背景 (#fffbeb) | `background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',` |
| 32 | src/components/ParentDashboardModal.tsx | 764 | 白背景 (#ffffff) | `<div style={{ background: '#ffffff', borderRadius: '12px', padding: '14px', border: '1px solid #fef08a', lineHeight: '1.6', fontSize: '13px', color: '#78350f' }}>` |
| 33 | src/components/ParentDashboardModal.tsx | 831 | 白背景 (#fff) | `style={{ padding: '6px 16px', borderRadius: '6px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}` |
| 34 | src/components/ParentDashboardModal.tsx | 840 | 白背景 (#ffffff) | `background: rewardAchieved ? '#dcfce7' : '#ffffff',` |
| 35 | src/components/ParentDashboardModal.tsx | 930 | 緑ライト背景 (#f0fdf4) | `background: isExpanded ? '#dbeafe' : '#f0fdf4',` |
| 36 | src/components/ParentDashboardModal.tsx | 952 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 37 | src/components/ParentDashboardModal.tsx | 987 | 白背景 (#ffffff) | `<div style={{ background: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px 10px' }}>` |
| 38 | src/components/ParentDashboardModal.tsx | 1040 | 緑ライト背景 (#f0fdf4) | `background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',` |
| 39 | src/components/ParentDashboardModal.tsx | 1083 | 緑ライト背景 (#f0fdf4) | `background: '#f0fdf4',` |
| 40 | src/components/ParentDashboardModal.tsx | 1106 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 41 | src/components/ParentDashboardModal.tsx | 1186 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 42 | src/components/ParentDashboardModal.tsx | 1244 | 緑ライト背景 (#f0fdf4) | `background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)',` |
| 43 | src/components/ParentDashboardModal.tsx | 1291 | 青ライト背景 (#eff6ff) | `background: '#eff6ff',` |
| 44 | src/components/ParentDashboardModal.tsx | 1311 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 45 | src/components/ParentDashboardModal.tsx | 1329 | 青ライト背景 (#eff6ff) | `background: '#eff6ff',` |
| 46 | src/components/ParentDashboardModal.tsx | 1349 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 47 | src/components/ParentDashboardModal.tsx | 1379 | 緑ライト背景 (#f0fdf4) | `background: isDone ? '#f0fdf4' : '#fff7ed',` |
| 48 | src/components/ParentDashboardModal.tsx | 1435 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 49 | src/components/ParentDashboardModal.tsx | 1452 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 50 | src/components/ParentDashboardModal.tsx | 1485 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 51 | src/components/ParentDashboardModal.tsx | 1507 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 52 | src/components/ParentDashboardModal.tsx | 1566 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 53 | src/components/ParentDashboardModal.tsx | 1610 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 54 | src/components/ParentDashboardModal.tsx | 1637 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 55 | src/components/ParentDashboardModal.tsx | 1661 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 56 | src/components/ParentDashboardModal.tsx | 1853 | ピンクライト背景 (#fdf2f8) | `background: '#fdf2f8',` |
| 57 | src/components/ParentDashboardModal.tsx | 1871 | スレートライト背景 (#f8fafc) | `background: '#f8fafc',` |
| 58 | src/components/QuickFlashCardModal.module.css | 87 | 白背景 (#ffffff) | `background: linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%);` |
| 59 | src/components/QuickFlashCardModal.module.css | 91 | 琥珀ライト背景 (#fffbeb) | `background: linear-gradient(135deg, #fdf4f8 0%, #fffbeb 100%);` |
| 60 | src/components/ReferenceBookQuizModal.module.css | 4 | スレートライト背景 (#f8fafc) | `background-color: var(--bg-primary, #f8fafc);` |
| 61 | src/components/ReferenceBookQuizModal.module.css | 19 | 白背景 (#ffffff) | `background: #ffffff;` |
| 62 | src/components/ReferenceBookQuizModal.module.css | 44 | 緑ライト背景 (#f0fdf4) | `background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);` |
| 63 | src/components/ReferenceBookQuizModal.module.css | 147 | 白背景 (#ffffff) | `background: #ffffff;` |
| 64 | src/components/ReferenceBookQuizModal.module.css | 193 | 琥珀ライト背景 (#fffbeb) | `background: linear-gradient(135deg, #fefce8 0%, #fffbeb 100%);` |
| 65 | src/components/ReferenceBookQuizModal.module.css | 240 | 白背景 (#ffffff) | `background: #ffffff;` |
| 66 | src/components/ReferenceBookQuizModal.module.css | 279 | スレートライト背景 (#f8fafc) | `background: #f8fafc;` |
| 67 | src/components/ReferenceBookQuizModal.module.css | 294 | 青ライト背景 (#eff6ff) | `background: #eff6ff;` |
| 68 | src/components/ReferenceBookQuizModal.module.css | 321 | 青ライト背景 (#eff6ff) | `background: #eff6ff;` |
| 69 | src/components/ReferenceBookQuizModal.module.css | 364 | 緑ライト背景 (#f0fdf4) | `background: #f0fdf4;` |
| 70 | src/components/ReferenceBookQuizModal.module.css | 390 | 白背景 (#ffffff) | `background: #ffffff;` |
| 71 | src/components/ReferenceBookQuizModal.module.css | 463 | スレートライト背景 (#f8fafc) | `background: #f8fafc;` |
| 72 | src/components/ReferenceBookQuizModal.module.css | 540 | 白背景 (#ffffff) | `background: #ffffff;` |
| 73 | src/pages/FinalChallengePage.tsx | 535 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 74 | src/pages/FinalChallengePage.tsx | 699 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 75 | src/pages/FinalChallengePage.tsx | 1218 | 白背景 (#ffffff) | `background: 'var(--surface, #ffffff)',` |
| 76 | src/pages/FinalChallengePage.tsx | 1279 | 白背景 (#ffffff) | `background: 'var(--surface, #ffffff)',` |
| 77 | src/pages/HomePage.module.css | 103 | 琥珀ライト背景 (#fffbeb) | `background: linear-gradient(135deg, var(--accent-gold-bg) 0%, #fffbeb 100%);` |
| 78 | src/pages/HomePage.module.css | 194 | 白背景 (#ffffff) | `background: #ffffff;` |
| 79 | src/pages/HomePage.module.css | 399 | 青ライト背景 (#eff6ff) | `background: linear-gradient(135deg, var(--surface) 0%, #eff6ff 100%);` |
| 80 | src/pages/HomePage.module.css | 473 | 白背景 (#ffffff) | `background: #ffffff;` |
| 81 | src/pages/HomePage.module.css | 749 | 緑ライト背景 (#f0fdf4) | `background: #f0fdf4;` |
| 82 | src/pages/HomePage.module.css | 770 | 琥珀ライト背景 (#fffbeb) | `background: #fffbeb;` |
| 83 | src/pages/HomePage.module.css | 1570 | 白背景 (#ffffff) | `background: #ffffff;` |
| 84 | src/pages/HomePage.module.css | 1626 | 緑ライト背景 (#f0fdf4) | `background: #f0fdf4;` |
| 85 | src/pages/HomePage.tsx | 1264 | ゴールドライト背景 (#fef3c7) | `background: isEarned ? (isOpened ? '#fef3c7' : 'var(--primary-weak)') : 'var(--surface-subtle)',` |
| 86 | src/pages/HomePage.tsx | 1296 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 87 | src/pages/HomePage.tsx | 1440 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 88 | src/pages/HomePage.tsx | 1843 | 琥珀ライト背景 (#fffbeb) | `background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',` |
| 89 | src/pages/MentalCarePage.module.css | 7 | スレートライト背景 (#f8fafc) | `background: var(--bg-primary, #F8FAFC);` |
| 90 | src/pages/MentalCarePage.module.css | 138 | 白背景 (#ffffff) | `background: linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%);` |
| 91 | src/pages/MentalCarePage.module.css | 226 | スレートライト背景 (#f8fafc) | `background: #F8FAFC;` |
| 92 | src/pages/MentalCarePage.module.css | 515 | スレートライト背景 (#f8fafc) | `background: #F8FAFC;` |
| 93 | src/pages/MentalCarePage.module.css | 605 | 緑ライト背景 (#f0fdf4) | `background: #F0FDF4;` |
| 94 | src/pages/MentalCarePage.module.css | 810 | スレートライト背景 (#f8fafc) | `background: #F8FAFC;` |
| 95 | src/pages/MentalCarePage.module.css | 956 | 琥珀ライト背景 (#fffbeb) | `background: #FFFBEB;` |
| 96 | src/pages/MentalCarePage.tsx | 774 | スレートライト背景 (#f8fafc) | `<div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', marginBottom: '20px' }}>` |
| 97 | src/pages/MentalCarePage.tsx | 1192 | スレートライト背景 (#f8fafc) | `background: selectedParentRequest === opt.type ? '#CCFBF1' : '#F8FAFC',` |
| 98 | src/pages/MentalCarePage.tsx | 1344 | 緑ライト背景 (#f0fdf4) | `style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}` |
| 99 | src/pages/MentalCarePage.tsx | 1353 | 黄ライト背景 (#fefce8) | `style={{ borderColor: '#FDE047', background: '#FEFCE8' }}` |
| 100 | src/pages/MentalCarePage.tsx | 1362 | スレートライト背景 (#f8fafc) | `style={{ borderColor: '#CBD5E1', background: '#F8FAFC' }}` |
| 101 | src/pages/ResultPage.module.css | 341 | 緑ライト背景 (#f0fdf4) | `background: linear-gradient(135deg, #f0fdf4 0%, var(--success-weak) 100%);` |
| 102 | src/pages/ResultPage.tsx | 92 | 青ライト背景 (#eff6ff) | `background: '#eff6ff',` |
| 103 | src/pages/ResultPage.tsx | 281 | 緑ライト背景 (#f0fdf4) | `background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',` |
| 104 | src/pages/ResultPage.tsx | 307 | 白背景 (#ffffff) | `background: '#ffffff',` |
| 105 | src/pages/SettingsPage.tsx | 449 | 琥珀ライト背景 (#fffbeb) | `background: backupStatus.includes('❌') ? '#FEF2F2' : backupStatus.includes('⚠️') ? '#FFFBEB' : '#F0FDF4',` |

### 2. コンポーネント・カラー設計の役割固定（段階2）
- **青の「歴史人物80」ボタンの階層整理**: 主役ボタン（Primary CTA）ではなく副次的な枠線ボタンスタイル（Outline/Secondary）に変更。
- **琥珀の枠線の統一**: ホーム画面等で散見される琥珀（Amber）枠のスタイルを3箇所で1セットの共通トークンに統一。
- **「名作参考書から調合」ピルの配色**: 水色のピルをシステム全体の役割色（Category/Subtle）に合わせて統一。
- **ティール系CTAのコントラスト改善**: 白文字コントラスト比 3.51:1 となっているティールCTAを、アクセシビリティ基準を満たす `#2C7A7B`（コントラスト比 5.03:1）以上に引き上げ。

---

## 段階3: コンポーネント整理・アフォーダンス適正化

- **表示専用ラベルのアフォーダンス是正**:
  - 「内訳」ピル、「あと8個」、「理科・算数・社会」タグなど、タップできない要素のボタンスタイル（ピル形状・シャドウ）を排し、純粋な表示専用テキスト/バッジに変更。
- **動物アイコンのアフォーダンス付与**: タップ可能であることが直感的に伝わる「押せる」見た目（ホバー・タップ領域、シャドウ等）を付加。
- **選択UIの視覚的区別**:
  - 出題教科（複数選択可能なチェックボックストグル）と、症例の教科（単一選択可能なセグメント/ラジオ切り替え）でUIコンポーネントの形状・振る舞いを明確に分離。

---

## 段階4: レイアウト最適化・導線整理

- **上段2カードのグリッド整列**:
  - 左カード・右カードで見出しの高さ、および最下部CTAの下端ラインを完全に揃える（右の見出しが2行になった場合でもボタン配置がズレないフレックス構造）。
- **禁則処理・途中改行の根絶**:
  - 「歴史人物80」「受験」「挑戦」などの単語途中での不自然な改行を防止（`text-wrap: balance/pretty`, `word-break: keep-all`, 字間調整）。
- **症例スタディカード下の余白最適化**: カード下部に生じている不自然な空白領域を解消。
- **モバイルヘッダーの2行スリム化**:
  - 375px幅で高さ 227px まで膨らんでいるヘッダーを、1行目（ステータス表示専用）・2行目（操作アイコン群）に整理し、合計高さ **120px 以内** に圧縮。
- **「本日の回診」重複文言の整理**:
  - 画面内に「本日の回診」が7回重複して出現しているラベリングの整理・認知負荷軽減。

---

## 段階5: 用語・世界観統制・表記集約

- **メタファー用語の統一**:
  - 「処方箋」「処方」「調合」「特効薬」の混在を整理・統一。
- **専門・開発用語の小学生向け置換**:
  - 「Stage」「Skill」「ライセンス」「アンロック」などのカタカナ用語を、小学生が親しみやすい日本語に統一。
- **進度・残数表記の1箇所集約**:
  - 「8/13」「8/56」「4/12」「あと8つ/あと8個」と各所で分散・重複している進度数値を1箇所の直感的なダッシュボードに集約。

---

## パフォーマンス・アーキテクチャ（将来課題）

- **本番JSバンドルのコード分割（Code Splitting）**:
  - 現在本番ビルド（`dist/assets/index-*.js`）が約 1.2MB の単一チャンクとなっているため、`React.lazy()` やルート単位・モーダル単位（`ParentDashboardModal`, `MentalCarePage`, `ReferenceBookQuizModal` 等）の動的インポートにより、初期ロードサイズを削減する。
