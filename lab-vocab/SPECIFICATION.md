# Labrador Vocab Specification

**Version:** 51.0
**Target:** Web / PWA
**Architecture:** Multi-Page Application (MPA) with Static Hosting

## 1. File Structure
- `index.html`: Home screen (Entry point).
- `quiz.html`: Quiz screen.
- `priming.html`: Priming (Pre-learning) screen.
- `result.html`: Result screen.
- `list.html`: Word list screen.
- `settings.html`: Settings screen.
- `style.css`: Common styles.
- `app.js`: Common logic (Data loading, SRS, Session).
- `words.csv`: Learning data source (Fetched on first load).
- `Dog.json`: Lottie animation data.

## 2. Data Management
- **Master Data**: `localStorage` (key: `lab_data_v30`)
- **Initial Load**: Fetch `words.csv` and initialize `localStorage` if empty.
- **Persistence**: All progress is saved to `localStorage`.
- **Session**: `sessionStorage` is used to pass quiz queue and results between pages.

## 3. UI/UX Specifications

### 3.1 Common Design
- **Header**: Screen title (Left) + Home button (Right, Icon only).
- **Footer**: Common "Back to Home" button (`.btn-home`) at the bottom of every screen.
- **Theme Color**: #F4D03F (Primary), #5D4037 (Text), #FAF9F6 (Background).

### 3.2 Home Screen (`index.html`)
- **Visual**: Lottie animation (`Dog.json`) + Affinity Heart Meter (10 hearts).
- **Chart**: "Memorizable Duration" (記憶できる期間) distribution.
  - Title moved to below the chart.
  - Lv.5 label changed to "1 Month Later" (1ヶ月後).
- **Settings**: Mode (Review/New), Question Count (10/20/30), Priming (On/Off).
- **Footer**: Version info displayed below settings buttons.

### 3.3 Quiz Screen (`quiz.html`)
- **Header**: Progress bar (Top), Question Count (Left), Level Badge (Right).
- **Card Layout**: English word (Top) + POS Badge (Bottom/Small). Vertical layout.
- **Icons**: Eye (Mask), Speaker (Audio). Hardcoded SVGs.
- **Footer**: "Interrupt & Home" button.

### 3.4 Result Screen (`result.html`)
- **Layout**:
  - Top (Fixed): Dog Animation + Speech Bubble + Heart Meter.
  - Middle (Scrollable): Result List.
  - Bottom (Fixed): "Retry" button + "Home" button.

## 4. Logic Specifications

### 4.1 Adaptive Quiz
- **Lv.0-1 (Standard)**: English -> Japanese (No Mask).
- **Lv.2 (Masked)**: Masked English -> Japanese.
- **Lv.3 (Reverse)**: Japanese -> English.
- **Lv.4+ (Fill-in)**: Fill-in-the-blank sentence.

### 4.2 SRS Algorithm
- Correct: Level Up (Max 5), Interval Extension.
- Incorrect: Level Reset (0), Interval Reset (1 day).

### 4.3 Affinity System
- Calculated based on total level of all words.
- Visualized by 10 hearts and dog's reaction.
