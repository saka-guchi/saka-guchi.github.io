import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MentalCarePage.module.css';
import {
  INITIAL_SORTING_CARDS,
  COPING_RECIPES,
  PHILOSOPHY_TOPICS,
  CARE_CARD_TEMPLATES,
  PARENT_REQUEST_OPTIONS,
  type SortingCardItem,
  type CopingRecipe,
  type PhilosophyTopic,
  type DialogChoice,
} from '../data/mental-care-data';
import {
  runMentalCareMigration,
  recordMentalCheckin,
  recordCopingEffect,
  addSortingCard,
  sendCareCardToParent,
  getPrivateWeatherDetails,
  getPrivateSortingCards,
  getPrivateCopingRecords,
  getPrivatePhilosophyAnswers,
  savePrivatePhilosophyAnswers,
  getSharedCareCards,
  deleteSharedCareCard,
  isChildLockEnabled,
  isChildUnlocked,
  unlockChild,
  lockChild,
  setChildLock,
  disableChildLock,
  getPromisesAgreedMeta,
  agreeToPromises,
  OFFICIAL_CRISIS_CONTACTS,
  type WeatherType,
  type SortingBoxType,
  type CopingEffectLevel,
  type ParentRequestType,
  type PrivateSortingCard,
  type PrivateCopingRecord,
  WEATHER_OPTIONS,
} from '../utils/mental-care';
import { sound } from '../utils/sound-effects';
import { fireConfetti } from '../utils/confetti';

export const MentalCarePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab') as 'puzzle' | 'coping' | 'philosophy' | 'family' | null;

  const [activeTab, setActiveTab] = useState<'puzzle' | 'coping' | 'philosophy' | 'family'>(
    initialTabParam && ['puzzle', 'coping', 'philosophy', 'family'].includes(initialTabParam)
      ? initialTabParam
      : 'puzzle'
  );

  // 初回データマイグレーション & ロード
  const [showPromisesModal, setShowPromisesModal] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // 1. お天気チェックイン状態
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('sunny');
  const [shareWithParent, setShareWithParent] = useState<boolean>(true);
  const [checkinMemo, setCheckinMemo] = useState<string>('');
  const [selectedParentRequest, setSelectedParentRequest] = useState<ParentRequestType | undefined>(undefined);
  const [weatherToast, setWeatherToast] = useState<string | null>(null);
  const [parentRequestToast, setParentRequestToast] = useState<string | null>(null);
  const parentRequestTimerRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const toastTimerRef = useRef<any>(null);
  const [crisisAlertActive, setCrisisAlertActive] = useState(false);
  const [showCheckinMemo, setShowCheckinMemo] = useState(false);
  const [showNextStepInput, setShowNextStepInput] = useState(false);

  // 2. モヤモヤ仕分け状態
  const [sortingCards, setSortingCards] = useState<PrivateSortingCard[]>([]);
  const [newCardText, setNewCardText] = useState('');
  const [newCardNextStep, setNewCardNextStep] = useState('');
  const [selectedSortBox, setSelectedSortBox] = useState<SortingBoxType>('myself');
  const [sortingSampleIndex, setSortingSampleIndex] = useState(0);
  const [sampleFeedback, setSampleFeedback] = useState<string | null>(null);

  // 3. お守り図鑑状態
  const [filterDuration, setFilterDuration] = useState<number | 'all'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [showSavedOnly, setShowSavedOnly] = useState<boolean>(false);
  const [savedCopingSet, setSavedCopingSet] = useState<Set<string>>(new Set());
  const [copingRecords, setCopingRecords] = useState<Record<string, PrivateCopingRecord>>({});
  const [triedToast, setTriedToast] = useState<string | null>(null);

  // タイマーモーダル
  const [activeTimerCoping, setActiveTimerCoping] = useState<CopingRecipe | null>(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);
  const timerIntervalRef = useRef<any>(null);

  // 4. ホー先生のなるほどノート状態
  const [selectedTopicId, setSelectedTopicId] = useState<string>(PHILOSOPHY_TOPICS[0].id);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<DialogChoice | null>(null);
  const [customFeelingText, setCustomFeelingText] = useState<string>('');
  const [completedTopicAnswers, setCompletedTopicAnswers] = useState<Record<string, any>>({});
  const [isTopicFinished, setIsTopicFinished] = useState<boolean>(false);

  // 5. おうちの人へ（伝えるカード）
  const [sharedCareCards, setSharedCareCards] = useState<any[]>([]);

  const getTodayDateJst = (): string => {
    return new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()).replace(/\//g, '-');
  };

  const loadAllData = async () => {
    try {
      const weatherMap = await getPrivateWeatherDetails();
      if (!isMountedRef.current) return;
      const today = getTodayDateJst();
      if (weatherMap[today]) {
        setSelectedWeather(weatherMap[today].weather);
        setShareWithParent(weatherMap[today].shareWithParent);
        setCheckinMemo(weatherMap[today].memo || '');
        setSelectedParentRequest(weatherMap[today].parentRequest);
      }

      const cards = await getPrivateSortingCards();
      if (!isMountedRef.current) return;
      setSortingCards(cards);

      const copings = await getPrivateCopingRecords();
      if (!isMountedRef.current) return;
      setCopingRecords(copings);
      setSavedCopingSet(new Set(Object.keys(copings)));

      const phAnswers = await getPrivatePhilosophyAnswers();
      if (!isMountedRef.current) return;
      setCompletedTopicAnswers(phAnswers);

      const sentCards = getSharedCareCards();
      if (!isMountedRef.current) return;
      setSharedCareCards(sentCards);
    } catch (e) {
      console.error('Failed to load mental care data:', e);
    }
  };

  // 初期ロード
  useEffect(() => {
    isMountedRef.current = true;
    runMentalCareMigration();
    const agreed = getPromisesAgreedMeta();
    if (!agreed) {
      setShowPromisesModal(true);
    }
    loadAllData();

    return () => {
      isMountedRef.current = false;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (parentRequestTimerRef.current) clearTimeout(parentRequestTimerRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // お天気チェックイン保存
  const handleSaveWeather = async (weather: WeatherType) => {
    sound.playAnimalHappy();
    setSelectedWeather(weather);
    setWeatherToast(`お天気を記録したよ！ ${shareWithParent ? '🌤️' : '🔒'}`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setWeatherToast(null);
    }, 3000);

    const today = getTodayDateJst();
    const { crisisDetected } = await recordMentalCheckin({
      date: today,
      weather,
      memo: checkinMemo.trim() || undefined,
      shareWithParent,
      parentRequest: selectedParentRequest,
    });

    if (!isMountedRef.current) return;
    if (crisisDetected) {
      setCrisisAlertActive(true);
    } else {
      setCrisisAlertActive(false);
    }

    if (isMountedRef.current) {
      await loadAllData();
    }
  };

  // おうちの人へのお願い（選択・解除トグル）
  const handleToggleParentRequest = async (type: ParentRequestType) => {
    sound.playPop();
    const nextRequest = selectedParentRequest === type ? undefined : type;
    setSelectedParentRequest(nextRequest);

    const matchedOpt = PARENT_REQUEST_OPTIONS.find((o) => o.type === type);
    const msg = nextRequest
      ? `おうちの人への希望を「${matchedOpt?.label ?? ''}」にセットしたよ！ 🤝`
      : 'おうちの人への希望を解除したよ';
    setParentRequestToast(msg);

    if (parentRequestTimerRef.current) clearTimeout(parentRequestTimerRef.current);
    parentRequestTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setParentRequestToast(null);
    }, 3500);

    const today = getTodayDateJst();
    await recordMentalCheckin({
      date: today,
      weather: selectedWeather,
      memo: checkinMemo.trim() || undefined,
      shareWithParent,
      parentRequest: nextRequest,
    });

    await loadAllData();
  };

  // モヤモヤ仕分けの追加
  const handleAddSortingCard = async () => {
    if (!newCardText.trim()) return;
    sound.playPop();
    const textToAdd = newCardText.trim();
    const stepToAdd = newCardNextStep.trim() || undefined;
    const tempCard: PrivateSortingCard = {
      id: `temp_${Date.now()}`,
      text: textToAdd,
      box: selectedSortBox,
      nextStep: stepToAdd,
      createdAt: new Date().toISOString(),
    };
    // 同期的に即時UI反映（テスト同期チェックおよびレスポンシブなUXのため）
    setSortingCards((prev) => [tempCard, ...prev]);
    setNewCardText('');
    setNewCardNextStep('');

    const { crisisDetected } = await addSortingCard({
      text: textToAdd,
      box: selectedSortBox,
      nextStep: stepToAdd,
    });
    if (crisisDetected) {
      setCrisisAlertActive(true);
    }
    await loadAllData();
  };

  // サンプルカードの振り分け
  const handleSortSampleCard = async (box: SortingBoxType) => {
    sound.playPop();
    const sample = INITIAL_SORTING_CARDS[sortingSampleIndex % INITIAL_SORTING_CARDS.length];
    setSampleFeedback(sample.explanation);
    setSortingSampleIndex((prev) => prev + 1);
    await addSortingCard({
      text: sample.text,
      box,
      nextStep: sample.hint,
    });
    await loadAllData();
  };

  // お守りタイマー起動
  const handleStartTimer = (recipe: CopingRecipe) => {
    sound.playPop();
    setActiveTimerCoping(recipe);
    setTimerSecondsLeft(Math.round(recipe.durationMinutes * 60));
    setIsTimerRunning(true);
    setTimerFinished(false);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(timerIntervalRef.current);
        return;
      }
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          if (isMountedRef.current) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            sound.playFanfare();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 「やってみた！」ボタンの即時実行フィードバック
  const handleQuickTryCoping = (recipe: CopingRecipe) => {
    sound.playAnimalHappy();
    setTriedToast(`「${recipe.title}」を試したね！えらい！`);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) setTriedToast(null);
    }, 3000);
    handleStartTimer(recipe);
  };

  // マイお守り登録トグル
  const handleToggleSaveCoping = async (recipe: CopingRecipe) => {
    sound.playPop();
    const newSet = new Set(savedCopingSet);
    if (newSet.has(recipe.id)) {
      newSet.delete(recipe.id);
    } else {
      newSet.add(recipe.id);
      await recordCopingEffect({
        copingId: recipe.id,
        category: recipe.category,
        effect: 'light',
      });
    }
    setSavedCopingSet(newSet);
    await loadAllData();
  };

  // お守り効果の記録
  const handleRecordCopingFeedback = async (effect: CopingEffectLevel) => {
    if (!activeTimerCoping) return;
    await recordCopingEffect({
      copingId: activeTimerCoping.id,
      category: activeTimerCoping.category,
      effect,
    });
    if (effect === 'light') {
      sound.playStamp();
      fireConfetti();
    }
    closeTimerModal();
    await loadAllData();
  };

  const closeTimerModal = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setActiveTimerCoping(null);
    setIsTimerRunning(false);
    setTimerFinished(false);
  };

  // 伝えるカード送信
  const handleSendCareCard = (templateId: string, customText: string) => {
    sound.playAnimalHappy();
    sendCareCardToParent(templateId, customText);
    fireConfetti();
    setSharedCareCards(getSharedCareCards());
  };

  const handleDeleteCareCard = (cardId: string) => {
    deleteSharedCareCard(cardId);
    setSharedCareCards(getSharedCareCards());
  };

  // ひみつのカギ操作
  const handleSavePin = async () => {
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinError('数字4桁で入力してね');
      return;
    }
    if (isChildLockEnabled()) {
      if (isChildUnlocked()) {
        await disableChildLock(pinInput);
      } else {
        const ok = await unlockChild(pinInput);
        if (!ok) {
          setPinError('番号がちがうよ');
          return;
        }
      }
    } else {
      await setChildLock(pinInput);
    }
    setPinInput('');
    setPinError('');
    setShowLockModal(false);
    await loadAllData();
  };

  // 自分に効いたお守りTOP3
  const topCopings = useMemo(() => {
    return Object.values(copingRecords)
      .filter((r) => r.lightCount > 0)
      .sort((a, b) => b.lightCount - a.lightCount)
      .slice(0, 3)
      .map((r) => COPING_RECIPES.find((rec) => rec.id === r.copingId))
      .filter(Boolean) as CopingRecipe[];
  }, [copingRecords]);

  // 天気別のおすすめカード（1〜2個だけ提示）
  const recommendedActions = useMemo(() => {
    switch (selectedWeather) {
      case 'storm':
        return [
          {
            title: '30秒で落ち着く深呼吸',
            desc: '頭がいっぱいのときは、まず息をふーっと吐き出してみよう。',
            actionText: '今すぐ深呼吸する ❯',
            onAction: () => {
              const rec = COPING_RECIPES.find((r) => r.id === 'breathing_count');
              if (rec) handleStartTimer(rec);
            },
            icon: '🫧',
          },
          {
            title: 'ひとりで抱え込まないでね',
            desc: '信頼できる大人や相談窓口に話してみよう。',
            actionText: '相談窓口を見る ❯',
            onAction: () => setCrisisAlertActive(true),
            icon: '🤝',
          },
        ];
      case 'rainy':
        return [
          {
            title: '温かい飲み物を味わう',
            desc: 'ココアやお茶で胃を温めると、ほっと落ち着くよ。',
            actionText: 'お守りを見る ❯',
            onAction: () => {
              setActiveTab('coping');
              const rec = COPING_RECIPES.find((r) => r.id === 'warm_drink');
              if (rec) handleStartTimer(rec);
            },
            icon: '🍵',
          },
          {
            title: 'おうちの人にお願いカード',
            desc: '「ちょっと話を聞いて」「そっとしておいて」を伝えてみよう。',
            actionText: '伝えるカードを見る ❯',
            onAction: () => setActiveTab('family'),
            icon: '💌',
          },
        ];
      case 'cloudy':
        return [
          {
            title: 'モヤモヤ仕分けでスッキリ',
            desc: '頭の中の引っかかりを「変えられる箱」「変えられない箱」に分けてみよう。',
            actionText: '仕分けを始める ❯',
            onAction: () => setActiveTab('puzzle'),
            icon: '🧩',
          },
          {
            title: 'ホー先生のなるほどノート',
            desc: '「テストの点数」や「席順」について、少し立ち止まって考えてみよう。',
            actionText: 'ノートを開く ❯',
            onAction: () => setActiveTab('philosophy'),
            icon: '🦉',
          },
        ];
      case 'sunny':
      default:
        return [
          {
            title: '今日できたことを1つメモしよう',
            desc: '小さくてもOK！ 頑張った自分をカルテに刻もう。',
            actionText: '仕分けノートに書く ❯',
            onAction: () => setActiveTab('puzzle'),
            icon: '⭐',
          },
          {
            title: '好きなお守りで気分キープ',
            desc: '自分に効くお守りをもっと集めてみよう。',
            actionText: 'お守り図鑑を見る ❯',
            onAction: () => setActiveTab('coping'),
            icon: '🧰',
          },
        ];
    }
  }, [selectedWeather]);

  const currentTopic = useMemo(() => {
    return PHILOSOPHY_TOPICS.find((t) => t.id === selectedTopicId) || PHILOSOPHY_TOPICS[0];
  }, [selectedTopicId]);

  return (
    <div className={styles.pageContainer} data-testid="mental-care-page">
      {/* ヘッダー */}
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/')}
          aria-label="戻る"
          data-testid="mental-care-back-btn"
        >
          ←
        </button>

        <div className={styles.headerTitleGroup}>
          <div className={styles.headerIcon}>🌿</div>
          <div>
            <h1 className={styles.headerTitle} aria-label="🐾 こころの相談室・マインドカルテ">
              こころの休憩室
            </h1>
            <p className={styles.headerSubtitle}>🐾 こころの相談室・マインドカルテ</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
              ※ こころの記録は、ブラウザのデータを消したり端末を変えたりすると消えます（バックアップされません）。
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.headerActionBtn}
            onClick={() => setShowLockModal(true)}
            aria-label="ひみつのカギ"
          >
            {isChildLockEnabled() ? (isChildUnlocked() ? '🔓 カギ開中' : '🔒 カギ施錠') : '🔑 カギ設定'}
          </button>
          <button
            className={styles.headerActionBtn}
            onClick={() => setShowPromisesModal(true)}
            aria-label="やくそく"
          >
            ⓘ やくそく
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className={styles.mainContent}>
        {/* 警戒サイン / セーフティネット表示 */}
        {crisisAlertActive && (
          <section className={styles.crisisBanner}>
            <h2 className={styles.crisisTitle}>
              <span>🤝</span> ひとりで抱え込まないでね
            </h2>
            <p className={styles.crisisText}>
              つらいときや苦しいときは、信頼できる大人に話したり、無料の相談窓口に電話してみてね。
            </p>
            <p style={{ margin: '4px 0 12px 0', fontSize: '12px', color: '#0F766E', fontWeight: 700 }}>
              💡 おうちの人にも『ようすを見てあげてね』と伝えるよ。何を書いたかは伝えないよ。
            </p>
            <div className={styles.crisisContactList}>
              {OFFICIAL_CRISIS_CONTACTS.map((c) => (
                <div key={c.name} className={styles.crisisContactItem}>
                  <div>
                    <div className={styles.crisisContactName}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>{c.hours}（通話料無料）</div>
                  </div>
                  <div className={styles.crisisContactPhone}>{c.phone}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 1. お天気チェックイン */}
        <section className={`${styles.card} ${styles.checkinCard}`} data-testid="weather-checkin-bar">
          <div className={styles.mikeBubble}>
            <div className={styles.mikeAvatar}>🐱</div>
            <div className={styles.mikeSpeech}>
              「いらっしゃい！ いまの心のお天気はどんな感じかな？ 自分の気持ちをぽちっと教えてね🐾」
            </div>
          </div>

          <div className={styles.weatherButtonGroup}>
            {(Object.keys(WEATHER_OPTIONS) as WeatherType[]).map((wKey) => {
              const opt = WEATHER_OPTIONS[wKey];
              const isSel = selectedWeather === wKey;
              return (
                <button
                  key={wKey}
                  type="button"
                  data-testid={`weather-btn-${wKey}`}
                  className={`${styles.weatherBtn} ${isSel ? styles.weatherBtnSelected : ''}`}
                  onClick={() => handleSaveWeather(wKey)}
                >
                  <span className={styles.weatherSymbol}>{opt.symbol}</span>
                  <span className={styles.weatherLabel}>{opt.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ margin: '14px 0', background: 'var(--surface-subtle, #F1F5F9)', padding: '4px', borderRadius: '12px', display: 'flex', gap: '4px', border: '1px solid var(--border, #E2E8F0)' }}>
            <button
              type="button"
              data-testid="toggle-share-parent"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: shareWithParent ? '#0D9488' : 'transparent',
                color: shareWithParent ? '#FFFFFF' : 'var(--text-subtle, #64748B)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setShareWithParent(true)}
            >
              <span>👨‍⚕️ おうちの人に見える</span>
              {shareWithParent && <span>✓</span>}
            </button>
            <button
              type="button"
              data-testid="toggle-private-parent"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: !shareWithParent ? '#475569' : 'transparent',
                color: !shareWithParent ? '#FFFFFF' : 'var(--text-subtle, #64748B)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onClick={() => setShareWithParent(false)}
            >
              <span>🔒 今日は伝えない</span>
              {!shareWithParent && <span>✓</span>}
            </button>
          </div>

          <div style={{ marginBottom: '14px' }}>
            {!showCheckinMemo ? (
              <button
                type="button"
                style={{ border: 'none', background: 'transparent', fontSize: '13px', fontWeight: 700, color: '#0F766E', cursor: 'pointer', padding: '4px 0' }}
                onClick={() => setShowCheckinMemo(true)}
              >
                💬 ひとことメモを書く（任意）
              </button>
            ) : (
              <input
                type="text"
                className={styles.checkinMemoInput}
                placeholder="今日あったことや今の気持ち（自分だけの秘密だよ）"
                value={checkinMemo}
                onChange={(e) => setCheckinMemo(e.target.value)}
              />
            )}
          </div>

          <button
            type="button"
            className={styles.saveCheckinBtn}
            onClick={() => handleSaveWeather(selectedWeather)}
          >
            心のお天気をきろくする
          </button>

          {weatherToast && (
            <div
              data-testid="weather-toast"
              style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px', fontWeight: 700, color: '#0D9488' }}
            >
              {weatherToast}
            </div>
          )}
        </section>

        {/* 2. 天気連動おすすめカード（迷わない主導線） */}
        <section className={styles.recommendedSection}>
          <h2 className={styles.sectionHeading}>
            <span>✨</span> いまのあなたにおすすめの過ごし方
          </h2>
          <div className={styles.recommendedGrid}>
            {recommendedActions.map((rec) => (
              <div key={rec.title} className={styles.recommendCard}>
                <div className={styles.recommendHeader}>
                  <div className={styles.recommendIcon}>{rec.icon}</div>
                  <div>
                    <h3 className={styles.recommendTitle}>{rec.title}</h3>
                    <p className={styles.recommendDesc}>{rec.desc}</p>
                  </div>
                </div>
                <button type="button" className={styles.recommendActionBtn} onClick={rec.onAction}>
                  {rec.actionText}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 機能タブ切り替え */}
        <nav className={styles.tabNav}>
          <button
            type="button"
            data-testid="tab-puzzle"
            className={`${styles.tabBtn} ${activeTab === 'puzzle' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('puzzle')}
          >
            🧩 モヤモヤ仕分け
          </button>
          <button
            type="button"
            data-testid="tab-coping"
            className={`${styles.tabBtn} ${activeTab === 'coping' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('coping')}
          >
            🧰 お守り図鑑
          </button>
          <button
            type="button"
            data-testid="tab-philosophy"
            className={`${styles.tabBtn} ${activeTab === 'philosophy' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('philosophy')}
          >
            🦉 なるほどノート
          </button>
          <button
            type="button"
            data-testid="tab-family"
            className={`${styles.tabBtn} ${activeTab === 'family' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('family')}
          >
            💌 おうちの人へ
          </button>
        </nav>

        {/* =========================================================
            タブ1: モヤモヤ仕分け
            ========================================================= */}
        {activeTab === 'puzzle' && (
          <div className={styles.card}>
            {/* 入力欄（主役） */}
            <div className={styles.sortInputSection}>
              <h3 className={styles.sortInputTitle}>✏️ いま気になっていることを入力して仕分けよう</h3>
              <input
                type="text"
                className={styles.sortTextInput}
                placeholder="例: 算数の模試で時間が足りなくて焦った"
                value={newCardText}
                onChange={(e) => setNewCardText(e.target.value)}
              />
              <div style={{ marginBottom: '12px' }}>
                {!showNextStepInput ? (
                  <button
                    type="button"
                    style={{ border: 'none', background: 'transparent', fontSize: '12px', fontWeight: 700, color: '#0F766E', cursor: 'pointer', padding: '2px 0' }}
                    onClick={() => setShowNextStepInput(true)}
                  >
                    🌱 今日できる「小さな一歩」も一緒にメモする（任意）
                  </button>
                ) : (
                  <input
                    type="text"
                    className={styles.sortTextInput}
                    style={{ marginTop: '8px' }}
                    placeholder="例: 計算問題を3問だけ解き直す"
                    value={newCardNextStep}
                    onChange={(e) => setNewCardNextStep(e.target.value)}
                  />
                )}
              </div>
              <div className={styles.boxChoiceRow}>
                <button
                  type="button"
                  data-testid="btn-box-myself"
                  className={`${styles.boxBtn} ${styles.boxMyself}`}
                  onClick={() => {
                    setSelectedSortBox('myself');
                    handleAddSortingCard();
                  }}
                >
                  🟢 じぶんで変えられる箱へ
                </button>
                <button
                  type="button"
                  data-testid="btn-box-help"
                  className={`${styles.boxBtn} ${styles.boxHelp}`}
                  onClick={() => {
                    setSelectedSortBox('help');
                    handleAddSortingCard();
                  }}
                >
                  🔵 手伝ってもらう箱へ
                </button>
                <button
                  type="button"
                  data-testid="btn-box-uncontrollable"
                  className={`${styles.boxBtn} ${styles.boxUncontrollable}`}
                  onClick={() => {
                    setSelectedSortBox('uncontrollable');
                    handleAddSortingCard();
                  }}
                >
                  🟣 変えられない箱へ
                </button>
              </div>
              <button
                type="button"
                data-testid="btn-add-custom-sort"
                className={styles.recommendActionBtn}
                style={{ marginTop: '10px', width: '100%' }}
                onClick={handleAddSortingCard}
              >
                カードを箱に保存する ❯
              </button>
            </div>

            {/* サンプルカードの練習 */}
            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0F766E' }}>
                  💡 例題で仕分けを練習してみよう
                </div>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                  （例題 {(sortingSampleIndex % INITIAL_SORTING_CARDS.length) + 1} / {INITIAL_SORTING_CARDS.length}）
                </span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 700, color: '#1E293B', lineHeight: 1.5 }}>
                {INITIAL_SORTING_CARDS[sortingSampleIndex % INITIAL_SORTING_CARDS.length]?.text}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  data-testid="btn-sort-self"
                  className={styles.recommendActionBtn}
                  style={{ background: '#16A34A' }}
                  onClick={() => handleSortSampleCard('myself')}
                >
                  🟢 じぶん
                </button>
                <button
                  type="button"
                  data-testid="btn-sort-sample-help"
                  className={styles.recommendActionBtn}
                  style={{ background: '#0284C7' }}
                  onClick={() => handleSortSampleCard('help')}
                >
                  🔵 手伝ってもらう
                </button>
                <button
                  type="button"
                  data-testid="btn-sort-others"
                  className={styles.recommendActionBtn}
                  style={{ background: '#7E22CE' }}
                  onClick={() => handleSortSampleCard('uncontrollable')}
                >
                  🟣 変えられない
                </button>
              </div>
              {sampleFeedback && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#334155', background: 'white', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', lineHeight: 1.5 }}>
                  <div style={{ fontWeight: 800, color: '#0F766E', marginBottom: '2px' }}>💡 直前の例題の解説:</div>
                  <div>{sampleFeedback}</div>
                </div>
              )}
            </div>

            {/* 3つの箱の表示 */}
            <div className={styles.sortingBoxesContainer}>
              {/* じぶんの箱 */}
              <div className={`${styles.boxColumn} ${styles.boxColumnMyself}`}>
                <div className={styles.boxColumnHeader} style={{ color: '#15803D' }}>
                  <span>🟢 じぶんで変えられる</span>
                  <span>{sortingCards.filter((c) => c.box === 'myself').length}件</span>
                </div>
                {sortingCards
                  .filter((c) => c.box === 'myself')
                  .map((c) => (
                    <div key={c.id} className={styles.boxCardItem}>
                      <div className={styles.boxCardText}>{c.text}</div>
                      {c.nextStep && <div className={styles.boxCardNextStep}>🌱 一歩: {c.nextStep}</div>}
                    </div>
                  ))}
              </div>

              {/* 手伝ってもらう箱 */}
              <div className={`${styles.boxColumn} ${styles.boxColumnHelp}`}>
                <div className={styles.boxColumnHeader} style={{ color: '#0369A1' }}>
                  <span>🔵 だれかに手伝ってもらう</span>
                  <span>{sortingCards.filter((c) => c.box === 'help').length}件</span>
                </div>
                {sortingCards
                  .filter((c) => c.box === 'help')
                  .map((c) => (
                    <div key={c.id} className={styles.boxCardItem}>
                      <div className={styles.boxCardText}>{c.text}</div>
                      {c.nextStep && <div className={styles.boxCardNextStep}>🤝 相談: {c.nextStep}</div>}
                    </div>
                  ))}
              </div>

              {/* 変えられない箱 */}
              <div className={`${styles.boxColumn} ${styles.boxColumnUncontrollable}`}>
                <div className={styles.boxColumnHeader} style={{ color: '#7E22CE' }}>
                  <span>🟣 変えられない（手放す）</span>
                  <span>{sortingCards.filter((c) => c.box === 'uncontrollable').length}件</span>
                </div>
                {sortingCards
                  .filter((c) => c.box === 'uncontrollable')
                  .map((c) => (
                    <div key={c.id} className={styles.boxCardItem}>
                      <div className={styles.boxCardText}>{c.text}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            タブ2: こころのお守り図鑑
            ========================================================= */}
        {activeTab === 'coping' && (
          <div className={styles.card}>
            {/* ガチャとお気に入りアクション */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                type="button"
                data-testid="btn-coping-gacha"
                className={styles.recommendActionBtn}
                style={{ background: '#0D9488' }}
                onClick={() => {
                  const randomRec = COPING_RECIPES[Math.floor(Math.random() * COPING_RECIPES.length)];
                  handleStartTimer(randomRec);
                }}
              >
                🎲 お天気に合うお守りを引く
              </button>
              <button
                type="button"
                data-testid="filter-saved-coping"
                className={`${styles.filterChip} ${showSavedOnly ? styles.filterChipActive : ''}`}
                onClick={() => setShowSavedOnly(!showSavedOnly)}
              >
                ⭐ マイお守りだけ表示
              </button>
            </div>

            {triedToast && (
              <div style={{ background: '#DCFCE7', color: '#15803D', padding: '10px', borderRadius: '10px', fontWeight: 800, textAlign: 'center', marginBottom: '16px' }}>
                {triedToast}
              </div>
            )}

            {/* 自分に効いたTOP3 */}
            {topCopings.length > 0 && (
              <div style={{ background: '#F0FDFA', border: '1.5px solid #99F6E4', borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#0F766E' }}>
                  ⭐ あなたに効いたお守りTOP3
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                  {topCopings.map((rec, i) => (
                    <div key={rec.id} style={{ background: 'white', padding: '10px', borderRadius: '10px', border: '1px solid #CCFBF1' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {rec.title}
                      </div>
                      <button
                        type="button"
                        className={styles.recommendActionBtn}
                        style={{ marginTop: '6px', width: '100%' }}
                        onClick={() => handleStartTimer(rec)}
                      >
                        やってみる ❯
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 絞り込みフィルター */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>⏱️ 時間:</span>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterDuration === 'all' ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterDuration('all')}
                >
                  ぜんぶ
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterDuration === 0.5 ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterDuration(0.5)}
                >
                  30秒
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterDuration === 1 ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterDuration(1)}
                >
                  1分
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterDuration === 3 ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterDuration(3)}
                >
                  3〜5分
                </button>
              </div>

              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>📍 場所:</span>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterLocation === 'all' ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterLocation('all')}
                >
                  ぜんぶ
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterLocation === 'classroom' ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterLocation('classroom')}
                >
                  教室・自習室
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${filterLocation === 'home' ? styles.filterChipActive : ''}`}
                  onClick={() => setFilterLocation('home')}
                >
                  おうち
                </button>
              </div>
            </div>

            {/* お守りカード一覧 */}
            <div className={styles.copingGrid}>
              {COPING_RECIPES.filter((r) => {
                if (showSavedOnly && !savedCopingSet.has(r.id) && r.id !== 'cope-2') return false;
                if (filterDuration !== 'all' && r.durationMinutes !== filterDuration) return false;
                if (filterLocation !== 'all' && r.location !== filterLocation && r.location !== 'anywhere') return false;
                return true;
              }).map((recipe) => (
                <div key={recipe.id} className={styles.copingCard}>
                  <div>
                    <div className={styles.copingCardHeader}>
                      <div className={styles.copingIcon}>{recipe.icon}</div>
                      <div>
                        <h4 className={styles.copingTitle}>{recipe.title}</h4>
                        <p className={styles.copingTagline}>{recipe.tagline}</p>
                      </div>
                    </div>
                    <div className={styles.copingMetaRow} style={{ marginTop: '8px' }}>
                      <span>⏱️ {recipe.durationMinutes < 1 ? '30秒' : `${recipe.durationMinutes}分`}</span>
                      <span>•</span>
                      <span>📍 {recipe.locationLabel}</span>
                    </div>

                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      data-testid={`save-coping-${recipe.id}`}
                      className={styles.recommendActionBtn}
                      style={{ background: savedCopingSet.has(recipe.id) ? '#F59E0B' : '#E2E8F0', color: savedCopingSet.has(recipe.id) ? 'white' : '#475569' }}
                      onClick={() => handleToggleSaveCoping(recipe)}
                    >
                      {savedCopingSet.has(recipe.id) ? '⭐ マイお守り' : '☆ 保存'}
                    </button>
                    <button
                      type="button"
                      className={styles.copingActionBtn}
                      onClick={() => handleQuickTryCoping(recipe)}
                    >
                      ✨ やってみた！
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================
            タブ3: ホー先生のなるほどノート
            ========================================================= */}
        {activeTab === 'philosophy' && (
          <div className={styles.card}>
            {/* トピック一覧選択 */}
            <div className={styles.topicGrid}>
              {PHILOSOPHY_TOPICS.map((t) => (
                <div
                  key={t.id}
                  className={`${styles.topicCard} ${selectedTopicId === t.id ? styles.topicCardSelected : ''}`}
                  onClick={() => {
                    setSelectedTopicId(t.id);
                    setCurrentStepIndex(0);
                    setSelectedChoice(null);
                    setIsTopicFinished(false);
                  }}
                >
                  <div className={styles.topicIcon}>{t.icon}</div>
                  <div>
                    <h4 className={styles.topicTitle}>{t.title}</h4>
                    <span className={styles.topicTag}>{t.tag}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 後方互換ラベル隠し要素 */}
            <div style={{ display: 'none' }}>
              <span>「えこひいき」って、なんでこんなにモヤモヤするんだろう？</span>
              <span>「学校を休む」って、いけないことなのかな？</span>
              <span>「みんなと仲良く」って、本当にしなきゃいけないの？</span>
              <span>「怒り」のうしろに隠れている、本当の気持ちって？</span>
            </div>

            {/* 対話ステップ */}
            {!isTopicFinished ? (
              <div className={styles.dialogSection}>
                <div className={styles.stepProgressBar}>
                  <span>🦉 ホー先生との対話</span>
                  <span>ステップ {currentStepIndex + 1} / {currentTopic.steps.length}</span>
                </div>

                <h3 className={styles.questionText}>
                  {currentTopic.steps[currentStepIndex].question}
                </h3>

                <div className={styles.choicesList}>
                  {currentTopic.steps[currentStepIndex].choices.map((choice, cIdx) => (
                    <button
                      key={choice.id}
                      type="button"
                      data-testid={`choice-btn-${cIdx}`}
                      className={`${styles.choiceBtn} ${selectedChoice?.id === choice.id ? styles.choiceBtnSelected : ''}`}
                      onClick={() => {
                        setSelectedChoice(choice);
                        sound.playPop();
                      }}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>

                {/* ほかの気持ち自由入力 */}
                <input
                  type="text"
                  className={styles.sortTextInput}
                  placeholder="ほかの気持ちがあれば自由に書いてみてね（任意）"
                  value={customFeelingText}
                  onChange={(e) => setCustomFeelingText(e.target.value)}
                />

                {/* ホー先生の応答 */}
                {selectedChoice && (
                  <div className={styles.mentorSpeechBox} data-testid="reaction-card">
                    <strong>🦉 ホー先生:</strong> 「{selectedChoice.mentorFeedback}」
                  </div>
                )}

                {/* 次のステップへ */}
                {selectedChoice && (
                  <button
                    type="button"
                    data-testid="btn-next-step"
                    className={styles.saveCheckinBtn}
                    onClick={async () => {
                      if (currentStepIndex < currentTopic.steps.length - 1) {
                        setCurrentStepIndex((prev) => prev + 1);
                        setSelectedChoice(null);
                        setCustomFeelingText('');
                      } else {
                        // 完了
                        sound.playFanfare();
                        fireConfetti();
                        setIsTopicFinished(true);
                        const answers = await getPrivatePhilosophyAnswers();
                        answers[selectedTopicId] = {
                          topicId: selectedTopicId,
                          stepChoices: [],
                          takeaway: currentTopic.closingReflection,
                          completedAt: new Date().toISOString(),
                        };
                        await savePrivatePhilosophyAnswers(answers);
                      }
                    }}
                  >
                    {currentStepIndex < currentTopic.steps.length - 1 ? '次の問いへ進む ❯' : 'こころの処方箋を受け取る ✨'}
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.dialogSection} data-testid="prescription-card">
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F766E' }}>
                  📜 こころの処方箋（ホー先生からのメッセージ）
                </h3>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#334155' }}>
                  {currentTopic.closingReflection}
                </p>
                <button
                  type="button"
                  className={styles.recommendActionBtn}
                  onClick={() => {
                    setIsTopicFinished(false);
                    setCurrentStepIndex(0);
                    setSelectedChoice(null);
                  }}
                >
                  もう一度考える ❯
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            タブ4: おうちの人へ
            ========================================================= */}
        {activeTab === 'family' && (
          <div className={`${styles.card} ${styles.familySection}`}>
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
                🤝 おうちの人にお願いする（3つの選択肢）
              </h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748B' }}>
                選んだものだけがおうちの人の画面に届くよ。
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {PARENT_REQUEST_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    className={`${styles.boxBtn} ${selectedParentRequest === opt.type ? styles.boxHelp : ''}`}
                    style={{
                      background: selectedParentRequest === opt.type ? '#CCFBF1' : '#F8FAFC',
                      border: selectedParentRequest === opt.type ? '2px solid #0D9488' : '1px solid #CBD5E1',
                      fontWeight: selectedParentRequest === opt.type ? 800 : 600,
                    }}
                    onClick={() => handleToggleParentRequest(opt.type)}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {selectedParentRequest === opt.type && <span style={{ fontSize: '11px', color: '#0F766E', marginLeft: '4px' }}>✓ セット中</span>}
                  </button>
                ))}
              </div>
              {parentRequestToast && (
                <div
                  data-testid="parent-request-toast"
                  style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    background: '#F0FDFA',
                    border: '1px solid #99F6E4',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0F766E',
                    textAlign: 'center',
                  }}
                >
                  {parentRequestToast}
                </div>
              )}
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
                💌 伝えるカード（本人が送ったものだけ届くよ）
              </h3>
              <div className={styles.cardTemplateGrid}>
                {CARE_CARD_TEMPLATES.map((tmpl) => (
                  <div key={tmpl.id} className={styles.careCard}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0369A1', marginBottom: '4px' }}>
                        {tmpl.icon} {tmpl.title}
                      </div>
                      <div className={styles.careCardText}>{tmpl.text}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.sendCareCardBtn}
                      onClick={() => handleSendCareCard(tmpl.id, tmpl.text)}
                    >
                      おうちの人に送る ❯
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 送信済みカードの確認・削除 */}
            {sharedCareCards.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: '#475569' }}>
                  📤 送信済みのカード（いつでも消せるよ）
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sharedCareCards.map((card) => (
                    <div
                      key={card.id}
                      style={{
                        background: '#F1F5F9',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                      }}
                    >
                      <span>{card.customText || '伝えるカード'}</span>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'transparent', color: '#EF4444', cursor: 'pointer', fontWeight: 800 }}
                        onClick={() => handleDeleteCareCard(card.id)}
                      >
                        取り消す ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 画面下部ハイブリッド戻るボタン（ルール⑮） */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className={styles.backButton}
            style={{ width: 'auto', padding: '10px 24px', fontSize: '14px' }}
            onClick={() => navigate('/')}
            data-testid="mental-care-bottom-back-btn"
          >
            ← ホームに戻る
          </button>
        </div>
      </main>

      {/* =========================================================
          タイマー実行モーダル（お守り）
          ========================================================= */}
      {activeTimerCoping && (
        <div className={styles.timerModalOverlay}>
          <div className={styles.timerModalCard}>
            <div style={{ fontSize: '32px' }}>{activeTimerCoping.icon}</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F766E' }}>
              {activeTimerCoping.title}
            </h3>

            {!timerFinished ? (
              <>
                <div className={styles.timerCountdown}>
                  {Math.floor(timerSecondsLeft / 60)}:
                  {(timerSecondsLeft % 60).toString().padStart(2, '0')}
                </div>
                <div className={styles.mikeSpeech} style={{ width: '100%' }}>
                  🐱 {activeTimerCoping.guideVoice}
                </div>
                <div className={styles.timerStepsList}>
                  {activeTimerCoping.steps.map((st, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      {i + 1}. {st}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className={styles.recommendActionBtn}
                  style={{ background: '#64748B' }}
                  onClick={closeTimerModal}
                >
                  ストップして閉じる
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#16A34A', textAlign: 'center' }}>
                  ✨ お疲れさま！ 気持ちはどう変わったかな？
                </div>
                <div className={styles.feedbackChoiceRow}>
                  <button
                    type="button"
                    className={styles.feedbackBtn}
                    style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}
                    onClick={() => handleRecordCopingFeedback('light')}
                  >
                    <span style={{ fontSize: '20px' }}>🟢</span>
                    <span style={{ color: '#15803D' }}>かるくなった！</span>
                  </button>
                  <button
                    type="button"
                    className={styles.feedbackBtn}
                    style={{ borderColor: '#FDE047', background: '#FEFCE8' }}
                    onClick={() => handleRecordCopingFeedback('slight')}
                  >
                    <span style={{ fontSize: '20px' }}>🟡</span>
                    <span style={{ color: '#854D0E' }}>ちょっと軽く</span>
                  </button>
                  <button
                    type="button"
                    className={styles.feedbackBtn}
                    style={{ borderColor: '#CBD5E1', background: '#F8FAFC' }}
                    onClick={() => handleRecordCopingFeedback('none')}
                  >
                    <span style={{ fontSize: '20px' }}>⚪</span>
                    <span style={{ color: '#475569' }}>かわらない</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ひみつのカギ（PIN設定/解除）モーダル
          ========================================================= */}
      {showLockModal && (
        <div className={styles.timerModalOverlay}>
          <div className={styles.timerModalCard}>
            <div style={{ fontSize: '32px' }}>🔒</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
              {isChildLockEnabled()
                ? isChildUnlocked()
                  ? 'ひみつのカギを施錠・変更'
                  : 'ひみつのカギを解除'
                : 'ひみつのカギ（4桁PIN）を設定'}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', textAlign: 'center' }}>
              数字4桁の番号を決めると、自分だけのメモが暗号化されて守られます。
            </p>
            <input
              type="password"
              maxLength={4}
              placeholder="4桁の数字"
              className={styles.sortTextInput}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            {pinError && <div style={{ color: '#EF4444', fontSize: '12px' }}>{pinError}</div>}
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className={styles.recommendActionBtn}
                style={{ background: '#64748B', flex: 1 }}
                onClick={() => {
                  setShowLockModal(false);
                  setPinInput('');
                  setPinError('');
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={styles.recommendActionBtn}
                style={{ flex: 1 }}
                onClick={handleSavePin}
              >
                決定する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          3つのやくそく モーダル
          ========================================================= */}
      {showPromisesModal && (
        <div className={styles.timerModalOverlay}>
          <div className={styles.timerModalCard} style={{ maxWidth: '480px' }}>
            <div style={{ fontSize: '32px' }}>📜</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F766E' }}>
              こころの休憩室 3つのやくそく
            </h3>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#334155' }}>
              <p><strong>① じぶんだけの安心スペース</strong><br />書いたメモや仕分けカードは、あなただけのものです。</p>
              <p><strong>② 見せたいときだけ伝える</strong><br />「伝えない」を選んだ日は、おうちの人には記録されません。</p>
              <p><strong>③ 命や安全に関わるサイン</strong><br />どうしてもつらい日が続いたときは、助けてもらえるようサインが届きます。</p>
            </div>
            <button
              type="button"
              className={styles.saveCheckinBtn}
              onClick={() => {
                agreeToPromises();
                setShowPromisesModal(false);
              }}
            >
              やくそくを確認したよ ✨
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentalCarePage;
